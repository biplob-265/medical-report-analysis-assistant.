
import React, { useState, useEffect } from 'react';
import { Language, ReportFile, HistoryItem } from './types';
import { UI_STRINGS } from './constants';
import Header from './components/Header';
import { Container, Card } from './components/Layout';
import { analyzeReport } from './services/geminiService';
import ChatBot from './components/ChatBot';
import LiveAudio from './components/LiveAudio';

type View = 'analysis' | 'chat' | 'live' | 'history';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [view, setView] = useState<View>('analysis');
  const [file, setFile] = useState<ReportFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load history from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('mediClarifyHistory');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const toggleLanguage = () => setLang(prev => (prev === 'en' ? 'bn' : 'en'));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFile({
          file: selectedFile,
          preview: event.target?.result as string,
          type: selectedFile.type.startsWith('image/') ? 'image' : 'pdf'
        });
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const performAnalysis = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const base64Data = file.preview.split(',')[1];
      const mimeType = file.file.type;
      const responseText = await analyzeReport(base64Data, mimeType, lang);
      setResult(responseText || "No data returned.");

      // Add to history
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        date: new Date().toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US'),
        fileName: file.file.name,
        result: responseText || "",
        preview: file.preview
      };
      const updatedHistory = [newItem, ...history];
      setHistory(updatedHistory);
      localStorage.setItem('mediClarifyHistory', JSON.stringify(updatedHistory));
    } catch (err) {
      setError(UI_STRINGS[lang].errorDesc);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const deleteHistoryItem = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('mediClarifyHistory', JSON.stringify(updatedHistory));
  };

  const viewHistoryItem = (item: HistoryItem) => {
    setResult(item.result);
    setFile({
      preview: item.preview,
      file: new File([], item.fileName),
      type: 'image'
    });
    setView('analysis');
  };

  const s = UI_STRINGS[lang];

  return (
    <div className="min-h-screen bg-slate-50 pb-20 print:bg-white">
      <Container>
        <Header lang={lang} onToggleLang={toggleLanguage} />

        {/* Navigation Tabs */}
        <div className="flex gap-1 mb-8 bg-slate-200/50 p-1 rounded-xl w-fit">
          {(['analysis', 'chat', 'live', 'history'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                view === v ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {v === 'analysis' ? s.tabAnalysis : v === 'chat' ? s.tabChat : v === 'live' ? s.tabLive : s.tabHistory}
            </button>
          ))}
        </div>

        {view === 'analysis' && (
          <div className="space-y-6">
            {!result ? (
              <Card className="p-12 text-center border-2 border-dashed border-slate-300 bg-slate-50/50">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center group"
                >
                  <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{s.uploadLabel}</h3>
                  <p className="text-slate-500">{s.uploadHint}</p>
                </label>

                {file && (
                  <div className="mt-8">
                    <div className="relative inline-block">
                      <img src={file.preview} alt="Preview" className="max-h-64 rounded-xl shadow-md border border-white" />
                      <button
                        onClick={handleReset}
                        className="absolute -top-3 -right-3 p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-6">
                      <button
                        onClick={performAnalysis}
                        disabled={loading}
                        className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg shadow-blue-200"
                      >
                        {loading ? s.analyzing : s.btnAnalyze}
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Card className="p-6 md:p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">{s.resultsTitle}</h2>
                    <div className="flex gap-2 print:hidden">
                      <button
                        onClick={handleCopy}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        {copied ? s.copied : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3" />
                            </svg>
                            {s.copy}
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleDownloadPDF}
                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 text-sm font-medium"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {s.download}
                      </button>
                    </div>
                  </div>

                  <div className="prose prose-slate max-w-none prose-p:text-slate-600 prose-headings:text-slate-900 prose-strong:text-slate-900">
                    {result.split('\n').map((line, i) => (
                      <p key={i} className="mb-4 last:mb-0 leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-100 bg-amber-50/50 p-6 rounded-xl border-amber-100">
                    <h4 className="text-amber-900 font-bold mb-2 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {s.disclaimerTitle}
                    </h4>
                    <p className="text-amber-800 text-sm">{s.disclaimerText}</p>
                  </div>

                  <button
                    onClick={handleReset}
                    className="mt-8 w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors print:hidden"
                  >
                    {s.btnReset}
                  </button>
                </Card>
              </div>
            )}
          </div>
        )}

        {view === 'chat' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <ChatBot lang={lang} />
          </div>
        )}

        {view === 'live' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <LiveAudio lang={lang} />
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{s.historyTitle}</h2>
            {history.length === 0 ? (
              <Card className="p-12 text-center text-slate-500 bg-slate-50">
                {s.emptyHistory}
              </Card>
            ) : (
              history.map((item) => (
                <Card key={item.id} className="p-4 flex items-center gap-4 hover:border-blue-200 transition-colors">
                  <img src={item.preview} alt="Thumb" className="w-16 h-16 rounded-lg object-cover border" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-slate-900 truncate">{item.fileName}</h4>
                    <p className="text-sm text-slate-500">{item.date}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => viewHistoryItem(item)}
                      className="px-3 py-1 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      View
                    </button>
                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      className="px-3 py-1 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      {s.delete}
                    </button>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </Container>
    </div>
  );
};

export default App;
