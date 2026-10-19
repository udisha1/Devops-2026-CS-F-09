import React, { useState, useMemo } from 'react';
import {
  CircleDot,
  Flame,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Pencil,
  Calendar,
  RotateCcw,
  GripVertical
} from 'lucide-react';

const COLUMNS = [
  {
    id: 'todo',
    name: 'To Do',
    subtitle: 'Ready to start',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    headerBg: 'from-indigo-500/15 via-indigo-500/5 to-transparent',
    borderClass: 'border-indigo-500/30 hover:border-indigo-500/50',
    dragOverBorder: 'border-indigo-400 ring-2 ring-indigo-500/40 shadow-[0_0_25px_rgba(99,102,241,0.3)]',
    accentColor: '#6366f1',
    icon: CircleDot
  },
  {
    id: 'in-progress',
    name: 'In Progress',
    subtitle: 'Currently in flow',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    headerBg: 'from-amber-500/15 via-amber-500/5 to-transparent',
    borderClass: 'border-amber-500/30 hover:border-amber-500/50',
    dragOverBorder: 'border-amber-400 ring-2 ring-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.3)]',
    accentColor: '#f59e0b',
    icon: Flame
  },
  {
    id: 'completed',
    name: 'Completed',
    subtitle: 'Finished milestones',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    headerBg: 'from-emerald-500/15 via-emerald-500/5 to-transparent',
    borderClass: 'border-emerald-500/30 hover:border-emerald-500/50',
    dragOverBorder: 'border-emerald-400 ring-2 ring-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.3)]',
    accentColor: '#10b981',
    icon: CheckCircle2
  }
];

const PRIORITY_BADGES = {
  Low: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  Medium: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  High: 'bg-rose-500/20 text-rose-300 border-rose-500/30'
};

