import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, FileText, Download, CheckCircle2, AlertCircle, 
  Loader2, Globe2, ArrowRight, RefreshCw, Sparkles, Octagon, Copy, Check
} from 'lucide-react';
import { parseSrt, stringifySrt, chunkEntries } from './services/srtService';
import { translateBatch } from './services/geminiService';
import { SrtEntry, TranslationState, LANGUAGES } from './types';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalEntries, setOriginalEntries] = useState<SrtEntry[]>([]);
  const [translatedEntries, setTranslatedEntries] = useState<SrtEntry[]>([]);
  const [targetLang, setTargetLang] = useState<string>(LANGUAGES[0].name);
  const [apiKey, setApiKey] = useState<string>(localStorage.getItem('gemini_api_key') || '');
  const [isCopied, setIsCopied] = useState(false);
  
  const isStopping = useRef(false);

  const [status, setStatus] = useState<TranslationState>({
    isTranslating: false, progress: 0, totalBatches: 0, currentBatch: 0, error: null, completed: false
  });

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setTranslatedEntries([]);
      setStatus(prev => ({ ...prev, completed: false, error: null, progress: 0 }));
      const reader = new FileReader();
      reader.onload = (event) => {
        const entries = parseSrt(event.target?.result as string);
        setOriginalEntries(entries);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleCopy = async () => {
    if (translatedEntries.length === 0) return;
    const content = stringifySrt(translatedEntries);
    try {
      await navigator.clipboard.writeText(content);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin teks", err);
    }
  };

  const stopTranslation = () => {
    isStopping.current = true;
    setStatus(prev => ({ ...prev, isTranslating: false, error: "Proses dihentikan oleh pengguna." }));
  };

  const startTranslation = async () => {
    if (originalEntries.length === 0 || !apiKey) {
      alert("Input API Key dan Upload File terlebih dahulu!");
      return;
    }

    isStopping.current = false;
    setStatus({ isTranslating: true, progress: 0, totalBatches: 0, currentBatch: 0, error: null, completed: false });

    const batches = chunkEntries(originalEntries, 15);
    const totalBatches = batches.length;
    setStatus(prev => ({ ...prev, totalBatches }));

    const results: SrtEntry[] = [];

    try {
      for (let i = 0; i < batches.length; i++) {
        if (isStopping.current) break;

        setStatus(prev => ({ 
          ...prev, 
          currentBatch: i + 1, 
          progress: Math.round((i / totalBatches) * 100),
          error: null 
        }));

        let success = false;
        let attempt = 0;

        while (!success && !isStopping.current) {
          try {
            const translatedTexts = await translateBatch(batches[i], targetLang, apiKey);
            const translatedBatch = batches[i].map((entry, idx) => ({
              ...entry,
              text: translatedTexts[idx] || entry.text
            }));
            
            results.push(...translatedBatch);
            setTranslatedEntries([...results]); 
            success = true; 
          } catch (batchErr) {
            attempt++;
            setStatus(prev => ({ 
              ...prev, 
              error: `Batch ${i + 1} sibuk. Mencoba ulang (ke-${attempt}) dalam 15 detik...` 
            }));
            await new Promise(resolve => setTimeout(resolve, 15000)); 
            if (isStopping.current) break;
          }
        }
      }

      setStatus(prev => ({ 
        ...prev, 
        isTranslating: false, 
        progress: isStopping.current ? prev.progress : 100, 
        completed: true,
        error: isStopping.current ? "Dihentikan. Hasil siap disalin/unduh." : null 
      }));
    } catch (err: any) {
      setStatus(prev => ({ ...prev, isTranslating: false, error: "Terjadi kesalahan fatal." }));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 bg-[#f8fafc]">
      <div className="max-w-4xl w-full text-center mb-12">
        <div className="relative inline-flex items-center justify-center p-4 bg-indigo-600 rounded-3xl mb-6 shadow-xl">
          <Globe2 className="w-10 h-10 text-white" />
          <Sparkles className="w-5 h-5 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 mb-2">Gemini SRT Translator</h1>
        <p className="text-slate-500 font-medium">Model: Gemini 3 Flash Preview</p>
      </div>

      <div className="max-w-2xl w-full space-y-8">
        <div className="bg-white p-8 rounded-[2rem] shadow-2xl border border-slate-100">
          <div className="space-y-6">
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Masukkan Gemini API Key..." className="w-full px-5 py-4 border-slate-200 rounded-2xl bg-slate-50 outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
            <select value={targetLang} onChange={(e) => setTargetLang(e.target.value)} className="w-full px-5 py-4 border-slate-200 rounded-2xl bg-slate-50 outline-none">
              {LANGUAGES.map((lang) => (<option key={lang.code} value={lang.name}>{lang.name}</option>))}
            </select>
            <div className="relative border-2 border-dashed rounded-2xl p-10 text-center border-slate-200 hover:border-indigo-400 transition-colors">
              <input type="file" accept=".srt" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <FileText className="w-12 h-12 text-indigo-500 mx-auto mb-2" />
              <p className="font-bold text-slate-700">{file ? file.name : "Klik untuk upload file .srt"}</p>
            </div>
            
            <div className="flex gap-3">
              {!status.isTranslating ? (
                <button onClick={startTranslation} disabled={!file} className="flex-1 py-4 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 shadow-lg transition-all">
                  Mulai Terjemahkan
                </button>
              ) : (
                <button onClick={stopTranslation} className="flex-1 py-4 rounded-2xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-lg flex items-center justify-center gap-2 transition-all">
                  <Octagon className="w-5 h-5" /> Hentikan Proses
                </button>
              )}
              {file && !status.isTranslating && <button onClick={() => { setFile(null); setTranslatedEntries([]); }} className="px-6 py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all"><RefreshCw className="w-5 h-5 text-slate-600" /></button>}
            </div>
          </div>
        </div>

        {(status.isTranslating || translatedEntries.length > 0) && (
          <div className="bg-white p-6 rounded-[2rem] shadow-2xl border border-slate-100">
             {status.error && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl text-sm font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {status.error}
              </div>
            )}
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between items-end px-1">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Translation Progress</span>
                  <span className="text-sm font-bold text-slate-700">
                    Batch {status.currentBatch} <span className="text-slate-300 mx-1">/</span> {status.totalBatches}
                  </span>
                </div>
                <div className="text-3xl font-black text-indigo-600 tabular-nums">
                  {status.progress}<span className="text-sm ml-0.5">%</span>
                </div>
              </div>

            <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
              <div 
                className="bg-indigo-600 h-full transition-all duration-500 ease-out shadow-[0_0_15px_rgba(79,70,229,0.4)]" 
                style={{ width: `${status.progress}%` }} 
              />
            </div>
          </div>
            
            {translatedEntries.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button onClick={() => {
                  const content = stringifySrt(translatedEntries);
                  const blob = new Blob([content], { type: 'text/plain' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = `translated_${file?.name || 'subtitles.srt'}`;
                  a.click();
                }} className="flex-1 py-4 rounded-2xl bg-emerald-600 text-white font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all">
                  <Download className="w-5 h-5" /> Download (.srt)
                </button>

                <button onClick={handleCopy} className={`flex-1 py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${isCopied ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-900'}`}>
                  {isCopied ? <><Check className="w-5 h-5" /> Copied!</> : <><Copy className="w-5 h-5" /> Copy Text</>}
                </button>
              </div>
            )}

            <div className="max-h-80 overflow-y-auto border rounded-xl bg-slate-50/50">
              <table className="w-full text-sm">
                <thead className="bg-white sticky top-0 shadow-sm">
                  <tr><th className="p-3 text-left text-slate-500">Original</th><th className="p-3 text-left font-bold text-indigo-600">Translated</th></tr>
                </thead>
                <tbody>
                  {translatedEntries.map((entry, i) => (
                    <tr key={i} className="border-t hover:bg-white transition-colors">
                      <td className="p-3 text-slate-400 leading-relaxed">{originalEntries[i]?.text}</td>
                      <td className="p-3 text-slate-800 font-medium leading-relaxed">{entry.text}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      <footer className="mt-12 text-slate-400 text-xs font-bold uppercase tracking-widest">
        © 2026 Gemini SRT Engine • Optimized for Batch Processing
      </footer>
    </div>
  );
};

export default App;