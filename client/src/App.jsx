import React, { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'
import StatsHeader from './components/StatsHeader'
import LiquidEther from './components/LiquidEther'
import Preloader from './components/Preloader'
import AuthPage from './components/AuthPage'
import Navbar from './components/Navbar'
import { Timer, BarChart3 } from 'lucide-react'

const THEMES = {
  cyberpunk: {
    name: 'Cyberpunk Neon',
    bgClass: 'bg-slate-950',
    etherColors: ['#5227FF', '#FF9FFC', '#B497CF'],
    glowColors: ['#c084fc', '#f472b6', '#38bdf8'],
    glowColorRaw: '40 80 80',
    cardBg: '#120F17',
    highlightText: 'text-indigo-400',
    highlightBorder: 'border-purple-500/30',
    particleHighlight: '#8b5cf6',
  },
  deepspace: {
    name: 'Deep Space',
    bgClass: 'bg-neutral-950',
    etherColors: ['#00F2FE', '#4FACFE', '#050515'],
    glowColors: ['#06b6d4', '#10b981', '#3b82f6'],
    glowColorRaw: '180 80 40',
    cardBg: '#091214',
    highlightText: 'text-cyan-400',
    highlightBorder: 'border-cyan-500/30',
    particleHighlight: '#06b6d4',
  },
  sunset: {
    name: 'Sunset Flare',
    bgClass: 'bg-stone-950',
    etherColors: ['#FF3366', '#FF9933', '#2a0a0a'],
    glowColors: ['#f97316', '#ec4899', '#e11d48'],
    glowColorRaw: '15 90 60',
    cardBg: '#1c0c0f',
    highlightText: 'text-orange-400',
    highlightBorder: 'border-orange-500/30',
    particleHighlight: '#f97316',
  },
  lavender: {
    name: 'Electric Violet',
    bgClass: 'bg-slate-950',
    etherColors: ['#8A2387', '#E94057', '#1a052e'],
    glowColors: ['#a855f7', '#6366f1', '#ec4899'],
    glowColorRaw: '270 80 50',
    cardBg: '#130f1c',
    highlightText: 'text-purple-400',
    highlightBorder: 'border-purple-500/30',
    particleHighlight: '#a855f7',
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
    return localStorage.getItem('taskflow-theme') || 'cyberpunk'
  })
  const [activeTab, setActiveTab] = useState('dashboard')

  const currentTheme = THEMES[theme] || THEMES.cyberpunk

  useEffect(() => {
    localStorage.setItem('taskflow-theme', theme)
  }, [theme])

 
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
      const res = await axios.put(`${API_URL}/${id}`, updatedFields)
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

      <div className={`min-h-screen ${currentTheme.bgClass} py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden transition-colors duration-500`}>

        <div className="fixed inset-0 z-0 pointer-events-none">
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
        
          <div className="max-w-4xl mx-auto relative z-10">
            
            <Navbar
              activeTab={activeTab}
              onChangeTab={setActiveTab}
              themeConfig={currentTheme}
              user={user}
              onLogout={handleLogout}
              theme={theme}
              setTheme={setTheme}
              THEMES={THEMES}
            />

            <style>{`
              @keyframes aura-drift {
                0%, 100% {
                  transform: translate(0px, 0px) scale(1);
                }
                50% {
                  transform: translate(30px, -20px) scale(1.15);
                }
              }
              @keyframes aura-drift-reverse {
                0%, 100% {
                  transform: translate(0px, 0px) scale(1.15);
                }
                50% {
                  transform: translate(-30px, 20px) scale(0.9);
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

            <header className="relative flex flex-col items-center justify-center pt-8 pb-12 overflow-visible text-center z-10">
              {/* Dynamic Aura Glow Dots */}
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-20 filter blur-[110px] pointer-events-none z-0"
                style={{
                  backgroundColor: currentTheme.glowColors[0],
                  animation: 'aura-drift 12s ease-in-out infinite'
                }}
              />
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full opacity-15 filter blur-[110px] pointer-events-none z-0"
                style={{
                  backgroundColor: currentTheme.glowColors[1] || currentTheme.glowColors[0],
                  animation: 'aura-drift-reverse 15s ease-in-out infinite'
                }}
              />
              
              {/* Brand Text */}
              <div className="relative z-10 flex flex-col items-center select-none">
                <span className={`text-[10px] font-extrabold uppercase tracking-[0.4em] mb-3 px-3 py-1 bg-slate-900/80 border ${currentTheme.highlightBorder} rounded-full ${currentTheme.highlightText} backdrop-blur-xl shadow-lg`}>
                  ✨ Flowing Workspace
                </span>
                <h1 className="text-5xl md:text-6xl font-black uppercase tracking-[0.25em] text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-slate-400 drop-shadow-[0_2px_10px_rgba(255,255,255,0.05)]">
                  TaskFlow
                </h1>
                <p className="text-xs text-slate-400 font-semibold tracking-wider mt-3.5 max-w-sm">
                  Flow through your day, one task at a time.
                </p>
              </div>

              {/* Sleek dynamic divider line */}
              <div 
                className="w-48 h-[1px] mt-8 opacity-45 rounded-full"
                style={{
                  background: `linear-gradient(90deg, transparent, ${currentTheme.glowColors[0]}, ${currentTheme.glowColors[1] || currentTheme.glowColors[0]}, transparent)`
                }}
              />
            </header>

            {/* Tab content switching */}
            {activeTab === 'dashboard' && (
              <div className="animate-tab-content">
                {todayTasks.length > 0 && (
                  <div className="mb-6 p-5 bg-gradient-to-r from-amber-50/10 to-orange-50/10 border border-amber-500/20 backdrop-blur-xl rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                          🌅 Good Morning!
                        </h2>
                        <p className="text-sm text-slate-350 mt-1 font-medium">
                          You have <strong>{todayTasks.length}</strong>{' '}
                          {todayTasks.length === 1 ? 'task' : 'tasks'} due today:
                        </p>
                        <ul className="mt-3 space-y-1.5 text-sm text-slate-300">
                          {todayTasks.map((t) => (
                            <li key={t._id} className="flex items-center gap-2 font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              {t.title}{' '}
                              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-305 font-bold border border-amber-500/30">
                                {t.priority}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <TaskForm onAddTask={handleAddTask} themeConfig={currentTheme} />

                {/* Filter Controls */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 px-4 py-2 border border-slate-800 rounded-xl bg-slate-950/80 text-white placeholder-slate-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  />
                  
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-800 rounded-xl bg-slate-950/80 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="All" className="bg-slate-950">All Categories</option>
                    <option value="Work" className="bg-slate-950">💼 Work</option>
                    <option value="Personal" className="bg-slate-950">🏠 Personal</option>
                    <option value="Study" className="bg-slate-950">🎓 Study</option>
                    <option value="General" className="bg-slate-950">📌 General</option>
                  </select>

                  <select
                    value={priorityFilter}
                    onChange={(e) => setPriorityFilter(e.target.value)}
                    className="px-4 py-2 border border-slate-800 rounded-xl bg-slate-950/80 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="All" className="bg-slate-950">All Priorities</option>
                    <option value="Low" className="bg-slate-950">Low Priority</option>
                    <option value="Medium" className="bg-slate-950">Medium Priority</option>
                    <option value="High" className="bg-slate-950">High Priority</option>
                  </select>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-4 py-2 border border-slate-800 rounded-xl bg-slate-950/80 text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                  >
                    <option value="createdAt-desc" className="bg-slate-950">Newest Created</option>
                    <option value="createdAt-asc" className="bg-slate-950">Oldest Created</option>
                    <option value="dueDate-asc" className="bg-slate-950">📅 Due Date (Asc)</option>
                    <option value="dueDate-desc" className="bg-slate-950">📅 Due Date (Desc)</option>
                    <option value="priority-desc" className="bg-slate-950">🔥 Priority (High-Low)</option>
                    <option value="priority-asc" className="bg-slate-950">❄️ Priority (Low-High)</option>
                  </select>
                </div>

                <TaskList
                  tasks={filteredAndSortedTasks}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                  themeConfig={currentTheme}
                />
              </div>
            )}

            {activeTab === 'focus' && (
              <div className="animate-tab-content bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 text-center text-slate-300 shadow-xl min-h-[300px] flex flex-col justify-center items-center">
                <Timer size={48} className={`mb-4 animate-pulse ${currentTheme.highlightText}`} />
                <h3 className="text-xl font-bold text-white mb-2">Focus Zone</h3>
                <p className="text-sm text-slate-400 max-w-md">
                  A dedicated view for your Pomodoro Focus Session and daily time-blocking schedule. Coming soon!
                </p>
              </div>
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
          </div>
        )}
      </div>
    </>
  )
}

export default App