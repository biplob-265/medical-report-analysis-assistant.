
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
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const s = UI_STRINGS[lang];

  const handleSubscribe = async (plan: 'monthly' | 'yearly') => {
    setProcessing(true);
    
    try {
      // Simulating backend payment gateway delay
      await new Promise(resolve => setTimeout(resolve, 2500));
      onSuccess(plan);
    } catch (error) {
      console.error("Payment initialization failed", error);
    } finally {
      setProcessing(false);
    }
  };

  const copyToClipboard = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
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
    <div className="space-y-12 animate-in fade-in duration-700 pb-12">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-5xl font-black text-slate-900 tracking-tighter mb-4">{s.pricingTitle}</h2>
        <p className="text-slate-500 text-xl font-medium leading-relaxed">
          {lang === 'bn' 
            ? 'গভীর বিশ্লেষণ এবং সীমাহীন এআই সুবিধার জন্য আজই প্রিমিয়ামে যোগ দিন।' 
            : 'Get deep insights and unlimited AI features with MediClarify Premium.'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Standard Payment Plans */}
        <Card className={`p-10 border-2 transition-all flex flex-col justify-between group bg-white shadow-xl ${processing ? 'opacity-50 pointer-events-none' : 'hover:border-blue-400 hover:shadow-blue-50'}`}>
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
            onClick={() => handleSubscribe('monthly')}
            className="w-full py-6 bg-slate-900 text-white font-black text-xl rounded-2xl hover:bg-blue-600 shadow-2xl transition-all active:scale-[0.98]"
          >
            {processing ? s.processingPayment : s.subscribe}
          </button>
        </Card>

        <Card className={`p-10 border-4 border-blue-600 relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-blue-100 bg-white scale-[1.02] ${processing ? 'opacity-50 pointer-events-none' : ''}`}>
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
            onClick={() => handleSubscribe('yearly')}
            className="w-full py-6 bg-blue-600 text-white font-black text-xl rounded-2xl hover:bg-blue-700 shadow-2xl shadow-blue-200 transition-all active:scale-[0.97]"
          >
            {processing ? s.processingPayment : s.subscribe}
          </button>
        </Card>
      </div>

      {/* Manual Payment Channels - Elevated with high visibility */}
      <div className="pt-12">
        <div className="bg-white rounded-[3rem] p-12 border-2 border-slate-100 shadow-2xl relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl">
            {lang === 'bn' ? 'সরাসরি পেমেন্ট গেটওয়ে' : 'Manual Payment Channels'}
          </div>
          
          <div className="text-center mb-10 mt-4">
            <h4 className="text-3xl font-black text-slate-800 mb-2">
              {lang === 'bn' ? 'বিকাশ বা নগদ-এ পেমেন্ট করুন' : 'Pay via bKash or Nagad'}
            </h4>
            <p className="text-slate-400 font-bold text-lg">
              {lang === 'bn' 
                ? 'নিচের নাম্বারে সেন্ড মানি করুন এবং অটোমেটিক সক্রিয় হওয়ার জন্য অপেক্ষা করুন।' 
                : 'Send money to the numbers below for manual account activation.'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* bKash Payment Card */}
            <div className="relative group">
              <div className="absolute inset-0 bg-pink-500 rounded-[2.5rem] blur-xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <button 
                onClick={() => copyToClipboard('01767515374')}
                className="w-full bg-white p-10 rounded-[2.5rem] border-2 border-pink-50 shadow-xl flex flex-col items-center text-center group hover:border-pink-500 transition-all relative overflow-hidden"
              >
                <div className="w-20 h-20 bg-pink-500 rounded-3xl flex items-center justify-center shadow-xl shadow-pink-200 mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-white font-black text-lg">bKash</span>
                </div>
                <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Personal Account</p>
                <p className="text-4xl font-black text-pink-600 tabular-nums tracking-tighter mb-4">01767515374</p>
                <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${copiedNumber === '01767515374' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400 group-hover:bg-pink-50 group-hover:text-pink-500'}`}>
                  {copiedNumber === '01767515374' ? '✓ Number Copied' : 'Click to Copy Number'}
                </div>
              </button>
            </div>

            {/* Nagad Payment Card */}
            <div className="relative group">
              <div className="absolute inset-0 bg-orange-500 rounded-[2.5rem] blur-xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <button 
                onClick={() => copyToClipboard('01831814494')}
                className="w-full bg-white p-10 rounded-[2.5rem] border-2 border-orange-50 shadow-xl flex flex-col items-center text-center group hover:border-orange-500 transition-all relative overflow-hidden"
              >
                <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center shadow-xl shadow-orange-200 mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-white font-black text-lg">Nagad</span>
                </div>
                <p className="text-xs text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Personal Account</p>
                <p className="text-4xl font-black text-orange-600 tabular-nums tracking-tighter mb-4">01831814494</p>
                <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${copiedNumber === '01831814494' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-600'}`}>
                  {copiedNumber === '01831814494' ? '✓ Number Copied' : 'Click to Copy Number'}
                </div>
              </button>
            </div>
          </div>

          <div className="mt-16 text-center border-t border-slate-100 pt-10">
            <p className="text-slate-400 font-bold text-sm uppercase tracking-[0.2em] mb-6">Secured by Industry Standard Gateways</p>
            <div className="flex justify-center items-center gap-10 grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700">
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" className="h-4" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-8" />
              <div className="text-slate-800 font-black text-lg italic tracking-tighter">aamarPay</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
