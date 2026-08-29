import React, { useState, useEffect, useRef } from 'react';
import { LayoutDashboard, Timer, BarChart3, LogOut, Palette, Brain } from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  onChangeTab, 
  themeConfig, 
  user, 
  onLogout, 
  theme, 
  setTheme, 
  THEMES 
}) {
  const [hoveredTab, setHoveredTab] = useState(null);
  const tabRefs = useRef({});
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0, opacity: 0 });

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'focus', label: 'Focus Zone', icon: Timer },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'feynman', label: 'Feynman Partner', icon: Brain }
  ];

  useEffect(() => {
    const targetId = hoveredTab || activeTab;
    const element = tabRefs.current[targetId];
    if (element) {
      setPillStyle({
        left: element.offsetLeft,
        width: element.offsetWidth,
        opacity: 1
      });
    } else {
      setPillStyle(prev => ({ ...prev, opacity: 0 }));
    }
  }, [hoveredTab, activeTab]);

  const colors = themeConfig?.glowColors || ['#c084fc', '#f472b6', '#38bdf8'];
  const highlightText = themeConfig?.highlightText || 'text-indigo-400';
  const isHoveredState = hoveredTab !== null;

  const pillBackground = isHoveredState
    ? 'rgba(255, 255, 255, 0.05)'
    : `linear-gradient(90deg, ${colors[0]}20, ${(colors[1] || colors[0])}20)`;

  const pillBorder = isHoveredState
    ? '1px solid rgba(255, 255, 255, 0.08)'
    : `1px solid ${colors[0]}40`;

  return (
    <div className="w-full mb-8 relative z-20">
      <nav className="flex flex-col md:flex-row items-center justify-between gap-4 p-2 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-xl px-6 py-3.5">
        
        {/* Left Side: User Info */}
        <div className="text-sm font-semibold text-slate-350 select-none flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse border border-emerald-400/40"></span>
          <span>Logged in as </span>
          <strong className={`${highlightText} font-bold`}>{user?.name}</strong>
        </div>

        {/* Center: Animated Tab Navigation */}
        <div className="relative flex items-center p-1 bg-slate-950/40 rounded-xl border border-white/5">
          {/* Animated Sliding Pill */}
          <div
            className="absolute top-1 bottom-1 rounded-lg transition-all duration-300 ease-out pointer-events-none"
            style={{
              left: `${pillStyle.left}px`,
              width: `${pillStyle.width}px`,
              opacity: pillStyle.opacity,
              background: pillBackground,
              border: pillBorder,
              boxShadow: !isHoveredState ? `0 0 12px ${colors[0]}15` : 'none'
            }}
          />

          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => (tabRefs.current[tab.id] = el)}
                onClick={() => onChangeTab(tab.id)}
                onMouseEnter={() => setHoveredTab(tab.id)}
                onMouseLeave={() => setHoveredTab(null)}
                className={`relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-lg text-[11px] font-extrabold uppercase tracking-wider transition-colors duration-250 cursor-pointer ${
                  isActive ? highlightText : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Side: Theme Selector & Log Out */}
        <div className="flex items-center gap-3">
          {/* Theme Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/60 border border-slate-800/80 rounded-xl px-2.5 py-1.5">
            <Palette className={`w-3.5 h-3.5 ${highlightText}`} />
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-transparent text-[11px] font-extrabold uppercase tracking-wider text-slate-300 hover:text-white focus:outline-none cursor-pointer border-none p-0"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
            >
              {Object.entries(THEMES).map(([key, t]) => (
                <option key={key} value={key} className="bg-slate-950 text-slate-350">
                  {t.name.split(' ')[0]}
                </option>
              ))}
            </select>
          </div>

          {/* Log Out Button */}
          <button
            onClick={onLogout}
            className="flex items-center justify-center p-2 bg-red-500/10 hover:bg-red-500/20 active:scale-[0.96] text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/30 rounded-xl transition-all duration-200 cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </nav>
    </div>
  );
}
