# Claude Echo 🧠⚡️

> **"每一次对话，不仅是解决问题，更是思维的投射。"**

Claude Echo 是一个深度分析与可视化工具，旨在解析开发者与 Claude 的交互历史。它不仅是一个 Dashboard，更是一面认知的镜子，帮助你看见在与 AI 协作过程中的思维路径、技能偏好与能力进化。

---

## 🌟 核心理念 (Philosophy)

### 1. The Echo (回响)
我们在与 AI 的每一次对话中，都留下了思维的指纹。Claude Echo 捕捉这些“回响”，将散落在无数 JSONL 文件中的对话碎片，重构为有意义的认知轨迹。

### 2. The Mirror (镜像)
你最常使用的工具是什么？你最依赖的技能有哪些？你的工作节奏如何？Echo 通过客观的数据分析，为你构建一幅“AI 协作画像”。它让你看见自己是偏向于 **Architect** (设计者)、**executor** (执行者) 还是 **Explorer** (探索者)。

### 3. Privacy First (隐私至上)
你的思维是最宝贵的资产。Claude Echo **完全本地运行**，直接读取你本地的 `.claude` 目录。没有任何数据会被上传到云端，确保绝对的隐私安全。

---

## ✨ 主要功能 (Features)

*   **📊 认知仪表盘 (Cognitive Dashboard)**
    *   **全景概览**: 实时统计会话总数、消息量、活跃项目数。
    *   **交互节奏**: 可视化每日的对话频率，捕捉你的“心流”时刻。

*   **🛠 能力画像 (Skill & Tool Profiling)**
    *   **Top Tools**: 自动识别并排名你最常用的工具（如 Bash, Grep, Edit 等），揭示你的操作习惯。
    *   **Top Skills**: 挖掘你最高频调用的技能（如 commit, review-pr 等），反映你的工作流偏好。

*   **🔍 深度回溯 (Deep Dive)**
    *   **交互式探索**: 点击任意图表（工具/技能/项目），即可弹窗展示所有相关的历史会话。
    *   **场景还原**: 快速定位并跳转到具体的 Session 详情页，重现当时的思考上下文。

*   **📂 项目足迹 (Project Footprint)**
    *   自动识别并聚合所有活跃项目，让你一览无余地看到 AI 协助过的每一个代码领地。

---

## 🚀 快速开始 (Getting Started)

### 前置要求
*   macOS / Linux 环境
*   本地已安装并使用过 `claude` (CLI)
*   Node.js 18+

### 安装与运行

```bash
# 1. 克隆项目
git clone https://github.com/keithMonster/claude-echo.git
cd claude-echo

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000)，即可看到你的认知回响。

---

## 📦 技术栈 (Tech Stack)

*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **Visualization**: [Recharts](https://recharts.org/)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Data Source**: Local File System (`~/.claude/projects`)

---

## 🤝 贡献 (Contributing)

我们欢迎任何形式的贡献——无论是新的可视化想法、性能优化，还是对认知分析的深刻见解。

1.  Fork 本仓库
2.  创建你的 Feature 分支 (`git checkout -b feature/AmazingFeature`)
3.  提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4.  推送到分支 (`git push origin feature/AmazingFeature`)
5.  提交 Pull Request

---

## License

MIT License. Created by [KeithMonster](https://github.com/keithMonster).
