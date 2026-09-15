import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, 
  Flame, CheckCircle2, Circle, Sparkles, Target, Coffee, 
  CloudRain, Radio, Plus, Minus, Wind, Waves, AudioWaveform
} from 'lucide-react';

const MODES = {
  focus: { id: 'focus', label: 'Deep Focus', duration: 25 * 60, icon: Flame },
  shortBreak: { id: 'shortBreak', label: 'Short Break', duration: 5 * 60, icon: Coffee },
  longBreak: { id: 'longBreak', label: 'Long Break', duration: 15 * 60, icon: Sparkles }
};

const SOUNDS = [
  { id: 'off', label: 'Silence', icon: VolumeX, activeClass: 'bg-slate-800/80 border-slate-600 text-white' },
  { id: 'white', label: 'White Noise', icon: Wind, activeClass: 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' },
  { id: 'pink', label: 'Pink Noise', icon: Waves, activeClass: 'bg-pink-500/20 border-pink-500/40 text-pink-300' },
  { id: 'brown', label: 'Brown Noise', icon: AudioWaveform, activeClass: 'bg-amber-600/20 border-amber-600/40 text-amber-300' },
  { id: 'rain', label: 'Soft Rain', icon: CloudRain, activeClass: 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' },
  { id: 'drone', label: '432Hz Drone', icon: Radio, activeClass: 'bg-purple-500/20 border-purple-500/40 text-purple-300' },
];

export default function FocusZone({ tasks = [], onUpdateTask, themeConfig }) {
  // Timer States
  const [currentMode, setCurrentMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.duration);
  const [totalTime, setTotalTime] = useState(MODES.focus.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  // Active Task Targeting
  const [selectedTaskId, setSelectedTaskId] = useState('');

  // Audio States (Web Audio API)
  const [ambientSound, setAmbientSound] = useState('off'); // 'off' | 'rain' | 'drone'
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);

  // Audio Context and Nodes Ref
  const audioCtxRef = useRef(null);
  const ambientGainRef = useRef(null);
  const ambientSourceNodesRef = useRef([]);

  // Theme values
  const colors = themeConfig?.glowColors || ['#c084fc', '#f472b6', '#38bdf8'];
  const highlightText = themeConfig?.highlightText || 'text-indigo-400';

  // Find active task from tasks list
  const activeTask = useMemo(() => {
    return tasks.find(t => t._id === selectedTaskId) || null;
  }, [tasks, selectedTaskId]);

  // List of incomplete tasks for dropdown
  const pendingTasks = useMemo(() => {
    return tasks.filter(t => !t.isCompleted);
  }, [tasks]);

  // If no task selected but pending tasks exist, default to first high priority or first pending
  useEffect(() => {
    if (!selectedTaskId && pendingTasks.length > 0) {
      const highPriority = pendingTasks.find(t => t.priority === 'High');
      setSelectedTaskId(highPriority ? highPriority._id : pendingTasks[0]._id);
    }
  }, [pendingTasks, selectedTaskId]);

  // Web Audio Context initialization helper
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
        const masterGain = audioCtxRef.current.createGain();
        masterGain.gain.setValueAtTime(isMuted ? 0 : volume, audioCtxRef.current.currentTime);
        masterGain.connect(audioCtxRef.current.destination);
        ambientGainRef.current = masterGain;
      }
    } else if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Play pleasant 3-tone chime on completion
  const playCompletionChime = () => {
    try {
      const ctx = getAudioContext();
      if (!ctx || isMuted) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);

        gain.gain.setValueAtTime(0, now + idx * 0.12);
        gain.gain.linearRampToValueAtTime(0.2, now + idx * 0.12 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 1.3);
      });
    } catch (e) {
      console.warn('Audio chime playback error:', e);
    }
  };

  const playCompletionChimeRef = useRef(playCompletionChime);
  useEffect(() => {
    playCompletionChimeRef.current = playCompletionChime;
  });

  // Stop current ambient nodes
  const stopAmbientSound = () => {
    ambientSourceNodesRef.current.forEach(node => {
      try {
        if (node.stop) node.stop();
        node.disconnect();
      } catch {
        // Node already stopped
      }
    });
    ambientSourceNodesRef.current = [];
  };

  // Start chosen ambient soundscape
  const startAmbientSound = (soundType) => {
    stopAmbientSound();
    if (soundType === 'off') return;

    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      if (soundType === 'white') {
        // Pure White Noise (flat spectral energy across all bands)
        const bufferSize = ctx.sampleRate * 3;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = (Math.random() * 2 - 1) * 0.15;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        whiteNoise.connect(ambientGainRef.current);
        whiteNoise.start();

        ambientSourceNodesRef.current = [whiteNoise];
      } else if (soundType === 'pink') {
        // Paul Kellet's filtered pink noise (1/f equal energy per octave)
        const bufferSize = ctx.sampleRate * 3;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.09;
          b6 = white * 0.115926;
        }

        const pinkNoise = ctx.createBufferSource();
        pinkNoise.buffer = noiseBuffer;
        pinkNoise.loop = true;

        pinkNoise.connect(ambientGainRef.current);
        pinkNoise.start();

        ambientSourceNodesRef.current = [pinkNoise];
      } else if (soundType === 'brown') {
        // Brownian / Red noise (1/f^2 integrated white noise with deep waterfall rumble)
        const bufferSize = ctx.sampleRate * 3;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + (0.02 * white)) / 1.02;
          output[i] = lastOut * 2.2;
        }

        const brownNoise = ctx.createBufferSource();
        brownNoise.buffer = noiseBuffer;
        brownNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, ctx.currentTime);

        brownNoise.connect(filter);
        filter.connect(ambientGainRef.current);
        brownNoise.start();

        ambientSourceNodesRef.current = [brownNoise, filter];
      } else if (soundType === 'rain') {
        // Synthesize soft rain using filtered pink/brown noise
        const bufferSize = ctx.sampleRate * 3;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99 * b0 + white * 0.05;
          b1 = 0.96 * b1 + white * 0.1;
          b2 = 0.86 * b2 + white * 0.25;
          output[i] = (b0 + b1 + b2) * 0.35;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // Bandpass filter for gentle rain acoustics
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(700, ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(ambientGainRef.current);
        whiteNoise.start();

        ambientSourceNodesRef.current = [whiteNoise, filter];
      } else if (soundType === 'drone') {
        // Cyberpunk 432Hz Binaural Focus Drone
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const droneFilter = ctx.createBiquadFilter();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(216, ctx.currentTime); // Sub-harmonic

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(217.5, ctx.currentTime); // 1.5Hz binaural beat delta

        droneFilter.type = 'lowpass';
        droneFilter.frequency.setValueAtTime(320, ctx.currentTime);

        const droneGain = ctx.createGain();
        droneGain.gain.setValueAtTime(0.4, ctx.currentTime);

        osc1.connect(droneFilter);
        osc2.connect(droneFilter);
        droneFilter.connect(droneGain);
        droneGain.connect(ambientGainRef.current);

        osc1.start();
        osc2.start();

        ambientSourceNodesRef.current = [osc1, osc2, droneFilter, droneGain];
      }
    } catch (e) {
      console.warn('Error initiating ambient sound:', e);
    }
  };

  // Sync volume with Web Audio master gain
  useEffect(() => {
    if (ambientGainRef.current && audioCtxRef.current) {
      const targetVol = isMuted ? 0 : volume;
      ambientGainRef.current.gain.setTargetAtTime(targetVol, audioCtxRef.current.currentTime, 0.05);
    }
  }, [volume, isMuted]);

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      stopAmbientSound();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Switch sound when state changes
  const handleSelectSound = (type) => {
    setAmbientSound(type);
    getAudioContext();
    startAmbientSound(type);
  };

  // Main countdown timer interval
  useEffect(() => {
    let interval = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      playCompletionChimeRef.current?.();

      if (currentMode === 'focus') {
        const newCompleted = completedSessions + 1;
        setCompletedSessions(newCompleted);
        // Every 4 focus sessions, switch to long break
        if (newCompleted % 4 === 0) {
          switchMode('longBreak');
        } else {
          switchMode('shortBreak');
        }
      } else {
        switchMode('focus');
      }
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, currentMode, completedSessions]);

  // Switch mode helper
  const switchMode = (modeKey) => {
    const modeObj = MODES[modeKey];
    setCurrentMode(modeKey);
    setTimeLeft(modeObj.duration);
    setTotalTime(modeObj.duration);
    setIsRunning(false);
  };

  // Adjust time by +/- 1 minute
  const adjustTime = (seconds) => {
    setTimeLeft(prev => Math.max(60, prev + seconds));
    setTotalTime(prev => Math.max(60, prev + seconds));
  };

  // Reset timer
  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(MODES[currentMode].duration);
    setTotalTime(MODES[currentMode].duration);
  };

  // Skip to next interval
  const handleSkip = () => {
    setIsRunning(false);
    if (currentMode === 'focus') {
      switchMode('shortBreak');
    } else {
      switchMode('focus');
    }
  };

  // Toggle play/pause
  const togglePlay = () => {
    getAudioContext();
    setIsRunning(!isRunning);
  };

  // Format MM:SS
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // SVG Circular progress math
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = totalTime > 0 ? timeLeft / totalTime : 0;
  const strokeDashoffset = circumference * (1 - progressRatio);

  // Subtask checkbox handler
  const handleToggleSubtask = async (subtaskId, completed) => {
    if (!activeTask || !onUpdateTask) return;
    const updatedSubtasks = activeTask.subtasks.map(sub => 
      sub._id === subtaskId ? { ...sub, isCompleted: completed } : sub
    );
    await onUpdateTask(activeTask._id, { subtasks: updatedSubtasks });
  };

  // Mark active task complete
  const handleCompleteActiveTask = async () => {
    if (!activeTask || !onUpdateTask) return;
    await onUpdateTask(activeTask._id, { isCompleted: true });
  };

  return (
    <div className="animate-tab-content space-y-6 select-none">
      {/* Top Banner & Mode Switcher */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Title & Cycle Pills */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center justify-center sm:justify-start gap-2">
              <Flame className={`w-5 h-5 ${highlightText}`} />
              <span>Pomodoro Focus Zone</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Work in deep intervals, block distractions, and conquer your queue.
            </p>
          </div>

          {/* Session Dots Indicator */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/60 border border-slate-800/80 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 mr-1.5">Cycle:</span>
            {[0, 1, 2, 3].map((index) => {
              const filled = (completedSessions % 4) > index;
              return (
                <span
                  key={index}
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                    filled 
                      ? 'scale-110 shadow-sm' 
                      : 'bg-slate-800 border border-slate-700/50'
                  }`}
                  style={{
                    backgroundColor: filled ? colors[0] : undefined,
                    boxShadow: filled ? `0 0 8px ${colors[0]}` : undefined
                  }}
                  title={`Session ${index + 1}`}
                />
              );
            })}
            <span className="text-[11px] font-black ml-1 text-slate-300">
              {completedSessions}
            </span>
          </div>
        </div>

        {/* Mode Selector Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/70 border border-slate-800/80 rounded-xl">
          {Object.entries(MODES).map(([key, mode]) => {
            const Icon = mode.icon;
            const isActive = currentMode === key;
            return (
              <button
                key={key}
                onClick={() => switchMode(key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive 
                    ? `${highlightText} bg-slate-900 border border-white/10 shadow-md` 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={14} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Center Console: Circular Timer & Sound Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Main Column: Circular Timer */}
        <div className="lg:col-span-7 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
          
          {/* Subtle Ambient Glow behind the timer */}
          <div 
            className="absolute w-72 h-72 rounded-full opacity-15 blur-3xl pointer-events-none transition-all duration-700"
            style={{
              background: `radial-gradient(circle, ${colors[0]}, ${colors[1] || colors[0]})`,
              transform: isRunning ? 'scale(1.2)' : 'scale(0.9)'
            }}
          />

          {/* SVG Circular Progress Ring */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
            <svg 
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 280 280"
            >
              {/* Background Track */}
              <circle
                cx="140"
                cy="140"
                r={radius}
                className="stroke-slate-800/60 fill-transparent"
                strokeWidth="10"
              />

              {/* Animated Progress Arc */}
              <circle
                cx="140"
                cy="140"
                r={radius}
                fill="transparent"
                stroke={colors[0]}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
                style={{
                  filter: isRunning ? `drop-shadow(0 0 10px ${colors[0]}90)` : 'none'
                }}
              />
            </svg>

            {/* Inner Center Display */}
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-slate-950/80 border border-white/5 mb-1.5 ${highlightText}`}>
                {MODES[currentMode].label}
              </span>

              <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tight tabular-nums drop-shadow-md">
                {formatTime(timeLeft)}
              </h1>

              <span className="text-[11px] font-bold text-slate-400 mt-2 flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                {isRunning ? 'Session Active' : 'Ready to Start'}
              </span>

              {/* Quick minute adjustments */}
              <div className="flex items-center gap-2 mt-3 opacity-60 hover:opacity-100 transition-opacity">
                <button
                  onClick={() => adjustTime(-60)}
                  className="p-1 text-slate-400 hover:text-white rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer"
                  title="Subtract 1 min"
                >
                  <Minus size={12} />
                </button>
                <span className="text-[10px] uppercase font-bold text-slate-500">Fine Tune</span>
                <button
                  onClick={() => adjustTime(60)}
                  className="p-1 text-slate-400 hover:text-white rounded bg-slate-950/60 border border-slate-800 hover:border-slate-700 cursor-pointer"
                  title="Add 1 min"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-4 mt-8">
            <button
              onClick={handleReset}
              className="p-3 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all duration-200 active:scale-95 cursor-pointer"
              title="Reset Timer"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={togglePlay}
              className="px-8 py-3.5 text-white font-black text-sm uppercase tracking-wider rounded-2xl transition-all duration-200 active:scale-95 flex items-center gap-2 cursor-pointer shadow-xl hover:shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${colors[0]}, ${colors[1] || colors[0]})`,
                boxShadow: isRunning ? `0 0 25px ${colors[0]}40` : undefined
              }}
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} fill="currentColor" />}
              <span>{isRunning ? 'Pause' : 'Start Focus'}</span>
            </button>

            <button
              onClick={handleSkip}
              className="p-3 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all duration-200 active:scale-95 cursor-pointer"
              title="Skip Session"
            >
              <SkipForward size={18} />
            </button>
          </div>
        </div>

        {/* Right Column: Target Task & Ambient Audio Synthesizer */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Target Task Panel */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Target size={14} className={highlightText} />
                  <span>Current Target</span>
                </h3>
                {activeTask && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    activeTask.priority === 'High' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    activeTask.priority === 'Medium' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {activeTask.priority}
                  </span>
                )}
              </div>

              {/* Dropdown Task Picker */}
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full mb-4 px-3.5 py-2.5 bg-slate-950/80 border border-slate-800 text-xs font-semibold text-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-700 cursor-pointer"
              >
                {pendingTasks.length === 0 ? (
                  <option value="">No pending tasks! (Create one in Dashboard)</option>
                ) : (
                  pendingTasks.map(t => (
                    <option key={t._id} value={t._id} className="bg-slate-950 text-slate-200">
                      {t.title} ({t.category || 'General'})
                    </option>
                  ))
                )}
              </select>

              {/* Selected Task Details & Subtasks checklist */}
              {activeTask ? (
                <div className="p-4 bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-white break-words">
                      {activeTask.title}
                    </h4>
                    {activeTask.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {activeTask.description}
                      </p>
                    )}
                  </div>

                  {/* Subtask interactive checklist */}
                  {activeTask.subtasks && activeTask.subtasks.length > 0 && (
                    <div className="pt-3 border-t border-slate-800/80 space-y-2">
                      <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                        Subtasks:
                      </span>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                        {activeTask.subtasks.map(sub => (
                          <div key={sub._id} className="flex items-center gap-2 text-xs">
                            <button
                              onClick={() => handleToggleSubtask(sub._id, !sub.isCompleted)}
                              className="text-slate-500 hover:text-emerald-400 transition flex-shrink-0 cursor-pointer active:scale-90"
                            >
                              {sub.isCompleted ? (
                                <CheckCircle2 className="text-emerald-400" size={15} />
                              ) : (
                                <Circle size={15} />
                              )}
                            </button>
                            <span className={`break-words ${sub.isCompleted ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                              {sub.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs border border-dashed border-slate-800/70 rounded-xl">
                  Select a task to focus on during this cycle.
                </div>
              )}
            </div>

            {/* Complete Task Button */}
            {activeTask && (
              <button
                onClick={handleCompleteActiveTask}
                className="mt-4 w-full py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.98] text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>Mark Task Complete</span>
              </button>
            )}
          </div>

          {/* Web Audio Ambient Soundscape Generator */}
          <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Radio size={14} className={highlightText} />
                <span>Ambient Soundscape</span>
              </h3>

              {/* Mute Toggle */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-400 hover:text-white transition cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>

            {/* Ambient Mode Selectors */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3.5">
              {SOUNDS.map(sound => {
                const Icon = sound.icon;
                const isActive = ambientSound === sound.id;
                return (
                  <button
                    key={sound.id}
                    onClick={() => handleSelectSound(sound.id)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                      isActive
                        ? `${sound.activeClass} shadow-sm`
                        : 'bg-slate-950/40 border-slate-800/70 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Icon size={13} />
                    <span>{sound.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Volume Slider */}
            <div className="flex items-center gap-2">
              <Volume2 size={12} className="text-slate-500" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-[10px] font-bold text-slate-400 w-8 text-right">
                {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
