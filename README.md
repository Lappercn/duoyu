# 多鱼理财 (DuoYu Finance) - AI驱动的多智能体股票投顾系统

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-stable-success)

## 📖 项目简介

**多鱼理财** 是一款基于 **AI Agent（人工智能体）** 技术的下一代智能投顾系统。它突破了传统 AI 投顾仅做简单问答的局限，通过构建一个由**首席情报官、多头分析师、空头风控官、资深主持人**组成的虚拟专业投研团队，模拟顶级基金公司的决策流程。

系统不仅能实时联网检索最新的市场行情与新闻，还能通过“左右互搏”的辩论机制，为您展示投资决策背后的逻辑冲突与权衡，提供透明、深度且客观的投资建议。

## 🌐 在线体验

👉 **立即访问在线演示**: [https://tongzhilian.cn/duoyu/](https://tongzhilian.cn/duoyu/)

---

## 🌟 核心亮点

### 1. 🚀 全真·实时数据驱动
拒绝“幻觉”！我们的**顾问智能体 (Consultant Agent)** 接入了实时联网搜索能力。
- **秒级行情**：实时获取股票的最新价格、涨跌幅、成交量、换手率等盘面核心指标。
- **突发新闻**：即时捕捉影响股价的行业政策、公司公告与市场传闻。
- **数据溯源**：所有分析依据均在报告中附带真实新闻链接与数据来源，真实可查。

### 2. ⚔️ 多视角逻辑博弈 (Multi-Agent Debate)
我们将决策过程透明化，模拟真实的投研会议：
- **🐂 多头分析师 (Bull Agent)**：戴着“乐观滤镜”，挖掘低估值、高增长潜力和护城河优势，寻找买入机会。
- **🐻 空头风控官 (Bear Agent)**：戴着“悲观滤镜”，审计高估值泡沫、技术面破位与宏观风险，发出预警。
- **🎤 资深主持人 (Host Agent)**：引导双方进行激烈的观点辩论，挖掘逻辑漏洞，最终综合双方论据给出公正裁决。

### 3. 🎙️ 沉浸式交互体验
- **3D 虚拟数字人**：每个智能体都有独特的 3D 形象与性格特征。
- **实时语音播报 (TTS)**：集成火山引擎超逼真语音合成，像真人顾问一样与您对话。
- **动态可视化报表**：将复杂的金融数据转化为直观的仪表盘与评分雷达图。

---

## 🛠️ 技术架构

本项目采用前后端分离架构，严格遵循高内聚、低耦合的设计原则。

### 前端 (Frontend)
- **框架**：Vue 3 + Vite
- **UI 组件库**：Element Plus
- **3D 引擎**：Three.js (支持 Draco 压缩模型，加载速度极快)
- **状态管理**：Pinia
- **路由**：Vue Router

### 后端 (Backend)
- **运行时**：Node.js
- **Web 框架**：Express
- **数据库**：MongoDB (持久化存储投研报告与历史记录)
- **大模型基座**：接入豆包 (Doubao) 大模型 API，具备强大的联网搜索与逻辑推理能力。
- **语音服务**：火山引擎 TTS (Text-to-Speech)

### 部署与运维
- **容器化**：Docker + Docker Compose 全栈容器化部署。
- **反向代理**：Nginx (支持动态 DNS 解析与 SSL 配置)。
- **自动化脚本**：提供一键部署脚本 `deploy_reset.sh`，支持环境自动清理与重置。

---

## 🚀 快速开始

### 环境要求
- Linux / Windows (WSL2)
- Docker & Docker Compose
- Node.js 18+ (仅本地开发需要)

### 部署步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-repo/duoyu-finance.git
   cd duoyu-finance
   ```

2. **配置环境变量**
   在 `backend` 目录下创建 `.env` 文件，填入以下配置：
   ```env
   PORT=3000
   MONGO_URI=mongodb://localhost:27017/duoyu
   
   # LLM Config (豆包大模型)
   DOUBAO_API_KEY=your_api_key
   DOUBAO_MODEL_VERSION=your_model_version
   
   # TTS Config (火山引擎语音)
   TTS_APPID=your_appid
   TTS_ACCESS_TOKEN=your_access_token
   TTS_CLUSTER=volcano_tts
   TTS_SECRET_KEY=your_secret_key
   ```

3. **一键部署**
   ```bash
   chmod +x deploy_reset.sh
   ./deploy_reset.sh
   ```
   脚本会自动清理旧容器、创建网络、启动 MongoDB、构建前端并启动后端服务。

4. **访问系统**
   打开浏览器访问：`http://localhost/duoyu/` (或服务器 IP)

---

## 📂 目录结构

```
duoyu-finance/
├── backend/                # 后端服务
│   ├── src/
│   │   ├── controllers/    # API 控制器
│   │   ├── services/       # 核心业务逻辑 (Agent Orchestrator, LLM, TTS)
│   │   └── models/         # MongoDB 数据模型
│   └── ...
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # Vue 组件 (3D 模型, 报表等)
│   │   ├── views/          # 页面视图
│   │   └── ...
│   └── public/             # 静态资源 (3D 模型, 解码器)
├── docs/                   # 项目文档
├── deploy_reset.sh         # 自动化部署脚本
├── nginx_full.conf         # Nginx 配置文件
└── ...
```

---

## 🤝 贡献指南

欢迎提交 Issue 或 Pull Request！
1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 许可证

本项目基于 MIT 许可证开源。详情请参阅 [LICENSE](LICENSE) 文件。
