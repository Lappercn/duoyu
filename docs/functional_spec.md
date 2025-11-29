# 多智能体股票投顾系统 - 前后端功能规格说明书 (FSD)

## 1. 后端接口文档 (API Specification)
*(保持不变，参考 technical_architecture.md)*

## 2. 前端功能组件 (Frontend Components)

### 2.1 资源目录规范 (Asset Structure)
为支持“狼人杀”风格的 3D 动画展示，前端 `public` 目录需严格遵循以下结构：
```
public/
├── agents/
│   ├── consultant/
│   │   ├── greeting.webp   # 打招呼/入场动画 (支持 GIF/WebP/MP4)
│   │   ├── speaking.webp   # 发言动画
│   │   └── idle.webp       # 待机/聆听动画 (可选，默认显示第一帧)
│   ├── bull/
│   │   ├── greeting.webp
│   │   ├── speaking.webp
│   │   └── idle.webp
│   ├── bear/
│   │   ...
│   └── host/
│       ...
```

### 2.2 核心页面与组件 (Views & Components)

#### 1. Views
*   **EntryView.vue**: 
    *   全屏背景，极简风格。
    *   输入框动效：输入股票代码后，背景隐约出现 K 线波动。
    *   “召唤团队”按钮：点击后触发转场动画进入 StageView。

*   **StageView.vue (核心舞台)**:
    *   **布局**：采用 Flex/Grid 布局模拟“圆桌”或“半圆舞台”。
    *   **背景**：深色金融科技风背景。
    *   **逻辑**：
        *   监听 `currentAnalysisStatus` 和 `debateLogs`。
        *   根据当前日志的 `speaker` 字段，动态控制各个 `AgentAvatar` 的状态（Speaking/Idle）。
        *   **入场序列**：Consultant -> Bull -> Bear -> Host 依次延时显示。

#### 2. Components
*   **AgentAvatar.vue**:
    *   **Props**: 
        *   `role` (consultant/bull/bear/host)
        *   `status` (hidden/entering/idle/speaking)
    *   **功能**：
        *   根据 `status` 切换 `<img>` 或 `<video>` 源文件。
        *   使用 CSS Transition 或 GSAP 实现入场位移、缩放、高亮效果。
        *   **Speaking 态**：放大 1.2 倍，增加外发光 (Box-shadow)，播放 `speaking.webp`。
        *   **Idle 态**：缩小/变暗，播放 `idle.webp` 或静态图。

*   **SpeechBubble.vue (气泡)**:
    *   打字机效果 (Typewriter Effect) 展示当前发言内容。
    *   自动滚动。

*   **MarketDashboard.vue (情报板)**:
    *   悬浮在舞台左侧/右侧。
    *   展示顾问检索到的 `Price`, `Change%`, `News Summary`。
    *   仅在 Consultant 入场后滑入显示。

### 2.3 状态管理 (Pinia Store)
*   **State**:
    *   `activeSpeaker`: String ('bull', 'bear'...) —— 驱动动画切换的核心变量。
    *   `stagePhase`: String ('initializing', 'debate', 'conclusion')。
*   **Actions**:
    *   `setSpeaker(role)`: 更新当前发言人，触发动画。
    *   `pushLog(log)`: 添加新日志，并自动 `setSpeaker(log.speaker)`。

## 3. 前端技术栈增补
*   **GSAP (GreenSock)**: 用于处理复杂的入场序列动画和状态切换动效（比 CSS Keyframes 更可控）。
*   **TypeIt / Typed.js**: 实现逼真的打字机文本输出效果。
