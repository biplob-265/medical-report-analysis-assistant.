
import { Handler } from '@netlify/functions';

/**
 * Mock Database of Transaction IDs
 * In a real-world scenario, this would be a database like MongoDB or PostgreSQL.
 */
const MOCK_DB = {
  validIds: ['PREM123M', 'PREM123Y', 'SAVE500M', 'GOLD999Y'],
  usedIds: ['USED0000', 'OLD1234'],
};

export const handler: Handler = async (event) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { trxId } = JSON.parse(event.body || '{}');

    if (!trxId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: { en: 'Transaction ID is required.', bn: 'ট্রানজেকশন আইডি প্রয়োজন।' } }),
      };
    }

    const cleanTrx = trxId.trim().toUpperCase();

    // 1. Check Format
    const isValidFormat = /^[A-Z0-9]{8,12}$/.test(cleanTrx);
    if (!isValidFormat) {
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, message: { en: 'Invalid format. Use 8-12 alphanumeric characters.', bn: 'সঠিক ফরম্যাট নয়। ৮-১২ অক্ষরের আইডি দিন।' } }),
      };
    }

    // 2. Check if already used
    if (MOCK_DB.usedIds.includes(cleanTrx)) {
      return {
        statusCode: 409,
        body: JSON.stringify({ success: false, message: { en: 'This ID has already been used.', bn: 'এই আইডিটি ইতিমধ্যে ব্যবহার করা হয়েছে।' } }),
      };
    }

    // 3. Check if exists in "Valid" IDs
    const isActuallyValid = MOCK_DB.validIds.includes(cleanTrx);

    if (isActuallyValid) {
      const plan = cleanTrx.endsWith('Y') ? 'yearly' : 'monthly';
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          plan,
          message: { en: 'Payment verified!', bn: 'পেমেন্ট সফলভাবে যাচাই করা হয়েছে!' }
        }),
      };
    }

    // 4. Default: Not Found
    return {
      statusCode: 404,
      body: JSON.stringify({
        success: false,
        message: { en: 'Transaction not found. Please wait 5 mins or check the ID.', bn: 'ট্রানজেকশনটি পাওয়া যায়নি। ৫ মিনিট অপেক্ষা করুন অথবা আইডি চেক করুন।' }
      }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: { en: 'Server Error.', bn: 'সার্ভারে সমস্যা হয়েছে।' } }),
    };
  }
};
