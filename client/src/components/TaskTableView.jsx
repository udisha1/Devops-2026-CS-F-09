import React from 'react';
import {
  CheckCircle2,
  Circle,
  Calendar,
  Pencil,
  Trash2,
  CheckSquare,
  Sparkles,
  Flame,
  CircleDot
} from 'lucide-react';

const STATUS_CONFIG = {
  todo: {
    label: 'To Do',
    icon: CircleDot,
    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
  },
  'in-progress': {
    label: 'In Progress',
    icon: Flame,
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  }
};

const PRIORITY_CONFIG = {
  Low: { label: 'Low', badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  Medium: { label: 'Medium', badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  High: { label: 'High', badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30' }
};

export default function TaskTableView({
  tasks = [],
  onUpdate,
  onDelete,
  onEdit,
  _themeConfig
}) {
  // Reliable status resolver
  const getTaskStatus = (task) => {
    if (task.status) return task.status;
    if (task.isCompleted) return 'completed';
    if (task.subtasks && task.subtasks.some((s) => s.isCompleted)) return 'in-progress';
    return 'todo';
  };

  // Human date helper
  const formatHumanDueDate = (dateVal) => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return null;

    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = d.toDateString() === tomorrow.toDateString();

    const isOverdue = d < now && !isToday;

    let text = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (isToday) text = 'Today';
    else if (isTomorrow) text = 'Tomorrow';

    return { text, isOverdue };
  };

  const handleStatusChange = (taskId, newStatus) => {
    const isCompleted = newStatus === 'completed';
    onUpdate(taskId, { status: newStatus, isCompleted });
  };

  const handleToggleCompletion = (task) => {
    const nextCompleted = !task.isCompleted;
    onUpdate(task._id, {
      isCompleted: nextCompleted,
      status: nextCompleted ? 'completed' : 'todo'
    });
  };

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 backdrop-blur-xl">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
          <Sparkles size={22} />
        </div>
        <h4 className="text-sm font-bold text-white mb-1">No tasks in list</h4>
        <p className="text-xs text-slate-400 font-medium max-w-sm mx-auto">
          Create a new task above or adjust your search filters.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-xl overflow-hidden">
      {/* Table Header (Desktop) */}
      <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-slate-950/60 border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400">
        <div className="col-span-5 flex items-center gap-3">
          <span>Task</span>
        </div>
        <div className="col-span-2">Status</div>
        <div className="col-span-1">Priority</div>
        <div className="col-span-1">Category</div>
        <div className="col-span-1">Due Date</div>
        <div className="col-span-1 text-center">Subtasks</div>
        <div className="col-span-1 text-right">Actions</div>
      </div>

      {/* Task Rows */}
      <div className="divide-y divide-slate-800/60">
        {tasks.map((task) => {
          const currentStatus = getTaskStatus(task);
          const isDone = task.isCompleted || currentStatus === 'completed';
          const dateInfo = formatHumanDueDate(task.dueDate);
          const totalSub = task.subtasks?.length || 0;
          const completedSub = task.subtasks?.filter((s) => s.isCompleted).length || 0;
          const priorityInfo = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.Medium;

          return (
            <div
              key={task._id}
              className={`p-3.5 sm:px-5 sm:py-3 hover:bg-slate-800/30 transition-colors flex flex-col md:grid md:grid-cols-12 md:gap-3 items-start md:items-center ${
                isDone ? 'opacity-65' : ''
              }`}
            >
              {/* Task Title & Checkbox */}
              <div className="md:col-span-5 flex items-start sm:items-center gap-3 w-full min-w-0 mb-2 md:mb-0">
                <button
                  type="button"
                  onClick={() => handleToggleCompletion(task)}
                  className="mt-0.5 sm:mt-0 text-slate-500 hover:text-emerald-400 transition cursor-pointer shrink-0"
                  title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {isDone ? (
                    <CheckCircle2 size={18} className="text-emerald-400 animate-check-pop" />
                  ) : (
                    <Circle size={18} />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs sm:text-sm font-semibold truncate ${
                        isDone ? 'line-through text-slate-500' : 'text-slate-100'
                      }`}
                      title={task.title}
                    >
                      {task.title}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-md font-normal">
                      {task.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Status Selector Dropdown */}
              <div className="md:col-span-2 w-full md:w-auto mb-2 md:mb-0">
                <select
                  value={currentStatus}
                  onChange={(e) => handleStatusChange(task._id, e.target.value)}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border cursor-pointer focus:outline-none transition ${
                    STATUS_CONFIG[currentStatus]?.badgeClass || STATUS_CONFIG.todo.badgeClass
                  }`}
                >
                  <option value="todo" className="bg-slate-950 text-slate-200">
                    ⚪ To Do
                  </option>
                  <option value="in-progress" className="bg-slate-950 text-amber-300">
                    ⚡ In Progress
                  </option>
                  <option value="completed" className="bg-slate-950 text-emerald-300">
                    ✅ Completed
                  </option>
                </select>
              </div>

              {/* Priority Badge */}
              <div className="md:col-span-1 mb-2 md:mb-0">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border inline-block ${priorityInfo.badgeClass}`}
                >
                  {task.priority || 'Medium'}
                </span>
              </div>

              {/* Category */}
              <div className="md:col-span-1 mb-2 md:mb-0">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white/5 text-slate-300 border border-white/5 inline-block">
                  {task.category || 'General'}
                </span>
              </div>

              {/* Due Date */}
              <div className="md:col-span-1 mb-2 md:mb-0">
                {dateInfo ? (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg inline-flex items-center gap-1 border ${
                      dateInfo.isOverdue
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold'
                        : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                    }`}
                  >
                    <Calendar size={10} />
                    <span>{dateInfo.text}</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-600">—</span>
                )}
              </div>

              {/* Subtasks Counter */}
              <div className="md:col-span-1 text-left md:text-center mb-2 md:mb-0">
                {totalSub > 0 ? (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white/5 text-slate-300 border border-white/5 inline-flex items-center gap-1">
                    <CheckSquare size={10} className="text-slate-400" />
                    <span>
                      {completedSub}/{totalSub}
                    </span>
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-600">—</span>
                )}
              </div>

              {/* Row Action Buttons */}
              <div className="md:col-span-1 flex items-center justify-end gap-1.5 w-full md:w-auto">
                {onEdit && (
                  <button
                    onClick={() => onEdit(task)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-white/5 transition cursor-pointer"
                    title="Edit Task Details"
                  >
                    <Pencil size={13} />
                  </button>
                )}
                <button
                  onClick={() => onDelete(task._id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-white/5 transition cursor-pointer"
                  title="Delete Task"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
