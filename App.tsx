
import React, { useState, useEffect } from 'react';
import { Language, ReportFile, HistoryItem, SubscriptionStatus } from './types';
import { UI_STRINGS } from './constants';
import Header from './components/Header';
import { Container, Card } from './components/Layout';
import { analyzeReport } from './services/geminiService';
import ChatBot from './components/ChatBot';
import LiveAudio from './components/LiveAudio';
import Subscription from './components/Subscription';

type View = 'analysis' | 'chat' | 'live' | 'history' | 'premium';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [view, setView] = useState<View>('analysis');
  const [file, setFile] = useState<ReportFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus>({ isPremium: false });

  // Load state from local storage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('mediClarifyHistory');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedSub = localStorage.getItem('mediClarifySubscription');
    if (savedSub) setSubStatus(JSON.parse(savedSub));

    // Handle payment success callback from your FastAPI backend redirect logic
    // This handles the transition from payment gateway -> backend -> frontend success URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_status') === 'success') {
      const plan = (urlParams.get('plan') as 'monthly' | 'yearly') || 'monthly';
      handleSubscriptionSuccess(plan);
      // Clean up URL for professional UX
      window.history.replaceState({}, document.title, "/");
      setView('premium');
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
    // Free User Limit: 2 Reports (as per instructions for monetization)
    if (!subStatus.isPremium && history.length >= 2) {
      setError(UI_STRINGS[lang].limitReached);
      setView('premium');
      return;
    }

    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const base64Data = file.preview.split(',')[1];
      const mimeType = file.file.type;
      const responseText = await analyzeReport(base64Data, mimeType, lang);
      setResult(responseText || "No data returned.");

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
      console.error(err);
      setError(UI_STRINGS[lang].errorDesc);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionSuccess = (plan: 'monthly' | 'yearly') => {
    // Expiry logic matching your Python backend (30 vs 365 days)
    const daysToAdd = plan === 'yearly' ? 365 : 30;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysToAdd);

    const newStatus: SubscriptionStatus = {
      isPremium: true,
      plan,
      expiryDate: expiryDate.toISOString()
    };
    
    setSubStatus(newStatus);
    localStorage.setItem('mediClarifySubscription', JSON.stringify(newStatus));
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
    <div className="min-h-screen bg-slate-50 pb-20 print:bg-white transition-all duration-500">
      <Container>
        <div className="print:hidden">
          <Header lang={lang} onToggleLang={toggleLanguage} />
          
          {/* Main Navigation with Premium Indicator */}
          <div className="flex gap-2 mb-10 bg-slate-200/40 p-1.5 rounded-3xl overflow-x-auto no-scrollbar w-full shadow-inner border border-slate-200/50">
            {(['analysis', 'chat', 'live', 'history', 'premium'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 min-w-[100px] py-4 px-4 rounded-2xl font-black text-xs transition-all whitespace-nowrap active:scale-[0.97] ${
                  view === v 
                    ? 'bg-white text-blue-600 shadow-xl translate-y-[-1px]' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                }`}
              >
                {v === 'analysis' ? s.tabAnalysis : 
                 v === 'chat' ? s.tabChat : 
                 v === 'live' ? s.tabLive : 
                 v === 'history' ? s.tabHistory : 
                 s.tabPremium}
                {v === 'premium' && subStatus.isPremium && <span className="ml-1 text-green-500 font-black">★</span>}
              </button>
            ))}
          </div>
        </div>

        {view === 'analysis' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {!result ? (
              <Card className="p-16 text-center border-4 border-dashed border-slate-200 bg-white hover:border-blue-500 hover:shadow-2xl transition-all cursor-default relative">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center group">
                  <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center mb-10 group-hover:bg-blue-600 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-xl shadow-blue-50">
                    <svg className="w-14 h-14 text-blue-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">{s.uploadLabel}</h3>
                  <p className="text-slate-400 max-w-sm mx-auto font-bold text-lg">{s.uploadHint}</p>
                </label>

                {file && (
                  <div className="mt-12 animate-in zoom-in-95 duration-500">
                    <div className="relative inline-block group">
                      <img src={file.preview} alt="Preview" className="max-h-[450px] rounded-3xl shadow-2xl border-8 border-slate-50 group-hover:opacity-95 transition-all" />
                      <button onClick={handleReset} className="absolute -top-6 -right-6 p-4 bg-red-600 text-white rounded-full shadow-2xl hover:bg-red-700 hover:scale-110 transition-all active:scale-90 z-10">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <div className="mt-12">
                      <button
                        onClick={performAnalysis}
                        disabled={loading}
                        className="px-16 py-6 bg-blue-600 text-white font-black text-2xl rounded-3xl hover:bg-blue-700 disabled:opacity-50 shadow-2xl shadow-blue-200 transition-all active:scale-[0.97]"
                      >
                        {loading ? (
                          <span className="flex items-center gap-4">
                            <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                            {s.analyzing}
                          </span>
                        ) : s.btnAnalyze}
                      </button>
                    </div>
                  </div>
                )}
                {error && <p className="mt-8 text-red-600 font-black bg-red-50 py-5 px-10 rounded-3xl border-2 border-red-100 inline-block shadow-sm animate-bounce">{error}</p>}
              </Card>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
                <Card className="p-10 md:p-20 print:border-none print:shadow-none print:p-0 bg-white shadow-2xl">
                  <div className="flex justify-between items-start mb-12 border-b-2 border-slate-50 pb-12 print:mb-16">
                    <div>
                      <h2 className="text-5xl font-black text-slate-900 mb-3 leading-none tracking-tighter">{s.resultsTitle}</h2>
                      <p className="text-slate-400 font-black text-xl uppercase tracking-widest">{file?.file.name}</p>
                    </div>
                    <div className="flex gap-4 print:hidden">
                      <button onClick={handleCopy} className="px-6 py-4 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border-2 border-slate-100 flex items-center gap-3 text-sm font-black shadow-sm bg-white">
                        {copied ? '✓ ' + s.copied : s.copy}
                      </button>
                      <button onClick={handleDownloadPDF} className="px-6 py-4 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl transition-all shadow-2xl shadow-blue-100 flex items-center gap-3 text-sm font-black">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {s.download}
                      </button>
                    </div>
                  </div>

                  <div className="prose prose-slate max-w-none text-slate-800 text-2xl font-medium leading-relaxed tracking-tight space-y-8">
                    {result.split('\n').map((line, i) => (
                      <p key={i} className="mb-0">
                        {line}
                      </p>
                    ))}
                  </div>

                  <div className="mt-20 pt-16 border-t-4 border-blue-50 bg-blue-50/20 p-12 rounded-[2.5rem] border-dashed relative">
                    <div className="absolute -top-10 left-12 w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-100 transform rotate-[-4deg]">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h4 className="text-blue-900 font-black mb-6 text-3xl tracking-tighter pt-4">
                      {s.disclaimerTitle}
                    </h4>
                    <p className="text-blue-900/80 leading-relaxed font-bold text-xl">{s.disclaimerText}</p>
                  </div>

                  <div className="mt-16 flex gap-6 print:hidden">
                    <button
                      onClick={handleReset}
                      className="flex-1 py-7 bg-slate-900 text-white font-black text-2xl rounded-3xl hover:bg-slate-800 transition-all shadow-2xl active:scale-[0.97]"
                    >
                      {s.btnReset}
                    </button>
                  </div>
                </Card>
              </div>
            )}
          </div>
        )}

        {view === 'chat' && <ChatBot lang={lang} />}
        {view === 'live' && <LiveAudio lang={lang} />}
        {view === 'premium' && (
          <Subscription 
            lang={lang} 
            status={subStatus} 
            onSuccess={handleSubscriptionSuccess} 
          />
        )}

        {view === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-700">
            <h2 className="text-4xl font-black text-slate-900 mb-12 px-2 tracking-tighter">{s.historyTitle}</h2>
            {history.length === 0 ? (
              <Card className="p-32 text-center text-slate-300 bg-white border-dashed border-4 border-slate-100 rounded-[3rem]">
                <div className="mb-8 opacity-10 flex justify-center">
                  <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-black">{s.emptyHistory}</p>
                <p className="mt-4 font-bold text-slate-400">Reports analyzed by MediClarify will be stored here.</p>
              </Card>
            ) : (
              history.map((item) => (
                <Card key={item.id} className="p-8 flex items-center gap-10 hover:border-blue-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all group relative overflow-hidden bg-white rounded-3xl border-2 border-slate-50">
                  <div className="w-32 h-32 rounded-3xl overflow-hidden border-8 border-slate-50 shadow-2xl flex-shrink-0 bg-slate-100">
                    <img src={item.preview} alt="Report" className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-900 truncate text-3xl mb-2 tracking-tighter">{item.fileName}</h4>
                    <p className="text-slate-400 font-black text-sm tracking-[0.2em] uppercase">{item.date}</p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => viewHistoryItem(item)}
                      className="px-10 py-5 text-lg font-black text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm"
                    >
                      {s.view}
                    </button>
                    <button
                      onClick={() => deleteHistoryItem(item.id)}
                      className="px-6 py-5 text-lg font-black text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-sm"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
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
