# 多智能体股票投顾系统 - 技术架构文档 (TAD)

## 1. 技术栈选型
-   **前端**：Vue 3 (Composition API) + Element Plus
    -   **动画库**：**GSAP (GreenSock)** - 处理复杂的角色入场和状态切换动画。
    -   **图表**：ECharts (用于雷达图)。
-   **后端**：Node.js + Express (轻量级Web框架)。
-   **数据库**：MongoDB (Mongoose ORM) - 存储非结构化分析报告与对话记录。
-   **大模型**：豆包 (Doubao) API - 需使用支持联网检索的模型版本（如 `doubao-seed-1-6-250615`）。
-   **环境管理**：dotenv - 管理API Key、Agent Prompts及Tool配置。

## 2. 系统架构图
```
[Client / Browser]  <-- HTTP/JSON -->  [Node.js Server]  <-- HTTP (Tools: Web Search) --> [Doubao API]
       |                                      |                                              |
   (Vue3 + GSAP)                        (Express App)                                    [Internet]
   [3D Assets]                                |
                                         [MongoDB]
```

## 3. 后端分层架构 (Layered Architecture)
*(保持不变)*

## 4. 数据库设计 (MongoDB)
*(保持不变)*

## 5. 关键流程 (Sequence)
*(保持不变)*
