
export type VerificationResult = {
  success: boolean;
  message: { en: string; bn: string };
  plan?: 'monthly' | 'yearly';
};

/**
 * Simulates a backend API call to verify manual payment transaction IDs.
 * In a real app, this would query bKash/Nagad gateway APIs or a database.
 */
export const verifyTransaction = async (trxId: string): Promise<VerificationResult> => {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const cleanTrx = trxId.trim().toUpperCase();

  // Basic validation: Transaction IDs are usually 8-12 characters alphanumeric
  const isValidFormat = /^[A-Z0-9]{8,12}$/.test(cleanTrx);

  if (!isValidFormat) {
    return {
      success: false,
      message: {
        en: "Invalid Transaction ID format. Please check your SMS and try again.",
        bn: "ট্রানজেকশন আইডির ফরম্যাট সঠিক নয়। আপনার এসএমএস চেক করে আবার চেষ্টা করুন।"
      }
    };
  }

  // Mock "Already Used" logic for a specific ID
  if (cleanTrx === "USED1234") {
    return {
      success: false,
      message: {
        en: "This Transaction ID has already been used for another account.",
        bn: "এই ট্রানজেকশন আইডিটি ইতিমধ্যে অন্য একটি অ্যাকাউন্টে ব্যবহৃত হয়েছে।"
      }
    };
  }

  // Logic to determine plan based on ID suffix (Mock logic)
  // For demo: IDs ending in 'Y' are yearly, others are monthly
  const plan: 'monthly' | 'yearly' = cleanTrx.endsWith('Y') ? 'yearly' : 'monthly';

  // For simulation purposes: 90% success rate for valid-looking IDs
  const isMockApproved = Math.random() > 0.1;

  if (isMockApproved) {
    return {
      success: true,
      message: {
        en: "Transaction verified successfully!",
        bn: "ট্রানজেকশন সফলভাবে যাচাই করা হয়েছে!"
      },
      plan
    };
  } else {
    return {
      success: false,
      message: {
        en: "Transaction not found. It may take up to 5 minutes to sync. Please try later.",
        bn: "ট্রানজেকশনটি খুঁজে পাওয়া যায়নি। সিঙ্ক হতে ৫ মিনিট সময় লাগতে পারে। পরে আবার চেষ্টা করুন।"
      }
    };
  }
};
