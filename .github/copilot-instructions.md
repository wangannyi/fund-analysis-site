# Project Guidelines

## Overview

基金分析网站（Fund Analysis Site）— 场内 ETF 数据追踪与投资建议平台。

## Architecture

```
server/          # Express API (Node.js, CommonJS)
  index.js       # 路由 + 定时任务
  scraper.js     # 东方财富数据抓取
  analyzer.js    # 投资建议生成
  notifier.js    # 邮件通知 (nodemailer)
client/          # React 18 SPA (CRA)
  src/components/  # UI 组件
data/            # JSON 文件存储 (funds.json, advice.json)
.claude/         # AI 辅助配置
  agents/        # Subagents (code-review, test, debug, etc.)
  skills/        # Skills (financial-analysis, fund-data-scraping)
```

前后端分离：client 通过 proxy (`localhost:3001`) 访问 server API。生产环境 server 直接托管 `client/build/` 静态文件。

## Build and Test

| Command | Purpose |
|---------|---------|
| `npm run dev` | 同时启动 server + client（开发模式） |
| `npm run server` | 仅启动后端（nodemon 热重载） |
| `npm run client` | 仅启动前端（React dev server） |
| `npm run build` | 构建前端生产包 |
| `npm run start:bg` | 后台启动 server |
| `npm run stop` | 停止后台 server |
| `npm run logs` | 查看后台 server 日志 |

测试尚未配置（待补充 Jest + React Testing Library）。

## Code Style

- CommonJS (`require`/`module.exports`) — server 端
- ES Modules (JSX) — client 端
- 2 空格缩进
- API 路径统一前缀 `/api/v1/`
- 中文注释，英文变量名

## Conventions

- 数据持久化使用 JSON 文件（`data/` 目录），不使用数据库
- 环境变量通过 `.env` 管理，敏感信息不入库
- 定时任务使用 `node-cron`
- 前端组件放 `client/src/components/`，每个组件一个文件
- Server 端口默认 3001，Client 端口默认 3000

## Key Dependencies

- **express** — HTTP server
- **axios** — 外部 API 请求（东方财富）
- **node-cron** — 定时数据抓取
- **nodemailer** — 邮件通知
- **react 18** — 前端 UI
- **dotenv** — 环境变量

## Pitfalls

- `.env` 中 SMTP 密码需要 Gmail 应用专用密码，非账户密码
- `data/` 目录下的 JSON 文件由 server 自动生成，不要手动编辑
- client 的 `proxy` 设置仅在开发模式生效
- 东方财富接口可能有频率限制，抓取间隔不宜过短
