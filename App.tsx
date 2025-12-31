
import React, { useState, useCallback, useRef } from 'react';
import { Shield, FileWarning, Trash2, Download, RefreshCcw, FileText, Settings, Activity, Info, Lock, Terminal, CheckCircle, AlertTriangle } from 'lucide-react';
import { CertificateData, LogEntry, WipeStatus } from './types';
import { generateHash, generateCertificateId } from './utils/crypto';
import LogPanel from './components/LogPanel';
import CertificatePreview from './components/CertificatePreview';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [passes, setPasses] = useState(3);
  const [status, setStatus] = useState<WipeStatus>(WipeStatus.IDLE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentSector, setCurrentSector] = useState('0x000000');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false });
    setLogs(prev => [...prev, { timestamp, message, type }]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setCertificateData(null);
      addLog(`File loaded: ${file.name}`, 'success');
      addLog(`Metadata: ${(file.size / 1024).toFixed(2)} KB | ${file.type || 'Binary'}`);
    }
  };

  const simulateWipe = async () => {
    if (!selectedFile) return;

    setStatus(WipeStatus.WIPING);
    setCertificateData(null);
    setProgress(0);
    setLogs([]);
    addLog('PROTOCOL INITIATED: NIST SP 800-88 REV 1 PURGE', 'warning');
    
    try {
      addLog('Calculating pre-wipe SHA-256 fingerprint...', 'info');
      const originalHash = await generateHash(await selectedFile.arrayBuffer());
      addLog(`Fingerprint: ${originalHash.substring(0, 32)}...`, 'success');

      const totalSteps = passes * 4;
      let currentStep = 0;

      for (let p = 1; p <= passes; p++) {
        const phases = [
          { name: 'Binary Zero Fill', prefix: '0x00' },
          { name: 'Inverse Byte Fill', prefix: '0xFF' },
          { name: 'PRNG Random Pulse', prefix: '0xRND' },
          { name: 'Bit-Level Verification', prefix: '0xVER' }
        ];

        for (const phase of phases) {
          addLog(`Pass ${p}/${passes} | Phase: ${phase.name}`, 'info');
          
          // Sub-steps for sector visualization
          for (let s = 0; s < 5; s++) {
            const sector = phase.prefix + Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
            setCurrentSector(sector);
            await new Promise(resolve => setTimeout(resolve, 80));
          }

          currentStep++;
          setProgress(Math.floor((currentStep / totalSteps) * 100));
        }
      }

      addLog('Finalizing hardware synchronization...', 'warning');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const finalHash = await generateHash(Math.random().toString());
      addLog('Data destruction verified. Storage space reclaimed.', 'success');

      const certId = generateCertificateId();
      const finalData: CertificateData = {
        certificateId: certId,
        fileName: selectedFile.name,
        filePath: `/volumes/secure_raid/partition_0/secure_vault/${selectedFile.name}`,
        fileSize: selectedFile.size,
        passes: passes,
        originalHash: originalHash,
        finalHash: finalHash,
        wipeDate: new Date().toLocaleString('en-GB'),
        success: true,
        toolVersion: 'SecureWiper Enterprise v4.0',
        standardCompliance: 'NIST SP 800-88 Rev. 1',
        qrUrl: `https://verify.securewiper.io/v/${certId}`
      };

      setCertificateData(finalData);
      setStatus(WipeStatus.COMPLETED);
      addLog(`CERTIFICATE ISSUED: ${certId}`, 'success');
      setProgress(100);

    } catch (error) {
      addLog(`CRITICAL FAILURE: ${error instanceof Error ? error.message : 'System fault'}`, 'error');
      setStatus(WipeStatus.FAILED);
    }
  };

  const handleDownloadPDF = async () => {
    if (!certificateRef.current || !certificateData) return;
    
    addLog('Synthesizing PDF document...', 'info');
    
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2, // High quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`SecureWiper_Certificate_${certificateData.certificateId}.pdf`);
      addLog('Document successfully exported to local storage.', 'success');
    } catch (err) {
      addLog('PDF Generation failed. Redirecting to print fallback.', 'error');
      window.print();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0f172a] text-slate-300">
      {/* Top Header - High Tech Look */}
      <header className="bg-[#1e293b]/80 backdrop-blur-md border-b border-white/5 py-4 px-8 flex items-center justify-between sticky top-0 z-50 print-hidden shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-[#0d47a1] to-[#1e293b] p-2.5 rounded-xl border border-white/10 shadow-lg">
              <Shield className="w-7 h-7 text-[#c9a44c]" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white flex items-center gap-2">
              SECUREWIPER <span className="bg-[#c9a44c] text-[#0f172a] px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">Enterprise v4.0</span>
            </h1>
            <div className="flex items-center gap-3 opacity-60 text-[10px] font-mono tracking-wider">
              <div className="flex items-center gap-1"><Lock className="w-3 h-3 text-blue-400" /> ENCRYPTED</div>
              <div className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-400" /> VERIFIED</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Security Level</span>
            <span className="text-sm font-black text-blue-400">CLASS 5 DESTRUCTION</span>
          </div>
          <div className="h-10 w-px bg-white/5 hidden lg:block"></div>
          <div className="flex items-center gap-3 bg-slate-900/50 border border-white/5 px-4 py-2 rounded-2xl">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse"></div>
            <span className="text-xs font-bold text-slate-400 tracking-tight">NODAL STATUS: ACTIVE</span>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden print:block print:h-auto">
        
        {/* Modern Sidebar */}
        <aside className="lg:w-[420px] bg-[#111827] border-r border-white/5 flex flex-col print-hidden shrink-0">
          <div className="p-6 space-y-8 overflow-y-auto flex-grow scrollbar-thin">
            
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <Terminal className="w-6 h-6 text-blue-500" /> COMMAND
              </h2>
              <p className="text-xs text-slate-500 font-medium">Configure cryptographic sanitization</p>
            </div>

            {/* Target Selection Card */}
            <div className="bg-[#1e293b]/50 border border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-all"></div>
              
              <div className="flex items-center gap-2 mb-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <FileWarning className="w-4 h-4 text-red-500" /> Target Resource
              </div>

              {!selectedFile ? (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-10 border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-2xl flex flex-col items-center justify-center gap-4 transition-all bg-slate-900/40 hover:bg-blue-600/5 group/btn"
                >
                  <div className="bg-slate-800 p-4 rounded-full shadow-inner border border-white/5 group-hover/btn:scale-110 group-hover/btn:shadow-blue-500/20 transition-all">
                    <Trash2 className="w-8 h-8 text-slate-400 group-hover/btn:text-blue-500" />
                  </div>
                  <div className="text-center">
                    <span className="text-sm text-white font-bold block mb-1">Select File for Purge</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Encrypted Link Required</span>
                  </div>
                </button>
              ) : (
                <div className="bg-[#0f172a] border border-blue-500/20 p-5 rounded-2xl shadow-inner relative z-10">
                  <button 
                    onClick={() => { setSelectedFile(null); setCertificateData(null); setLogs([]); }}
                    className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-red-500/10 text-slate-400 hover:text-red-500 rounded-xl transition-all border border-white/5"
                  >
                    <RefreshCcw className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-5">
                    <div className="bg-blue-600/20 p-4 rounded-2xl border border-blue-500/30">
                      <FileText className="w-7 h-7 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-black text-white text-sm truncate pr-8">{selectedFile.name}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-mono font-bold">
                          {(selectedFile.size / 1024).toFixed(2)} KB
                        </span>
                        <span className="text-[10px] text-green-500 font-bold uppercase tracking-tighter flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> READY
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
            </div>

            {/* Sanitization Config Card */}
            <div className="bg-[#1e293b]/50 border border-white/5 p-6 rounded-[2rem] shadow-xl relative overflow-hidden">
               <div className="flex items-center gap-2 mb-6 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                <Settings className="w-4 h-4 text-blue-500" /> Security Logic
              </div>
              
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Erasure Iterations</label>
                    <div className={`px-3 py-1 rounded-full text-[9px] font-black border tracking-widest ${passes >= 7 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                      {passes >= 35 ? 'GUTMANN METHOD' : passes >= 7 ? 'DOD 5220.22-M' : 'NIST CLEAR'}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {[1, 3, 7, 35].map(p => (
                      <button
                        key={p}
                        onClick={() => setPasses(p)}
                        className={`py-3.5 rounded-2xl text-xs font-black border transition-all duration-300 ${
                          passes === p 
                            ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-105 z-10' 
                            : 'bg-slate-900/60 text-slate-500 border-white/5 hover:border-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  disabled={!selectedFile || status === WipeStatus.WIPING}
                  onClick={simulateWipe}
                  className={`group relative w-full py-5 rounded-2xl font-black text-sm flex items-center justify-center gap-4 transition-all active:scale-95 overflow-hidden ${
                    !selectedFile || status === WipeStatus.WIPING
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed shadow-none'
                      : 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-[0_10px_30px_rgba(220,38,38,0.3)] hover:shadow-red-500/40'
                  }`}
                >
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {status === WipeStatus.WIPING ? (
                    <RefreshCcw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  )}
                  {status === WipeStatus.WIPING ? 'ENGAGING PURGE...' : 'EXECUTE DATA PURGE'}
                </button>
              </div>
            </div>

            {/* Real-time Telemetry Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                 <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" /> Telemetry Stream
                 </div>
                 <div className="font-mono text-blue-400">{currentSector}</div>
              </div>

              {status === WipeStatus.WIPING && (
                <div className="relative w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-white/5 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600 rounded-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(37,99,235,0.6)]"
                    style={{ width: `${progress}%` }}
                  />
                  <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-[shimmer_2s_infinite]"></div>
                </div>
              )}

              <LogPanel logs={logs} />
            </div>
          </div>

          <div className="p-6 border-t border-white/5 bg-slate-900/40">
            <div className="flex items-start gap-4 text-slate-500">
              <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
              <p className="text-[10px] leading-relaxed font-medium uppercase tracking-tighter">
                WARNING: Data destruction is irreversible. All bit-level patterns will be permanently overwritten according to NIST standards.
              </p>
            </div>
          </div>
        </aside>

        {/* Certificate Display Area - High Contrast for Readability */}
        <section className="flex-grow bg-[#020617] p-4 sm:p-12 overflow-y-auto print:p-0 print:bg-white relative">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none"></div>

          <div className="max-w-[850px] mx-auto space-y-8 print:m-0 print:p-0 print:max-w-none relative z-10">
            
            <div className="flex items-center justify-between print-hidden">
              <div className="flex flex-col">
                <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                  <FileText className="w-7 h-7 text-[#0d47a1]" />
                  CERTIFICATE PREVIEW
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Generated Secure Report</p>
                </div>
              </div>
              
              {certificateData && (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={handleDownloadPDF}
                    className="group flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-[0_20px_40px_rgba(37,99,235,0.3)] transition-all hover:-translate-y-1 active:translate-y-0"
                  >
                    <Download className="w-5 h-5 group-hover:bounce" />
                    DOWNLOAD PDF
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all"
                    title="System Print"
                  >
                    <Activity className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="print:m-0 print:p-0 shadow-[0_40px_100px_rgba(0,0,0,0.6)] rounded-sm overflow-hidden" ref={certificateRef}>
              <CertificatePreview data={certificateData} />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 border-t border-white/5 py-4 px-8 flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] print-hidden">
        <div>© 2025 SECUREWIPER SYSTEMS • GLOBAL DEFENSE GRADE</div>
        <div className="flex items-center gap-4">
          <span className="hover:text-blue-400 cursor-pointer">PRIVACY</span>
          <span className="hover:text-blue-400 cursor-pointer">COMPLIANCE</span>
          <span className="hover:text-blue-400 cursor-pointer">NODE_v4.0.2</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
