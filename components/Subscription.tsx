
import React, { useState } from 'react';
import { Language, SubscriptionStatus } from '../types';
import { UI_STRINGS } from '../constants';
import { Card } from './Layout';

interface SubscriptionProps {
  lang: Language;
  onSuccess: (plan: 'monthly' | 'yearly') => void;
  status: SubscriptionStatus;
}

const Subscription: React.FC<SubscriptionProps> = ({ lang, onSuccess, status }) => {
  const [processing, setProcessing] = useState(false);
  const s = UI_STRINGS[lang];

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    setProcessing(true);
    
    // In a production environment, this triggers a fetch to your FastAPI backend:
    // const response = await fetch('/api/initiate-payment', { method: 'POST', body: JSON.stringify({ plan }) });
    // const data = await response.json();
    // window.location.href = data.payment_url; (This matches your Android Intent/Python request flow)

    try {
      // Simulating the backend request and redirection delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      // For this demo, we bypass the external redirect and trigger success
      onSuccess(plan);
    } catch (error) {
      console.error("Payment initialization failed", error);
    } finally {
      setProcessing(false);
    }
  };

  if (status.isPremium) {
    return (
      <Card className="p-12 text-center bg-green-50 border-green-100 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-green-200">
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-4xl font-black text-green-900 mb-3 tracking-tight">{s.paymentSuccess}</h2>
        <p className="text-green-700 text-xl font-bold">
          {lang === 'bn' 
            ? `আপনার ${status.plan === 'yearly' ? 'বার্ষিক' : 'মাসিক'} সাবস্ক্রিপশন এখন সচল আছে।` 
            : `Your ${status.plan} subscription is fully active.`}
        </p>
        <div className="mt-8 p-6 bg-white/60 rounded-3xl inline-block border-2 border-green-200 shadow-sm">
          <p className="text-green-800 font-black text-lg">
            {lang === 'bn' ? 'মেয়াদ শেষ হবে:' : 'Valid until:'} {status.expiryDate ? new Date(status.expiryDate).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-12">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">{s.pricingTitle}</h2>
        <p className="text-slate-500 text-xl font-medium leading-relaxed">
          {lang === 'bn' 
            ? 'সহজ এবং পরিষ্কার ব্যাখ্যা পেতে আজই প্রিমিয়ামে যোগ দিন।' 
            : 'Unlock unlimited deep analysis and priority AI assistance.'}
        </p>
      </div>

      {processing ? (
        <Card className="p-24 text-center space-y-10 shadow-2xl">
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 border-8 border-slate-100 rounded-full"></div>
              <div className="w-24 h-24 border-8 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
          </div>
          <div className="space-y-4">
            <p className="text-3xl font-black text-slate-900">{s.processingPayment}</p>
            <p className="text-slate-500 text-lg font-bold">Please do not close this window...</p>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-10">
          {/* Monthly */}
          <Card className="p-10 border-2 border-slate-100 hover:border-blue-400 transition-all flex flex-col justify-between group bg-white shadow-xl hover:shadow-blue-50">
            <div>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-3xl font-black text-slate-900">{s.monthly}</h3>
                <span className="bg-slate-100 text-slate-600 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Standard</span>
              </div>
              <p className="text-6xl font-black text-blue-600 mb-10 tracking-tighter">{s.priceMonthly}</p>
              <ul className="space-y-5 mb-12 text-slate-600 font-bold text-lg">
                <li className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-[10px] font-black">✓</div>
                  Unlimited Report Analysis
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-[10px] font-black">✓</div>
                  24/7 Medical Info Chat
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-[10px] font-black">✓</div>
                  Full History Access
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleSubscribe('monthly')}
              className="w-full py-6 bg-slate-900 text-white font-black text-xl rounded-2xl hover:bg-blue-600 shadow-2xl transition-all active:scale-[0.98]"
            >
              {s.subscribe}
            </button>
          </Card>

          {/* Yearly */}
          <Card className="p-10 border-4 border-blue-600 relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-blue-100 bg-white scale-[1.02]">
            <div className="absolute top-8 right-[-45px] bg-blue-600 text-white text-[12px] font-black px-14 py-2 rotate-45 shadow-lg uppercase tracking-widest">Popular</div>
            <div>
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-3xl font-black text-slate-900">{s.yearly}</h3>
                <span className="bg-blue-100 text-blue-600 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest">Premium</span>
              </div>
              <p className="text-6xl font-black text-blue-600 mb-10 tracking-tighter">{s.priceYearly}</p>
              <ul className="space-y-5 mb-12 text-slate-700 font-black text-lg">
                <li className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">✓</div>
                  All Standard Features
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">✓</div>
                  Advanced Voice AI Access
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-[10px] font-black">✓</div>
                  Direct PDF Generation
                </li>
              </ul>
            </div>
            <button
              onClick={() => handleSubscribe('yearly')}
              className="w-full py-6 bg-blue-600 text-white font-black text-xl rounded-2xl hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-[0.98]"
            >
              {s.subscribe}
            </button>
          </Card>
        </div>
      )}

      {/* Footer Branding */}
      <div className="pt-16 border-t-2 border-slate-100 border-dashed">
        <p className="text-center text-slate-400 font-black text-xs mb-10 uppercase tracking-[0.3em]">Authorized Payment via aamarPay</p>
        <div className="flex justify-center items-center gap-12 opacity-80 transition-all flex-wrap px-8">
          <div className="flex items-center gap-2">
             <div className="w-4 h-4 rounded-full bg-pink-500 shadow-sm shadow-pink-200"></div>
             <span className="font-black text-2xl text-pink-600 tracking-tighter">bKash</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-4 h-4 rounded-full bg-orange-500 shadow-sm shadow-orange-200"></div>
             <span className="font-black text-2xl text-orange-600 tracking-tighter">Nagad</span>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-4 h-4 rounded-full bg-red-500 shadow-sm shadow-red-200"></div>
             <span className="font-black text-2xl text-red-600 tracking-tighter">Rocket</span>
          </div>
          <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" className="h-5 grayscale hover:grayscale-0 transition-all" />
          <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-10 grayscale hover:grayscale-0 transition-all" />
        </div>
      </div>
    </div>
  );
};

export default Subscription;
