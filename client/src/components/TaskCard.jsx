import React, { useState } from 'react';
import { CheckCircle2, Circle, Trash2, Calendar, Sparkles } from 'lucide-react';
import axios from 'axios';
import BorderGlow from './BorderGlow';

export default function TaskCard({ task, onUpdate, onDelete, themeConfig }) {
  const [isGenerating, setIsGenerating] = useState(false);

  const defaultGlowColors = ['#c084fc', '#f472b6', '#38bdf8'];
  const defaultGlowColorRaw = '40 80 80';
  const defaultCardBg = '#120F17';

  const colors = themeConfig?.glowColors || defaultGlowColors;
  const glowColor = themeConfig?.glowColorRaw || defaultGlowColorRaw;
  const backgroundColor = themeConfig?.cardBg || defaultCardBg;

  const totalSubtasks = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(sub => sub.isCompleted).length || 0;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const priorityColors = {
    Low: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    Medium: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    High: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
  };

  const handleBreakdown = async () => {
    setIsGenerating(true);
    try {
      const res = await axios.post(`http://localhost:5001/api/tasks/${task._id}/breakdown`);
      onUpdate(task._id, res.data); // Update the tasks state in App.jsx
    } catch (err) {
      console.error("Error breaking down task:", err);
      alert("Failed to generate subtasks. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleSubtask = (subtaskId, subtaskCompleted) => {
    const updatedSubtasks = task.subtasks.map(sub => 
      sub._id === subtaskId ? { ...sub, isCompleted: subtaskCompleted } : sub
    );
    onUpdate(task._id, { subtasks: updatedSubtasks });
  };

  return (
    <BorderGlow
      edgeSensitivity={30}
      glowColor={glowColor}
      backgroundColor={backgroundColor}
      borderRadius={28}
      glowRadius={40}
      glowIntensity={1}
      coneSpread={25}
      animated={false}
      colors={colors}
      className={`transition ${task.isCompleted ? 'opacity-50' : ''}`}
    >
      <div className="p-5 flex items-start justify-between gap-4 w-full">
        <div className="flex items-start gap-3 w-full">
          <button 
            onClick={() => onUpdate(task._id, { isCompleted: !task.isCompleted })}
            className="mt-1 text-slate-500 hover:text-indigo-400 transition flex-shrink-0 cursor-pointer active:scale-90 hover:scale-105 duration-200 transform"
          >
            {task.isCompleted ? (
              <CheckCircle2 className="text-indigo-400 animate-check-pop" size={22} />
            ) : (
              <Circle size={22} className="transition-transform duration-200 hover:scale-105" />
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className={`font-semibold text-white break-words ${task.isCompleted ? 'line-through text-gray-500' : ''}`}>
                {task.title}
              </h3>
              {!task.isCompleted && (!task.subtasks || task.subtasks.length === 0) && (
                <button
                  onClick={handleBreakdown}
                  disabled={isGenerating}
                  className="text-purple-300 hover:text-purple-200 hover:bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/30 transition flex items-center gap-1 text-xs font-semibold disabled:opacity-50"
                  title="Break task into subtasks using AI"
                >
                  <Sparkles size={13} className={isGenerating ? 'animate-spin' : ''} />
                  {isGenerating ? 'Breaking down...' : 'Break it Down'}
                </button>
              )}
            </div>
            {task.description && (
              <p className="text-sm text-gray-300 mt-1 break-words">{task.description}</p>
            )}

            {/* Subtasks List */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div className="mt-4 border-t border-white/10 pt-3">
                <div className="flex justify-between items-center mb-1.5">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Subtasks ({completedSubtasks}/{totalSubtasks})
                  </h4>
                  <span className="text-[10px] font-extrabold text-gray-350">{progressPercent}%</span>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full bg-white/10 rounded-full h-1.5 mb-3 overflow-hidden">
                  <div
                    className="h-full transition-all duration-300 ease-out rounded-full"
                    style={{
                      width: `${progressPercent}%`,
                      background: `linear-gradient(90deg, ${colors[0]}, ${colors[1] || colors[0]})`
                    }}
                  />
                </div>

                <div className="space-y-2">
                  {task.subtasks.map((sub) => (
                    <div key={sub._id} className="flex items-center gap-2 text-sm">
                      <button
                        onClick={() => handleToggleSubtask(sub._id, !sub.isCompleted)}
                        disabled={task.isCompleted}
                        className="text-slate-500 hover:text-indigo-400 transition flex-shrink-0 cursor-pointer active:scale-90 hover:scale-105 duration-200 transform"
                      >
                        {sub.isCompleted ? (
                          <CheckCircle2 className="text-emerald-400 animate-check-pop" size={16} />
                        ) : (
                          <Circle size={16} className="transition-transform duration-200 hover:scale-105" />
                        )}
                      </button>
                      <span className={`break-words ${sub.isCompleted ? 'line-through text-gray-500' : 'text-gray-200'}`}>
                        {sub.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 items-center mt-3">
              <span className="text-xs px-2.5 py-1 bg-white/10 text-white rounded-full font-medium border border-white/5">
                {task.category || 'General'}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priorityColors[task.priority]}`}>
                {task.priority}
              </span>
              {task.dueDate && (
                <span className="text-xs px-2.5 py-1 bg-indigo-500/20 text-indigo-300 rounded-full font-medium flex items-center gap-1 border border-indigo-500/30">
                  <Calendar size={12} />
                  Due: {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => onDelete(task._id)}
          className="text-gray-400 hover:text-rose-400 transition p-1 flex-shrink-0 self-start"
          title="Delete Task"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </BorderGlow>
  );
}