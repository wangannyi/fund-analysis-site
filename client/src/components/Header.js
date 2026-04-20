import React from 'react';

export default function Header({ updateTime, onRefresh, refreshing, darkMode, onToggleDark }) {
  return (
    <header className="header">
      <div className="header-left">
        <h1 className="logo">📊 基金观察站</h1>
        <span className="update-time">
          {updateTime
            ? `更新于 ${new Date(updateTime).toLocaleString('zh-CN')}`
            : '暂无数据'}
        </span>
      </div>
      <div className="header-right">
        <button
          className="btn btn-refresh"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? '⏳ 刷新中...' : '🔄 刷新数据'}
        </button>
        <button className="btn btn-theme" onClick={onToggleDark}>
          {darkMode ? '☀️' : '🌙'}
        </button>
      </div>
    </header>
  );
}
