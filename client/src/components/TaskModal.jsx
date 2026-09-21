import React, { useState, useEffect } from 'react';
import { X, Calendar, Plus, Trash2, CheckCircle2, Circle, Sparkles, Tag, AlertCircle, Loader2 } from 'lucide-react';

const CATEGORIES = ['General', 'Work', 'Personal', 'Study'];
const PRIORITIES = [
  { id: 'Low', label: 'Low', activeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' },
  { id: 'Medium', label: 'Medium', activeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40' },
  { id: 'High', label: 'High', activeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40' }
];

export default function TaskModal({ isOpen, onClose, onSave, task = null, themeConfig }) {
  const isEditMode = !!task?._id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const colors = themeConfig?.glowColors || ['#c084fc', '#f472b6', '#38bdf8'];
  const highlightText = themeConfig?.highlightText || 'text-indigo-400';

  // Format ISO string to datetime-local input value (YYYY-MM-DDTHH:mm)
  const formatDateTimeLocal = (dateVal) => {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Populate form on open/task change
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title || '');
        setDescription(task.description || '');
        const isPreset = CATEGORIES.includes(task.category);
        if (isPreset) {
          setCategory(task.category || 'General');
          setIsCustomCategory(false);
          setCustomCategory('');
        } else if (task.category) {
          setCategory('Custom');
          setIsCustomCategory(true);
          setCustomCategory(task.category);
        } else {
          setCategory('General');
          setIsCustomCategory(false);
          setCustomCategory('');
        }
        setPriority(task.priority || 'Medium');
        setDueDate(formatDateTimeLocal(task.dueDate));
        setSubtasks(task.subtasks ? [...task.subtasks] : []);
      } else {
        // Reset for new task
        setTitle('');
        setDescription('');
        setCategory('General');
        setCustomCategory('');
        setIsCustomCategory(false);
        setPriority('Medium');
        setDueDate('');
        setSubtasks([]);
      }
      setNewSubtaskTitle('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, task]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Add a subtask to local state
  const handleAddSubtask = (e) => {
    if (e) e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    setSubtasks(prev => [
      ...prev,
      { _id: `local_${Date.now()}_${Math.random()}`, title: newSubtaskTitle.trim(), isCompleted: false }
    ]);
    setNewSubtaskTitle('');
  };

  // Delete a subtask from local state
  const handleDeleteSubtask = (subId) => {
    setSubtasks(prev => prev.filter(s => s._id !== subId));
  };

  // Toggle subtask completion inside modal
  const handleToggleSubtask = (subId) => {
    setSubtasks(prev => prev.map(s => 
      s._id === subId ? { ...s, isCompleted: !s.isCompleted } : s
    ));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a task title.');
      return;
    }

    const finalCategory = isCustomCategory ? (customCategory.trim() || 'General') : category;

    // Clean subtasks for MongoDB (strip temporary local IDs if new)
    const cleanedSubtasks = subtasks.map(s => {
      if (typeof s._id === 'string' && s._id.startsWith('local_')) {
        return { title: s.title, isCompleted: !!s.isCompleted };
      }
      return { _id: s._id, title: s.title, isCompleted: !!s.isCompleted };
    });

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category: finalCategory,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      subtasks: cleanedSubtasks
    };

    setIsSubmitting(true);
    setError('');
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error('Error saving task in modal:', err);
      setError(err?.response?.data?.message || 'Failed to save task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="w-full max-w-lg bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-6 sm:p-7 shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden"
        style={{
          boxShadow: `0 0 40px ${colors[0]}15, 0 20px 40px -15px rgba(0,0,0,0.8)`
        }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className={highlightText} />
            <h2 className="text-base font-black text-white uppercase tracking-wider">
              {isEditMode ? 'Edit Task Details' : 'Create New Task'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-950/50 hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 shrink-0">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto pr-1 space-y-4 flex-1">
          {/* Title Field */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Task Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Prepare system deployment architecture"
              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 text-sm font-semibold text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-700"
              required
              autoFocus
            />
          </div>

          {/* Description / Notes Field */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Description & Notes
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key context, links, or notes..."
              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 text-xs font-medium text-slate-200 placeholder-slate-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-700 resize-y min-h-[70px]"
            />
          </div>

          {/* Category & Priority 2-Column Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Picker */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
                <Tag size={12} />
                <span>Category</span>
              </label>
              <select
                value={category}
                onChange={(e) => {
                  const val = e.target.value;
                  setCategory(val);
                  setIsCustomCategory(val === 'Custom');
                }}
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 text-xs font-bold text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-700 cursor-pointer"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-slate-950 text-slate-200">
                    {cat}
                  </option>
                ))}
                <option value="Custom" className="bg-slate-950 text-slate-200">
                  + Custom Category...
                </option>
              </select>

              {isCustomCategory && (
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Enter custom category"
                  className="w-full mt-2 px-3 py-1.5 bg-slate-950/80 border border-slate-800 text-xs font-semibold text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-700"
                />
              )}
            </div>

            {/* Priority Selector Pills */}
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
                Priority
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {PRIORITIES.map(p => {
                  const isSelected = priority === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPriority(p.id)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-extrabold transition-all border cursor-pointer ${
                        isSelected
                          ? `${p.activeClass} shadow-sm scale-102`
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Due Date & Time Picker */}
          <div>
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Calendar size={12} />
              <span>Due Date & Time</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 text-xs font-semibold text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-700 cursor-pointer"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={() => setDueDate('')}
                  className="px-2.5 py-2.5 text-xs text-slate-400 hover:text-rose-400 bg-slate-950/80 border border-slate-800 rounded-xl transition cursor-pointer"
                  title="Clear Due Date"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Subtasks Checklist Manager */}
          <div className="pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
                Subtasks ({subtasks.filter(s => s.isCompleted).length}/{subtasks.length})
              </label>
            </div>

            {/* Existing subtasks list */}
            {subtasks.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1 mb-3">
                {subtasks.map((sub) => (
                  <div 
                    key={sub._id}
                    className="flex items-center justify-between gap-2 p-2 bg-slate-950/60 border border-slate-800/80 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSubtask(sub._id)}
                        className="text-slate-500 hover:text-emerald-400 transition cursor-pointer shrink-0"
                      >
                        {sub.isCompleted ? (
                          <CheckCircle2 size={15} className="text-emerald-400" />
                        ) : (
                          <Circle size={15} />
                        )}
                      </button>
                      <span className={`break-words ${sub.isCompleted ? 'line-through text-slate-500' : 'text-slate-200 font-medium'}`}>
                        {sub.title}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(sub._id)}
                      className="text-slate-500 hover:text-rose-400 transition p-1 cursor-pointer shrink-0"
                      title="Remove subtask"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic mb-3">
                No subtasks added yet. Break this task into small actionable steps below.
              </p>
            )}

            {/* Add Subtask Input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="+ Add subtask step and press Enter..."
                className="flex-1 px-3.5 py-2 bg-slate-950/80 border border-slate-800 text-xs font-medium text-white placeholder-slate-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-700"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                disabled={!newSubtaskTitle.trim()}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Add</span>
              </button>
            </div>
          </div>
        </form>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-slate-800/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-white bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-xl transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim()}
            className="px-6 py-2.5 text-xs font-extrabold uppercase tracking-wider text-white rounded-xl transition active:scale-96 flex items-center gap-1.5 shadow-lg cursor-pointer disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${colors[0]}, ${colors[1] || colors[0]})`,
              boxShadow: `0 0 20px ${colors[0]}35`
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{isEditMode ? 'Save Changes' : 'Create Task'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
