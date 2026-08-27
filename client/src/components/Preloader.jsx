import React, { useEffect, useState } from 'react';

const Preloader = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Increment progress from 0 to 100
    const duration = 1200; // ms
    const intervalTime = 15; // ms
    const increment = 100 / (duration / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          // Wait briefly at 100% then start fading out
          setTimeout(() => {
            setFadeOut(true);
            // Callback to notify App.jsx that loading is done
            setTimeout(() => {
              if (onComplete) onComplete();
            }, 500); // match fadeOut transition duration
          }, 300);
          return 100;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 transition-all duration-500 ease-in-out ${
        fadeOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Visual background details */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      
      {/* Neon Glow Circle */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="absolute w-24 h-24 rounded-full border-4 border-indigo-500/10 animate-ping"></div>
        <div className="absolute w-20 h-20 rounded-full border-4 border-indigo-500/30"></div>
        <div className="absolute w-20 h-20 rounded-full border-t-4 border-indigo-500 animate-spin"></div>
        
        {/* Checkmark or Icon inside the ring */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-8 h-8 text-indigo-400 animate-pulse"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
          />
        </svg>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-extrabold tracking-widest text-slate-100 mb-2 uppercase drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
        TaskFlow
      </h1>
      <p className="text-xs text-indigo-400 font-semibold tracking-widest uppercase mb-8">
        Organize. Automate. Achieve.
      </p>

      {/* Progress Bar Container */}
      <div className="w-64 h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)] transition-all duration-75 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Progress Text */}
      <span className="mt-2 text-xs font-mono text-slate-400 font-bold">
        {Math.round(progress)}%
      </span>
    </div>
  );
};

export default Preloader;
