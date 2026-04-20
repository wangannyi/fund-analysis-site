require("dotenv").config();
const express = require('express');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const { scrapeAndSave, FUNDS_FILE } = require('./scraper');
const { sendDailyReport } = require('./notifier');
const { generateAdvice, ADVICE_FILE } = require('./analyzer');

const app = express();
const PORT = process.env.PORT || 3001;

// 静态文件服务（React构建产物）
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
}

// API: 获取基金数据
app.get('/api/v1/funds', (req, res) => {
  try {
    if (!fs.existsSync(FUNDS_FILE)) {
      return res.status(404).json({ error: '数据尚未生成，请稍后再试' });
    }
    const data = JSON.parse(fs.readFileSync(FUNDS_FILE, 'utf-8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '读取数据失败', message: error.message });
  }
});

// API: 获取投资建议
app.get('/api/v1/advice', (req, res) => {
  try {
    if (!fs.existsSync(ADVICE_FILE)) {
      return res.status(404).json({ error: '投资建议尚未生成' });
    }
    const data = JSON.parse(fs.readFileSync(ADVICE_FILE, 'utf-8'));
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: '读取建议失败', message: error.message });
  }
});

// API: 手动触发数据刷新
app.post('/api/v1/refresh', async (req, res) => {
  try {
    const fundsData = await scrapeAndSave();
    if (fundsData) {
      generateAdvice(fundsData);
      res.json({ success: true, message: '数据已刷新' });
    } else {
      res.status(500).json({ error: '抓取数据失败' });
    }
  } catch (error) {
    res.status(500).json({ error: '刷新失败', message: error.message });
  }
});

// 前端路由回退
app.get('/{*path}', (req, res) => {
  const indexPath = path.join(clientBuildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <html>
        <body style="font-family:sans-serif;text-align:center;padding:50px">
          <h2>基金分析平台 API 已启动</h2>
          <p>前端尚未构建，请先运行 <code>cd client && npm run build</code></p>
          <p>API 端点:</p>
          <ul style="list-style:none">
            <li><a href="/api/v1/funds">GET /api/v1/funds</a> - 基金数据</li>
            <li><a href="/api/v1/advice">GET /api/v1/advice</a> - 投资建议</li>
            <li>POST /api/v1/refresh - 手动刷新</li>
          </ul>
        </body>
      </html>
    `);
  }
});

// 定时任务：每天早上10点刷新数据并推送邮件
cron.schedule('0 10 * * *', async () => {
  console.log(`[定时任务] ${new Date().toISOString()} 开始每日刷新...`);
  const fundsData = await scrapeAndSave();
  if (fundsData) {
    generateAdvice(fundsData);
    console.log('[定时任务] 数据刷新完成，开始发送邮件...');
    await sendDailyReport();
  }
});

// 启动时先抓取一次数据
async function init() {
  if (!fs.existsSync(FUNDS_FILE)) {
    console.log('首次启动，正在抓取数据...');
    const fundsData = await scrapeAndSave();
    if (fundsData) {
      generateAdvice(fundsData);
    }
  } else {
    console.log('已有数据文件，跳过初始抓取');
  }
}

app.listen(PORT, () => {
  console.log(`🚀 服务器已启动: http://localhost:${PORT}`);
  console.log(`📊 API: http://localhost:${PORT}/api/v1/funds`);
  console.log(`💡 建议: http://localhost:${PORT}/api/v1/advice`);
  init();
});
