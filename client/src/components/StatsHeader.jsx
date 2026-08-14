import React from 'react'

const StatsHeader = ({task}) => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.isCompleted).length;
    const pending = total - completed;
  return (
    <div>
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
    </div>
  )
}

export default StatsHeader
