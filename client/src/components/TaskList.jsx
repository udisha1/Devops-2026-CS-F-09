import React from 'react';
import TaskCard from './TaskCard';

export default function TaskList({ tasks, onUpdate, onDelete, themeConfig }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 bg-white/5 rounded-xl border border-dashed border-slate-800">
        <p className="text-gray-400 font-medium">No tasks found. Add a task above to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {tasks.map((task) => (
        <TaskCard
          key={task._id}
          task={task}
          onUpdate={onUpdate}
          onDelete={onDelete}
          themeConfig={themeConfig}
        />
      ))}
    </div>
  );
}