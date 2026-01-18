
import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  Download, 
  Settings, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  Globe,
  ArrowRight
} from 'lucide-react';
import { parseSrt, stringifySrt, chunkEntries } from './services/srtService';
import { translateBatch } from './services/geminiService';
import { SrtEntry, TranslationState, LANGUAGES, Language } from './types';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [originalEntries, setOriginalEntries] = useState<SrtEntry[]>([]);
  const [translatedEntries, setTranslatedEntries] = useState<SrtEntry[]>([]);
  const [targetLang, setTargetLang] = useState<string>(LANGUAGES[0].name);
  const [status, setStatus] = useState<TranslationState>({
    isTranslating: false,
    progress: 0,
    totalBatches: 0,
    currentBatch: 0,
    error: null,
    completed: false
  });

  const abortControllerRef = useRef<AbortController | null>(null);

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

  const startTranslation = async () => {
    if (originalEntries.length === 0) return;

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
        const translatedTexts = await translateBatch(batch, targetLang);

        const translatedBatch: SrtEntry[] = batch.map((entry, idx) => ({
          ...entry,
          text: translatedTexts[idx] || entry.text // Fallback to original if missing
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
        error: err.message || "An unexpected error occurred during translation."
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
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-4xl w-full text-center mb-12">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-4">
          <Globe className="w-8 h-8 text-indigo-600" />
        </div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          Gemini SRT Translator
        </h1>
        <p className="text-lg text-slate-600">
          Translate your subtitle files with the power of Google Gemini AI.
        </p>
      </div>

      <div className="max-w-xl w-full space-y-8">
        {/* Step 1: Upload and Language Selection */}
        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">1</div>
            <h2 className="text-xl font-bold text-slate-800">Upload & Configure</h2>
          </div>

          <div className="space-y-6">
            {/* Language Selector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Target Language</label>
              <div className="relative">
                <select 
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="block w-full pl-4 pr-10 py-3 text-base border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 rounded-xl transition-all appearance-none bg-slate-50"
                  disabled={status.isTranslating}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.name}>
                      {lang.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <Settings className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* File Input */}
            <div 
              className={`relative border-2 border-dashed rounded-2xl p-8 transition-all text-center
                ${file ? 'border-indigo-300 bg-indigo-50/30' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}`}
            >
              <input
                type="file"
                accept=".srt"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={status.isTranslating}
              />
              <div className="flex flex-col items-center">
                {file ? (
                  <>
                    <FileText className="w-12 h-12 text-indigo-500 mb-3" />
                    <p className="text-sm font-semibold text-slate-900 truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB • {originalEntries.length} lines</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-slate-400 mb-3" />
                    <p className="text-sm font-medium text-slate-700">Click or drag your .srt file here</p>
                    <p className="text-xs text-slate-500 mt-1">Only .srt format is supported</p>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={startTranslation}
              disabled={!file || status.isTranslating || originalEntries.length === 0}
              className={`w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-bold text-white transition-all transform active:scale-[0.98]
                ${!file || status.isTranslating || originalEntries.length === 0 
                  ? 'bg-slate-300 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200'}`}
            >
              {status.isTranslating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Translating {status.currentBatch} / {status.totalBatches}
                </>
              ) : (
                <>
                  Start Translation
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step 2: Progress and Download */}
        {(status.isTranslating || status.completed || status.error) && (
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-600">2</div>
              <h2 className="text-xl font-bold text-slate-800">Results</h2>
            </div>

            <div className="space-y-6">
              {/* Progress Bar */}
              {status.isTranslating && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-600">Translation Progress</span>
                    <span className="text-indigo-600 font-bold">{status.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full transition-all duration-500 ease-out"
                      style={{ width: `${status.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 text-center italic">
                    Processing batch {status.currentBatch} of {status.totalBatches}...
                  </p>
                </div>
              )}

              {/* Completion Message */}
              {status.completed && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-emerald-900 font-bold">Translation Finished!</h3>
                    <p className="text-emerald-700 text-sm mt-1">Successfully translated {originalEntries.length} lines into {targetLang}.</p>
                    <button
                      onClick={downloadFile}
                      className="mt-4 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-emerald-100"
                    >
                      <Download className="w-5 h-5" />
                      Download Translated File
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {status.error && (
                <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 flex items-start gap-4">
                  <AlertCircle className="w-6 h-6 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-rose-900 font-bold">Translation Failed</h3>
                    <p className="text-rose-700 text-sm mt-1">{status.error}</p>
                    <button
                      onClick={startTranslation}
                      className="mt-4 text-rose-600 font-bold text-sm hover:underline"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <footer className="mt-12 text-slate-400 text-sm max-w-xl text-center space-y-1">
        <p>This tool translates subtitles in batches of 10 lines to ensure accuracy and speed.</p>
        <p>© 2024 Built with Gemini 3 Flash and React.</p>
      </footer>
    </div>
  );
};

export default App;
