import React from 'react';

export default function AdvicePanel({ profile, overview }) {
  if (!profile) {
    return <div className="empty-state">暂无投资建议数据</div>;
  }

  return (
    <div className="advice-panel">
      {/* 市场概览 */}
      {overview && (
        <div className="overview-grid">
          <div className="overview-card">
            <div className="label">总本金</div>
            <div className="value">¥{overview.totalCapital?.toLocaleString()}</div>
          </div>
          <div className="overview-card">
            <div className="label">覆盖板块</div>
            <div className="value">{overview.sectorCount} 个</div>
          </div>
          <div className="overview-card">
            <div className="label">候选基金</div>
            <div className="value">{overview.totalFunds} 只</div>
          </div>
          <div className="overview-card">
            <div className="label">风险等级</div>
            <div className="value">{profile.riskLevel}</div>
          </div>
        </div>
      )}

      {/* 策略描述 */}
      <div className="strategy-desc">
        <p>{profile.description}</p>
      </div>

      {/* 推荐配置 */}
      <div className="recommendation-list">
        {profile.recommendations?.map((rec, idx) => (
          <div className="recommendation-item" key={idx}>
            <div className="rec-info">
              <div className="rec-name">{rec.name}</div>
              <div className="rec-detail">
                {rec.code} · {rec.sector}
              </div>
            </div>
            <div className="rec-amount">
              <div className="money">¥{rec.amount?.toLocaleString()}</div>
              <div className="reason">{rec.reason}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 定投计划 */}
      {profile.dipPlan && (
        <div className="dip-plan">
          <h4>📅 定投建议</h4>
          <p>{profile.dipPlan}</p>
        </div>
      )}
    </div>
  );
}
