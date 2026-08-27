import React, { useState } from 'react'

const StatsHeader = ({ tasks = [], themeConfig }) => {
  const safeTasks = Array.isArray(tasks) ? tasks : []
  const total = safeTasks.length
  const completed = safeTasks.filter((t) => t?.isCompleted).length
  const pending = total - completed

  const [hoveredCard, setHoveredCard] = useState(null);

  const colors = themeConfig?.glowColors || ['#c084fc', '#f472b6', '#38bdf8'];

  const cardStyle = (id, glowColorHex) => ({
    transform: hoveredCard === id ? 'scale(1.02)' : 'scale(1)',
    boxShadow: hoveredCard === id ? `0 0 20px ${glowColorHex}30` : 'none',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
  });

  return (
    <div className="grid grid-cols-3 gap-4 mb-8 select-none">
      {/* Total Tasks Card */}
      <div
        onMouseEnter={() => setHoveredCard('total')}
        onMouseLeave={() => setHoveredCard(null)}
        className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 text-center backdrop-blur-xl"
        style={cardStyle('total', colors[0])}
      >
        <p className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Total Tasks</p>
        <p className="text-3xl font-black text-white mt-2">{total}</p>
      </div>

      {/* Pending Tasks Card */}
      <div
        onMouseEnter={() => setHoveredCard('pending')}
        onMouseLeave={() => setHoveredCard(null)}
        className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 text-center backdrop-blur-xl"
        style={cardStyle('pending', '#d97706')}
      >
        <p className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Pending</p>
        <p className="text-3xl font-black text-amber-500 mt-2">{pending}</p>
      </div>

      {/* Completed Tasks Card */}
      <div
        onMouseEnter={() => setHoveredCard('completed')}
        onMouseLeave={() => setHoveredCard(null)}
        className="bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 text-center backdrop-blur-xl"
        style={cardStyle('completed', '#10b981')}
      >
        <p className="text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Completed</p>
        <p className="text-3xl font-black text-emerald-500 mt-2">{completed}</p>
      </div>
    </div>
  )
}

export default StatsHeader;