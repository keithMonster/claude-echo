# Claude Echo 更新日志 (2026-01-30)

## 1. 概览

本次更新主要集中在增强用户交互体验，实现了数据图表的可视化联动。用户现在可以通过点击仪表盘上的图表元素，深入探索具体的会话记录和项目信息。

## 2. 新增功能

### 2.1 交互式图表与弹窗
*   **点击穿透 (Drill-down)**:
    *   **常用工具 (Top Tools)**: 点击柱状图中的工具栏，弹出该工具的历史使用记录列表。
    *   **常用技能 (Top Skills)**: 点击柱状图中的技能栏，弹出该技能的历史使用记录列表。
    *   **活跃项目 (Active Projects)**: 点击“活跃项目”统计卡片，弹出所有已识别项目的列表。
*   **动态弹窗 (Modal)**:
    *   统一的 Modal 组件设计，支持加载状态 (Loading Spinner)。
    *   结果列表展示：项目名称、时间戳、调用次数摘要。
    *   无结果时的友好提示。

### 2.2 后端搜索能力
*   **新 API 路由**: `app/api/search/route.ts`
    *   `GET /api/search?type=tool&name=Bash`: 查询使用过 Bash 工具的会话。
    *   `GET /api/search?type=skill&name=commit`: 查询使用过 commit 技能的会话。
    *   `GET /api/search?type=project`: 获取所有项目名称列表。
*   **核心逻辑增强**: `lib/claude-history.ts`
    *   新增 `searchByToolOrSkill`: 高效扫描 `.jsonl` 文件，按需提取匹配会话。
    *   新增 `getProjectsList`: 快速获取项目目录列表。

## 3. 核心文件变更

### modified: `lib/claude-history.ts`
*   增加了 `searchByToolOrSkill` 函数：实现了对历史记录的反向索引搜索。
*   增加了 `getProjectsList` 函数：提供项目列表数据源。
*   优化了 `getHistoryOverview`：在 `stats` 对象中增加了 `projects` 字段。

### new: `app/api/search/route.ts`
*   创建了全新的 Search API Endpoint，处理前端的查询请求。

### modified: `app/page.tsx`
*   重构了页面组件：
    *   引入 `Modal` 状态管理 (`modalOpen`, `modalContent` 等)。
    *   引入 `handleChartClick` 和 `handleProjectClick` 事件处理函数。
    *   给 `BarChart` 和 `StatCard` 添加了点击交互逻辑。
    *   优化了 UI 细节（Loading 动画、Hover 效果）。

## 4. 下一步计划
*   **搜索优化**: 目前搜索是实时扫描文件系统，随着记录增多可能会变慢。未来可考虑引入简单的内存缓存或索引文件。
*   **更多维度**: 支持按时间范围搜索，或按项目筛选工具使用情况。
