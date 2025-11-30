#!/bin/bash

# 脚本说明：
# 1. 此脚本用于在服务器上一键部署“多鱼理财”项目
# 2. 前提：服务器已安装 Docker，且已运行名为 'nginx' 的容器（挂载了 80/443）
# 3. 此脚本会：
#    - 自动创建 Docker 网络
#    - 清理旧容器
#    - 构建前端（静态资源）并拷贝到 Nginx 容器
#    - 启动后端 Node 服务（连接 Nginx）
#    - 更新 Nginx 配置并重载

# ================= 配置区域 =================
# 项目根目录（假设脚本在项目根目录运行）
PROJECT_ROOT=$(pwd)
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Nginx 容器名称
NGINX_CONTAINER="nginx"
# Nginx 内部静态资源存放路径（对应 nginx.conf 里的 alias）
NGINX_HTML_PATH="/usr/share/nginx/html/duoyu"

# 后端容器配置
BACKEND_CONTAINER="duoyu-backend"
BACKEND_IMAGE="node:20-alpine"
BACKEND_PORT=3000

# 环境变量（请根据实际情况修改，或通过 export 传入）
MONGO_URI=${MONGO_URI:-"mongodb://用户名:密码@你的Mongo地址:27017/duoyu?authSource=admin"}
DOUBAO_API_KEY=${DOUBAO_API_KEY:-"你的火山引擎密钥"}
DOUBAO_MODEL_VERSION=${DOUBAO_MODEL_VERSION:-"你的模型版本"}
# ===========================================

echo ">>> 开始部署 [多鱼理财]..."

# 1. 准备网络环境
echo ">>> [1/5] 检查 Docker 网络..."
if ! docker network inspect duoyu-net >/dev/null 2>&1; then
    docker network create duoyu-net
    echo "    已创建网络: duoyu-net"
else
    echo "    网络 duoyu-net 已存在"
fi

# 确保 Nginx 在网络中
if ! docker network inspect duoyu-net | grep -q "$NGINX_CONTAINER"; then
    docker network connect duoyu-net $NGINX_CONTAINER
    echo "    已将 $NGINX_CONTAINER 加入 duoyu-net"
fi

# 2. 清理旧容器和进程
echo ">>> [2/5] 清理旧服务..."
docker rm -f $BACKEND_CONTAINER >/dev/null 2>&1
# 清理可能残留的 node 进程（慎用，仅清理名为 node 的相关进程）
# killall -q node npm || true 

# 3. 构建前端
echo ">>> [3/5] 构建前端..."
if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR"
    
    # 清理旧依赖（防止 Windows/Linux 架构冲突）
    rm -rf node_modules package-lock.json dist
    
    # 使用 Docker 构建前端（环境隔离，确保干净）
    docker run --rm \
        -v "$FRONTEND_DIR":/app \
        -w /app \
        $BACKEND_IMAGE sh -c "
            npm config set registry https://registry.npmmirror.com && 
            npm install && 
            VITE_BASE_PATH=/duoyu/ VITE_API_BASE_URL=/duoyu/api npm run build
        "
        
    if [ $? -eq 0 ]; then
        echo "    前端构建成功！"
        # 确保 Nginx 容器内目录存在
        docker exec $NGINX_CONTAINER mkdir -p $NGINX_HTML_PATH
        # 拷贝构建产物
        docker cp dist/. $NGINX_CONTAINER:$NGINX_HTML_PATH/
        echo "    已部署静态文件到 Nginx: $NGINX_HTML_PATH"
    else
        echo "!!! 前端构建失败，请检查日志"
        exit 1
    fi
    cd "$PROJECT_ROOT"
else
    echo "!!! 未找到前端目录: $FRONTEND_DIR"
    exit 1
fi

# 4. 启动后端
echo ">>> [4/5] 启动后端..."
if [ -d "$BACKEND_DIR" ]; then
    cd "$BACKEND_DIR"
    
    # 清理后端旧依赖
    rm -rf node_modules package-lock.json
    
    # 启动后端容器
    docker run -d \
        --name $BACKEND_CONTAINER \
        --network duoyu-net \
        --restart unless-stopped \
        -v "$BACKEND_DIR":/app \
        -w /app \
        -e PORT=$BACKEND_PORT \
        -e MONGO_URI="$MONGO_URI" \
        -e DOUBAO_API_KEY="$DOUBAO_API_KEY" \
        -e DOUBAO_MODEL_VERSION="$DOUBAO_MODEL_VERSION" \
        $BACKEND_IMAGE sh -c "
            npm config set registry https://registry.npmmirror.com &&
            npm install && 
            npm start
        "
        
    if [ $? -eq 0 ]; then
        echo "    后端容器启动成功！ID: $(docker ps -q -f name=$BACKEND_CONTAINER)"
    else
        echo "!!! 后端启动失败"
        exit 1
    fi
    cd "$PROJECT_ROOT"
else
    echo "!!! 未找到后端目录: $BACKEND_DIR"
    exit 1
fi

# 5. 更新 Nginx 配置
echo ">>> [5/5] 更新 Nginx 配置..."
if [ -f "$PROJECT_ROOT/nginx.conf" ]; then
    docker cp "$PROJECT_ROOT/nginx.conf" $NGINX_CONTAINER:/etc/nginx/nginx.conf
    
    echo "    正在重载 Nginx..."
    if docker exec $NGINX_CONTAINER nginx -t; then
        docker exec $NGINX_CONTAINER nginx -s reload
        echo ">>> 部署完成！"
        echo "访问地址: https://tongzhilian.cn/duoyu/"
    else
        echo "!!! Nginx 配置校验失败，请检查 nginx.conf"
        exit 1
    fi
else
    echo "!!! 未找到 nginx.conf 文件，跳过配置更新"
fi
