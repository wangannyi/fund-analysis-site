import React, { useState, useMemo } from 'react';

const SORT_OPTIONS = [
  { key: 'changePercent', label: '涨跌幅', desc: true },
  { key: 'price', label: '价格', desc: true },
  { key: 'amount', label: '成交额', desc: true },
  { key: 'turnoverRate', label: '换手率', desc: true },
];

export default function FundTable({ funds, sectorColor }) {
  const [sortKey, setSortKey] = useState('changePercent');
  const [sortDesc, setSortDesc] = useState(true);

  const sortedFunds = useMemo(() => {
    if (!funds || funds.length === 0) return [];
    return [...funds].sort((a, b) => {
      const va = parseFloat(a[sortKey]) || 0;
      const vb = parseFloat(b[sortKey]) || 0;
      return sortDesc ? vb - va : va - vb;
    });
  }, [funds, sortKey, sortDesc]);

  if (!funds || funds.length === 0) {
    return <div className="empty-state">暂无该板块基金数据</div>;
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortKey(key);
      setSortDesc(SORT_OPTIONS.find((o) => o.key === key)?.desc ?? true);
    }
  }

  function sortIndicator(key) {
    if (sortKey !== key) return '';
    return sortDesc ? ' ↓' : ' ↑';
  }

  return (
    <div className="table-wrapper">
      <table className="fund-table">
        <thead>
          <tr>
            <th>排名</th>
            <th>代码</th>
            <th>名称</th>
            <th className="sortable" onClick={() => handleSort('price')}>
              最新价{sortIndicator('price')}
            </th>
            <th className="sortable" onClick={() => handleSort('changePercent')}>
              涨跌幅{sortIndicator('changePercent')}
            </th>
            <th className="sortable" onClick={() => handleSort('amount')}>
              成交额{sortIndicator('amount')}
            </th>
            <th className="sortable" onClick={() => handleSort('turnoverRate')}>
              换手率{sortIndicator('turnoverRate')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedFunds.map((fund, index) => (
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
