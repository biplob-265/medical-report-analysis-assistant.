
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
type DownloadStatus = 'idle' | 'preparing' | 'capturing' | 'saving' | 'error';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [view, setView] = useState<View>('analysis');
  const [file, setFile] = useState<ReportFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState<DownloadStatus>('idle');
  const [showDownloadConfirm, setShowDownloadConfirm] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus>({ isPremium: false });

  useEffect(() => {
    const savedHistory = localStorage.getItem('mediClarifyHistory');
    if (savedHistory) setHistory(JSON.parse(savedHistory));

    const savedSub = localStorage.getItem('mediClarifySubscription');
    if (savedSub) setSubStatus(JSON.parse(savedSub));

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_status') === 'success') {
      const plan = (urlParams.get('plan') as 'monthly' | 'yearly') || 'monthly';
      handleSubscriptionSuccess(plan);
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

  const initiateDownload = () => {
    setShowDownloadConfirm(true);
  };

  const handleDownloadPDF = async () => {
    setShowDownloadConfirm(false);
    const element = document.getElementById('report-content');
    if (!element || isDownloading) return;

    setIsDownloading(true);
    setDownloadStatus('preparing');
    
    try {
      // Allow progress UI to render
      await new Promise(r => setTimeout(r, 1000));
      
      const html2pdfLib = (window as any).html2pdf;
      if (!html2pdfLib || typeof html2pdfLib !== 'function') {
        throw new Error("html2pdf library is not available or not a function. Check your internet connection or script tags.");
      }

      setDownloadStatus('capturing');

      const opt = {
        margin: [15, 15, 15, 15],
        filename: `MediClarify_Report_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          logging: false 
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      // Ensure the library call is robust
      const worker = html2pdfLib().set(opt).from(element).toPdf();
      
      await worker.get('pdf').then(() => {
        setDownloadStatus('saving');
      }).save();
      
      setDownloadStatus('idle');
    } catch (err: any) {
      console.error("PDF download error:", err);
      setDownloadStatus('error');
      setError(lang === 'bn' ? "পিডিএফ তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।" : "PDF generation failed. Please refresh and try again.");
    } finally {
      setIsDownloading(false);
    }
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

  const getProgressMessage = () => {
    switch (downloadStatus) {
      case 'preparing': return lang === 'bn' ? 'রিপোর্ট প্রস্তুত হচ্ছে...' : 'Preparing content...';
      case 'capturing': return lang === 'bn' ? 'ফাইল তৈরি হচ্ছে...' : 'Capturing layout...';
      case 'saving': return lang === 'bn' ? 'সংরক্ষণ করা হচ্ছে...' : 'Finalizing document...';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 transition-all duration-500">
      <Container>
        {/* PDF Progress Overlay */}
        {isDownloading && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/95 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="text-center p-12 max-w-sm w-full">
              <div className="relative mb-12 inline-block">
                <div className="w-28 h-28 rounded-full border-4 border-slate-100 border-t-blue-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-12 h-12 text-blue-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">
                {lang === 'bn' ? 'পিডিএফ তৈরি হচ্ছে' : 'Generating PDF'}
              </h2>
              <p className="text-blue-600 font-black text-xl mb-10">
                {getProgressMessage()}
              </p>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                <div className={`h-full bg-blue-600 transition-all duration-1000 ease-out shadow-lg ${
                  downloadStatus === 'preparing' ? 'w-1/4' :
                  downloadStatus === 'capturing' ? 'w-3/4' :
                  'w-full'
                }`}></div>
              </div>
            </div>
          </div>
        )}

        {/* Download Confirmation Modal */}
        {showDownloadConfirm && !isDownloading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-[0_25px_100px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-300 border-4 border-white">
              <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-10 mx-auto">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-4xl font-black text-slate-900 text-center mb-6 tracking-tight">
                {lang === 'bn' ? 'রিপোর্ট ডাউনলোড করুন' : 'Download Analysis'}
              </h3>
              <p className="text-slate-500 text-center font-bold text-xl leading-relaxed mb-12 px-2">
                {lang === 'bn' 
                  ? 'আপনার রিপোর্টের সারসংক্ষেপ এবং ব্যাখ্যাসহ একটি প্রফেশনাল পিডিএফ ফাইল তৈরি করা হবে।' 
                  : 'We will generate a high-quality PDF containing all findings and explanations for your records.'}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowDownloadConfirm(false)}
                  className="flex-1 py-6 bg-slate-100 text-slate-600 font-black text-xl rounded-2xl hover:bg-slate-200 transition-all active:scale-[0.97]"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  className="flex-1 py-6 bg-blue-600 text-white font-black text-xl rounded-2xl hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-[0.97]"
                >
                  {lang === 'bn' ? 'ডাউনলোড' : 'Download'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="print:hidden">
          <Header lang={lang} onToggleLang={toggleLanguage} />
          
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
                <Card className="p-10 md:p-20 bg-white shadow-2xl overflow-visible">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12 border-b-2 border-slate-50 pb-12 print:hidden">
                    <div>
                      <h2 className="text-5xl font-black text-slate-900 mb-3 leading-none tracking-tighter">{s.resultsTitle}</h2>
                      <p className="text-slate-400 font-black text-xl uppercase tracking-widest">{file?.file.name}</p>
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                      <button onClick={handleCopy} className="flex-1 md:flex-none px-6 py-4 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all border-2 border-slate-100 flex items-center justify-center gap-3 text-sm font-black shadow-sm bg-white">
                        {copied ? '✓ ' + s.copied : s.copy}
                      </button>
                      <button 
                        onClick={initiateDownload} 
                        disabled={isDownloading}
                        className="flex-1 md:flex-none px-8 py-4 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl transition-all shadow-2xl shadow-blue-100 flex items-center justify-center gap-3 text-sm font-black disabled:opacity-50"
                      >
                        {isDownloading ? (
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        )}
                        {s.download}
                      </button>
                    </div>
                  </div>

                  <div id="report-content" className="bg-white">
                    {/* PDF Header (Hidden in app) */}
                    <div className="hidden print:block border-b-8 border-blue-600 pb-10 mb-12">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-5">
                           <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-xl shadow-blue-200">
                              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                           </div>
                           <div>
                              <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">MediClarify</h1>
                              <p className="text-blue-600 font-black uppercase tracking-[0.3em] text-xs mt-2">AI Medical Report Assistant</p>
                           </div>
                        </div>
                        <div className="text-right">
                          <p className="text-slate-900 font-black text-2xl">{new Date().toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          <p className="text-slate-400 text-sm font-black uppercase tracking-widest mt-1">Ref: {Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                        </div>
                      </div>
                    </div>

                    <div className="prose prose-slate max-w-none space-y-10">
                      {result.split('###').filter(s => s.trim()).map((section, idx) => {
                        const lines = section.split('\n').filter(l => l.trim());
                        if (lines.length === 0) return null;
                        
                        const title = lines[0];
                        const contentLines = lines.slice(1);
                        const isDisclaimer = title.toLowerCase().includes('disclaimer') || title.toLowerCase().includes('সতর্কতা');
                        
                        return (
                          <div key={idx} className={`rounded-[2.5rem] transition-all ${isDisclaimer ? 'bg-slate-50 border-4 border-slate-100 p-10 mt-16 shadow-inner' : 'mb-10'}`}>
                            <h3 className={`text-4xl font-black mb-6 flex items-center gap-4 ${isDisclaimer ? 'text-slate-800' : 'text-blue-900'}`}>
                              {!isDisclaimer && <span className="w-3 h-10 bg-blue-600 rounded-full shadow-lg shadow-blue-200"></span>}
                              {title.trim()}
                            </h3>
                            <div className={`text-2xl font-bold leading-relaxed space-y-4 ${isDisclaimer ? 'text-slate-500 text-xl font-medium' : 'text-slate-800'}`}>
                              {contentLines.map((line, lIdx) => (
                                <p key={lIdx}>{line.trim()}</p>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-20 flex flex-col sm:flex-row gap-8 print:hidden">
                    <button
                      onClick={initiateDownload}
                      disabled={isDownloading}
                      className="flex-[2] py-8 bg-blue-600 text-white font-black text-3xl rounded-[2.5rem] hover:bg-blue-700 shadow-[0_20px_50px_-10px_rgba(37,99,235,0.4)] transition-all active:scale-[0.97] flex items-center justify-center gap-6 disabled:opacity-50"
                    >
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {isDownloading ? (lang === 'bn' ? 'তৈরি হচ্ছে...' : 'Generating...') : s.download}
                    </button>
                    <button
                      onClick={handleReset}
                      className="flex-1 py-8 bg-slate-900 text-white font-black text-3xl rounded-[2.5rem] hover:bg-slate-800 transition-all shadow-2xl active:scale-[0.97]"
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
              <Card className="p-32 text-center text-slate-300 bg-white border-dashed border-4 border-slate-100 rounded-[3.5rem]">
                <div className="mb-8 opacity-10 flex justify-center">
                  <svg className="w-32 h-32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-3xl font-black">{s.emptyHistory}</p>
              </Card>
            ) : (
              history.map((item) => (
                <Card key={item.id} className="p-8 flex items-center gap-10 hover:border-blue-500 hover:shadow-2xl transition-all group relative overflow-hidden bg-white rounded-[2.5rem] border-2 border-slate-50">
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
