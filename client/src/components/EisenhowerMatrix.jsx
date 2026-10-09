import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  CalendarClock, 
  Users, 
  Archive, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Pencil, 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Search, 
  Calendar,
  Sparkles,
  GripVertical
} from 'lucide-react';

const QUADRANTS = [
  {
    id: 'q1',
    name: 'Do First',
    subtitle: 'Urgent & Important',
    description: 'Critical deadlines, pressing emergencies & immediate obligations.',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    headerBg: 'from-rose-500/15 via-rose-500/5 to-transparent',
    borderClass: 'border-rose-500/30 hover:border-rose-500/60',
    dragOverBorder: 'border-rose-400 ring-2 ring-rose-500/40 shadow-[0_0_25px_rgba(244,63,94,0.3)]',
    accentColor: '#f43f5e',
    icon: Flame,
    defaultPriority: 'High',
    requiresUrgency: true
  },
  {
    id: 'q2',
    name: 'Schedule',
    subtitle: 'Not Urgent, but Important',
    description: 'Strategic planning, deep work, skill development & prevention.',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    headerBg: 'from-cyan-500/15 via-cyan-500/5 to-transparent',
    borderClass: 'border-cyan-500/30 hover:border-cyan-500/60',
    dragOverBorder: 'border-cyan-400 ring-2 ring-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.3)]',
    accentColor: '#06b6d4',
    icon: CalendarClock,
    defaultPriority: 'High',
    requiresUrgency: false
  },
  {
    id: 'q3',
    name: 'Delegate',
    subtitle: 'Urgent, but Not Important',
    description: 'Interruptions, routine chores & requests to automate or hand off.',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    headerBg: 'from-amber-500/15 via-amber-500/5 to-transparent',
    borderClass: 'border-amber-500/30 hover:border-amber-500/60',
    dragOverBorder: 'border-amber-400 ring-2 ring-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.3)]',
    accentColor: '#f59e0b',
    icon: Users,
    defaultPriority: 'Low',
    requiresUrgency: true
  },
  {
    id: 'q4',
    name: "Don't Do",
    subtitle: 'Neither Urgent nor Important',
    description: 'Time sinks, distractions, and backlog ideas to drop or postpone.',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    headerBg: 'from-purple-500/15 via-purple-500/5 to-transparent',
    borderClass: 'border-purple-500/30 hover:border-purple-500/60',
    dragOverBorder: 'border-purple-400 ring-2 ring-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.3)]',
    accentColor: '#a855f7',
    icon: Archive,
    defaultPriority: 'Low',
    requiresUrgency: false
  }
];

