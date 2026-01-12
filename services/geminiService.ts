
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_INSTRUCTIONS, CHAT_SYSTEM_INSTRUCTION } from "../constants";
import { Language } from "../types";

// Note: Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key.

export const analyzeReport = async (
  base64Image: string, 
  mimeType: string, 
  lang: Language
) => {
  // Always use a new GoogleGenAI instance for requests.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

MANDATORY STRUCTURE:
You must use these exact headers for your response:
### SUMMARY
### KEY FINDINGS
### EXPLANATIONS
### RECOMMENDATIONS
### DISCLAIMER

Always conclude with the mandatory disclaimer text.`;
  
  const systemInstruction = SYSTEM_INSTRUCTIONS.replace('{{LANGUAGE}}', lang === 'en' ? 'English' : 'Bangla');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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

// Added startChat to resolve the missing export error in ChatBot.tsx
export const startChat = (lang: Language) => {
  // Always use a new GoogleGenAI instance for requests.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = CHAT_SYSTEM_INSTRUCTION + "\nRequested language: " + (lang === 'en' ? 'English' : 'Bangla');
  
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: systemInstruction,
    },
  });
};
