
import React, { useState } from 'react';
import { Language, SubscriptionStatus } from '../types';
import { UI_STRINGS } from '../constants';
import { Card } from './Layout';

interface SubscriptionProps {
  lang: Language;
  onSuccess: (plan: 'monthly' | 'yearly') => void;
  status: SubscriptionStatus;
  onReturn: () => void;
}

const Subscription: React.FC<SubscriptionProps> = ({ lang, onSuccess, status, onReturn }) => {
  const [view, setView] = useState<'selection' | 'checkout' | 'automated' | 'verifying'>('selection');
  const [method, setMethod] = useState<'card' | 'mobile'>('card');
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | null>(null);
  const [trxId, setTrxId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [automatedStep, setAutomatedStep] = useState(0);

  const s = UI_STRINGS[lang];

  const automatedSteps = [
    { en: 'Connecting to Secure Gateway...', bn: 'সিকিউর গেটওয়ের সাথে সংযুক্ত হচ্ছে...' },
    { en: 'Authenticating Account...', bn: 'অ্যাকাউন্ট যাচাই করা হচ্ছে...' },
    { en: 'Processing Transaction...', bn: 'লেনদেন সম্পন্ন করা হচ্ছে...' },
    { en: 'Success! Welcome to Premium.', bn: 'সফল হয়েছে! প্রিমিয়ামে স্বাগতম।' }
  ];

  const handleStartCheckout = (plan: 'monthly' | 'yearly') => {
    setSelectedPlan(plan);
    setView('checkout');
  };

  const handleAutomatedPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (method === 'mobile' && phoneNumber.length < 11) {
      setError(lang === 'bn' ? 'সঠিক ফোন নাম্বার দিন' : 'Enter a valid phone number');
      return;
    }
    setError(null);
    setView('automated');
    setAutomatedStep(0);
    
    for (let i = 0; i < automatedSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAutomatedStep(i);
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    onSuccess(selectedPlan || 'monthly');
  };

  const handleManualVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trxId.length < 6) {
      setError(s.invalidTrx);
      return;
    }

    setError(null);
    setView('verifying');
    
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    if (trxId.length >= 8) {
      onSuccess(selectedPlan || 'monthly');
    } else {
      setError(s.invalidTrx);
      setView('selection');
    }
  };

  const copyToClipboard = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  if (status.isPremium) {
    return (
      <div className="relative overflow-hidden py-12 px-4 min-h-[600px] flex items-center justify-center animate-in fade-in duration-1000">
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(40)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-bounce opacity-40"
              style={{
                backgroundColor: ['#10b981', '#3b82f6', '#fbbf24', '#f472b6', '#a855f7'][i % 5],
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${0.5 + Math.random() * 2.5}s`
              }}
            />
          ))}
        </div>

        <Card className="max-w-xl w-full p-12 text-center bg-white border-4 border-green-50 shadow-[0_50px_100px_-20px_rgba(16,185,129,0.25)] relative z-10 rounded-[3.5rem]">
          <div className="relative mb-12 inline-block">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-30"></div>
            <div className="w-32 h-32 bg-green-600 rounded-full flex items-center justify-center relative shadow-2xl shadow-green-200">
              <svg 
                className="w-16 h-16 text-white animate-in zoom-in-50 duration-500 delay-300" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="3.5" 
                  d="M5 13l4 4L19 7" 
                  className="animate-[draw_0.6s_ease-out_forwards]"
                  style={{ strokeDasharray: 50, strokeDashoffset: 50 }}
                />
              </svg>
            </div>
          </div>

          <div className="space-y-6">
            <div className="inline-block px-6 py-2 bg-yellow-100 text-yellow-700 rounded-full font-black text-sm uppercase tracking-widest mb-2 border-2 border-yellow-200 shadow-sm animate-pulse">
              ★ Premium Active
            </div>
            
            <h2 className="text-5xl font-black text-slate-900 tracking-tight leading-none">
              {s.paymentSuccess}
            </h2>
            
            <p className="text-slate-500 text-2xl font-bold leading-relaxed max-w-sm mx-auto">
              {lang === 'bn' 
                ? `অভিনন্দন! আপনার ${status.plan === 'yearly' ? 'বার্ষিক' : 'মাসিক'} প্রিমিয়াম মেম্বারশিপ এখন সচল হয়েছে।` 
                : `Congratulations! Your ${status.plan} Premium membership is now fully active.`}
            </p>

            <div className="pt-8 grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">
                  {lang === 'bn' ? 'প্ল্যান' : 'Current Plan'}
                </p>
                <p className="text-2xl font-black text-slate-800 capitalize">{status.plan}</p>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">
                  {lang === 'bn' ? 'মেয়াদ শেষ হবে' : 'Expires On'}
                </p>
                <p className="text-2xl font-black text-slate-800">
                  {status.expiryDate ? new Date(status.expiryDate).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                </p>
              </div>
            </div>

            <div className="pt-10">
              <button
                onClick={onReturn}
                className="w-full py-6 bg-blue-600 text-white font-black text-2xl rounded-[2.5rem] hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-4"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                {lang === 'bn' ? 'রিপোর্ট বিশ্লেষণ শুরু করুন' : 'Start Analyzing Now'}
              </button>
            </div>
          </div>
        </Card>

        <style>{`
          @keyframes draw {
            to { stroke-dashoffset: 0; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-12 relative">
      {/* Automated Checkout View */}
      {view === 'checkout' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
          <Card className="max-w-md w-full overflow-hidden bg-white shadow-2xl rounded-[3rem] border-4 border-slate-100">
            <div className="p-8 pb-4 flex justify-between items-center border-b border-slate-50">
              <h3 className="text-2xl font-black text-slate-900">{lang === 'bn' ? 'পেমেন্ট গেটওয়ে' : 'Secure Checkout'}</h3>
              <button onClick={() => setView('selection')} className="text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Payment Method Tabs */}
            <div className="flex p-2 bg-slate-50 mx-8 mt-6 rounded-2xl border border-slate-100">
              <button 
                onClick={() => setMethod('card')}
                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${method === 'card' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {lang === 'bn' ? 'ডেবিট/ক্রেডিট কার্ড' : 'Card'}
              </button>
              <button 
                onClick={() => setMethod('mobile')}
                className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${method === 'mobile' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {lang === 'bn' ? 'মোবাইল ব্যাংকিং' : 'Mobile Banking'}
              </button>
            </div>
            
            <div className="p-8 pt-6">
              <div className="mb-6 p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{lang === 'bn' ? 'সাবস্ক্রিপশন প্ল্যান' : 'Selected Plan'}</p>
                  <p className="text-lg font-black text-blue-700 capitalize">{selectedPlan}</p>
                </div>
                <p className="text-2xl font-black text-blue-800">{selectedPlan === 'monthly' ? '৳৫০০' : '৳৫০০০'}</p>
              </div>

              <form onSubmit={handleAutomatedPayment} className="space-y-4">
                {method === 'card' ? (
                  <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'bn' ? 'কার্ড নাম্বার' : 'Card Number'}</label>
                      <input 
                        type="text" 
                        placeholder="xxxx xxxx xxxx xxxx" 
                        className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-600 outline-none font-bold text-lg transition-colors"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Expiry</label>
                        <input type="text" placeholder="MM/YY" className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-600 outline-none font-bold text-lg" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">CVC</label>
                        <input type="password" placeholder="***" className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-blue-600 outline-none font-bold text-lg" required />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">{lang === 'bn' ? 'বিকাশ/নগদ/রকেট নাম্বার' : 'Mobile Number'}</label>
                      <div className="relative">
                        <input 
                          type="tel" 
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="01xxxxxxxxx" 
                          className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:border-pink-500 outline-none font-black text-xl tracking-wider transition-colors"
                          required
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                          <div className="w-8 h-8 bg-pink-500 rounded-md"></div>
                          <div className="w-8 h-8 bg-orange-600 rounded-md"></div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 font-bold px-1">
                      {lang === 'bn' ? '* পেমেন্ট সম্পন্ন করতে আপনার ওয়ালেটে যথেষ্ট ব্যালেন্স থাকতে হবে।' : '* Ensure sufficient balance in your mobile wallet to complete payment.'}
                    </p>
                  </div>
                )}
                
                {error && <p className="text-red-600 text-sm font-black animate-shake">{error}</p>}

                <button 
                  type="submit" 
                  className={`w-full py-6 mt-4 text-white font-black text-xl rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${method === 'card' ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-pink-500 hover:bg-pink-600 shadow-pink-100'}`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  {lang === 'bn' ? 'নিরাপদে পেমেন্ট করুন' : 'Pay Securely Now'}
                </button>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Processing Animation View */}
      {view === 'automated' && (
        <div className="fixed inset-0 z-[110] bg-white/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-sm w-full text-center">
            <div className="relative w-32 h-32 mx-auto mb-10">
              <div className="absolute inset-0 border-8 border-slate-50 rounded-full"></div>
              <div className="absolute inset-0 border-8 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className={`w-12 h-12 animate-pulse ${method === 'mobile' ? 'text-pink-500' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">
              {lang === 'bn' ? automatedSteps[automatedStep].bn : automatedSteps[automatedStep].en}
            </h3>
            <p className="text-slate-400 font-bold mb-8">
              {lang === 'bn' ? 'অনুগ্রহ করে অপেক্ষা করুন এবং পেজ রিফ্রেশ করবেন না...' : 'Please wait while we process your request...'}
            </p>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full transition-all duration-1000 ease-out shadow-lg ${method === 'mobile' ? 'bg-pink-500' : 'bg-blue-600'}`}
                style={{ width: `${((automatedStep + 1) / automatedSteps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Manual Verification View */}
      {view === 'verifying' && (
        <div className="fixed inset-0 z-[110] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-md w-full p-12 text-center bg-white rounded-[3rem] shadow-2xl">
            <div className="w-20 h-20 bg-slate-900 text-white rounded-3xl mx-auto mb-8 flex items-center justify-center animate-pulse">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-2">{s.verifying}</h3>
            <p className="text-slate-400 font-bold mb-8">Matching Transaction ID with internal records...</p>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 bg-slate-900 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-slate-900 rounded-full animate-bounce [animation-delay:-0.1s]"></div>
              <div className="w-3 h-3 bg-slate-900 rounded-full animate-bounce [animation-delay:-0.2s]"></div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">{s.pricingTitle}</h2>
        <p className="text-slate-500 text-xl font-medium leading-relaxed">
          {lang === 'bn' 
            ? 'গভীর বিশ্লেষণ এবং সীমাহীন এআই সুবিধার জন্য আজই প্রিমিয়ামে যোগ দিন।' 
            : 'Get deep insights and unlimited AI features with MediClarify Premium.'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <Card className="p-10 border-2 transition-all flex flex-col justify-between group bg-white shadow-xl hover:border-blue-400 hover:shadow-blue-50">
          <div>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-3xl font-black text-slate-900">{s.monthly}</h3>
              <span className="bg-slate-100 text-slate-600 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Standard</span>
            </div>
            <p className="text-6xl font-black text-blue-600 mb-10 tracking-tighter">{s.priceMonthly}</p>
            <ul className="space-y-5 mb-12 text-slate-600 font-bold text-lg">
              <li className="flex items-center gap-4">
                <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-[10px] font-black">✓</div>
                Unlimited Analysis
              </li>
              <li className="flex items-center gap-4">
                <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-[10px] font-black">✓</div>
                Chat Memory Enabled
              </li>
            </ul>
          </div>
          <button
            onClick={() => handleStartCheckout('monthly')}
            className="w-full py-6 bg-slate-900 text-white font-black text-xl rounded-2xl hover:bg-blue-600 shadow-2xl transition-all active:scale-[0.98]"
          >
            {s.subscribe}
          </button>
        </Card>

        <Card className="p-10 border-4 border-blue-600 relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-blue-100 bg-white scale-[1.02]">
          <div className="absolute top-8 right-[-45px] bg-blue-600 text-white text-[12px] font-black px-14 py-2 rotate-45 shadow-lg uppercase tracking-widest">Best Value</div>
          <div>
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-3xl font-black text-slate-900">{s.yearly}</h3>
              <span className="bg-blue-100 text-blue-600 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Annual</span>
            </div>
            <p className="text-6xl font-black text-blue-600 mb-10 tracking-tighter">{s.priceYearly}</p>
            <ul className="space-y-5 mb-12 text-slate-700 font-black text-lg">
              <li className="flex items-center gap-4">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">✓</div>
                Save 15% Annually
              </li>
              <li className="flex items-center gap-4">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">✓</div>
                Priority Support Access
              </li>
            </ul>
          </div>
          <button
            onClick={() => handleStartCheckout('yearly')}
            className="w-full py-6 bg-blue-600 text-white font-black text-xl rounded-2xl hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-[0.97]"
          >
            {s.subscribe}
          </button>
        </Card>
      </div>

      <div className="pt-12">
        <div className="bg-white rounded-[3rem] p-12 border-2 border-slate-100 shadow-2xl relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl border-4 border-white flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            {s.manualTitle}
          </div>
          
          <div className="text-center mb-10 mt-6">
            <h4 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
              {lang === 'bn' ? 'সরাসরি সাবস্ক্রাইব করুন' : 'Direct Manual Subscription'}
            </h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto mb-16">
            {/* bKash Verified Card */}
            <button 
              onClick={() => copyToClipboard('01767515374')}
              className="w-full bg-white p-12 rounded-[3rem] border-4 border-pink-50 shadow-2xl flex flex-col items-center text-center group hover:border-pink-500 transition-all relative overflow-hidden active:scale-[0.98]"
            >
              <div className="absolute top-6 left-6 flex items-center gap-1.5 bg-pink-50 px-4 py-1.5 rounded-full border border-pink-100">
                <svg className="w-4 h-4 text-pink-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Verified Merchant</span>
              </div>
              <div className="w-24 h-24 bg-pink-500 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-pink-200 mb-8 group-hover:rotate-6 transition-transform">
                <span className="text-white font-black text-xl">bKash</span>
              </div>
              <p className="text-xs text-slate-400 font-black uppercase tracking-[0.3em] mb-2">Personal Account (Official)</p>
              <p className="text-5xl font-black text-pink-600 tabular-nums tracking-tighter mb-6">01767515374</p>
              <div className={`px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-sm ${copiedNumber === '01767515374' ? 'bg-green-100 text-green-600 border-2 border-green-200' : 'bg-slate-100 text-slate-500 border-2 border-slate-200 group-hover:bg-pink-50 group-hover:text-pink-500 group-hover:border-pink-200'}`}>
                {copiedNumber === '01767515374' ? '✓ Number Copied' : 'Click to Copy Number'}
              </div>
            </button>

            {/* Nagad Verified Card */}
            <button 
              onClick={() => copyToClipboard('01831814494')}
              className="w-full bg-white p-12 rounded-[3rem] border-4 border-orange-50 shadow-2xl flex flex-col items-center text-center group hover:border-orange-500 transition-all relative overflow-hidden active:scale-[0.98]"
            >
              <div className="absolute top-6 left-6 flex items-center gap-1.5 bg-orange-50 px-4 py-1.5 rounded-full border border-orange-100">
                <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Verified Merchant</span>
              </div>
              <div className="w-24 h-24 bg-orange-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-orange-200 mb-8 group-hover:-rotate-6 transition-transform">
                <span className="text-white font-black text-xl">Nagad</span>
              </div>
              <p className="text-xs text-slate-400 font-black uppercase tracking-[0.3em] mb-2">Personal Account (Official)</p>
              <p className="text-5xl font-black text-orange-600 tabular-nums tracking-tighter mb-601831814494">01831814494</p>
              <div className={`px-10 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-sm ${copiedNumber === '01831814494' ? 'bg-green-100 text-green-600 border-2 border-green-200' : 'bg-slate-100 text-slate-500 border-2 border-slate-200 group-hover:bg-orange-50 group-hover:text-orange-600 group-hover:border-orange-200'}`}>
                {copiedNumber === '01831814494' ? '✓ Number Copied' : 'Click to Copy Number'}
              </div>
            </button>
          </div>

          <div className="bg-slate-50 p-12 rounded-[3.5rem] border-2 border-white shadow-inner max-w-5xl mx-auto">
            <h5 className="text-3xl font-black text-slate-900 mb-10 flex items-center justify-center gap-4">{s.stepGuide}</h5>
            
            <form onSubmit={handleManualVerify} className="max-w-md mx-auto space-y-6">
              <input
                type="text"
                value={trxId}
                onChange={(e) => setTrxId(e.target.value.toUpperCase())}
                placeholder={s.verifyPlaceholder}
                className="w-full px-8 py-6 rounded-[2rem] border-4 border-slate-100 focus:border-blue-600 focus:outline-none text-xl font-black tabular-nums transition-all bg-white shadow-sm"
                required
              />
              {error && <p className="text-red-600 font-black text-center animate-bounce">{error}</p>}
              <button type="submit" className="w-full py-6 bg-slate-900 text-white font-black text-2xl rounded-[2.5rem] hover:bg-blue-600 shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4">
                {s.verifyBtn}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
