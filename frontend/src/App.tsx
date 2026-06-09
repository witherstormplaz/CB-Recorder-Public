import React, { useState, useRef, MouseEvent, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Play, Square, Settings, Clock, Globe, TerminalSquare } from 'lucide-react';

declare global {
  interface Window {
    electronAPI?: {
      startRecording: (options: { url: string, duration: string, browser: string }) => void;
      stopRecording: () => void;
      onLog: (callback: (log: string) => void) => void;
      onStatus: (callback: (status: string) => void) => void;
    };
  }
}

export default function App() {
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState('');
  const [browser, setBrowser] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState('Idle');
  
  // Terminal Logs
  const [logs, setLogs] = useState<string[]>([]);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Mouse tracking for Liquid Glass glare
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for the mouse position
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const handleToggleRecord = () => {
    if (!isRecording) {
      if (!url) return;
      setIsRecording(true);
      setStatus('Starting engine...');
      setLogs(['[system] Initializing streamlink engine...']);
      if (window.electronAPI) {
        window.electronAPI.startRecording({ url, duration, browser });
      } else {
        setLogs(prev => [...prev, '[warning] Running in browser mock mode.']);
      }
    } else {
      if (window.electronAPI) {
        window.electronAPI.stopRecording();
      }
      setIsRecording(false);
      setStatus('Idle');
    }
  };

  // Listen to Real IPC Logs
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onLog((log: string) => {
        const lines = log.split('\n').filter(l => l.trim().length > 0);
        setLogs(prev => [...prev.slice(-100), ...lines]); // Keep last 100 lines
      });
      window.electronAPI.onStatus((newStatus: string) => {
        setStatus(newStatus);
        if (newStatus === 'Idle') setIsRecording(false);
      });
    }
  }, []);

  // Auto-scroll terminal container (fixes full-page shaking bug)
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    // Draggable frameless window
    <div 
      className="min-h-screen bg-[#050500] text-white overflow-hidden relative flex items-center justify-center font-sans select-none" 
      style={{ WebkitAppRegion: 'drag' } as any}
    >
      
      {/* Dynamic Yellow/Gold Background Orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-yellow-500/30 rounded-full blur-[140px] mix-blend-screen"
        />
        <motion.div 
          animate={{ scale: [1, 1.5, 1], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-amber-600/30 rounded-full blur-[120px] mix-blend-screen"
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], y: [0, -50, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[20%] left-[40%] w-[40vw] h-[40vw] bg-orange-500/20 rounded-full blur-[100px] mix-blend-screen"
        />
      </div>

      {/* Main Layout Container */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        
        {/* Main Liquid Glass Card */}
        <motion.div 
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => { mouseX.set(400); mouseY.set(300); }}
          initial={{ opacity: 0, x: "-50%", y: "-50%" }}
          animate={{ opacity: 1, x: isRecording ? "calc(-50% - 220px)" : "-50%", y: "-50%" }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
          className="absolute top-1/2 left-1/2 z-20 w-[420px] p-8 rounded-[2.5rem] bg-white/[0.04] backdrop-blur-3xl shadow-2xl overflow-hidden group border border-white/10 flex flex-col justify-between pointer-events-auto"
          style={{ boxShadow: '0 25px 50px -12px rgba(251, 191, 36, 0.15)', height: '540px' }}
        >
          {/* Real-time Cursor Glare */}
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 opacity-0 group-hover:opacity-100 mix-blend-overlay"
            style={{
              background: useTransform(
                [springX, springY],
                ([x, y]) => `radial-gradient(600px circle at ${x}px ${y}px, rgba(255,255,255,0.15), transparent 40%)`
              ),
            }}
          />

          {/* Non-draggable interactive content area */}
          <div className="relative z-30" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-yellow-100 via-yellow-400 to-amber-600 drop-shadow-sm">
                Recorder V2
              </h1>
              <p className="text-sm text-yellow-100/50 mt-2 font-medium tracking-wide">LIQUID GLASS EDITION</p>
            </div>

            <div className="space-y-6">
              {/* URL Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-yellow-500/70 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <Globe size={12} /> Stream URL
                </label>
                <div className="relative group/input">
                  <input 
                    type="text" 
                    placeholder="https://chaturbate.com/username/"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={isRecording}
                    className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 text-sm text-yellow-50 placeholder:text-yellow-100/30 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all disabled:opacity-50 shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-yellow-500/70 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <Clock size={12} /> Duration (s)
                  </label>
                  <input 
                    type="number" 
                    placeholder="Unlimited"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    disabled={isRecording}
                    className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 text-sm text-yellow-50 placeholder:text-yellow-100/30 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all disabled:opacity-50 shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-yellow-500/70 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <Settings size={12} /> Browser Auth
                  </label>
                  <select 
                    value={browser}
                    onChange={(e) => setBrowser(e.target.value)}
                    disabled={isRecording}
                    className="w-full bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4 text-sm text-yellow-50 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 transition-all appearance-none disabled:opacity-50 shadow-inner"
                  >
                    <option value="" className="bg-[#1a1a10]">None</option>
                    <option value="chrome" className="bg-[#1a1a10]">Chrome</option>
                    <option value="edge" className="bg-[#1a1a10]">Edge</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 h-8 flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={status}
                  initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                  className={`text-sm font-semibold tracking-wide ${isRecording ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-yellow-100/30'}`}
                >
                  {status}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-auto pt-6 flex justify-center z-30">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleRecord}
              className={`relative overflow-hidden group rounded-full p-[2px] transition-all duration-700 ${
                isRecording 
                  ? 'bg-red-500/40 shadow-[0_0_50px_-10px_rgba(239,68,68,0.6)]' 
                  : 'bg-yellow-500/30 shadow-[0_0_50px_-10px_rgba(250,204,21,0.3)] hover:shadow-[0_0_60px_-10px_rgba(250,204,21,0.5)] hover:bg-yellow-400/50'
              }`}
            >
              <div className={`relative z-10 flex items-center gap-3 px-8 py-4 rounded-full backdrop-blur-xl border border-white/20 transition-colors duration-500 ${
                isRecording ? 'bg-red-950/70' : 'bg-[#1a1500]/70'
              }`}>
                {isRecording ? (
                  <>
                    <Square size={18} className="fill-red-400 text-red-400 shadow-sm" />
                    <span className="font-bold text-red-200 tracking-widest text-xs">STOP RECORDING</span>
                  </>
                ) : (
                  <>
                    <Play size={18} className="fill-yellow-400 text-yellow-400 shadow-sm" />
                    <span className="font-bold text-yellow-100 tracking-widest text-xs">START RECORDING</span>
                  </>
                )}
              </div>
              <div className="absolute inset-0 -translate-x-[150%] skew-x-12 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-[shine_1.5s_ease-out_infinite]" />
            </motion.button>
          </div>
        </motion.div>

        {/* Sliding Terminal Panel */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, x: "-50%", y: "-50%", scale: 0.95 }}
              animate={{ opacity: 1, x: "calc(-50% + 220px)", y: "-50%", scale: 1 }}
              exit={{ opacity: 0, x: "-50%", y: "-50%", scale: 0.95 }}
              transition={{ duration: 0.7, type: "spring", bounce: 0.2 }}
              className="absolute top-1/2 left-1/2 z-10 w-[400px] h-[500px] overflow-hidden rounded-[2.5rem] bg-black/60 backdrop-blur-xl border border-white/5 shadow-2xl flex flex-col pointer-events-auto"
              style={{ WebkitAppRegion: 'no-drag' } as any}
            >
              {/* Terminal Header */}
              <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                <TerminalSquare size={16} className="text-yellow-500/70" />
                <span className="text-xs font-bold text-yellow-500/70 uppercase tracking-widest">Process Logs</span>
              </div>
              
              {/* Terminal Body */}
              <div 
                ref={logsContainerRef}
                className="flex-1 p-6 overflow-y-auto font-mono text-[11px] leading-relaxed text-yellow-100/60 scrollbar-hide"
              >
                <AnimatePresence initial={false}>
                  {logs.map((log, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="mb-2"
                    >
                      <span className="text-yellow-500/40 mr-2">{new Date().toISOString().split('T')[1].slice(0, 8)}</span>
                      {log.includes('debug') ? <span className="text-white/30">{log}</span> : <span className="text-yellow-100">{log}</span>}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              
              {/* Overlay fade at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      <style>{`
        @keyframes shine { 100% { transform: translateX(150%) skewX(12deg); } }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
