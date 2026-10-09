import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  LayoutGrid, 
  Timer, 
  BarChart3, 
  LogOut, 
  Palette, 
  Brain, 
  Sparkles, 
  Menu, 
  X,
  CheckCircle2
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  onChangeTab, 
  themeConfig, 
  user, 
  onLogout, 
  theme, 
  setTheme, 
  THEMES,
  tasks = []
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const colors = themeConfig?.glowColors || ['#c084fc', '#f472b6', '#38bdf8'];
  const highlightText = themeConfig?.highlightText || 'text-indigo-400';

  const pendingCount = tasks.filter(t => !t.isCompleted).length;
  const completedCount = tasks.filter(t => t.isCompleted).length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const tabs = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      subtitle: 'Overview & Tasks',
      icon: LayoutDashboard,
      badge: pendingCount > 0 ? `${pendingCount}` : null
    },
    { 
      id: 'matrix', 
      label: 'Priority Matrix', 
      subtitle: 'Eisenhower 2x2',
      icon: LayoutGrid 
    },
    { 
      id: 'focus', 
      label: 'Focus Zone', 
      subtitle: 'Pomodoro & Audio',
      icon: Timer 
    },
    { 
      id: 'analytics', 
      label: 'Analytics', 
      subtitle: 'Progress Insights',
      icon: BarChart3 
    },
    { 
      id: 'feynman', 
      label: 'Feynman Partner', 
      subtitle: 'AI Thinking Partner',
      icon: Brain 
    }
  ];

  const handleSelectTab = (tabId) => {
    onChangeTab(tabId);
    setMobileMenuOpen(false);
  };

  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'U';

  return (
    <>
      {/* Mobile Top Header (Visible only on < md screens) */}
      <div className="md:hidden w-full mb-4 flex items-center justify-between p-3.5 bg-slate-900/80 backdrop-blur-2xl border border-slate-800/80 rounded-2xl shadow-xl z-30">
        <div 
          onClick={() => handleSelectTab('dashboard')}
          className="flex items-center gap-2 cursor-pointer select-none"
        >
          <div 
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1] || colors[0]})` }}
          >
            <Sparkles size={16} />
          </div>
          <span className="text-sm font-black tracking-wider text-white uppercase">
            TaskFlow
          </span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
          title="Toggle Navigation"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Backdrop for mobile drawer */}
      {mobileMenuOpen && (
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 animate-fade-in"
        />
      )}

      {/* Main Left Sidebar (Sticky on Desktop, Slide-over on Mobile) */}
      <aside className={`
        fixed md:sticky top-0 md:top-6 left-0 h-full md:h-[calc(100vh-3rem)] w-72 shrink-0 z-50 md:z-20
        flex flex-col justify-between p-5 bg-slate-900/80 md:bg-slate-900/70 backdrop-blur-2xl 
        border-r md:border border-slate-800/80 md:rounded-3xl shadow-2xl transition-transform duration-300 ease-out
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Top Section: Brand + User Profile */}
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div 
              onClick={() => handleSelectTab('dashboard')}
              className="flex items-center gap-3 cursor-pointer select-none group"
              title="TaskFlow Workspace"
            >
              <div 
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-xl transition-transform duration-200 group-hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1] || colors[0]})` }}
              >
                <Sparkles size={18} />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-wider text-white uppercase leading-none">
                  TaskFlow
                </span>
                <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1">
                  Workspace
                </span>
              </div>
            </div>

            {/* Close button on mobile drawer */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white bg-white/5 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="mt-4 p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white shrink-0 shadow-md"
              style={{ background: `linear-gradient(135deg, ${colors[1] || colors[0]}, ${colors[0]})` }}
            >
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <h4 className="text-xs font-bold text-white truncate">
                  {user?.name || 'Workspace User'}
                </h4>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                {user?.email || 'Logged in'}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 px-3 mb-2 block">
              Navigation
            </span>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all duration-200 cursor-pointer text-left group relative ${
                    isActive 
                      ? 'bg-slate-950/80 text-white border border-slate-700/80 shadow-lg' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  }`}
                  style={isActive ? {
                    boxShadow: `0 0 20px ${colors[0]}15, inset 0 0 15px ${colors[0]}08`,
                    borderColor: `${colors[0]}40`
                  } : {}}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className={`p-1.5 rounded-lg transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                      style={isActive ? { background: `${colors[0]}25` } : {}}
                    >
                      <Icon size={16} className={isActive ? highlightText : ''} />
                    </div>
                    <div>
                      <span className="text-xs font-bold block leading-snug">
                        {tab.label}
                      </span>
                      <span className="text-[10px] text-slate-500 block leading-tight font-medium">
                        {tab.subtitle}
                      </span>
                    </div>
                  </div>

                  {tab.badge && (
                    <span 
                      className="text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white shadow-sm"
                      style={{ background: colors[0] }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Progress Widget + Theme + Logout */}
        <div className="pt-4 border-t border-white/5 space-y-3.5">
          {/* Mini Progress Card */}
          {totalCount > 0 && (
            <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/60">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="font-semibold text-slate-400">Total Progress</span>
                <span className="font-extrabold text-white">{progressPercent}%</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${progressPercent}%`,
                    background: `linear-gradient(90deg, ${colors[0]}, ${colors[1] || colors[0]})`
                  }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1.5">
                <span>{completedCount} of {totalCount} completed</span>
                <CheckCircle2 size={12} className={progressPercent === 100 ? 'text-emerald-400' : 'text-slate-600'} />
              </div>
            </div>
          )}

          {/* Theme Switcher */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 px-1">
              <Palette size={14} className={highlightText} />
              <span>Theme</span>
            </div>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none cursor-pointer"
            >
              {Object.entries(THEMES).map(([key, t]) => (
                <option key={key} value={key} className="bg-slate-950 text-slate-300">
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 p-2.5 bg-rose-500/10 hover:bg-rose-500/20 active:scale-[0.98] text-rose-400 hover:text-rose-300 border border-rose-500/20 rounded-xl transition-all duration-200 cursor-pointer text-xs font-bold"
            title="Log Out of TaskFlow"
          >
            <LogOut size={14} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
