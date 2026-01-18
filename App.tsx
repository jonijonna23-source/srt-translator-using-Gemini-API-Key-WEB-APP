import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Download, 
  Settings, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Globe2, // Logo baru yang lebih menarik
  ArrowRight,
  RefreshCw,
  Edit3,
  Sparkles // Logo tambahan untuk kesan AI
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

  const [status, setStatus] = useState<TranslationState>({
    isTranslating: false,
    progress: 0,
    totalBatches: 0,
    currentBatch: 0,
    error: null,
    completed: false
  });

  useEffect(() => {
    localStorage.setItem('gemini_api_key', apiKey);
  }, [apiKey]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.srt')) {
        alert("Please upload a valid .srt file.");
        return;
      }
      setFile(selectedFile);
      setTranslatedEntries([]);
      setStatus(prev => ({ ...prev, completed: false, error: null, progress: 0 }));
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        const entries = parseSrt(content);
        setOriginalEntries(entries);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleClear = () => {
    setFile(null);
    setOriginalEntries([]);
    setTranslatedEntries([]);
    setStatus({
      isTranslating: false,
      progress: 0,
      totalBatches: 0,
      currentBatch: 0,
      error: null,
      completed: false
    });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const handleManualEdit = (index: number, newText: string) => {
    const updated = [...translatedEntries];
    updated[index] = { ...updated[index], text: newText };
    setTranslatedEntries(updated);
  };

  const startTranslation = async () => {
    if (originalEntries.length === 0) return;
    if (!apiKey) {
      alert("Please enter your Gemini API Key in the configuration box!");
      return;
    }

    setStatus({
      isTranslating: true,
      progress: 0,
      totalBatches: 0,
      currentBatch: 0,
      error: null,
      completed: false
    });

    const batches = chunkEntries(originalEntries, 10);
    const totalBatches = batches.length;
    setStatus(prev => ({ ...prev, totalBatches }));

    const results: SrtEntry[] = [];

    try {
      for (let i = 0; i < batches.length; i++) {
        setStatus(prev => ({ 
          ...prev, 
          currentBatch: i + 1, 
          progress: Math.round(((i) / totalBatches) * 100) 
        }));

        const batch = batches[i];
        const translatedTexts = await translateBatch(batch, targetLang, apiKey);

        const translatedBatch: SrtEntry[] = batch.map((entry, idx) => ({
          ...entry,
          text: translatedTexts[idx] || entry.text
        }));

        results.push(...translatedBatch);
      }

      setTranslatedEntries(results);
      setStatus(prev => ({ 
        ...prev, 
        isTranslating: false, 
        progress: 100, 
        completed: true 
      }));
    } catch (err: any) {
      setStatus(prev => ({ 
        ...prev, 
        isTranslating: false, 
        error: err.message || "An error occurred during translation."
      }));
    }
  };

  const downloadFile = () => {
    if (translatedEntries.length === 0) return;
    const content = stringifySrt(translatedEntries);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `translated_${file?.name || 'subtitles.srt'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 bg-[#f8fafc]">
      {/* 3. Logo & Header */}
      <div className="max-w-4xl w-full text-center mb-12">
        <div className="relative inline-flex items-center justify-center p-4 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-3xl mb-6 shadow-xl shadow-indigo-200/50">
          <Globe2 className="w-10 h-10 text-white" />
          <Sparkles className="w-5 h-5 text-yellow-300 absolute -top-1 -right-1 animate-pulse" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
          Gemini SRT Translator
        </h1>
        <p className="text-lg text-slate-500 font-medium">Elevate your subtitles with AI-powered natural translation.</p>
      </div>

      <div className="max-w-2xl w-full space-y-8">
        <div className="bg-white p-8 rounded-[2rem] shadow-2xl shadow-slate-200/60 border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center font-bold text-indigo-600">1</div>
            <h2 className="text-xl font-bold text-slate-800">Configuration</h2>
          </div>

          <div className="space-y-6">
            {/* API KEY INPUT */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 ml-1">Gemini API Key</label>
              <input 
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your API Key here..."
                className="w-full px-5 py-4 border-slate-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 rounded-2xl bg-slate-50/50 text-sm transition-all outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700 ml-1">Target Language</label>
              <div className="relative">
                <select 
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="block w-full px-5 py-4 border-slate-200 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-500 rounded-2xl bg-slate-50/50 appearance-none outline-none transition-all"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.name}>{lang.name}</option>
                  ))}
                </select>
                <Settings className="w-5 h-5 absolute right-4 top-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 ${file ? 'border-indigo-300 bg-indigo-50/20' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}`}>
              <input type="file" accept=".srt" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={status.isTranslating} />
              <div className="flex flex-col items-center">
                {file ? (
                  <>
                    <FileText className="w-14 h-14 text-indigo-500 mb-3" />
                    <p className="text-sm font-bold text-slate-900 truncate max-w-[250px]">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">{originalEntries.length} Lines detected</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-14 h-14 text-slate-300 mb-3" />
                    <p className="text-sm font-bold text-slate-700">Drop your .srt file here</p>
                    <p className="text-xs text-slate-400 mt-1">Maximum precision translation</p>
                  </>
                )}
              </div>
            </div>

            {/* 2. Tombol Start & Change File Berdampingan */}
            <div className="flex gap-3">
              <button
                onClick={startTranslation}
                disabled={!file || status.isTranslating || originalEntries.length === 0}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-white transition-all active:scale-[0.98] ${!file || status.isTranslating ? 'bg-slate-200 text-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100'}`}
              >
                {status.isTranslating ? <><Loader2 className="w-5 h-5 animate-spin" /> {status.progress}%</> : <><ArrowRight className="w-5 h-5" /> Start Translation</>}
              </button>

              {file && !status.isTranslating && (
                <button
                  onClick={handleClear}
                  className="px-6 py-4 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" /> Change File
                </button>
              )}
            </div>
          </div>
        </div>

        {/* STEP 2: RESULTS */}
        {(status.isTranslating || status.completed || status.error) && (
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl shadow-slate-200/60 border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-slate-600">2</div>
              <h2 className="text-xl font-bold text-slate-800">Translation Results</h2>
            </div>

            <div className="space-y-6">
              {status.isTranslating && (
                <div className="space-y-4">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-slate-500">Processing Batches...</span>
                    <span className="text-indigo-600">{status.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden p-1">
                    <div className="bg-indigo-600 h-full rounded-full transition-all duration-500 shadow-sm" style={{ width: `${status.progress}%` }} />
                  </div>
                </div>
              )}

              {status.completed && (
                <div className="space-y-8">
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-[1.5rem] p-8 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-emerald-900 font-black text-xl mb-1">Success!</h3>
                    <p className="text-emerald-700 text-sm font-medium mb-6">Translation complete. Review the lines below before downloading.</p>
                    
                    <button onClick={downloadFile} className="w-full sm:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-4 px-10 rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-[0.95]">
                      <Download className="w-5 h-5" /> Download .srt File
                    </button>
                  </div>

                  <div className="border border-slate-100 rounded-[1.5rem] overflow-hidden shadow-inner bg-slate-50 max-h-[600px] overflow-y-auto">
                    <table className="w-full text-left text-sm border-collapse">
                      <thead className="bg-white border-b sticky top-0 z-10">
                        <tr>
                          <th className="p-4 font-bold text-slate-400 uppercase tracking-wider text-[10px] w-1/2">Original</th>
                          <th className="p-4 font-bold text-indigo-600 uppercase tracking-wider text-[10px] w-1/2 flex items-center gap-2">
                            <Edit3 className="w-3 h-3" /> Translated (Editable)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {translatedEntries.map((entry, i) => (
                          <tr key={i} className="border-b border-slate-50 hover:bg-white transition-colors">
                            <td className="p-4 text-slate-500 leading-relaxed">{originalEntries[i]?.text}</td>
                            <td className="p-3">
                              <textarea 
                                className="w-full p-3 bg-white border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none text-slate-700 transition-all resize-none font-medium leading-relaxed"
                                value={entry.text}
                                onChange={(e) => handleManualEdit(i, e.target.value)}
                                rows={2}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {status.error && (
                <div className="bg-rose-50 border border-rose-100 rounded-[1.5rem] p-8 flex flex-col items-center gap-4 text-center">
                  <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-rose-600" />
                  </div>
                  <p className="text-rose-800 font-bold">{status.error}</p>
                  <button onClick={startTranslation} className="text-rose-600 font-bold hover:text-rose-700 underline underline-offset-4 transition-all">Retry Translation</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <footer className="mt-16 text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em] text-center">
        © 2026 Gemini Subtitle Engine • 1.5 Flash
      </footer>
    </div>
  );
};

export default App;