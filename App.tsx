
import React, { useState, useMemo } from 'react';
import { NoteFormat, AppState, ProcessingResult } from './types';
import { processAudioToNotes } from './services/gemini';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    view: 'upload',
    isProcessing: false,
    result: null,
    error: null,
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [format, setFormat] = useState<NoteFormat>(NoteFormat.BULLET);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/m4a'];
      if (validTypes.includes(file.type) || file.name.match(/\.(mp3|wav|m4a)$/i)) {
        setSelectedFile(file);
        setState(prev => ({ ...prev, error: null }));
      } else {
        setSelectedFile(null);
        setState(prev => ({ ...prev, error: "Supported formats are .mp3, .wav, or .m4a" }));
      }
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result?.toString().split(',')[1];
        if (base64String) resolve(base64String);
        else reject(new Error("Audio processing failure"));
      };
      reader.onerror = () => reject(new Error("File read error"));
    });
  };

  const handleGenerate = async () => {
    if (!selectedFile) return;
    setState(prev => ({ ...prev, isProcessing: true, error: null }));
    try {
      const base64 = await fileToBase64(selectedFile);
      const res = await processAudioToNotes(base64, selectedFile.type || 'audio/mpeg', format);
      setState({ view: 'result', isProcessing: false, result: res, error: null });
    } catch (err: any) {
      setState(prev => ({ ...prev, isProcessing: false, error: err.message || "Failed to analyze audio." }));
    }
  };

  const handleBack = () => {
    setState({ view: 'upload', isProcessing: false, result: null, error: null });
    setSelectedFile(null);
  };

  const processedNotes = useMemo(() => {
    if (!state.result?.notes) return [];
    return state.result.notes.split('\n').filter(line => line.trim() !== '');
  }, [state.result?.notes]);

  return (
    <div className="min-h-screen w-full flex flex-col items-center">
      {/* Dynamic Header */}
      <header className="w-full max-w-6xl pt-16 pb-12 px-8 flex flex-col items-center text-center animate-reveal">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)]">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </div>
          <span className="text-sm font-black tracking-[0.2em] text-gray-500 uppercase">Acoustic Logic</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter leading-none">
          Lecture <span className="text-red-600">Voice-to-Notes</span>
        </h1>
        <p className="text-xl md:text-2xl text-gray-400 font-light max-w-2xl leading-relaxed">
          Transform academic recordings into structured intelligence with clinical precision.
        </p>
      </header>

      <main className="w-full max-w-6xl px-8 pb-24">
        {state.view === 'upload' ? (
          <div className="grid grid-cols-1 gap-8 animate-reveal" style={{ animationDelay: '0.2s' }}>
            <div className="glass-card rounded-[40px] p-10 md:p-16 flex flex-col gap-12">
              
              {/* Step 1: File Selection */}
              <section className="flex flex-col gap-6">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-3xl font-extrabold tracking-tight">01. Upload Recording</h2>
                  <span className="text-xs font-mono text-gray-600">LIMIT: 20MB</span>
                </div>
                
                <div 
                  className={`relative h-64 border-2 border-dashed rounded-[32px] transition-all duration-500 flex flex-col items-center justify-center group overflow-hidden ${
                    selectedFile ? 'border-red-600 bg-red-600/5' : 'border-white/10 bg-black/40 hover:border-red-600/40'
                  }`}
                >
                  <input
                    type="file"
                    accept=".mp3,.wav,.m4a"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    disabled={state.isProcessing}
                  />
                  
                  <div className={`mb-4 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                    selectedFile ? 'bg-red-600 text-white' : 'bg-white/5 text-gray-500 group-hover:text-red-500'
                  }`}>
                    {selectedFile ? (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                    )}
                  </div>
                  
                  <div className="text-center">
                    <p className={`text-xl font-bold mb-1 ${selectedFile ? 'text-white' : 'text-gray-300'}`}>
                      {selectedFile ? selectedFile.name : "Choose audio file"}
                    </p>
                    <p className="text-sm text-gray-500 uppercase tracking-widest font-medium">
                      {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : "MP3, WAV, or M4A supported"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Step 2: Format Choice */}
              <section className="flex flex-col gap-8">
                <h2 className="text-3xl font-extrabold tracking-tight">02. Structure Output</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[NoteFormat.BULLET, NoteFormat.PARAGRAPH].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      className={`relative p-8 rounded-[32px] border-2 text-left transition-all duration-300 glow-on-hover flex flex-col gap-3 ${
                        format === fmt ? 'border-red-600 bg-red-600/10' : 'border-white/5 bg-black/40'
                      }`}
                      disabled={state.isProcessing}
                    >
                      <div className="flex justify-between items-center">
                        <span className={`text-2xl font-bold ${format === fmt ? 'text-white' : 'text-gray-400'}`}>{fmt}</span>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${format === fmt ? 'border-red-600' : 'border-gray-700'}`}>
                          {format === fmt && <div className="w-3 h-3 rounded-full bg-red-600" />}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 leading-relaxed max-w-[200px]">
                        {fmt === NoteFormat.BULLET ? 'Condensed summaries optimized for rapid visual scanning.' : 'Context-rich prose for comprehensive understanding.'}
                      </p>
                    </button>
                  ))}
                </div>
              </section>

              {/* Step 3: Action */}
              <div className="pt-6">
                {state.error && (
                  <div className="mb-8 p-6 bg-red-600/10 border border-red-600/30 text-red-500 rounded-2xl flex items-center gap-4 text-lg">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                    {state.error}
                  </div>
                )}

                <button
                  onClick={handleGenerate}
                  disabled={!selectedFile || state.isProcessing}
                  className={`w-full py-8 rounded-[32px] text-2xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all duration-500 flex items-center justify-center gap-4 overflow-hidden relative ${
                    !selectedFile || state.isProcessing 
                    ? 'bg-gray-900 text-gray-600 cursor-not-allowed opacity-50' 
                    : 'bg-red-600 text-white hover:bg-red-700 hover:scale-[1.01] active:scale-[0.99] shadow-red-900/40'
                  }`}
                >
                  {state.isProcessing ? (
                    <>
                      <div className="w-6 h-6 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Processing Audio...
                    </>
                  ) : (
                    "Initialize Generation"
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-10 items-start animate-reveal">
            
            {/* Sidebar Controls */}
            <aside className="lg:col-span-3 w-full flex flex-col gap-6 sticky top-8">
              <button
                onClick={handleBack}
                className="w-full py-6 px-8 glass-card hover:bg-white/5 rounded-[28px] text-white font-bold flex items-center gap-3 transition-all border border-white/10 text-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                New Analysis
              </button>

              <div className="glass-card rounded-[28px] p-8 border border-white/10 flex flex-col gap-8">
                <div>
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Model Details</h4>
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Mode</span>
                      <span className="text-red-500 font-bold text-xs bg-red-600/10 px-2 py-1 rounded uppercase tracking-tighter">{state.result?.format}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-sm">Engine</span>
                      <span className="text-white font-bold text-xs uppercase tracking-widest">Gemini 3</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <button 
                    onClick={() => window.print()}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border border-white/5"
                  >
                    Print Intelligence
                  </button>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="lg:col-span-9 w-full flex flex-col gap-10">
              
              {/* Primary Output: Notes */}
              <section className="glass-card rounded-[40px] p-10 md:p-14 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[80px] rounded-full -z-10"></div>
                <div className="flex items-center gap-4 mb-12">
                  <div className="w-12 h-12 bg-red-600/10 rounded-2xl flex items-center justify-center text-red-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <h3 className="text-4xl font-black tracking-tight">Structured Notes</h3>
                </div>

                <div className="space-y-6 text-xl leading-[1.8] text-gray-200 font-normal">
                  {processedNotes.map((line, i) => {
                    const isHeader = line.startsWith('###') || line.startsWith('**');
                    return (
                      <div 
                        key={i} 
                        className={`${isHeader ? 'text-white font-black text-3xl mt-10 mb-6' : 'pl-2 border-l-2 border-transparent hover:border-red-600/20 transition-all'}`}
                      >
                        {line.replace(/###\s?|\*\*/g, '')}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Secondary Output: Raw Transcription */}
              <section className="glass-card rounded-[40px] p-10 md:p-14 bg-black/30">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-500">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight text-gray-300">Raw Signal Transcription</h3>
                </div>
                
                <div className="text-lg leading-relaxed text-gray-500 font-light italic whitespace-pre-wrap max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
                  {state.result?.transcription}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      <footer className="w-full max-w-6xl px-8 pt-12 pb-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-gray-700">
        <div className="flex flex-col gap-2 text-center md:text-left">
          <p className="text-sm font-black uppercase tracking-widest">Acoustic Logic Node v4.0</p>
          <p className="text-xs font-mono">ENCRYPTED LECTURE ANALYTICS PIPELINE</p>
        </div>
        <div className="text-[10px] font-mono tracking-widest opacity-30">
          DESIGNED FOR SUPREME ACADEMIC PERFORMANCE
        </div>
      </footer>
    </div>
  );
};

export default App;
