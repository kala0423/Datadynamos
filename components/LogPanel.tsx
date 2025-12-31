
import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
}

const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-[#020617] rounded-2xl p-4 font-mono text-[11px] h-60 overflow-y-auto shadow-inner border border-white/5 scrollbar-thin">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/5 text-blue-500/80 font-black tracking-widest uppercase">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        System_Console.sh
      </div>
      <div className="space-y-1.5">
        {logs.length === 0 && <div className="text-slate-600 italic">Waiting for connection...</div>}
        {logs.map((log, index) => (
          <div key={index} className="flex gap-3 leading-tight animate-in slide-in-from-left-2 duration-200">
            <span className="text-slate-700 shrink-0 font-bold">[{log.timestamp}]</span>
            <span className={`
              ${log.type === 'info' ? 'text-slate-400' : ''}
              ${log.type === 'success' ? 'text-emerald-400 font-bold' : ''}
              ${log.type === 'warning' ? 'text-orange-400 font-bold' : ''}
              ${log.type === 'error' ? 'text-red-500 font-black uppercase tracking-tighter' : ''}
            `}>
              {log.type === 'error' ? '>> ERR: ' : ''}{log.message}
            </span>
          </div>
        ))}
      </div>
      <div ref={logEndRef} />
    </div>
  );
};

export default LogPanel;
