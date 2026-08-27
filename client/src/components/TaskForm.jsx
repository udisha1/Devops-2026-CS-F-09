import React, { useState } from 'react';
import axios from 'axios';

export default function TaskForm({ onAddTask }) {
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
          category: parsedData.category || "General"          
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

  return (
    <div className="mb-8">
      <form onSubmit={handleSmartSubmit} className="p-4 border-2 border-purple-400 rounded-lg shadow-sm bg-purple-50 mb-6">
        <h3 className="text-lg font-bold mb-2 text-purple-800">✨ AI Task Entry</h3>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={smartText}
            onChange={(e) => setSmartText(e.target.value)}
            placeholder="Type anything..."
            className="flex-1 p-2 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !smartText.trim()}
            className="px-6 py-2 bg-purple-600 text-white font-semibold rounded hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {isLoading ? 'Thinking...' : 'Magic Add'}
          </button>
        </div>
      </form>
    </div>
  );
}