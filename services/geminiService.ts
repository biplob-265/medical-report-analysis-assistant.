
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTIONS, CHAT_SYSTEM_INSTRUCTION } from "../constants";
import { Language } from "../types";

// Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeReport = async (
  base64Image: string, 
  mimeType: string, 
  lang: Language
) => {
  const prompt = `Analyze this medical report image. 
Language Requirement: Use simple Bangla (সহজ বাংলা). 
Term Formatting: Every English medical term MUST be followed by a Bangla explanation in brackets. 
Example: "Heart Rate (হৃদস্পন্দনের গতি)".
Instructions:
- Identify if it is Blood, Heart, Imaging (CT/MRI/USG), or Endoscopy.
- For Endoscopy: Explain ulcer, erosion, polyp, gastritis simply.
- For Imaging: Highlight findings like lesion, mass, cyst.
- For Blood/Heart: Explain markers and ranges.
- DO NOT diagnose. Use words like "may indicate".
- Structure: Summary, Key Findings, Possible Indications, Next Steps, and Disclaimer.
- Always conclude with the mandatory disclaimer.`;
  
  const systemInstruction = SYSTEM_INSTRUCTIONS.replace('{{LANGUAGE}}', lang === 'en' ? 'English' : 'Bangla');

  try {
    // When using generate content for text answers, use ai.models.generateContent to query GenAI with both the model name and prompt.
    // Fix: Updated contents to follow the recommended { parts: [...] } format for multimodal input.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // High intelligence for complex report analysis
      contents: {
        parts: [
          { text: prompt },
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType
            }
          }
        ]
      },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.1,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const startChat = (lang: Language) => {
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: CHAT_SYSTEM_INSTRUCTION,
      temperature: 0.7,
    }
  });
};
