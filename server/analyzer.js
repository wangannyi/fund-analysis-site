const fs = require('fs');
const path = require('path');

const FUNDS_FILE = path.join(__dirname, '..', 'data', 'funds.json');
const ADVICE_FILE = path.join(__dirname, '..', 'data', 'advice.json');

const TOTAL_CAPITAL = 100000; // 10万本金

// 风险偏好配置
const RISK_PROFILES = {
  conservative: {
    name: '保守型',
    riskLevel: '低风险',
    description: '追求稳健收益，控制回撤。适合风险承受能力较低的投资者。',
    allocation: { etf: 0.3, bond: 0.5, cash: 0.2 },
    maxSingleSector: 0.15,
    preferSectors: ['power', 'energy'],
  },
  balanced: {
    name: '均衡型',
    riskLevel: '中风险',
    description: '平衡收益与风险，兼顾成长与稳健。适合大多数投资者。',
    allocation: { etf: 0.5, bond: 0.3, cash: 0.2 },
    maxSingleSector: 0.25,
    preferSectors: ['power', 'energy', 'internet'],
  },
  aggressive: {
    name: '进取型',
    riskLevel: '高风险',
    description: '追求高收益，承受较大波动。适合风险承受能力强的投资者。',
    allocation: { etf: 0.7, bond: 0.2, cash: 0.1 },
    maxSingleSector: 0.3,
    preferSectors: ['ai', 'internet', 'energy', 'power'],
  },
};

// 评估单只基金
function scoreFund(fund) {
  let score = 0;
  const rate = parseFloat(fund.changePercent) || 0;
  const amount = parseFloat(fund.amount) || 0;
  const marketCap = parseFloat(fund.marketCap) || 0;

  // 涨幅得分 (0-40分)
  if (rate > 5) score += 40;
  else if (rate > 3) score += 35;
  else if (rate > 1) score += 25;
  else if (rate > 0) score += 15;
  else score += 5;

  // 成交额得分 - 流动性 (0-30分)
  if (amount > 1e9) score += 30;
  else if (amount > 5e8) score += 25;
  else if (amount > 1e8) score += 20;
  else if (amount > 5e7) score += 10;
  else score += 5;

  // 规模得分 (0-30分)
  if (marketCap > 1e10) score += 30;
  else if (marketCap > 5e9) score += 25;
  else if (marketCap > 1e9) score += 20;
  else if (marketCap > 2e8) score += 10;
  else score += 5;

  return score;
}

// 生成投资建议
function generateAdvice(fundsData) {
  if (!fundsData || !fundsData.sectors) {
    return { error: '无基金数据' };
  }

  const advice = {
    updateTime: new Date().toISOString(),
    capital: TOTAL_CAPITAL,
    marketOverview: generateMarketOverview(fundsData.sectors),
    profiles: {},
  };

  for (const [profileKey, profile] of Object.entries(RISK_PROFILES)) {
    const etfBudget = TOTAL_CAPITAL * profile.allocation.etf;
    const bondBudget = TOTAL_CAPITAL * profile.allocation.bond;
    const cashBudget = TOTAL_CAPITAL * profile.allocation.cash;

    // 从偏好行业中选基金
    const recommendations = [];
    const sectorBudget = etfBudget / profile.preferSectors.length;

    for (const sectorKey of profile.preferSectors) {
      const sector = fundsData.sectors[sectorKey];
      if (!sector || !sector.funds || sector.funds.length === 0) continue;

      // 对基金评分排序
      const scoredFunds = sector.funds
        .map((f) => ({ ...f, score: scoreFund(f) }))
        .sort((a, b) => b.score - a.score);

      // 取前2只
      const topFunds = scoredFunds.slice(0, 2);
      const perFundBudget = Math.min(
        sectorBudget / topFunds.length,
        TOTAL_CAPITAL * profile.maxSingleSector
      );

      for (const fund of topFunds) {
        recommendations.push({
          code: fund.code,
          name: fund.name,
          sector: sector.name,
          changePercent: fund.changePercent,
          score: fund.score,
          amount: Math.round(perFundBudget / 100) * 100, // 取整到百
          reason: generateReason(fund, sector.name),
        });
      }
    }

    advice.profiles[profileKey] = {
      ...profile,
      etfBudget,
      bondBudget,
      cashBudget,
      recommendations,
      dipPlan: `建议每周定投 ¥${Math.round(etfBudget / 4 / 52 / 100) * 100 || 100}，持续 6-12 个月，分散买入时点风险。`,
    };
  }

  // 保存
  const dataDir = path.dirname(ADVICE_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(ADVICE_FILE, JSON.stringify(advice, null, 2), 'utf-8');
  console.log(`投资建议已保存到 ${ADVICE_FILE}`);

  return advice;
}

// 生成市场概览
function generateMarketOverview(sectors) {
  let totalFunds = 0;
  const sectorCount = Object.keys(sectors).length;

  for (const sector of Object.values(sectors)) {
    totalFunds += sector.totalCount || 0;
  }

  return {
    totalCapital: TOTAL_CAPITAL,
    sectorCount,
    totalFunds,
  };
}

// 生成推荐理由
function generateReason(fund, sectorName) {
  const rate = parseFloat(fund.changePercent) || 0;
  const parts = [`${sectorName}行业ETF`];

  if (rate > 3) parts.push('近期涨幅领先');
  else if (rate > 0) parts.push('表现稳健');
  else parts.push('估值处于低位，具备反弹潜力');

  const amount = parseFloat(fund.amount) || 0;
  if (amount > 1e9) parts.push('成交活跃，流动性好');
  else if (amount > 1e8) parts.push('流动性尚可');

  return parts.join('，');
}

module.exports = { generateAdvice, ADVICE_FILE };
