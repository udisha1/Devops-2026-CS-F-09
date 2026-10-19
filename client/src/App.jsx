import React, { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'
import StatsHeader from './components/StatsHeader'
import LiquidEther from './components/LiquidEther'
import Preloader from './components/Preloader'
import AuthPage from './components/AuthPage'
import Navbar from './components/Navbar'
import FeynmanPartner from './components/FeynmanPartner'
import FocusZone from './components/FocusZone'
import TaskModal from './components/TaskModal'
import EisenhowerMatrix from './components/EisenhowerMatrix'
import { BarChart3, Search, Filter, ArrowUpDown, LayoutGrid, Columns3, List } from 'lucide-react'

const THEMES = {
  sunrise: {
    name: '🌅 Sunrise Radiance',
    bgClass: 'bg-[#0e0a14]',
    etherColors: ['#F59E0B', '#FB923C', '#F43F5E'],
    glowColors: ['#f59e0b', '#fb923c', '#f43f5e'],
    glowColorRaw: '35 95 60',
    cardBg: '#161014',
    highlightText: 'text-amber-400',
    highlightBorder: 'border-amber-500/30',
    particleHighlight: '#f59e0b',
  },
  oasis: {
    name: '🌿 Zen Oasis',
    bgClass: 'bg-[#07130f]',
    etherColors: ['#10B981', '#06B6D4', '#34D399'],
    glowColors: ['#10b981', '#34d399', '#06b6d4'],
    glowColorRaw: '155 85 45',
    cardBg: '#0b1612',
    highlightText: 'text-emerald-400',
    highlightBorder: 'border-emerald-500/30',
    particleHighlight: '#10b981',
  },
  aurora: {
    name: '🌌 Cosmic Aurora',
    bgClass: 'bg-[#080d18]',
    etherColors: ['#00F2FE', '#4FACFE', '#A855F7'],
    glowColors: ['#06b6d4', '#a855f7', '#ec4899'],
    glowColorRaw: '190 85 55',
    cardBg: '#0d101d',
    highlightText: 'text-cyan-400',
    highlightBorder: 'border-cyan-500/30',
    particleHighlight: '#06b6d4',
  },
  blossom: {
    name: '🌸 Sakura Blossom',
    bgClass: 'bg-[#130714]',
    etherColors: ['#F472B6', '#FB7185', '#C084FC'],
    glowColors: ['#f472b6', '#fb7185', '#c084fc'],
    glowColorRaw: '330 85 60',
    cardBg: '#180f1b',
    highlightText: 'text-pink-400',
    highlightBorder: 'border-pink-500/30',
    particleHighlight: '#f472b6',
  },
  ocean: {
    name: '🌊 Ocean Serenity',
    bgClass: 'bg-[#06121c]',
    etherColors: ['#38BDF8', '#0EA5E9', '#2DD4BF'],
    glowColors: ['#38bdf8', '#2dd4bf', '#0ea5e9'],
    glowColorRaw: '200 85 50',
    cardBg: '#0b1620',
    highlightText: 'text-sky-400',
    highlightBorder: 'border-sky-500/30',
    particleHighlight: '#38bdf8',
  },
  cyberpunk: {
    name: '⚡ Cyberpunk Neon',
    bgClass: 'bg-slate-950',
    etherColors: ['#5227FF', '#FF9FFC', '#B497CF'],
    glowColors: ['#c084fc', '#f472b6', '#38bdf8'],
    glowColorRaw: '40 80 80',
    cardBg: '#120F17',
    highlightText: 'text-indigo-400',
    highlightBorder: 'border-purple-500/30',
    particleHighlight: '#8b5cf6',
  }
}

const API_URL = 'http://localhost:5001/api/tasks'

const App = () => {
  const [tasks, setTasks] = useState([])
  const [todayTasks, setTodayTasks] = useState([])
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [sortBy, setSortBy] = useState('createdAt-desc')
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('taskflow-theme')
    if (saved === 'sunset') return 'sunrise'
    if (saved === 'lavender') return 'blossom'
    if (saved === 'deepspace') return 'aurora'
    return saved && THEMES[saved] ? saved : 'sunrise'
  })
  const [activeTab, setActiveTab] = useState('dashboard')
  const [dashboardView, setDashboardView] = useState(() => {
    return localStorage.getItem('taskflow-dashboard-view') || 'grid'
  })
  const [taskModalState, setTaskModalState] = useState({ isOpen: false, task: null })

  const currentTheme = THEMES[theme] || THEMES.sunrise || THEMES.cyberpunk

  useEffect(() => {
    localStorage.setItem('taskflow-theme', theme)
  }, [theme])

  useEffect(() => {
    localStorage.setItem('taskflow-dashboard-view', dashboardView)
  }, [dashboardView])

 
  const [appLoading, setAppLoading] = useState(true)
  const [token, setToken] = useState(localStorage.getItem('token') || null)
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })

  
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )
    return () => {
      axios.interceptors.request.eject(requestInterceptor)
    }
  }, [token])

  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401) {
          // Token expired or invalid, reset auth state
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
        }
        return Promise.reject(error)
      }
    )
    return () => {
      axios.interceptors.response.eject(responseInterceptor)
    }
  }, [])

 
  useEffect(() => {
    const verifyToken = async () => {
      if (token) {
        try {
          const res = await axios.get('http://localhost:5001/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          })
          setUser(res.data)
          localStorage.setItem('user', JSON.stringify(res.data))
        } catch (err) {
          console.error('Session verification failed:', err)
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
        }
      }
    }
    verifyToken()
  }, [token])

 
  const fetchTasks = useCallback(async () => {
    try {
      const res = await axios.get(API_URL)
      setTasks(res.data)
    } catch (err) {
      console.error('Error fetching tasks:', err)
    }
  }, [])

  const filteredAndSortedTasks = useMemo(() => {
    const priorityWeight = { High: 3, Medium: 2, Low: 1 };

    // 1. Filter
    let result = tasks.filter(task => {
      // Search filter
      const matchesSearch = !search || task.title.toLowerCase().includes(search.toLowerCase());
      
      // Priority filter
      const matchesPriority = priorityFilter === 'All' || task.priority === priorityFilter;
      
      // Category filter
      const matchesCategory = categoryFilter === 'All' || (task.category || 'General') === categoryFilter;

      return matchesSearch && matchesPriority && matchesCategory;
    });

    // 2. Sort
    result.sort((a, b) => {
      if (sortBy === 'dueDate-asc') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortBy === 'dueDate-desc') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(b.dueDate) - new Date(a.dueDate);
      }
      if (sortBy === 'priority-desc') {
        return (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
      }
      if (sortBy === 'priority-asc') {
        return (priorityWeight[a.priority] || 0) - (priorityWeight[b.priority] || 0);
      }
      if (sortBy === 'createdAt-asc') {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      // default: createdAt-desc (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return result;
  }, [tasks, search, priorityFilter, categoryFilter, sortBy]);

  const fetchTodayTasks = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/today`)
      setTodayTasks(res.data)
    } catch (err) {
      console.error("Error fetching today's tasks:", err)
    }
  }, [])

  useEffect(() => {
    if (token && user) {
      fetchTasks()
      fetchTodayTasks()
    }
  }, [token, user, fetchTasks, fetchTodayTasks])

  const handleAddTask = async (newTaskData) => {
    try {
      const res = await axios.post(API_URL, newTaskData)
      setTasks([res.data, ...tasks])
      fetchTodayTasks()
    } catch (err) {
      console.error('Error adding task:', err)
    }
  }

  const handleUpdateTask = async (id, updatedFields) => {
    try {
      const fieldsToSend = { ...updatedFields }
      if (fieldsToSend.status !== undefined && fieldsToSend.isCompleted === undefined) {
        fieldsToSend.isCompleted = fieldsToSend.status === 'completed'
      } else if (fieldsToSend.isCompleted !== undefined && fieldsToSend.status === undefined) {
        fieldsToSend.status = fieldsToSend.isCompleted ? 'completed' : 'todo'
      }
      const res = await axios.put(`${API_URL}/${id}`, fieldsToSend)
      setTasks(tasks.map((t) => (t._id === id ? res.data : t)))
      fetchTodayTasks()
    } catch (err) {
      console.error('Error updating task:', err)
    }
  }

  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`)
      setTasks(tasks.filter((t) => t._id !== id))
      fetchTodayTasks()
    } catch (err) {
      console.error('Error deleting task:', err)
    }
  }

  const handleLoginSuccess = (newToken, loggedInUser) => {
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(loggedInUser))
    setToken(newToken)
    setUser(loggedInUser)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    setTasks([])
    setTodayTasks([])
  }

  return (
    <>
   
      {appLoading && <Preloader onComplete={() => setAppLoading(false)} />}

      <div className={`min-h-screen ${currentTheme.bgClass} relative overflow-hidden transition-colors duration-700`}>

        {/* Luminous & Positive Ambient Aura Lighting Layer */}
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none">
          {/* Subtle Aesthetic Grid Texture */}
          <div 
            className="absolute inset-0 opacity-[0.035] transition-opacity duration-1000"
            style={{
              backgroundImage: `radial-gradient(${currentTheme.glowColors[0]} 1.2px, transparent 1.2px)`,
              backgroundSize: '36px 36px'
            }}
          />

          {/* Primary Warm / Uplifting Radiant Aura (Top-Right) */}
          <div
            className="absolute -top-32 -right-32 w-[650px] h-[650px] rounded-full blur-[130px] opacity-25 animate-aura-drift transition-all duration-1000"
            style={{
              background: `radial-gradient(circle, ${currentTheme.glowColors[0]} 0%, ${currentTheme.glowColors[1] || currentTheme.glowColors[0]} 55%, transparent 75%)`
            }}
          />

          {/* Secondary Calming / Serene Aura (Bottom-Left) */}
          <div
            className="absolute -bottom-40 -left-40 w-[700px] h-[700px] rounded-full blur-[140px] opacity-20 animate-aura-drift-reverse transition-all duration-1000"
            style={{
              background: `radial-gradient(circle, ${currentTheme.glowColors[1] || currentTheme.glowColors[0]} 0%, ${currentTheme.glowColors[2] || currentTheme.glowColors[0]} 55%, transparent 75%)`
            }}
          />

          {/* Center Ethereal Luminous Glow */}
          <div
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full blur-[150px] opacity-15 animate-aura-pulse transition-all duration-1000"
            style={{
              background: `radial-gradient(circle, ${currentTheme.glowColors[2] || currentTheme.glowColors[0]} 0%, transparent 70%)`
            }}
          />

          {/* Interactive Liquid Ether Fluid Simulation */}
          <LiquidEther
            colors={currentTheme.etherColors}
            mouseForce={19}
            cursorSize={95}
            isViscous={true}
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={24}
            resolution={0.5}
            isBounce={false}
            autoDemo={true}
            autoSpeed={0.5}
            autoIntensity={2.4}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
          />
        </div>

        
        {!token || !user ? (
          <AuthPage onLoginSuccess={handleLoginSuccess} />
        ) : (
        
          <div className="flex flex-col md:flex-row min-h-screen max-w-[1440px] mx-auto relative z-10 gap-6 px-3 sm:px-6 py-4 md:py-6">
            
            <Navbar
              activeTab={activeTab}
              onChangeTab={setActiveTab}
              themeConfig={currentTheme}
              user={user}
              onLogout={handleLogout}
              theme={theme}
              setTheme={setTheme}
              THEMES={THEMES}
              tasks={tasks}
            />

            <main className="flex-1 min-w-0 pb-12">

            <style>{`
              .animate-aura-drift {
                animation: aura-drift 18s ease-in-out infinite;
              }
              .animate-aura-drift-reverse {
                animation: aura-drift-reverse 22s ease-in-out infinite;
              }
              .animate-aura-pulse {
                animation: aura-pulse 14s ease-in-out infinite;
              }
              @keyframes aura-drift {
                0%, 100% {
                  transform: translate(0px, 0px) scale(1);
                }
                50% {
                  transform: translate(45px, -30px) scale(1.15);
                }
              }
              @keyframes aura-drift-reverse {
                0%, 100% {
                  transform: translate(0px, 0px) scale(1.15);
                }
                50% {
                  transform: translate(-45px, 30px) scale(0.9);
                }
              }
              @keyframes aura-pulse {
                0%, 100% {
                  transform: translate(-50%, 0) scale(1);
                  opacity: 0.15;
                }
                50% {
                  transform: translate(-50%, -20px) scale(1.12);
                  opacity: 0.28;
                }
              }
              @keyframes fade-in-slide-up {
                from {
                  opacity: 0;
                  transform: translateY(10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              .animate-tab-content {
                animation: fade-in-slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
              @keyframes check-pop {
                0% { transform: scale(0.8); }
                50% { transform: scale(1.15); }
                100% { transform: scale(1); }
              }
              .animate-check-pop {
                animation: check-pop 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
              }
            `}</style>

            {/* Tab content switching */}
            {activeTab === 'dashboard' && (
              <div className="animate-tab-content">
                {/* Sleek Compact Hero Greeting Bar */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-xl shadow-xl">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-950 border border-white/10 ${currentTheme.highlightText}`}>
                        ⚡ Active Flow
                      </span>
                      <span className="text-xs text-slate-400 font-semibold">
                        {tasks.filter(t => !t.isCompleted).length} pending · {tasks.filter(t => t.isCompleted).length} completed
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider">
                      Welcome, {user?.name?.split(' ')[0] || 'User'}
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      Capture tasks naturally with AI or prioritize them in the Eisenhower Matrix.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <button
                      onClick={() => setActiveTab('matrix')}
                      className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-200 hover:text-white transition cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Priority Matrix</span>
                      <span className="text-[10px] text-slate-400">→</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('focus')}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-white transition cursor-pointer shadow-lg flex items-center gap-1.5"
                      style={{
                        background: `linear-gradient(135deg, ${currentTheme.glowColors[0]}, ${currentTheme.glowColors[1] || currentTheme.glowColors[0]})`
                      }}
                    >
                      <span>Focus Zone</span>
                      <span className="text-[10px]">⏱</span>
                    </button>
                  </div>
                </div>

                {todayTasks.length > 0 && (
                  <div className="mb-6 p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-transparent border border-amber-500/20 backdrop-blur-xl rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                          <span>🌅 Good Morning!</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                            {todayTasks.length} {todayTasks.length === 1 ? 'task' : 'tasks'} due today
                          </span>
                        </h3>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {todayTasks.map((t) => (
                            <span 
                              key={t._id} 
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950/70 border border-amber-500/20 text-xs font-semibold text-slate-200"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span className="truncate max-w-[200px]">{t.title}</span>
                              <span className="text-[10px] text-amber-300">({t.priority})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <TaskForm
                  onAddTask={handleAddTask}
                  onOpenManualModal={() => setTaskModalState({ isOpen: true, task: null })}
                  themeConfig={currentTheme}
                />

                {/* Unified Filter & Search Toolbar */}
                <div className="p-3 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-xl mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-3">
                  <div className="relative flex-1">
                    <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search tasks by title..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 rounded-xl focus:outline-none focus:border-indigo-500 transition text-xs font-medium"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Category Selector */}
                    <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2">
                      <Filter size={13} className="text-slate-500" />
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-slate-300 focus:outline-none cursor-pointer border-none p-0 pr-1"
                      >
                        <option value="All" className="bg-slate-950">All Categories</option>
                        <option value="Work" className="bg-slate-950">💼 Work</option>
                        <option value="Personal" className="bg-slate-950">🏠 Personal</option>
                        <option value="Study" className="bg-slate-950">🎓 Study</option>
                        <option value="General" className="bg-slate-950">📌 General</option>
                      </select>
                    </div>

                    {/* Priority Selector */}
                    <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2">
                      <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-slate-300 focus:outline-none cursor-pointer border-none p-0 pr-1"
                      >
                        <option value="All" className="bg-slate-950">All Priorities</option>
                        <option value="Low" className="bg-slate-950">🟢 Low</option>
                        <option value="Medium" className="bg-slate-950">🟡 Medium</option>
                        <option value="High" className="bg-slate-950">🔴 High</option>
                      </select>
                    </div>

                    {/* Sort Selector */}
                    <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2">
                      <ArrowUpDown size={13} className="text-slate-500" />
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-transparent text-xs font-semibold text-slate-300 focus:outline-none cursor-pointer border-none p-0 pr-1"
                      >
                        <option value="createdAt-desc" className="bg-slate-950">Newest Created</option>
                        <option value="createdAt-asc" className="bg-slate-950">Oldest Created</option>
                        <option value="dueDate-asc" className="bg-slate-950">📅 Due Date (Asc)</option>
                        <option value="dueDate-desc" className="bg-slate-950">📅 Due Date (Desc)</option>
                        <option value="priority-desc" className="bg-slate-950">🔥 Priority (High-Low)</option>
                        <option value="priority-asc" className="bg-slate-950">❄️ Priority (Low-High)</option>
                      </select>
                    </div>

                    {/* View Switcher Segmented Control */}
                    <div className="flex items-center p-0.5 bg-slate-950/80 border border-slate-800 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setDashboardView('grid')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          dashboardView === 'grid'
                            ? `${currentTheme.highlightText} bg-white/10 shadow-sm`
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                        title="Card Grid View"
                      >
                        <LayoutGrid size={13} />
                        <span className="hidden sm:inline">Grid</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDashboardView('kanban')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          dashboardView === 'kanban'
                            ? `${currentTheme.highlightText} bg-white/10 shadow-sm`
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                        title="Kanban Board View"
                      >
                        <Columns3 size={13} />
                        <span className="hidden sm:inline">Kanban</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDashboardView('list')}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          dashboardView === 'list'
                            ? `${currentTheme.highlightText} bg-white/10 shadow-sm`
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                        title="Compact List / Table View"
                      >
                        <List size={13} />
                        <span className="hidden sm:inline">List</span>
                      </button>
                    </div>

                    {/* Task Count Badge */}
                    <span className="text-[11px] font-bold text-slate-400 px-2.5 py-1 rounded-lg bg-white/5 hidden xl:inline">
                      {filteredAndSortedTasks.length} {filteredAndSortedTasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  </div>
                </div>

                <TaskList
                  tasks={filteredAndSortedTasks}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                  onEdit={(task) => setTaskModalState({ isOpen: true, task })}
                  onAddTask={handleAddTask}
                  themeConfig={currentTheme}
                  viewMode={dashboardView}
                />
              </div>
            )}

            {activeTab === 'matrix' && (
              <EisenhowerMatrix
                tasks={tasks}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onAddTask={handleAddTask}
                onEditTask={(task) => setTaskModalState({ isOpen: true, task })}
                themeConfig={currentTheme}
              />
            )}

            {activeTab === 'focus' && (
              <FocusZone
                tasks={tasks}
                onUpdateTask={handleUpdateTask}
                themeConfig={currentTheme}
              />
            )}

            {activeTab === 'analytics' && (
              <div className="animate-tab-content space-y-6">
                <StatsHeader tasks={tasks} themeConfig={currentTheme} />
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 text-center text-slate-300 shadow-xl min-h-[200px] flex flex-col justify-center items-center">
                  <BarChart3 size={48} className={`mb-4 ${currentTheme.highlightText}`} />
                  <h3 className="text-xl font-bold text-white mb-2">Analytics & Insights</h3>
                  <p className="text-sm text-slate-400 max-w-md">
                    View detailed task completion graphs, weekly progress logs, and AI productivity recommendations. Coming soon!
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'feynman' && (
              <FeynmanPartner themeConfig={currentTheme} />
            )}
            </main>
          </div>
        )}

        {/* Task Detail & Manual Add Modal */}
        <TaskModal
          isOpen={taskModalState.isOpen}
          task={taskModalState.task}
          onClose={() => setTaskModalState({ isOpen: false, task: null })}
          onSave={async (formData) => {
            if (taskModalState.task?._id) {
              await handleUpdateTask(taskModalState.task._id, formData);
            } else {
              await handleAddTask(formData);
            }
          }}
          themeConfig={currentTheme}
        />
      </div>
    </>
  )
}

export default App