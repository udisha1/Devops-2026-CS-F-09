import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Brain, Mic, MicOff, Sparkles, Loader2, Play, Square, 
  Trash2, History, AlertCircle, CheckCircle2, Lightbulb, 
  ArrowLeft, Volume2, VolumeX, RefreshCw
} from 'lucide-react';

const API_BASE = 'http://localhost:5001/api/feynman';

export default function FeynmanPartner({ themeConfig }) {
  // Concept setup state
  const [concept, setConcept] = useState('');
  const [isActive, setIsActive] = useState(false);

  // Voice & Interaction states
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState([]); // [{ sender: 'user'|'child', text: string }]
  const [currentUserSpeech, setCurrentUserSpeech] = useState('');
  const [interimSpeech, setInterimSpeech] = useState('');
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [useVoice, setUseVoice] = useState(true);
  const [childSpeaking, setChildSpeaking] = useState(false);

  // Manual fallback input state
  const [manualText, setManualText] = useState('');

  // Diagnostic Report / Results states
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);

  // History states
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistorySession, setSelectedHistorySession] = useState(null);

  // Speech Recognition instance ref
  const recognitionRef = useRef(null);

  // Theme configuration values
  const colors = themeConfig?.glowColors || ['#c084fc', '#f472b6', '#38bdf8'];
  const highlightText = themeConfig?.highlightText || 'text-indigo-400';
  const highlightBorder = themeConfig?.highlightBorder || 'border-purple-500/30';
  const cardBg = themeConfig?.cardBg || '#120F17';

  // Load history on component mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API_BASE}/history`);
      setHistoryList(res.data);
    } catch (err) {
      console.error('Error fetching Feynman history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Initialize browser speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      setUseVoice(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      if (finalTranscript) {
        setCurrentUserSpeech(prev => prev + finalTranscript);
      }
      setInterimSpeech(interimTranscript);
    };

    rec.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setIsSpeechSupported(false);
        setUseVoice(false);
      }
    };

    rec.onend = () => {
      // Auto-restart if we are supposed to be listening and child is not speaking
      if (isActive && isListening && !childSpeaking) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Auto-restart failed:', e);
        }
      }
    };

    recognitionRef.current = rec;

    // Cleanup speech synthesis on unmount
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isActive, isListening, childSpeaking]);

  // Voice synthesis helper
  const speakText = (text, callback) => {
    if (!window.speechSynthesis) {
      if (callback) callback();
      return;
    }

    window.speechSynthesis.cancel();
    setChildSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.45; // Child-like higher pitch
    utterance.rate = 0.95; // Slightly slower pacing

    // Try English voice
    const voices = window.speechSynthesis.getVoices();
    const childVoice = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('google'));
    if (childVoice) {
      utterance.voice = childVoice;
    }

    utterance.onend = () => {
      setChildSpeaking(false);
      if (callback) callback();
    };

    utterance.onerror = (e) => {
      console.error('TTS error:', e);
      setChildSpeaking(false);
      if (callback) callback();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Toggle listening
  const toggleListening = () => {
    if (!isListening) {
      setIsListening(true);
      setCurrentUserSpeech('');
      setInterimSpeech('');
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error('Speech start error:', e);
      }
    } else {
      setIsListening(false);
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Speech stop error:', e);
      }
    }
  };

  // Start Session
  const handleStartSession = (e) => {
    e.preventDefault();
    if (!concept.trim()) return;
    setIsActive(true);
    setTranscript([]);
    setCurrentUserSpeech('');
    setInterimSpeech('');
    setEvaluationResult(null);
    setSelectedHistorySession(null);
    
    if (useVoice && isSpeechSupported) {
      setIsListening(true);
      setTimeout(() => {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error(e);
        }
      }, 200);
    }
  };

  // Submit manual text (keyboard fallback)
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    
    // Add user text directly
    setTranscript(prev => [...prev, { sender: 'user', text: manualText }]);
    setManualText('');
  };

  // Hand Raise ✋ Action: Get a child-like question
  const handleRaiseHand = async () => {
    // Collect user text so far
    let currentSpeechText = '';
    
    if (useVoice) {
      currentSpeechText = currentUserSpeech.trim();
      // Temporarily stop microphone while generating & speaking
      setIsListening(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
    } else {
      // Non-voice mode
      currentSpeechText = manualText.trim();
      setManualText('');
    }

    if (!currentSpeechText && transcript.length === 0) {
      alert("Please say or type something first so the child can listen!");
      if (useVoice && isSpeechSupported) {
        setIsListening(true);
        recognitionRef.current.start();
      }
      return;
    }

    // Build complete narrative explained so far
    const userSpeeches = transcript
      .filter(item => item.sender === 'user')
      .map(item => item.text);
    if (currentSpeechText) {
      userSpeeches.push(currentSpeechText);
    }
    const explanationSoFar = userSpeeches.join(' ');

    setChildSpeaking(true);

    try {
      const res = await axios.post(`${API_BASE}/interruption`, {
        concept,
        explanationSoFar,
        history: transcript
      });

      const question = res.data.question;

      // Add user input (if any) and child question to transcript
      const updatedTranscript = [...transcript];
      if (currentSpeechText) {
        updatedTranscript.push({ sender: 'user', text: currentSpeechText });
      }
      updatedTranscript.push({ sender: 'child', text: question });

      setTranscript(updatedTranscript);
      setCurrentUserSpeech('');
      setInterimSpeech('');

      // Speak out loud, then auto-resume listening when done
      speakText(question, () => {
        if (useVoice && isSpeechSupported) {
          setIsListening(true);
          try {
            recognitionRef.current.start();
          } catch (e) {
            // ignore
          }
        }
      });

    } catch (err) {
      console.error('Raise hand request failed:', err);
      alert('The child got distracted! Try again.');
      setChildSpeaking(false);
      if (useVoice && isSpeechSupported) {
        setIsListening(true);
        try {
          recognitionRef.current.start();
        } catch (e) {
          // ignore
        }
      }
    }
  };

  // Complete Explanation & Evaluate
  const handleEvaluate = async () => {
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    let finalUserSpeech = currentUserSpeech.trim();
    let finalTranscript = [...transcript];
    if (finalUserSpeech) {
      finalTranscript.push({ sender: 'user', text: finalUserSpeech });
    }

    if (finalTranscript.length === 0) {
      alert("No explanation registered. Please speak or type your explanation first.");
      return;
    }

    setIsEvaluating(true);
    try {
      const res = await axios.post(`${API_BASE}/evaluate`, {
        concept,
        transcript: finalTranscript
      });

      setEvaluationResult(res.data.evaluation);
      setIsActive(false);
      setConcept('');
      fetchHistory(); // refresh sidebar history list
    } catch (err) {
      console.error('Evaluation failed:', err);
      alert('Failed to evaluate explanation. Please try again.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Delete history item
  const handleDeleteHistory = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      await axios.delete(`${API_BASE}/history/${id}`);
      fetchHistory();
      if (selectedHistorySession && selectedHistorySession._id === id) {
        setSelectedHistorySession(null);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // View specific history item details
  const handleSelectHistory = async (id) => {
    try {
      const res = await axios.get(`${API_BASE}/history/${id}`);
      setSelectedHistorySession(res.data);
      setEvaluationResult(null);
    } catch (err) {
      console.error('Failed to load session details:', err);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-tab-content">
      {/* LEFT SIDEBAR: History list */}
      <div className="md:col-span-1 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 flex flex-col min-h-[400px]">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
          <History size={14} className={highlightText} />
          <span>Feynman History</span>
        </h3>

        <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[450px] pr-1">
          {loadingHistory ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="animate-spin text-slate-500" size={24} />
            </div>
          ) : historyList.length === 0 ? (
            <p className="text-xs text-slate-550 italic text-center py-8">No previous learning sessions saved yet.</p>
          ) : (
            historyList.map(session => (
              <div 
                key={session._id}
                onClick={() => handleSelectHistory(session._id)}
                className={`p-3 bg-slate-950/40 hover:bg-slate-950 border transition-all duration-200 rounded-xl cursor-pointer flex justify-between items-center group ${
                  selectedHistorySession?._id === session._id 
                    ? `border-slate-500/40 bg-slate-950` 
                    : `border-slate-900 hover:border-slate-800`
                }`}
              >
                <div className="flex flex-col min-w-0 pr-2">
                  <span className="text-xs font-bold text-slate-100 truncate">{session.concept}</span>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] font-semibold text-slate-450">
                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                      {session.evaluation?.simplicityRating || 'Grade School'}
                    </span>
                    <span>•</span>
                    <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <button 
                  onClick={(e) => handleDeleteHistory(session._id, e)}
                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 transition-all duration-150"
                  title="Delete Session"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT WORKSPACE: Interactive Session or Evaluation Results */}
      <div className="md:col-span-2 space-y-6">
        
        {/* Setup Screen / Choose Concept */}
        {!isActive && !evaluationResult && !selectedHistorySession && (
          <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Brain size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Feynman Learning Partner</h3>
                <p className="text-xs text-slate-400">Explain a concept simply as if to a child to verify your understanding.</p>
              </div>
            </div>

            <form onSubmit={handleStartSession} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                  What concept are you learning?
                </label>
                <input 
                  type="text"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  placeholder="e.g. Recursion, API, Photosynthesis, Docker Containers..."
                  className="w-full px-4 py-3 bg-slate-950/80 border border-slate-850 text-slate-100 placeholder-slate-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-700 focus:border-slate-700 text-sm font-semibold transition-all"
                  required
                />
              </div>

              {/* Voice mode toggler */}
              {isSpeechSupported ? (
                <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-900 rounded-xl">
                  <div className="flex items-center gap-2">
                    {useVoice ? <Volume2 size={16} className={highlightText} /> : <VolumeX size={16} className="text-slate-400" />}
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Voice Mode (Microphone)</span>
                      <span className="text-[10px] text-slate-500">Transcribe voice and speak questions out loud automatically.</span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={useVoice}
                      onChange={(e) => setUseVoice(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500/80 peer-checked:after:bg-white border border-slate-800"></div>
                  </label>
                </div>
              ) : (
                <div className="p-3.5 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex items-start gap-2 text-yellow-350">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <div className="text-[10px] font-semibold leading-relaxed">
                    Speech recognition is not supported by your browser or microphone access is blocked. 
                    Keyboard fallback mode will be used. (Use Chrome, Edge, or Safari for voice interaction).
                  </div>
                </div>
              )}

              <button 
                type="submit"
                disabled={!concept.trim()}
                className="w-full py-3 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${colors[0]}, ${colors[1] || colors[0]})`
                }}
              >
                <Play size={12} fill="white" />
                <span>Start Learning Session</span>
              </button>
            </form>
          </div>
        )}

        {/* ACTIVE SESSION PANEL (Voice recording / chat interaction) */}
        {isActive && (
          <div className="p-6 bg-slate-900/60 border border-slate-800/80 rounded-2xl shadow-xl backdrop-blur-xl relative overflow-hidden">
            
            {/* Top Info Bar */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-800/60 mb-5">
              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 block">Explaining Concept</span>
                <span className="text-base font-black text-white uppercase tracking-wider">{concept}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleEvaluate}
                  disabled={isEvaluating}
                  className="px-4 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider hover:brightness-110 transition cursor-pointer flex items-center gap-1 shadow-md"
                >
                  {isEvaluating ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      <span>Evaluating...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={12} />
                      <span>Finish & Evaluate</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={() => {
                    setIsActive(false);
                    setTranscript([]);
                    setCurrentUserSpeech('');
                  }}
                  className="px-3 py-1.5 bg-slate-950 text-slate-400 border border-slate-800 hover:text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>

            {/* Conversation Area */}
            <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 min-h-[180px] max-h-[300px] overflow-y-auto space-y-4 mb-4">
              
              {/* Previous turns */}
              {transcript.map((turn, i) => (
                <div key={i} className={`flex ${turn.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs font-semibold leading-relaxed ${
                    turn.sender === 'user' 
                      ? 'bg-slate-800 text-slate-100 rounded-tr-none' 
                      : 'bg-purple-900/35 border border-purple-500/20 text-purple-200 rounded-tl-none'
                  }`}>
                    {turn.text}
                  </div>
                </div>
              ))}

              {/* Current voice transcription draft (Live preview) */}
              {useVoice && (currentUserSpeech || interimSpeech) && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] bg-slate-800/40 border border-slate-850 text-slate-350 rounded-2xl rounded-tr-none px-4 py-2.5 text-xs font-semibold leading-relaxed italic">
                    {currentUserSpeech}
                    <span className="text-slate-500">{interimSpeech}</span>
                    <span className="ml-1 inline-block w-1.5 h-3 bg-indigo-500 animate-pulse"></span>
                  </div>
                </div>
              )}

              {/* Distracted Child animation / TTS visual feedback */}
              {childSpeaking && (
                <div className="flex justify-start items-center gap-2">
                  <div className="bg-purple-900/10 border border-purple-500/10 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs text-purple-400 font-semibold italic flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin" />
                    <span>Child is speaking out loud...</span>
                  </div>
                </div>
              )}

              {transcript.length === 0 && !currentUserSpeech && !interimSpeech && (
                <div className="h-full flex flex-col justify-center items-center py-6 text-center text-slate-500">
                  <Brain size={28} className="text-slate-655 animate-bounce mb-2" />
                  <p className="text-xs font-medium">
                    {useVoice 
                      ? "Microphone is on. Click 'Start Speaking' and begin explaining your concept..." 
                      : "Type your first sentence below to explain the concept!"
                    }
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Interaction controls */}
            <div className="space-y-3">
              {useVoice ? (
                /* Voice Interface Panel */
                <div className="flex items-center justify-between gap-4 p-3 bg-slate-950/60 border border-slate-900 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={toggleListening}
                      disabled={childSpeaking}
                      className={`p-3 rounded-full transition-all duration-200 shadow-md ${
                        isListening 
                          ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                          : 'bg-indigo-650 hover:bg-indigo-700 text-white'
                      }`}
                    >
                      {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                    </button>
                    <div>
                      <span className="text-xs font-bold block text-slate-200">
                        {isListening ? "Listening to explanation..." : "Microphone Paused"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {isListening ? "Keep explaining your concept" : "Click mic to speak"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleRaiseHand}
                    disabled={childSpeaking || (!currentUserSpeech.trim() && transcript.length === 0)}
                    className="px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 disabled:opacity-40 active:scale-[0.96] text-purple-400 hover:text-purple-300 border border-purple-500/20 hover:border-purple-500/30 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-150 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>✋ Raise Hand</span>
                  </button>
                </div>
              ) : (
                /* Keyboard Fallback Interface */
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input 
                    type="text" 
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="Type a sentence explaining a part of the concept..."
                    className="flex-1 px-4 py-2.5 bg-slate-950/80 border border-slate-850 text-slate-100 placeholder-slate-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-700 focus:border-slate-700 text-sm font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleRaiseHand}
                    disabled={childSpeaking || (!manualText.trim() && transcript.length === 0)}
                    className="px-4 py-2.5 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1"
                  >
                    <span>✋ Raise Hand</span>
                  </button>
                  <button 
                    type="submit" 
                    disabled={!manualText.trim()}
                    className="px-4 py-2.5 rounded-xl text-white font-extrabold text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${colors[0]}, ${colors[1] || colors[0]})`
                    }}
                  >
                    Send
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* DIAGNOSTIC REPORT RESULTS VIEW (For freshly completed evaluation or selected history session) */}
        {(evaluationResult || selectedHistorySession) && (
          <div className="space-y-6">
            
            {/* Header with back button */}
            <div className="flex justify-between items-center bg-slate-900/40 p-3 rounded-xl border border-slate-850">
              <button 
                onClick={() => {
                  setEvaluationResult(null);
                  setSelectedHistorySession(null);
                }}
                className="flex items-center gap-1 text-slate-400 hover:text-white text-xs font-bold transition duration-150 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Back to Setup</span>
              </button>
              
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                {selectedHistorySession ? 'Reviewing Historical Session' : 'New Session Evaluated! 🎉'}
              </span>
            </div>

            {/* Diagnostic Card */}
            {(() => {
              const data = evaluationResult || selectedHistorySession?.evaluation;
              const title = selectedHistorySession?.concept || concept;
              
              if (!data) return null;

              return (
                <div 
                  className="border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl relative overflow-hidden transition-all duration-300"
                  style={{ backgroundColor: cardBg }}
                >
                  {/* Neon Glow overlay */}
                  <div 
                    className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-10 filter blur-[40px] pointer-events-none"
                    style={{ backgroundColor: colors[0] }}
                  />

                  {/* Main Header / Title */}
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-6 border-b border-slate-800/50 mb-6">
                    <div>
                      <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500 block">Feynman Report Card</span>
                      <h2 className="text-xl font-black text-white uppercase tracking-wider">{title}</h2>
                    </div>

                    {/* Simplicity Grade Badge */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[9px] font-bold text-slate-450 block uppercase">Simplicity Grade</span>
                        <span className={`text-xs font-black ${highlightText}`}>{data.simplicityRating || 'Grade School'}</span>
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black border ${highlightBorder} bg-slate-950/60`}>
                        {data.simplicityScore}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Strengths & Gaps */}
                    <div className="space-y-5">
                      {/* Strengths */}
                      <div>
                        <h4 className="text-xs font-black text-emerald-400 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                          <CheckCircle2 size={13} />
                          <span>Strengths</span>
                        </h4>
                        <ul className="space-y-1.5 text-xs text-slate-300 pl-1">
                          {data.strengths?.length > 0 ? (
                            data.strengths.map((str, index) => (
                              <li key={index} className="flex items-start gap-1.5 leading-relaxed">
                                <span className="text-emerald-500 mt-0.5">•</span>
                                <span>{str}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-500 italic">No particular strengths highlighted.</li>
                          )}
                        </ul>
                      </div>

                      {/* Conceptual Gaps */}
                      <div>
                        <h4 className="text-xs font-black text-amber-400 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                          <AlertCircle size={13} />
                          <span>Conceptual Gaps</span>
                        </h4>
                        <ul className="space-y-1.5 text-xs text-slate-300 pl-1">
                          {data.conceptualGaps?.length > 0 ? (
                            data.conceptualGaps.map((gap, index) => (
                              <li key={index} className="flex items-start gap-1.5 leading-relaxed">
                                <span className="text-amber-500 mt-0.5">•</span>
                                <span>{gap}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-emerald-400/80 italic flex items-center gap-1 text-[11px] font-bold">
                              <CheckCircle2 size={11} />
                              <span>Zero conceptual gaps! Perfect understanding!</span>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* Right Column: Jargon & Suggestion Analogy */}
                    <div className="space-y-5">
                      {/* Jargon Words Detected */}
                      <div>
                        <h4 className="text-xs font-black text-red-400 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                          <MicOff size={13} />
                          <span>Jargon Detected</span>
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {data.jargonUsed?.length > 0 ? (
                            data.jargonUsed.map((jargon, index) => (
                              <span 
                                key={index}
                                className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-300 text-[10px] font-bold rounded-lg uppercase tracking-wide"
                              >
                                {jargon}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-emerald-400 font-bold italic flex items-center gap-1">
                              <CheckCircle2 size={11} />
                              <span>Zero jargon words! Great child-friendly speech.</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Suggested Analogy */}
                      <div className="p-4 bg-slate-950/60 border border-purple-500/15 rounded-xl relative overflow-hidden">
                        <div className="absolute top-3 right-3 text-purple-400/25">
                          <Lightbulb size={24} />
                        </div>
                        <h4 className="text-xs font-black text-purple-350 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Lightbulb size={13} className="text-purple-400" />
                          <span>Child-Friendly Analogy</span>
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed font-semibold italic">
                          "{data.suggestedAnalogy}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Summary Feedback */}
                  <div className="mt-6 pt-5 border-t border-slate-800/50">
                    <h4 className="text-xs font-black text-white uppercase tracking-wide mb-2">Overall Assessment</h4>
                    <p className="text-xs text-slate-350 leading-relaxed font-medium">
                      {data.summaryFeedback}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Transcript review panel for historical session */}
            {selectedHistorySession?.transcript && (
              <div className="p-5 bg-slate-900/30 border border-slate-850 rounded-2xl">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3.5">
                  Dialogue History
                </h4>
                <div className="space-y-3.5 max-h-[250px] overflow-y-auto pr-1">
                  {selectedHistorySession.transcript.map((item, index) => (
                    <div key={index} className={`flex ${item.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[85%] flex flex-col">
                        <span className={`text-[9px] font-bold mb-1 uppercase tracking-wide ${
                          item.sender === 'user' ? 'text-right text-slate-500' : 'text-left text-purple-450'
                        }`}>
                          {item.sender === 'user' ? 'You' : 'AI Child'}
                        </span>
                        <div className={`rounded-xl px-3 py-2 text-xs font-semibold leading-relaxed ${
                          item.sender === 'user' 
                            ? 'bg-slate-800 text-slate-100 rounded-tr-none' 
                            : 'bg-purple-900/20 border border-purple-500/10 text-purple-300 rounded-tl-none'
                        }`}>
                          {item.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
