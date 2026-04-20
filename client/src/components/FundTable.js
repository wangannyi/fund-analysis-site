import React from 'react';

export default function FundTable({ funds, sectorColor }) {
  if (!funds || funds.length === 0) {
    return <div className="empty-state">暂无该板块基金数据</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="fund-table">
        <thead>
          <tr>
            <th>排名</th>
            <th>代码</th>
            <th>名称</th>
            <th>最新价</th>
            <th>涨跌幅</th>
            <th>成交额</th>
            <th>换手率</th>
          </tr>
        </thead>
        <tbody>
          {funds.map((fund, index) => (
            <tr key={fund.code}>
              <td>
                <span
                  className="rank-badge"
                  style={index < 3 ? { background: sectorColor, color: '#fff' } : {}}
                >
                  {index + 1}
                </span>
              </td>
              <td className="code">{fund.code}</td>
              <td className="name">{fund.name}</td>
              <td className="price">{fund.price?.toFixed(3)}</td>
              <td className={`change ${fund.changePercent >= 0 ? 'up' : 'down'}`}>
                {fund.changePercent >= 0 ? '+' : ''}
                {fund.changePercent?.toFixed(2)}%
              </td>
              <td className="volume">{formatVolume(fund.amount)}</td>
              <td className="turnover">{fund.turnoverRate?.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatVolume(amount) {
  if (!amount) return '-';
  if (amount >= 1e8) return (amount / 1e8).toFixed(2) + '亿';
  if (amount >= 1e4) return (amount / 1e4).toFixed(0) + '万';
  return amount.toFixed(0);
}
