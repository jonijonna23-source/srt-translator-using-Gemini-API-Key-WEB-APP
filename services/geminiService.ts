import { GoogleGenerativeAI } from "@google/generative-ai";
import { SrtEntry } from "../types";

// Fungsi tambahan untuk memberikan jeda (delay)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const translateBatch = async (
  entries: SrtEntry[],
  targetLanguage: string,
  userApiKey: string, // Menerima API Key dari input user di App.tsx
  retryCount = 0
): Promise<string[]> => {
  
  // Inisialisasi menggunakan API Key yang diberikan user
  const genAI = new GoogleGenerativeAI(userApiKey);
  
  // Menggunakan gemini-1.5-flash (lebih cepat dan stabil untuk subtitle)
  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
        responseMimeType: "application/json",
    }
  });

  const prompt = `You are a professional movie subtitle translator. 
  Translate these subtitles into ${targetLanguage}.
  
  STRICT RULES:
  1. Use NATURAL, CONVERSATIONAL, and INFORMAL language (Slang is encouraged where appropriate).
  2. DO NOT translate word-for-word. Capture the emotion and context of the dialogue.
  3. If it's a joke or idiom, find an equivalent expression in ${targetLanguage}.
  4. Keep the translation concise to fit subtitle timing.
  5. Return ONLY a JSON array of strings.

  Subtitles to translate:
  ${JSON.stringify(entries.map(e => e.text))}`;

  try {
    // Jeda 2 detik untuk menghindari Rate Limit
    await sleep(2000); 

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Parsing hasil JSON dari Gemini
    const translatedTexts: string[] = JSON.parse(text);
    
    return translatedTexts;

  } catch (error: any) {
    // Penanganan Rate Limit (Error 429)
    if (error?.status === 429 && retryCount < 3) {
       console.warn(`Rate limit reached. Retrying (${retryCount + 1}/3)...`);
       await sleep(5000); 
       return translateBatch(entries, targetLanguage, userApiKey, retryCount + 1);
    }

    console.error("Gemini Translation Error:", error);
    throw new Error("Translation failed. The AI is busy or the API Key is invalid. Please wait a moment.");
  }
};