export default function KanbanBoard({
  tasks = [],
  onUpdate,
  onDelete,
  onEdit,
  onAddTask,
  themeConfig
}) {
  const [dragOverCol, setDragOverCol] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  // Column quick add states
  const [quickAddTexts, setQuickAddTexts] = useState({ todo: '', 'in-progress': '', completed: '' });
  const [quickAddActive, setQuickAddActive] = useState({ todo: false, 'in-progress': false, completed: false });
  const [isAddingTask, setIsAddingTask] = useState(false);

  const colors = themeConfig?.glowColors || ['#c084fc', '#f472b6', '#38bdf8'];

  // Helper to reliably compute column status for any task
  const getTaskStatus = (task) => {
    if (task.status) return task.status;
    if (task.isCompleted) return 'completed';
    if (task.subtasks && task.subtasks.some((s) => s.isCompleted)) return 'in-progress';
    return 'todo';
  };

  // Group tasks into 3 columns
  const columnTasks = useMemo(() => {
    const buckets = { todo: [], 'in-progress': [], completed: [] };
    tasks.forEach((task) => {
      const status = getTaskStatus(task);
      if (buckets[status]) {
        buckets[status].push(task);
      } else {
        buckets.todo.push(task);
      }
    });
    return buckets;
  }, [tasks]);

  // Drag and drop handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverCol(null);
  };

  const handleDragOver = (e, colId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = (e, colId) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverCol === colId) {
      setDragOverCol(null);
    }
  };

  const handleDrop = async (e, targetColId) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;
    await moveTaskToStatus(taskId, targetColId);
  };

  // Status transition updater
  const moveTaskToStatus = async (taskId, targetStatus) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    const currentStatus = getTaskStatus(task);
    if (currentStatus === targetStatus) return;

    const updates = {
      status: targetStatus,
      isCompleted: targetStatus === 'completed'
    };

    await onUpdate(taskId, updates);
  };

  // Inline quick task add
  const handleQuickAdd = async (e, colId) => {
    e.preventDefault();
    const title = quickAddTexts[colId]?.trim();
    if (!title || !onAddTask) return;

    setIsAddingTask(true);
    try {
      await onAddTask({
        title,
        status: colId,
        isCompleted: colId === 'completed',
        priority: colId === 'in-progress' ? 'High' : 'Medium',
        category: 'General'
      });
      setQuickAddTexts((prev) => ({ ...prev, [colId]: '' }));
      setQuickAddActive((prev) => ({ ...prev, [colId]: false }));
    } catch (err) {
      console.error('Failed to quick-add task in kanban column:', err);
    } finally {
      setIsAddingTask(false);
    }
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

  return (
    <div className="w-full">
      {/* Board Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
        {COLUMNS.map((col) => {
          const colTasksList = columnTasks[col.id] || [];
          const isDragOver = dragOverCol === col.id;
          const ColIcon = col.icon;
          const isQuickActive = quickAddActive[col.id];

          return (
            <div
              key={col.id}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`flex flex-col rounded-3xl bg-slate-900/50 backdrop-blur-xl border transition-all duration-300 min-h-[480px] p-4 ${
                isDragOver ? col.dragOverBorder : `${col.borderClass} shadow-xl`
              }`}
            >
              {/* Column Header */}
              <div
                className={`p-3.5 rounded-2xl bg-gradient-to-r ${col.headerBg} border border-white/5 mb-3 flex items-center justify-between`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-md"
                    style={{ backgroundColor: `${col.accentColor}30`, border: `1px solid ${col.accentColor}60` }}
                  >
                    <ColIcon size={16} style={{ color: col.accentColor }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white tracking-wide flex items-center gap-2">
                      <span>{col.name}</span>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${col.badgeClass}`}>
                        {colTasksList.length}
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400 font-medium">{col.subtitle}</p>
                  </div>
                </div>

                {onAddTask && (
                  <button
                    onClick={() => {
                      setQuickAddActive((prev) => ({ ...prev, [col.id]: !prev[col.id] }));
                    }}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition cursor-pointer"
                    title={`Add task to ${col.name}`}
                  >
                    <Plus size={15} />
                  </button>
                )}
              </div>

              {/* In-Column Quick Add Form */}
              {isQuickActive && onAddTask && (
                <form onSubmit={(e) => handleQuickAdd(e, col.id)} className="mb-3 animate-fade-in">
                  <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-2xl shadow-lg">
                    <input
                      type="text"
                      value={quickAddTexts[col.id] || ''}
                      onChange={(e) =>
                        setQuickAddTexts((prev) => ({ ...prev, [col.id]: e.target.value }))
                      }
                      placeholder={`+ Task title for ${col.name}...`}
                      autoFocus
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 rounded-xl focus:outline-none focus:border-indigo-500 transition mb-2"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setQuickAddActive((prev) => ({ ...prev, [col.id]: false }))
                        }
                        className="px-2.5 py-1 text-[11px] text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isAddingTask || !quickAddTexts[col.id]?.trim()}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
                      >
                        {isAddingTask ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Card List in Column */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[720px] pr-0.5">
                {colTasksList.length === 0 ? (
                  <div className="py-12 px-3 text-center rounded-2xl border border-dashed border-slate-800/80 bg-slate-950/20 flex flex-col items-center justify-center">
                    <p className="text-xs text-slate-500 font-semibold mb-1">No tasks in {col.name}</p>
                    <p className="text-[10px] text-slate-600">Drag tasks here or click + above</p>
                  </div>
                ) : (
                  colTasksList.map((task) => {
                    const totalSubtasks = task.subtasks?.length || 0;
                    const completedSubtasks =
                      task.subtasks?.filter((s) => s.isCompleted).length || 0;
                    const dateInfo = formatHumanDueDate(task.dueDate);
                    const currentStatus = getTaskStatus(task);
                    const isCompleted = currentStatus === 'completed' || task.isCompleted;

                    return (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id)}
                        onDragEnd={handleDragEnd}
                        className={`group relative p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 backdrop-blur-md transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-lg ${
                          draggedTaskId === task._id ? 'opacity-40 scale-95' : 'opacity-100'
                        } ${isCompleted ? 'border-emerald-500/20' : ''}`}
                      >
                        {/* Drag grip + Title Header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <button
                              onClick={() => {
                                const nextCompleted = !isCompleted;
                                onUpdate(task._id, {
                                  isCompleted: nextCompleted,
                                  status: nextCompleted ? 'completed' : 'todo'
                                });
                              }}
                              className="mt-0.5 text-slate-500 hover:text-emerald-400 transition cursor-pointer shrink-0"
                              title={isCompleted ? 'Mark pending' : 'Mark completed'}
                            >
                              {isCompleted ? (
                                <CheckCircle2 size={16} className="text-emerald-400 animate-check-pop" />
                              ) : (
                                <Circle size={16} />
                              )}
                            </button>
                            <span
                              className={`text-xs font-bold break-words leading-snug ${
                                isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                              }`}
                            >
                              {task.title}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition shrink-0">
                            <span className="text-slate-600 hover:text-slate-400 cursor-grab p-0.5" title="Drag card">
                              <GripVertical size={13} />
                            </span>
                          </div>
                        </div>

                        {/* Optional description */}
                        {task.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2 mb-2.5 font-normal leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Subtasks Progress Bar if any */}
                        {totalSubtasks > 0 && (
                          <div className="mb-2.5">
                            <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1 font-semibold">
                              <span>
                                Checklist ({completedSubtasks}/{totalSubtasks})
                              </span>
                              <span>{Math.round((completedSubtasks / totalSubtasks) * 100)}%</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-1 overflow-hidden border border-white/5">
                              <div
                                className="h-full rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.round((completedSubtasks / totalSubtasks) * 100)}%`,
                                  background: `linear-gradient(90deg, ${colors[0]}, ${colors[1] || colors[0]})`
                                }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Badges: Category, Priority, Due Date */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-3">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white/5 text-slate-300 border border-white/5">
                            {task.category || 'General'}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                              PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.Medium
                            }`}
                          >
                            {task.priority || 'Medium'}
                          </span>
                          {dateInfo && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 border ${
                                dateInfo.isOverdue
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-bold'
                                  : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20'
                              }`}
                            >
                              <Calendar size={10} />
                              <span>{dateInfo.text}</span>
                            </span>
                          )}
                        </div>

                        {/* Bottom Actions Row: 1-Click Status Moves + Edit/Delete */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                          {/* 1-Click Status Transit Buttons */}
                          <div className="flex items-center gap-1">
                            {currentStatus !== 'todo' && (
                              <button
                                onClick={() => moveTaskToStatus(task._id, 'todo')}
                                className="px-2 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-[10px] font-semibold text-slate-400 hover:text-slate-200 transition border border-slate-800 cursor-pointer flex items-center gap-1"
                                title="Move to To Do"
                              >
                                <RotateCcw size={10} />
                                <span>To Do</span>
                              </button>
                            )}

                            {currentStatus !== 'in-progress' && (
                              <button
                                onClick={() => moveTaskToStatus(task._id, 'in-progress')}
                                className="px-2 py-0.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-[10px] font-semibold text-amber-300 transition border border-amber-500/30 cursor-pointer flex items-center gap-1"
                                title="Move to In Progress"
                              >
                                <Flame size={10} />
                                <span>In Flow</span>
                              </button>
                            )}

                            {currentStatus !== 'completed' && (
                              <button
                                onClick={() => moveTaskToStatus(task._id, 'completed')}
                                className="px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-semibold text-emerald-300 transition border border-emerald-500/30 cursor-pointer flex items-center gap-1"
                                title="Mark Completed"
                              >
                                <CheckCircle2 size={10} />
                                <span>Done</span>
                              </button>
                            )}
                          </div>

                          {/* Edit / Delete */}
                          <div className="flex items-center gap-1">
                            {onEdit && (
                              <button
                                onClick={() => onEdit(task)}
                                className="p-1 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-white/5 transition cursor-pointer"
                                title="Edit Task"
                              >
                                <Pencil size={12} />
                              </button>
                            )}
                            <button
                              onClick={() => onDelete(task._id)}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-white/5 transition cursor-pointer"
                              title="Delete Task"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
