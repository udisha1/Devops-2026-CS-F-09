import { CheckCircle2, Circle, Trash2, Calendar } from 'lucide-react';

export default function TaskCard({ task, onToggle, onDelete }) {
  const priorityColors = {
    Low: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    High: 'bg-red-100 text-red-700',
  };

  return (
    <div className={`p-5 bg-white rounded-xl shadow-sm border border-gray-100 flex items-start justify-between gap-4 transition ${task.isCompleted ? 'opacity-60 bg-gray-50' : ''}`}>
      <div className="flex items-start gap-3">
        <button 
          onClick={() => onToggle(task._id, !task.isCompleted)}
          className="mt-1 text-gray-400 hover:text-indigo-600 transition"
        >
          {task.isCompleted ? (
            <CheckCircle2 className="text-indigo-600" size={22} />
          ) : (
            <Circle size={22} />
          )}
        </button>

        <div>
          <h3 className={`font-semibold text-gray-800 ${task.isCompleted ? 'line-through text-gray-500' : ''}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          )}
          <div className="flex gap-2 items-center mt-3">
            <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
              {task.category || 'General'}
            </span>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>
            {task.dueDate && (
              <span className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full font-medium flex items-center gap-1">
                <Calendar size={12} />
                Due: {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => onDelete(task._id)}
        className="text-gray-400 hover:text-red-600 transition p-1"
        title="Delete Task"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}