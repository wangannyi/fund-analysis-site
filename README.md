# Fund Analysis Site 📈

场内 ETF 数据追踪与投资建议平台。自动抓取东方财富基金数据，生成投资建议，支持邮件通知。

## 功能特性

- 🔍 自动抓取场内 ETF 实时数据（东方财富）
- 📊 投资建议智能生成
- 📧 每日邮件报告推送
- ⏰ 定时任务自动执行
- 🖥️ React 前端可视化展示

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js + Express |
| 前端 | React 18 (CRA) |
| 数据存储 | JSON 文件 |
| 定时任务 | node-cron |
| 邮件 | nodemailer |

## 快速开始

```bash
# 安装依赖
npm install
cd client && npm install && cd ..

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 SMTP 配置

# 开发模式（前后端同时启动）
npm run dev
```

访问 http://localhost:3000 查看前端，API 运行在 http://localhost:3001。

## 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 同时启动前后端（开发） |
| `npm run server` | 仅启动后端（热重载） |
| `npm run client` | 仅启动前端 |
| `npm run build` | 构建前端生产包 |
| `npm run start:bg` | 后台启动 server |
| `npm run stop` | 停止后台 server |
| `npm run logs` | 查看 server 日志 |

## 项目结构

```
server/
  index.js        # 路由 + 定时任务
  scraper.js      # 东方财富数据抓取
  analyzer.js     # 投资建议生成
  notifier.js     # 邮件通知
client/
  src/
    components/   # React 组件
      FundTable.js
      AdvicePanel.js
      Header.js
data/
  funds.json      # 基金数据（自动生成）
  advice.json     # 投资建议（自动生成）
```

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/v1/funds` | 获取基金数据 |
| GET | `/api/v1/advice` | 获取投资建议 |
| POST | `/api/v1/refresh` | 手动触发数据刷新 |

## 环境变量

在项目根目录创建 `.env` 文件：

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

> ⚠️ Gmail 需使用[应用专用密码](https://myaccount.google.com/apppasswords)，非账户密码。

## License

ISC
