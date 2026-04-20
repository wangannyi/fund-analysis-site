const axios = require('axios');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const FUNDS_FILE = path.join(DATA_DIR, 'funds.json');

// 行业关键词映射
const SECTOR_KEYWORDS = {
  internet: {
    name: '互联网',
    keywords: ['互联网', '信息技术', '计算机', '数字经济', '电子商务', '传媒', '网络'],
  },
  ai: {
    name: '人工智能',
    keywords: ['人工智能', 'AI', '机器人', '智能', '芯片', '半导体', '科技', '算力'],
  },
  power: {
    name: '电力',
    keywords: ['电力', '电网', '输配电', '发电', '电力设备', '电气'],
  },
  energy: {
    name: '新能源',
    keywords: ['新能源', '光伏', '风电', '储能', '锂电', '清洁能源', '碳中和', '绿电'],
  },
};

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Referer: 'http://fund.eastmoney.com/fundguzhi.html',
  Accept: '*/*',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
};

// 从东方财富基金估值接口获取指数型基金列表（HTTP，稳定可用）
async function fetchEtfList() {
  const url = 'http://api.fund.eastmoney.com/FundGuZhi/GetFundGZList';
  const params = {
    type: 0,
    sort: 3,
    ordertype: 'desc',
    canbuy: 0,
    pageIndex: 1,
    pageSize: 10000,
  };

  try {
    const response = await axios.get(url, { params, headers: HEADERS, timeout: 30000 });
    const data = response.data;

    if (!data || !data.Data || !data.Data.list) {
      console.error('API 返回数据格式异常');
      return [];
    }

    // 只保留指数型基金（ETF/LOF）
    const indexFunds = data.Data.list.filter(
      (f) => f.FType && (f.FType.includes('指数型') || f.jjlx === '指数型')
    );

    console.log(`  API 返回 ${data.Data.list.length} 只基金，筛选出 ${indexFunds.length} 只指数型`);

    return indexFunds.map((item) => ({
      code: item.bzdm,
      name: item.jjjc,
      price: parseFloat(item.gsz) || 0,
      changeRate: parseFloat((item.gszzl || '0').replace('%', '')) || 0,
      nav: parseFloat(item.dwjz) || 0,
      fundType: item.FType,
    }));
  } catch (error) {
    console.error('获取基金列表失败:', error.message);
    return [];
  }
}

// 从腾讯行情接口获取场内ETF交易数据（成交额、换手率等）
async function fetchTradeData(codes) {
  if (!codes || codes.length === 0) return {};

  // 腾讯接口支持批量查询，格式: sh510300,sz159915
  const queryList = codes.map((code) => {
    // 6开头为上海，其他为深圳
    const prefix = code.startsWith('5') || code.startsWith('6') ? 'sh' : 'sz';
    return `${prefix}${code}`;
  });

  // 每次最多查50个，分批
  const batchSize = 50;
  const result = {};

  for (let i = 0; i < queryList.length; i += batchSize) {
    const batch = queryList.slice(i, i + batchSize);
    try {
      const url = `http://qt.gtimg.cn/q=${batch.join(',')}`;
      const response = await axios.get(url, {
        headers: HEADERS,
        timeout: 10000,
        responseType: 'arraybuffer',
      });

      const text = new TextDecoder('gbk').decode(response.data);
      const lines = text.split(';').filter((l) => l.includes('~'));

      for (const line of lines) {
        const parts = line.split('~');
        if (parts.length < 50) continue;
        const code = parts[2];
        result[code] = {
          volume: parseInt(parts[6]) || 0,        // 成交量(手)
          amount: parseFloat(parts[37]) || 0,     // 成交额(万元)
          turnoverRate: parseFloat(parts[38]) || 0, // 换手率%
        };
      }

      // 请求间隔，避免频率限制
      if (i + batchSize < queryList.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    } catch (error) {
      console.error(`获取交易数据失败(批次${i / batchSize + 1}):`, error.message);
    }
  }

  return result;
}

// 按行业分类基金
function classifyFunds(funds, tradeData = {}) {
  const sectors = {};

  for (const [sectorKey, sectorInfo] of Object.entries(SECTOR_KEYWORDS)) {
    const matched = funds.filter((fund) =>
      sectorInfo.keywords.some((keyword) => fund.name && fund.name.includes(keyword))
    );

    // 区分场内ETF和场外基金
    const withTrade = matched.filter((f) => tradeData[f.code]);
    const withoutTrade = matched.filter((f) => !tradeData[f.code]);

    // 优先展示有交易数据的场内ETF，按成交额降序
    const sortedTrade = withTrade
      .filter((f) => !isNaN(f.changeRate))
      .sort((a, b) => (tradeData[b.code]?.amount || 0) - (tradeData[a.code]?.amount || 0));

    // 场外基金按涨跌幅降序
    const sortedOther = withoutTrade
      .filter((f) => !isNaN(f.changeRate))
      .sort((a, b) => b.changeRate - a.changeRate);

    // 场内ETF优先，不足10个用场外基金补充
    const combined = [...sortedTrade, ...sortedOther].slice(0, 10);

    const top10 = combined.map((f) => {
      const trade = tradeData[f.code] || {};
      return {
        code: f.code,
        name: f.name,
        price: f.price,
        changePercent: f.changeRate,
        nav: f.nav,
        fundType: f.fundType,
        volume: trade.volume || 0,
        amount: trade.amount || 0,
        turnoverRate: trade.turnoverRate || 0,
      };
    });

    sectors[sectorKey] = {
      name: sectorInfo.name,
      totalCount: matched.length,
      funds: top10,
    };
  }

  return sectors;
}

// 主抓取函数
async function scrapeAndSave() {
  console.log(`[${new Date().toISOString()}] 开始抓取基金数据...`);

  const allFunds = await fetchEtfList();
  if (allFunds.length === 0) {
    console.error('未获取到任何基金数据，跳过本次更新');
    return null;
  }

  console.log(`获取到 ${allFunds.length} 只ETF基金`);

  // 获取场内ETF的交易数据（成交额、换手率）
  // 场内基金代码: 5xxxxx(上海ETF), 1xxxxx(深圳ETF/LOF), 16xxxx(LOF)
  const etfCodes = allFunds
    .filter((f) => {
      if (!f.code) return false;
      return f.code.startsWith('5') || f.code.startsWith('15') || f.code.startsWith('16');
    })
    .map((f) => f.code);
  console.log(`尝试获取 ${etfCodes.length} 只场内ETF交易数据...`);
  const tradeData = await fetchTradeData(etfCodes);
  console.log(`成功获取 ${Object.keys(tradeData).length} 只ETF交易数据`);

  const sectors = classifyFunds(allFunds, tradeData);

  const result = {
    updateTime: new Date().toISOString(),
    totalFunds: allFunds.length,
    sectors,
  };

  // 确保目录存在
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  fs.writeFileSync(FUNDS_FILE, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`数据已保存到 ${FUNDS_FILE}`);

  // 打印摘要
  for (const [key, sector] of Object.entries(sectors)) {
    console.log(`  ${sector.name}: 匹配 ${sector.totalCount} 只，Top10 已记录`);
  }

  return result;
}

module.exports = { scrapeAndSave, FUNDS_FILE };
