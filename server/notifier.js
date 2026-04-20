const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const ADVICE_FILE = path.join(__dirname, '..', 'data', 'advice.json');
const FUNDS_FILE = path.join(__dirname, '..', 'data', 'funds.json');

// 邮件配置 - 使用 Gmail SMTP
// 需要在 Gmail 设置中开启"应用专用密码": https://myaccount.google.com/apppasswords
const EMAIL_CONFIG = {
  to: 'cookieee.wang@gmail.com',
  from: process.env.SMTP_USER || 'your-sender@gmail.com',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'your-sender@gmail.com',
      pass: process.env.SMTP_PASS || 'your-app-password',
    },
  },
};

function createTransporter() {
  return nodemailer.createTransport(EMAIL_CONFIG.smtp);
}

// 生成邮件 HTML 内容
function buildEmailHtml(fundsData, adviceData) {
  const date = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  const sectorSummary = Object.entries(fundsData.sectors)
    .map(([key, sector]) => {
      const top3 = sector.funds.slice(0, 3);
      const rows = top3.map((f) =>
        `<tr><td style="padding:4px 8px">${f.code}</td><td style="padding:4px 8px">${f.name}</td><td style="padding:4px 8px;color:${f.changePercent >= 0 ? '#dc2626' : '#16a34a'}">${f.changePercent >= 0 ? '+' : ''}${f.changePercent}%</td></tr>`
      ).join('');
      return `
        <h3 style="margin:16px 0 8px;color:#1e293b">${sector.name}（共${sector.totalCount}只）</h3>
        <table style="border-collapse:collapse;width:100%;font-size:14px">
          <tr style="background:#f1f5f9"><th style="padding:6px 8px;text-align:left">代码</th><th style="padding:6px 8px;text-align:left">名称</th><th style="padding:6px 8px;text-align:left">涨跌幅</th></tr>
          ${rows}
        </table>`;
    }).join('');

  const balanced = adviceData.profiles.balanced;
  const adviceRows = balanced.recommendations.map((r) =>
    `<tr><td style="padding:4px 8px">${r.code}</td><td style="padding:4px 8px">${r.name}</td><td style="padding:4px 8px">${r.sector}</td><td style="padding:4px 8px;font-weight:bold">¥${r.amount.toLocaleString()}</td><td style="padding:4px 8px;font-size:12px">${r.reason}</td></tr>`
  ).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:680px;margin:0 auto;padding:20px;color:#334155">
  <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:24px;border-radius:12px;color:white;margin-bottom:24px">
    <h1 style="margin:0;font-size:22px">📊 基金日报 - ${date}</h1>
    <p style="margin:8px 0 0;opacity:0.9">数据更新时间: ${new Date(fundsData.updateTime).toLocaleString('zh-CN')}</p>
  </div>

  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:20px">
    <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a">🏆 各行业 Top3 基金</h2>
    ${sectorSummary}
  </div>

  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin-bottom:20px">
    <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a">💡 今日投资建议（均衡型 / ${balanced.etfBudget.toLocaleString()}元）</h2>
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      <tr style="background:#f1f5f9"><th style="padding:6px 8px;text-align:left">代码</th><th style="padding:6px 8px;text-align:left">名称</th><th style="padding:6px 8px;text-align:left">行业</th><th style="padding:6px 8px;text-align:left">建议金额</th><th style="padding:6px 8px;text-align:left">理由</th></tr>
      ${adviceRows}
    </table>
    <p style="margin:12px 0 0;font-size:13px;color:#64748b">现金储备: ¥${balanced.cashBudget.toLocaleString()} | 覆盖 ${adviceData.marketOverview.sectorCount} 个行业</p>
  </div>

  <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px;font-size:13px;color:#92400e">
    ⚠️ <strong>风险提示</strong>：以上内容仅供参考，不构成投资建议。基金有风险，投资需谨慎。过往业绩不代表未来表现。
  </div>

  <p style="text-align:center;font-size:12px;color:#94a3b8;margin-top:24px">
    此邮件由基金分析平台自动发送 | <a href="http://localhost:3001" style="color:#2563eb">查看完整报告</a>
  </p>
</body>
</html>`;
}

// 发送邮件
async function sendDailyReport() {
  try {
    if (!fs.existsSync(FUNDS_FILE) || !fs.existsSync(ADVICE_FILE)) {
      console.log('[邮件] 数据文件不存在，跳过发送');
      return false;
    }

    const fundsData = JSON.parse(fs.readFileSync(FUNDS_FILE, 'utf-8'));
    const adviceData = JSON.parse(fs.readFileSync(ADVICE_FILE, 'utf-8'));

    const html = buildEmailHtml(fundsData, adviceData);
    const date = new Date().toLocaleDateString('zh-CN');

    const transporter = createTransporter();

    const info = await transporter.sendMail({
      from: `"基金日报" <${EMAIL_CONFIG.from}>`,
      to: EMAIL_CONFIG.to,
      subject: `📊 基金分析日报 - ${date}`,
      html,
    });

    console.log(`[邮件] 发送成功: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`[邮件] 发送失败: ${error.message}`);
    return false;
  }
}

module.exports = { sendDailyReport, EMAIL_CONFIG };
