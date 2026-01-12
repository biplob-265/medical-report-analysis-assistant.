
export type VerificationResult = {
  success: boolean;
  message: { en: string; bn: string };
  plan?: 'monthly' | 'yearly';
};

/**
 * Communicates with the Netlify Backend Function.
 * Falls back to local mock logic if the function endpoint is unavailable.
 */
export const verifyTransaction = async (trxId: string): Promise<VerificationResult> => {
  try {
    const response = await fetch('/.netlify/functions/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trxId }),
    });

    if (response.ok || response.status === 400 || response.status === 409 || response.status === 404) {
      return await response.json();
    }
    
    throw new Error('Backend unavailable');
  } catch (err) {
    // FALLBACK LOGIC (For local development or if functions aren't deployed yet)
    console.warn("Using fallback verification logic...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const cleanTrx = trxId.trim().toUpperCase();
    
    // Demo IDs for testing without the real backend
    if (cleanTrx === 'PREM123M') return { success: true, plan: 'monthly', message: { en: 'Verified!', bn: 'যাচাই হয়েছে!' } };
    if (cleanTrx === 'PREM123Y') return { success: true, plan: 'yearly', message: { en: 'Verified!', bn: 'যাচাই হয়েছে!' } };
    if (cleanTrx === 'USED0000') return { success: false, message: { en: 'ID already used.', bn: 'আইডি ইতিমধ্যে ব্যবহৃত।' } };

    return {
      success: false,
      message: {
        en: "Transaction not found. Use PREM123M for testing.",
        bn: "ট্রানজেকশন পাওয়া যায়নি। টেস্ট করার জন্য PREM123M ব্যবহার করুন।"
      }
    };
  }
};
