import type { VercelRequest, VercelResponse } from '@vercel/node';

const MOCK_DB = {
  validIds: ['PREM123M', 'PREM123Y', 'SAVE500M', 'GOLD999Y'],
  usedIds: ['USED0000', 'OLD1234'],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { trxId } = req.body;

    if (!trxId) {
      return res.status(400).json({
        success: false,
        message: { en: 'Transaction ID is required.', bn: 'ট্রানজেকশন আইডি প্রয়োজন।' }
      });
    }

    const cleanTrx = trxId.trim().toUpperCase();

    if (MOCK_DB.usedIds.includes(cleanTrx)) {
      return res.status(409).json({
        success: false,
        message: { en: 'This ID has already been used.', bn: 'এই আইডিটি ইতিমধ্যে ব্যবহার করা হয়েছে।' }
      });
    }

    if (MOCK_DB.validIds.includes(cleanTrx)) {
      const plan = cleanTrx.endsWith('Y') ? 'yearly' : 'monthly';
      return res.status(200).json({
        success: true,
        plan,
        message: { en: 'Payment verified!', bn: 'পেমেন্ট সফলভাবে যাচাই করা হয়েছে!' }
      });
    }

    return res.status(404).json({
      success: false,
      message: { en: 'Transaction not found.', bn: 'ট্রানজেকশনটি পাওয়া যায়নি।' }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: { en: 'Server Error.', bn: 'সার্ভারে সমস্যা হয়েছে।' }
    });
  }
}