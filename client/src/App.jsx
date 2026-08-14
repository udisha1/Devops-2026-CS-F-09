import React, { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'http://localhost:5000/api/tasks'

const App = () => {
  const [tasks, setTasks] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: 'Medium',
  })
  const [search, setSearch] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('All')

 
  const priorityColors = {
    Low: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    High: 'bg-red-100 text-red-700',
  }


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

  useEffect(() => {
    fetchTasks()
  }, [search, priorityFilter])


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }


  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return
    try {
      const res = await axios.post(API_URL, formData)
      setTasks([res.data, ...tasks])
      setFormData({
        title: '',
        description: '',
        category: 'General',
        priority: 'Medium',
      })
    } catch (err) {
      console.error('Error adding task:', err)
    }
  }

  const handleToggleTask = async (id, isCompleted) => {
    try {
      const res = await axios.put(`${API_URL}/${id}`, { isCompleted })
      setTasks(tasks.map((t) => (t._id === id ? res.data : t)))
    } catch (err) {
      console.error('Error updating task:', err)
    }
  }

  const handleDeleteTask = async (id) => {
    try {
      await axios.delete(`${API_URL}/${id}`)
      setTasks(tasks.filter((t) => t._id !== id))
    } catch (err) {
      console.error('Error deleting task:', err)
    }
  }

  const total = tasks.length
  const completed = tasks.filter((t) => t.isCompleted).length
  const pending = total - completed

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">TaskFlow</h1>
          <p className="text-gray-500 mt-2">MERN Stack Task Tracker</p>
        </header>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Tasks</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{total}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Pending</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pending}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm text-center">
            <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Completed</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{completed}</p>
          </div>
        </div>

        <form onSubmit={handleAddTask} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Add New Task</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              name="title"
              placeholder="Task title..."
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            />
            <input
              type="text"
              name="category"
              placeholder="Category (e.g., Work, Study, Personal)"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <textarea
              name="description"
              placeholder="Task description (optional)"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              rows="2"
            />
            <div className="flex flex-col justify-between">
              <label className="text-sm font-medium text-gray-600 mb-1">Priority Level:</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full md:w-auto px-6 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
          >
            + Add Task
          </button>
        </form>

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

        {/* Task List */}
        {tasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">No tasks found. Add a task above to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((task) => (
              <div
                key={task._id}
                className={`p-5 bg-white rounded-xl shadow-sm border border-gray-100 flex items-start justify-between gap-4 transition ${
                  task.isCompleted ? 'opacity-60 bg-gray-50' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={(e) => handleToggleTask(task._id, e.target.checked)}
                    className="mt-1 h-5 w-5 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <h3
                      className={`font-semibold text-gray-800 ${
                        task.isCompleted ? 'line-through text-gray-500' : ''
                      }`}
                    >
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                    <div className="flex gap-2 items-center mt-3">
                      <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                        {task.category || 'General'}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          priorityColors[task.priority]
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteTask(task._id)}
                  className="text-gray-400 hover:text-red-600 transition p-1 font-semibold"
                  title="Delete Task"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