export default function EisenhowerMatrix({ 
  tasks = [], 
  onUpdateTask, 
  onDeleteTask, 
  onAddTask, 
  onEditTask, 
  themeConfig 
}) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [hideCompleted, setHideCompleted] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [dragOverQuadrant, setDragOverQuadrant] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  // In-quadrant quick add input state
  const [quickAddTexts, setQuickAddTexts] = useState({ q1: '', q2: '', q3: '', q4: '' });
  const [quickAddActive, setQuickAddActive] = useState({ q1: false, q2: false, q3: false, q4: false });
  const [isAddingTask, setIsAddingTask] = useState(false);

  const colors = themeConfig?.glowColors || ['#c084fc', '#f472b6', '#38bdf8'];
  const highlightText = themeConfig?.highlightText || 'text-indigo-400';

  // Smart auto-classifier for tasks without an explicit quadrant
  const getTaskQuadrant = (task) => {
    if (task.eisenhowerQuadrant && task.eisenhowerQuadrant !== 'auto') {
      return task.eisenhowerQuadrant;
    }

    const now = new Date();
    // Urgent window: past due, due today, or due within next 48 hours
    const urgentThreshold = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    let isUrgent = false;
    if (task.dueDate) {
      const due = new Date(task.dueDate);
      isUrgent = due <= urgentThreshold;
    }

    // High and Medium are classified as Important; Low is classified as Not Important
    const isImportant = task.priority === 'High' || task.priority === 'Medium';

    if (isUrgent && isImportant) return 'q1';
    if (!isUrgent && isImportant) return 'q2';
    if (isUrgent && !isImportant) return 'q3';
    return 'q4';
  };

  // Group tasks into the 4 quadrants after filtering
  const quadrantTasks = useMemo(() => {
    const buckets = { q1: [], q2: [], q3: [], q4: [] };

    tasks.forEach(task => {
      // Search filter
      if (search && !task.title.toLowerCase().includes(search.toLowerCase()) && 
          !(task.description && task.description.toLowerCase().includes(search.toLowerCase()))) {
        return;
      }

      // Category filter
      if (categoryFilter !== 'All' && (task.category || 'General') !== categoryFilter) {
        return;
      }

      // Hide completed toggle
      if (hideCompleted && task.isCompleted) {
        return;
      }

      const qId = getTaskQuadrant(task);
      if (buckets[qId]) {
        buckets[qId].push(task);
      } else {
        buckets.q4.push(task);
      }
    });

    return buckets;
  }, [tasks, search, categoryFilter, hideCompleted]);

  // Overall statistics
  const totalInMatrix = Object.values(quadrantTasks).reduce((acc, list) => acc + list.length, 0);

  // Drag and drop handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('text/plain', taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverQuadrant(null);
  };

  const handleDragOver = (e, qId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverQuadrant !== qId) {
      setDragOverQuadrant(qId);
    }
  };

  const handleDragLeave = (e, qId) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    if (dragOverQuadrant === qId) {
      setDragOverQuadrant(null);
    }
  };

  const handleDrop = async (e, targetQuadrantId) => {
    e.preventDefault();
    setDragOverQuadrant(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!taskId) return;
    await moveTaskToQuadrant(taskId, targetQuadrantId);
  };

  // Move task to a target quadrant
  const moveTaskToQuadrant = async (taskId, targetQuadrantId) => {
    const targetConfig = QUADRANTS.find(q => q.id === targetQuadrantId);
    if (!targetConfig) return;

    const updates = {
      eisenhowerQuadrant: targetQuadrantId,
      priority: targetConfig.defaultPriority
    };

    // If moving to an urgent quadrant and task has no due date, set due date to today
    const task = tasks.find(t => t._id === taskId);
    if (targetConfig.requiresUrgency && (!task?.dueDate || new Date(task.dueDate) < new Date())) {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      updates.dueDate = today.toISOString();
    }

    await onUpdateTask(taskId, updates);
  };

  // In-quadrant quick add submission
  const handleQuickAddSubmit = async (e, qId) => {
    e.preventDefault();
    const title = quickAddTexts[qId]?.trim();
    if (!title || isAddingTask) return;

    const quadConfig = QUADRANTS.find(q => q.id === qId);
    setIsAddingTask(true);

    try {
      const newTaskData = {
        title,
        priority: quadConfig.defaultPriority,
        category: categoryFilter !== 'All' ? categoryFilter : 'General',
        eisenhowerQuadrant: qId
      };

      if (quadConfig.requiresUrgency) {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        newTaskData.dueDate = today.toISOString();
      }

      await onAddTask(newTaskData);
      setQuickAddTexts(prev => ({ ...prev, [qId]: '' }));
      setQuickAddActive(prev => ({ ...prev, [qId]: false }));
    } catch (err) {
      console.error('Error adding quick matrix task:', err);
    } finally {
      setIsAddingTask(false);
    }
  };

  return (
    <div className="space-y-6 animate-tab-content">
      {/* Header Bar */}
      <div 
        className="p-6 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-xl"
        style={{ boxShadow: `0 0 30px ${colors[0]}12` }}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-950 border border-white/10 ${highlightText}`}>
                Decision Matrix
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                {totalInMatrix} {totalInMatrix === 1 ? 'task' : 'tasks'} categorized
              </span>
            </div>
            <h2 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              Eisenhower Priority Matrix
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Organize your actions by <strong className="text-white">Urgency</strong> and <strong className="text-white">Importance</strong> to focus on high-impact work and eliminate distractions.
            </p>
          </div>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition cursor-pointer self-start md:self-auto"
          >
            <Info size={14} className={highlightText} />
            <span>{showGuide ? 'Hide Matrix Guide' : 'How It Works'}</span>
            {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Collapsible Eisenhower Guide */}
        {showGuide && (
          <div className="mb-5 p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-3 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <Sparkles size={16} className={`${highlightText} shrink-0 mt-0.5`} />
              <p className="leading-relaxed">
                <strong className="text-white">"What is important is seldom urgent and what is urgent is seldom important."</strong> — Dwight D. Eisenhower.
                The secret to sustained productivity is spending <em>60–70% of your time in Q2 (Schedule)</em> before tasks become stressful Q1 fires.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-800">
              <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/20">
                <span className="font-bold text-rose-300 block mb-0.5">Q1: DO FIRST</span>
                <span className="text-slate-400 text-[11px]">Execute immediately. Don't procrastinate on critical deadlines.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20">
                <span className="font-bold text-cyan-300 block mb-0.5">Q2: SCHEDULE</span>
                <span className="text-slate-400 text-[11px]">Book dedicated focus blocks. This is where strategic growth happens.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/20">
                <span className="font-bold text-amber-300 block mb-0.5">Q3: DELEGATE</span>
                <span className="text-slate-400 text-[11px]">Automate, decline, or batch urgent but low-yield requests.</span>
              </div>
              <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/20">
                <span className="font-bold text-purple-300 block mb-0.5">Q4: ELIMINATE</span>
                <span className="text-slate-400 text-[11px]">Drop or archive time wasters and low-priority ideas.</span>
              </div>
            </div>
          </div>
        )}

        {/* Filters & Search Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t border-slate-800/80">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search tasks in matrix..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Work">💼 Work</option>
            <option value="Personal">🏠 Personal</option>
            <option value="Study">🎓 Study</option>
            <option value="General">📌 General</option>
          </select>

          <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer select-none px-2 py-1 bg-slate-950/40 rounded-xl border border-white/5">
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(e) => setHideCompleted(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-0 cursor-pointer"
            />
            <span>Hide Completed</span>
          </label>
        </div>
      </div>

      {/* Axis Labels (Urgent vs Not Urgent Header) */}
      <div className="hidden lg:grid grid-cols-2 gap-6 text-center select-none px-2">
        <div className="flex items-center justify-center gap-2 py-1.5 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs font-black uppercase tracking-widest text-slate-300">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          <span>⚡ URGENT (Immediate Action)</span>
        </div>
        <div className="flex items-center justify-center gap-2 py-1.5 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs font-black uppercase tracking-widest text-slate-300">
          <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
          <span>⏳ NOT URGENT (Strategic Time)</span>
        </div>
      </div>

      {/* 2x2 Quadrant Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {QUADRANTS.map((quad) => {
          const Icon = quad.icon;
          const qList = quadrantTasks[quad.id] || [];
          const isOver = dragOverQuadrant === quad.id;
          const completedCount = qList.filter(t => t.isCompleted).length;
          const progressPercent = qList.length > 0 ? Math.round((completedCount / qList.length) * 100) : 0;
          const isQuickActive = quickAddActive[quad.id];

          return (
            <div
              key={quad.id}
              onDragOver={(e) => handleDragOver(e, quad.id)}
              onDragLeave={(e) => handleDragLeave(e, quad.id)}
              onDrop={(e) => handleDrop(e, quad.id)}
              className={`flex flex-col min-h-[380px] bg-slate-900/50 backdrop-blur-xl rounded-2xl border transition-all duration-200 overflow-hidden shadow-xl ${
                isOver ? quad.dragOverBorder : quad.borderClass
              }`}
            >
              {/* Quadrant Header */}
              <div className={`p-4 bg-gradient-to-r ${quad.headerBg} border-b border-white/5`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="p-2 rounded-xl text-white shadow-lg"
                      style={{ background: quad.accentColor }}
                    >
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">
                          {quad.name}
                        </h3>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${quad.badgeClass}`}>
                          {qList.length}
                        </span>
                      </div>
                      <p className="text-[11px] font-semibold text-slate-400">
                        {quad.subtitle}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setQuickAddActive(prev => ({ ...prev, [quad.id]: !prev[quad.id] }))}
                    className="flex items-center gap-1 text-xs text-slate-300 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer font-medium"
                    title={`Add task to ${quad.name}`}
                  >
                    <Plus size={13} />
                    <span>Quick Task</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 mt-2 line-clamp-1">
                  {quad.description}
                </p>

                {/* Progress Mini-bar */}
                {qList.length > 0 && (
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 bg-white/5 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${progressPercent}%`,
                          backgroundColor: quad.accentColor
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {completedCount}/{qList.length}
                    </span>
                  </div>
                )}
              </div>

              {/* In-quadrant Inline Quick Add Form */}
              {isQuickActive && (
                <form
                  onSubmit={(e) => handleQuickAddSubmit(e, quad.id)}
                  className="p-3 bg-slate-950/70 border-b border-slate-800 flex gap-2 animate-fade-in"
                >
                  <input
                    type="text"
                    autoFocus
                    placeholder={`Add task to ${quad.name}...`}
                    value={quickAddTexts[quad.id] || ''}
                    onChange={(e) => setQuickAddTexts(prev => ({ ...prev, [quad.id]: e.target.value }))}
                    className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isAddingTask || !quickAddTexts[quad.id]?.trim()}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white transition disabled:opacity-50 cursor-pointer shadow-md"
                    style={{ background: quad.accentColor }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickAddActive(prev => ({ ...prev, [quad.id]: false }))}
                    className="px-2 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white bg-white/5 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {/* Task Cards Area */}
              <div className="flex-1 p-3 space-y-2.5 overflow-y-auto max-h-[460px]">
                {qList.length === 0 ? (
                  <div className="h-full min-h-[160px] flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                    <p className="text-xs text-slate-500 font-medium mb-1">
                      No tasks in this quadrant
                    </p>
                    <span className="text-[10px] text-slate-600">
                      Drag tasks here or click "+ Quick Task"
                    </span>
                  </div>
                ) : (
                  qList.map((task) => {
                    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.isCompleted;
                    const subtaskCount = task.subtasks?.length || 0;
                    const subtaskDone = task.subtasks?.filter(s => s.isCompleted).length || 0;

                    return (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id)}
                        onDragEnd={handleDragEnd}
                        className={`group p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition shadow-md flex items-start gap-2.5 cursor-grab active:cursor-grabbing ${
                          task.isCompleted ? 'opacity-55' : ''
                        }`}
                      >
                        {/* Drag Handle Icon */}
                        <div className="mt-1 text-slate-600 group-hover:text-slate-400 transition cursor-grab">
                          <GripVertical size={14} />
                        </div>

                        {/* Complete Checkbox */}
                        <button
                          onClick={() => onUpdateTask(task._id, { isCompleted: !task.isCompleted })}
                          className="mt-0.5 text-slate-500 hover:text-indigo-400 transition shrink-0 cursor-pointer active:scale-90"
                          title={task.isCompleted ? 'Mark incomplete' : 'Mark complete'}
                        >
                          {task.isCompleted ? (
                            <CheckCircle2 className="text-indigo-400 animate-check-pop" size={17} />
                          ) : (
                            <Circle size={17} />
                          )}
                        </button>

                        {/* Task Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-xs font-semibold text-white break-words ${
                            task.isCompleted ? 'line-through text-slate-500' : ''
                          }`}>
                            {task.title}
                          </h4>

                          {task.description && (
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2 break-words">
                              {task.description}
                            </p>
                          )}

                          {/* Task Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {/* Category */}
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/5 text-slate-300 font-medium border border-white/5">
                              {task.category || 'General'}
                            </span>

                            {/* Priority */}
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                              task.priority === 'High' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                              task.priority === 'Medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                              'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {task.priority}
                            </span>

                            {/* Due Date */}
                            {task.dueDate && (
                              <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1 border ${
                                isOverdue 
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                                  : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                              }`}>
                                <Calendar size={10} />
                                <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              </span>
                            )}

                            {/* Subtask count */}
                            {subtaskCount > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 font-medium">
                                ✓ {subtaskDone}/{subtaskCount}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons & Move Menu */}
                        <div className="flex items-center gap-1 shrink-0 self-start">
                          {/* 1-Click Move Dropdown */}
                          <div className="relative group/move">
                            <button
                              className="px-1.5 py-1 text-[10px] font-bold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-md transition cursor-pointer"
                              title="Move to another quadrant"
                            >
                              Move
                            </button>
                            <div className="absolute right-0 top-full mt-1 hidden group-hover/move:flex flex-col bg-slate-900 border border-slate-800 rounded-lg p-1 z-30 shadow-2xl min-w-[110px]">
                              {QUADRANTS.filter(q => q.id !== quad.id).map(targetQ => (
                                <button
                                  key={targetQ.id}
                                  onClick={() => moveTaskToQuadrant(task._id, targetQ.id)}
                                  className="text-left px-2 py-1 text-[10px] font-semibold text-slate-300 hover:text-white hover:bg-white/10 rounded transition cursor-pointer flex items-center justify-between"
                                >
                                  <span>{targetQ.name}</span>
                                  <span className="text-[9px] text-slate-500 uppercase">{targetQ.id}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Edit button */}
                          {onEditTask && (
                            <button
                              onClick={() => onEditTask(task)}
                              className="p-1 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-md transition cursor-pointer"
                              title="Edit Task Details"
                            >
                              <Pencil size={13} />
                            </button>
                          )}

                          {/* Delete button */}
                          <button
                            onClick={() => onDeleteTask(task._id)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-md transition cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 size={13} />
                          </button>
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
