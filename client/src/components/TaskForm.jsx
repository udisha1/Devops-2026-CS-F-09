import React, { useState } from 'react';
import axios from 'axios';
import { Sparkles, Loader2 } from 'lucide-react';

export default function TaskForm({ onAddTask, themeConfig }) {
  const [smartText, setSmartText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSmartSubmit = async (e) => {
    e.preventDefault();
    if (!smartText.trim()) return;

    setIsLoading(true);
    try {
      console.log("Asking AI to parse...");
      const aiResponse = await axios.post('http://localhost:5001/api/parse-task', {
        text: smartText
      });
      
      const parsedData = aiResponse.data;
      console.log("AI Extracted:", parsedData);
      
      // Pass the parsed data to the parent component to save to MongoDB
      if (onAddTask) {
        await onAddTask({
          title: parsedData.title,
          description: "Created via AI Magic ✨",
          priority: parsedData.priority || "Medium", 
          category: parsedData.category || "General",
          dueDate: parsedData.dueDate          
        });
      }
      setSmartText(''); 

    } catch (error) {
      console.error("AI Task Entry Error:", error);
      alert("Error adding smart task. Check the console!");
    } finally {
      setIsLoading(false);
    }
  };

  const colors = themeConfig?.glowColors || ['#c084fc', '#f472b6', '#38bdf8'];
  const highlightText = themeConfig?.highlightText || 'text-indigo-400';

  return (
    <div className="mb-8">
      <form 
        onSubmit={handleSmartSubmit} 
        className="p-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-xl mb-6 relative overflow-hidden transition-all duration-300"
      >
        <h3 className={`text-[10px] font-extrabold uppercase tracking-wider mb-2.5 flex items-center gap-1.5 ${highlightText}`}>
          <Sparkles size={14} className={isLoading ? 'animate-pulse' : ''} />
          <span>AI Task Entry</span>
        </h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={smartText}
            onChange={(e) => setSmartText(e.target.value)}
            placeholder="Type anything (e.g. 'Write report by Friday high priority')..."
            className="flex-1 px-4 py-2.5 bg-slate-950/80 border border-slate-850 text-slate-100 placeholder-slate-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-700 focus:border-slate-700 transition-all text-sm font-medium"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !smartText.trim()}
            className="px-5 py-2.5 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl disabled:opacity-50 transition active:scale-[0.96] flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${colors[0]}, ${colors[1] || colors[0]})`
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Thinking...</span>
              </>
            ) : (
              <span>Magic Add</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}