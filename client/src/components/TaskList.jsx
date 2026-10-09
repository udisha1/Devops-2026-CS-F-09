import React from 'react';
import TaskCard from './TaskCard';
import { Sparkles } from 'lucide-react';

export default function TaskList({ tasks, onUpdate, onDelete, onEdit, themeConfig }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 backdrop-blur-xl">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
          <Sparkles size={22} />
        </div>
        <h4 className="text-sm font-bold text-white mb-1">All clear! No tasks found</h4>
        <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
          Type in the AI natural language entry above or click "+ Manual Task" to organize your day.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {tasks.map((task) => (
        <TaskCard
          key={task._id}
          task={task}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onEdit={onEdit}
          themeConfig={themeConfig}
        />
      ))}
    </div>
  );
}