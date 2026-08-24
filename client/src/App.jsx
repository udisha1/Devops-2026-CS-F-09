import React, { useState, useEffect } from 'react'
import axios from 'axios'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'
import StatsHeader from './components/StatsHeader'
import ParticleText from './components/Particle';
const API_URL = 'http://localhost:5000/api/tasks'

const App = () => {
  const [tasks, setTasks] = useState([])
  const [todayTasks, setTodayTasks] = useState([])
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('All')

  // Fetch tasks from Express server
  const fetchTasks = async () => {
    try {
      const res = await axios.get(API_URL, {
        params: { search, priority: priorityFilter },
      })
      setTasks(res.data)
    } catch (err) {
      console.error('Error fetching tasks:', err)
    }
  }

  // Fetch tasks due today
  const fetchTodayTasks = async () => {
    try {
      const res = await axios.get(`${API_URL}/today`)
      setTodayTasks(res.data)
    } catch (err) {
      console.error('Error fetching today\'s tasks:', err)
    }
  }

  useEffect(() => {
    fetchTasks()
    fetchTodayTasks()
  }, [search, priorityFilter])

  // Add a new task
  const handleAddTask = async (newTaskData) => {
    try {
      const res = await axios.post(API_URL, newTaskData)
      setTasks([res.data, ...tasks])
      fetchTodayTasks()
    } catch (err) {
      console.error('Error adding task:', err)
    }
  }

  // Toggle completion state
  const handleToggleTask = async (id, isCompleted) => {
    try {
      const res = await axios.put(`${API_URL}/${id}`, { isCompleted })
      setTasks(tasks.map((t) => (t._id === id ? res.data : t)))
      fetchTodayTasks()
    } catch (err) {
      console.error('Error updating task:', err)
    }
  }

  // Delete task
  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`)
      setTasks(tasks.filter((t) => t._id !== id))
      fetchTodayTasks()
    } catch (err) {
      console.error('Error deleting task:', err)
    }
  }

  return (
    <div className="min-h-screen bg-radial-[at_25%_25%] from-white to-blue-500 to-75% py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <div style={{ width: '100%', height: 250, background:'linear-gradient(135deg, #09090f 0%, #1e1b4b 50%, #0f172a 100%)'}}>
              <ParticleText
                text="TaskFlow"
                particleSize={2.2}
                density={4}
                color="#f8fafc"
                highlightColor="#8b5cf6"
                scatter={190}
                gatherDuration={1600}
                stagger={420}
                pointerRepel={42}
                repelRadius={120}
                idleDrift={0.8}
                trigger="mount"
                fontSize="clamp(3.5rem, 13vw, 9rem)"
                fontWeight={800}
                fontFamily="inherit"
                glow
              />
            </div>
        </header>

        <StatsHeader tasks={tasks} />

        {todayTasks.length > 0 && (
          <div className="mb-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                  🌅 Good Morning!
                </h2>
                <p className="text-sm text-amber-700 mt-1 font-medium">
                  You have <strong>{todayTasks.length}</strong> {todayTasks.length === 1 ? 'task' : 'tasks'} due today:
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-amber-800">
                  {todayTasks.map(t => (
                    <li key={t._id} className="flex items-center gap-2 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      {t.title} <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">{t.priority}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <TaskForm onAddTask={handleAddTask} />

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search tasks by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          >
            <option value="All">All Priorities</option>
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
          </select>
        </div>

        <TaskList
          tasks={tasks}
          onToggle={handleToggleTask}
          onDelete={handleDeleteTask}
        />
      </div>
    </div>
  )
}

export default App