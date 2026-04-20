import React, { useState, useEffect } from 'react';
import './App.css';
import FundTable from './components/FundTable';
import AdvicePanel from './components/AdvicePanel';
import Header from './components/Header';

const SECTOR_TABS = [
  { key: 'internet', label: '🌐 互联网', color: '#3b82f6' },
  { key: 'ai', label: '🤖 人工智能', color: '#8b5cf6' },
  { key: 'power', label: '⚡ 电力', color: '#f59e0b' },
  { key: 'energy', label: '🔋 新能源', color: '#10b981' },
];

function App() {
  const [fundsData, setFundsData] = useState(null);
  const [adviceData, setAdviceData] = useState(null);
  const [activeSector, setActiveSector] = useState('internet');
  const [activeProfile, setActiveProfile] = useState('balanced');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [darkMode, setDarkMode] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [fundsRes, adviceRes] = await Promise.all([
        fetch('/api/v1/funds'),
        fetch('/api/v1/advice'),
      ]);

      if (fundsRes.ok) {
        setFundsData(await fundsRes.json());
      }
      if (adviceRes.ok) {
        setAdviceData(await adviceRes.json());
      }
    } catch (err) {
      setError('数据加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch('/api/v1/refresh', { method: 'POST' });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      setError('刷新失败');
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="app loading-screen">
        <div className="spinner" />
        <p>正在加载基金数据...</p>
      </div>
    );
  }

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <Header
        updateTime={fundsData?.updateTime}
        onRefresh={handleRefresh}
        refreshing={refreshing}
        darkMode={darkMode}
        onToggleDark={() => setDarkMode(!darkMode)}
      />

      {error && <div className="error-banner">{error}</div>}

      {/* 行业Tab */}
      <div className="sector-tabs">
        {SECTOR_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`sector-tab ${activeSector === tab.key ? 'active' : ''}`}
            style={activeSector === tab.key ? { borderColor: tab.color } : {}}
            onClick={() => setActiveSector(tab.key)}
          >
            {tab.label}
            {fundsData?.sectors?.[tab.key] && (
              <span className="tab-count">
                {fundsData.sectors[tab.key].totalCount}只
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 基金排行榜 */}
      <section className="section">
        <h2 className="section-title">
          {SECTOR_TABS.find((t) => t.key === activeSector)?.label} Top 10 场内基金
        </h2>
        <FundTable
          funds={fundsData?.sectors?.[activeSector]?.funds || []}
          sectorColor={SECTOR_TABS.find((t) => t.key === activeSector)?.color}
        />
      </section>

      {/* 投资建议 */}
      <section className="section">
        <h2 className="section-title">💰 投资建议（10万本金）</h2>
        <div className="profile-tabs">
          {adviceData?.profiles &&
            Object.entries(adviceData.profiles).map(([key, profile]) => (
              <button
                key={key}
                className={`profile-tab ${activeProfile === key ? 'active' : ''}`}
                onClick={() => setActiveProfile(key)}
              >
                {profile.name}
              </button>
            ))}
        </div>
        <AdvicePanel
          profile={adviceData?.profiles?.[activeProfile]}
          overview={adviceData?.marketOverview}
        />
      </section>

      {/* 风险提示 */}
      <footer className="disclaimer">
        <p>⚠️ 投资有风险，入市需谨慎</p>
        <p>以上内容仅供参考，不构成投资建议。基金过往业绩不代表未来表现。</p>
        <p>请根据自身风险承受能力做出决策，建议咨询专业理财顾问。</p>
        <p className="source">数据来源：东方财富 | 更新时间：{fundsData?.updateTime ? new Date(fundsData.updateTime).toLocaleString('zh-CN') : '未知'}</p>
      </footer>
    </div>
  );
}

export default App;
