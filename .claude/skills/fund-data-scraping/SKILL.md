# 基金数据抓取 Skill

## 概述
专注于从中国金融数据网站（东方财富、同花顺等）抓取场内基金数据的最佳实践。

## 数据源优先级
1. **东方财富基金API**（推荐）: `fund.eastmoney.com` 提供结构化JSON数据
2. **同花顺**: 备用数据源
3. **天天基金网**: 补充数据

## 东方财富API端点

### 基金排行数据
```
GET http://fund.eastmoney.com/data/rankhandler.aspx
参数:
  op=ph          # 排行
  dt=kf          # 开放式基金
  ft=zs          # 指数型(场内基金)
  rs=           # 排序
  gs=0           # 分组
  sc=1nzf        # 排序字段(近1年涨幅)
  st=desc        # 降序
  pi=1           # 页码
  pn=50          # 每页数量
```

### ETF基金列表
```
GET http://fund.eastmoney.com/cnjy_dwjz.html
GET https://push2.eastmoney.com/api/qt/clist/get
参数:
  pn=1&pz=200&po=1&np=1&fltt=2&invt=2
  &fid=f3&fs=b:MK0021,b:MK0022,b:MK0023,b:MK0024
  &fields=f12,f14,f2,f3,f4,f5,f6,f7
```

## 行业分类关键词
- **互联网**: 互联网、信息技术、计算机、数字经济、电子商务
- **AI/人工智能**: 人工智能、AI、机器人、智能制造、芯片、半导体
- **电力**: 电力、电网、输配电、发电、电力设备
- **能源**: 新能源、光伏、风电、储能、锂电池、清洁能源

## 数据字段映射
```javascript
const FIELD_MAP = {
  f12: 'code',      // 基金代码
  f14: 'name',      // 基金名称
  f2: 'price',      // 最新价
  f3: 'changeRate', // 涨跌幅%
  f4: 'change',     // 涨跌额
  f5: 'volume',     // 成交量(手)
  f6: 'amount',     // 成交额
  f7: 'amplitude',  // 振幅%
};
```

## 抓取最佳实践
1. 设置合理的 User-Agent 和 Referer 头
2. 请求间隔 >= 1秒，避免被封IP
3. 使用重试机制（最多3次）
4. 缓存数据，避免重复请求
5. 错误时降级到备用数据源
6. 数据校验：检查返回字段完整性

## 反爬虫应对
```javascript
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'http://fund.eastmoney.com/',
  'Accept': 'application/json, text/javascript, */*',
};
```

## 数据存储格式
```json
{
  "updateTime": "2026-04-20T08:00:00Z",
  "sectors": {
    "internet": { "name": "互联网", "funds": [...] },
    "ai": { "name": "人工智能", "funds": [...] },
    "power": { "name": "电力", "funds": [...] },
    "energy": { "name": "新能源", "funds": [...] }
  }
}
```
