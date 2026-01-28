
import React, { useState, useEffect } from 'react';
import { Language, ReportFile, HistoryItem, SubscriptionStatus } from './types';
import { UI_STRINGS } from './constants';
import Header from './components/Header';
import { Container, Card } from './components/Layout';
import { analyzeReport } from './services/geminiService';
import Subscription from './components/Subscription';

type View = 'analysis' | 'history' | 'premium';
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
      // Ensure libraries are ready
      await new Promise(r => setTimeout(r, 800));
      const html2pdfLib = (window as any).html2pdf;
      if (!html2pdfLib) throw new Error("html2pdf library missing");

      setDownloadStatus('capturing');

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `MediClarify_Report_${Date.now()}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { 
          scale: 3, 
          useCORS: true, 
          letterRendering: true, 
          logging: false,
          scrollY: -window.scrollY 
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdfLib().set(opt).from(element).save();
      
      setDownloadStatus('idle');
    } catch (err: any) {
      console.error("PDF error:", err);
      setDownloadStatus('error');
      setError(lang === 'bn' ? "পিডিএফ তৈরি করতে সমস্যা হয়েছে।" : "PDF generation failed.");
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

  return (
    <div className="min-h-screen bg-slate-50 pb-20 transition-all duration-500">
      <Container>
        {/* PDF Download Confirmation Modal */}
        {showDownloadConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <Card className="max-w-md w-full p-8 text-center bg-white shadow-2xl rounded-[2.5rem]">
              <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">{lang === 'bn' ? 'পিডিএফ ডাউনলোড করুন' : 'Download PDF Report'}</h3>
              <p className="text-slate-500 font-bold mb-8">{lang === 'bn' ? 'আপনি কি এই বিশ্লেষণের একটি অফিশিয়াল পিডিএফ কপি ডাউনলোড করতে চান?' : 'Would you like to download an official PDF copy of this analysis?'}</p>
              <div className="flex gap-4">
                <button onClick={() => setShowDownloadConfirm(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-black rounded-2xl hover:bg-slate-200 transition-all">{lang === 'bn' ? 'না' : 'Cancel'}</button>
                <button onClick={handleDownloadPDF} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all">{lang === 'bn' ? 'হ্যাঁ, ডাউনলোড করুন' : 'Download'}</button>
              </div>
            </Card>
          </div>
        )}

        {/* PDF Progress Overlay */}
        {isDownloading && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/95 backdrop-blur-xl animate-in fade-in duration-300">
            <div className="text-center p-12 max-w-sm w-full">
              <div className="w-28 h-28 mx-auto mb-10 border-4 border-slate-100 border-t-blue-600 animate-spin rounded-full"></div>
              <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter">{lang === 'bn' ? 'পিডিএফ তৈরি হচ্ছে' : 'Generating PDF'}</h2>
              <p className="text-slate-400 font-black mb-10 uppercase tracking-[0.2em]">{downloadStatus}...</p>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden shadow-inner">
                <div className={`h-full bg-blue-600 transition-all duration-1000 ease-out ${downloadStatus === 'preparing' ? 'w-1/4' : downloadStatus === 'capturing' ? 'w-3/4' : 'w-full'}`}></div>
              </div>
            </div>
          </div>
        )}

        <div className="print:hidden">
          <Header lang={lang} onToggleLang={toggleLanguage} />
          <div className="flex gap-2 mb-10 bg-slate-200/40 p-1.5 rounded-3xl overflow-x-auto no-scrollbar shadow-inner border border-slate-200/50">
            {(['analysis', 'history', 'premium'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex-1 min-w-[100px] py-4 px-4 rounded-2xl font-black text-xs transition-all whitespace-nowrap active:scale-[0.97] ${view === v ? 'bg-white text-blue-600 shadow-xl' : 'text-slate-500 hover:text-slate-800'}`}
              >
                {v === 'analysis' ? s.tabAnalysis : v === 'history' ? s.tabHistory : s.tabPremium}
                {v === 'premium' && subStatus.isPremium && <span className="ml-1 text-green-500">★</span>}
              </button>
            ))}
          </div>
        </div>

        {view === 'analysis' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {!result ? (
              <Card className="p-16 text-center border-4 border-dashed border-slate-200 bg-white hover:border-blue-500 hover:shadow-2xl transition-all cursor-default relative">
                <input type="file" id="file-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center group">
                  <div className="w-28 h-28 bg-blue-50 rounded-full flex items-center justify-center mb-10 group-hover:bg-blue-600 group-hover:scale-110 transition-all shadow-xl shadow-blue-50">
                    <svg className="w-14 h-14 text-blue-600 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mb-3">{s.uploadLabel}</h3>
                  <p className="text-slate-400 font-bold text-lg">{s.uploadHint}</p>
                </label>
                {file && (
                  <div className="mt-12">
                    <div className="relative inline-block group">
                      <img src={file.preview} alt="Preview" className="max-h-[450px] rounded-3xl shadow-2xl border-8 border-slate-50" />
                      <button onClick={handleReset} className="absolute -top-6 -right-6 p-4 bg-red-600 text-white rounded-full shadow-2xl active:scale-90 z-10"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg></button>
                    </div>
                    <div className="mt-12">
                      <button onClick={performAnalysis} disabled={loading} className="px-16 py-6 bg-blue-600 text-white font-black text-2xl rounded-3xl hover:bg-blue-700 disabled:opacity-50 shadow-2xl transition-all active:scale-[0.97]">
                        {loading ? <span className="flex items-center gap-4"><div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>{s.analyzing}</span> : s.btnAnalyze}
                      </button>
                    </div>
                  </div>
                )}
                {error && <p className="mt-8 text-red-600 font-black bg-red-50 py-5 px-10 rounded-3xl border-2 border-red-100 inline-block animate-bounce">{error}</p>}
              </Card>
            ) : (
              <Card className="p-10 md:p-20 bg-white shadow-2xl overflow-visible relative">
                <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-12 border-b-2 border-slate-50 pb-12 print:hidden">
                  <div>
                    <h2 className="text-5xl font-black text-slate-900 mb-3 leading-none tracking-tighter">{s.resultsTitle}</h2>
                    <p className="text-slate-400 font-black text-xl uppercase tracking-widest">{file?.file.name}</p>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={handleCopy} className="px-6 py-4 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-2xl border-2 border-slate-100 text-sm font-black shadow-sm bg-white">{copied ? '✓ ' + s.copied : s.copy}</button>
                    <button onClick={initiateDownload} className="px-8 py-4 bg-blue-600 text-white hover:bg-blue-700 rounded-2xl shadow-2xl text-sm font-black group transition-all">
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        {s.download}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Report Content Wrapper for PDF */}
                <div id="report-content" className="bg-white p-2">
                  {/* Official PDF Header (Hidden in app, visible in PDF) */}
                  <div className="hidden print:flex flex-col mb-12 pb-8 border-b-4 border-slate-900">
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <h1 className="text-4xl font-black text-slate-900 leading-none">MediClarify</h1>
                          <p className="text-blue-600 font-black text-sm uppercase tracking-widest mt-1">Medical Report Assistant</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Generated On</p>
                        <p className="text-xl font-black text-slate-800">{new Date().toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 flex justify-between items-center">
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source Report</p>
                        <p className="text-lg font-black text-slate-900 truncate pr-4">{file?.file.name}</p>
                      </div>
                      <div className="w-[1px] h-10 bg-slate-200 mx-6"></div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan Type</p>
                        <p className="text-lg font-black text-blue-600 capitalize">{subStatus.isPremium ? 'Premium Analysis' : 'Standard Analysis'}</p>
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
                        <div key={idx} className={`rounded-[2.5rem] ${isDisclaimer ? 'bg-slate-50 border-4 border-slate-100 p-10 mt-16 break-inside-avoid' : 'mb-12'}`}>
                          <h3 className={`text-3xl md:text-4xl font-black mb-6 flex items-center gap-4 ${isDisclaimer ? 'text-slate-800' : 'text-blue-900'}`}>
                            {!isDisclaimer && <span className="w-3 h-10 bg-blue-600 rounded-full flex-shrink-0"></span>}
                            {title.trim()}
                          </h3>
                          <div className={`text-xl md:text-2xl font-bold leading-relaxed space-y-4 ${isDisclaimer ? 'text-slate-500 text-base md:text-lg font-medium italic' : 'text-slate-800'}`}>
                            {contentLines.map((line, lIdx) => (
                              <p key={lIdx} className="break-words">
                                {line.trim().startsWith('-') || line.trim().startsWith('*') 
                                  ? <span className="flex gap-3"><span className="text-blue-500">•</span>{line.trim().substring(1)}</span> 
                                  : line.trim()
                                }
                              </p>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* PDF Footer Disclaimer */}
                  <div className="hidden print:block mt-12 pt-8 border-t-2 border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">www.mediclarify.ai • educational use only</p>
                  </div>
                </div>

                <div className="mt-20 flex flex-col sm:flex-row gap-8 print:hidden">
                  <button onClick={handleReset} className="w-full py-8 bg-slate-900 text-white font-black text-3xl rounded-[2.5rem] hover:bg-slate-800 transition-all shadow-2xl active:scale-[0.97]">{s.btnReset}</button>
                </div>
              </Card>
            )}
          </div>
        )}

        {view === 'premium' && (
          <Subscription 
            lang={lang} 
            status={subStatus} 
            onSuccess={handleSubscriptionSuccess} 
            onReturn={() => { setView('analysis'); handleReset(); }}
          />
        )}
        {view === 'history' && (
          <div className="space-y-6 animate-in fade-in duration-700">
            <h2 className="text-4xl font-black text-slate-900 mb-12 px-2 tracking-tighter">{s.historyTitle}</h2>
            {history.length === 0 ? (
              <Card className="p-32 text-center text-slate-300 bg-white border-dashed border-4 border-slate-100 rounded-[3.5rem]"><p className="text-3xl font-black">{s.emptyHistory}</p></Card>
            ) : (
              history.map((item) => (
                <Card key={item.id} className="p-8 flex items-center gap-10 hover:border-blue-500 hover:shadow-2xl transition-all group relative overflow-hidden bg-white rounded-[2.5rem] border-2 border-slate-50">
                  <div className="w-32 h-32 rounded-3xl overflow-hidden border-8 border-slate-50 shadow-2xl flex-shrink-0 bg-slate-100"><img src={item.preview} alt="Report" className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-1000" /></div>
                  <div className="flex-1 min-w-0"><h4 className="font-black text-slate-900 truncate text-3xl mb-2 tracking-tighter">{item.fileName}</h4><p className="text-slate-400 font-black text-sm tracking-[0.2em] uppercase">{item.date}</p></div>
                  <div className="flex gap-4">
                    <button onClick={() => viewHistoryItem(item)} className="px-10 py-5 text-lg font-black text-blue-600 bg-blue-50 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm">{s.view}</button>
                    <button onClick={() => deleteHistoryItem(item.id)} className="px-6 py-5 text-lg font-black text-red-600 bg-red-50 hover:bg-red-600 hover:text-white rounded-2xl transition-all shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
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
