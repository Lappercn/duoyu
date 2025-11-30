#!/bin/bash

# ==================================================================
# 全新部署脚本 (适用于新加坡/海外服务器，无镜像源配置)
# 功能：
# 1. (可选) 清理所有 Docker 容器和镜像，重置环境
# 2. 启动 Nginx 容器 (挂载旧业务 + 新业务)
# 3. 构建并部署 [多鱼理财] 前端到 /duoyu
# 4. 启动 [多鱼理财] 后端 API 服务
# ==================================================================

# 配置区域
PROJECT_ROOT=$(pwd)
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
ENV_FILE="$BACKEND_DIR/.env"

# 旧业务静态文件目录 (请确认此路径正确，否则根路径访问会 404)
# 假设旧业务在: /root/project/tongzhilian/doc/.vitepress/dist
OLD_SITE_DIR="/root/project/tongzhilian/doc/.vitepress/dist"

# 证书目录 (请确认此路径正确)
SSL_DIR="/data/nginx/ssl" 

# 容器名称
NGINX_CONTAINER="nginx"
BACKEND_CONTAINER="duoyu-backend"

echo ">>> [警告] 此脚本将清理旧的 Docker 容器！"
read -p "确认要重新部署吗？(y/n): " confirm
if [ "$confirm" != "y" ]; then
    echo "已取消。"
    exit 0
fi

# ================= 0. 读取 .env 配置 =================
echo ">>> [0/5] 读取环境配置..."
if [ -f "$ENV_FILE" ]; then
    # 自动从 .env 文件读取配置，处理可能的 Windows 换行符
    # 使用 grep 和 sed 提取变量，避免直接 source 可能导致的兼容性问题
    MONGO_URI=$(grep "^MONGO_URI=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '\r' | tr -d '"' | tr -d "'")
    DOUBAO_API_KEY=$(grep "^DOUBAO_API_KEY=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '\r' | tr -d '"' | tr -d "'")
    DOUBAO_MODEL_VERSION=$(grep "^DOUBAO_MODEL_VERSION=" "$ENV_FILE" | cut -d'=' -f2- | tr -d '\r' | tr -d '"' | tr -d "'")
    
    echo "    已读取 MONGO_URI"
    echo "    已读取 DOUBAO_API_KEY"
    echo "    已读取 DOUBAO_MODEL_VERSION"
else
    echo "!!! 未找到 .env 文件: $ENV_FILE"
    echo "请确保 backend 目录下有 .env 文件，或者手动在脚本中配置变量。"
    exit 1
fi

# ================= 1. 清理环境 =================
echo ">>> [1/5] 清理环境..."
# 停止并删除相关容器
docker rm -f $NGINX_CONTAINER $BACKEND_CONTAINER >/dev/null 2>&1
# 清理网络
docker network rm duoyu-net >/dev/null 2>&1

# 创建网络
docker network create duoyu-net
echo "    网络 duoyu-net 已创建"

# ================= 2. 启动 Nginx =================
echo ">>> [2/5] 启动 Nginx..."

if [ ! -d "$SSL_DIR" ]; then
    echo "!!! 警告：未找到 SSL 证书目录: $SSL_DIR"
    echo "!!! Nginx 可能无法启动。请修改脚本中的 SSL_DIR 变量。"
fi

docker run -d \
    --name $NGINX_CONTAINER \
    --network duoyu-net \
    --restart unless-stopped \
    -p 80:80 \
    -p 443:443 \
    -v "$PROJECT_ROOT/nginx_full.conf":/etc/nginx/nginx.conf \
    -v "$OLD_SITE_DIR":/usr/share/nginx/html \
    -v "$SSL_DIR":/etc/nginx/ssl \
    nginx:latest

if [ $? -eq 0 ]; then
    echo "    Nginx 启动成功"
else
    echo "!!! Nginx 启动失败，请检查端口占用或挂载路径"
    exit 1
fi

# ================= 3. 构建并部署前端 =================
echo ">>> [3/5] 构建多鱼理财前端..."
if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR"
    
    # 清理旧依赖
    rm -rf node_modules package-lock.json dist
    
    # 启动临时容器构建
    docker run --rm \
        -v "$FRONTEND_DIR":/app \
        -w /app \
        node:20-alpine sh -c "
            npm install && 
            VITE_BASE_PATH=/duoyu/ VITE_API_BASE_URL=/duoyu/api npm run build
        "
        
    if [ $? -eq 0 ]; then
        echo "    前端构建成功"
        docker exec $NGINX_CONTAINER mkdir -p /usr/share/nginx/html/duoyu
        docker cp dist/. $NGINX_CONTAINER:/usr/share/nginx/html/duoyu/
        echo "    已部署到 /duoyu"
    else
        echo "!!! 前端构建失败"
        exit 1
    fi
    cd "$PROJECT_ROOT"
else
    echo "!!! 未找到前端目录"
    exit 1
fi

# ================= 4. 启动后端 =================
echo ">>> [4/5] 启动后端..."
if [ -d "$BACKEND_DIR" ]; then
    cd "$BACKEND_DIR"
    rm -rf node_modules package-lock.json
    
    # 将 .env 挂载进去，或者直接传环境变量
    # 这里我们选择直接传环境变量，因为刚才已经读取了
    # 同时为了方便后续调试，我们也可以把 .env 挂载进去（如果代码里用 dotenv 读取文件的话）
    # 但我们的代码是 process.env.XXX，所以传参更稳妥
    
    docker run -d \
        --name $BACKEND_CONTAINER \
        --network duoyu-net \
        --restart unless-stopped \
        -v "$BACKEND_DIR":/app \
        -w /app \
        -e PORT=3000 \
        -e MONGO_URI="$MONGO_URI" \
        -e DOUBAO_API_KEY="$DOUBAO_API_KEY" \
        -e DOUBAO_MODEL_VERSION="$DOUBAO_MODEL_VERSION" \
        node:20-alpine sh -c "
            npm install && 
            npm start
        "
        
    echo "    后端已启动"
    cd "$PROJECT_ROOT"
else
    echo "!!! 未找到后端目录"
    exit 1
fi

# ================= 5. 收尾 =================
echo ">>> [5/5] 验证..."
docker exec $NGINX_CONTAINER nginx -t
docker exec $NGINX_CONTAINER nginx -s reload

echo "========================================"
echo "部署完成！"
echo "旧业务 (根路径): https://tongzhilian.cn/"
echo "新业务 (多鱼):   https://tongzhilian.cn/duoyu/"
echo "========================================"
