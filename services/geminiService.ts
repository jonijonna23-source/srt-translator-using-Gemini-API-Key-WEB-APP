import { GoogleGenAI, Type } from "@google/genai";
import { SrtEntry } from "../types";

// Gunakan VITE_ untuk kompatibilitas Vercel & Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Fungsi tambahan untuk memberikan jeda (delay)
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const translateBatch = async (
  entries: SrtEntry[],
  targetLanguage: string,
  retryCount = 0 // Untuk melacak berapa kali sudah mencoba ulang
): Promise<string[]> => {
  
  const model = ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate the following subtitle lines into ${targetLanguage}. 
    Return ONLY the translations as a JSON array of strings in the exact same order. 
    Maintain the emotional tone and context of the conversation.
    
    Subtitles:
    ${entries.map((e, i) => `${i}: ${e.text}`).join('\n')}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.STRING
        }
      }
    }
  });

  try {
    // Tambahkan jeda 2 detik sebelum eksekusi agar tidak menumpuk (Rate Limit)
    await sleep(2000); 

    const result = await model;
    const jsonStr = result.text.trim();
    const translatedTexts: string[] = JSON.parse(jsonStr);
    
    return translatedTexts;

  } catch (error: any) {
    // Jika kena limit (Error 429), coba lagi otomatis setelah 5 detik
    if (error.status === 429 && retryCount < 3) {
       console.warn(`Rate limit kena. Mencoba ulang ke-${retryCount + 1}...`);
       await sleep(5000); 
       return translateBatch(entries, targetLanguage, retryCount + 1);
    }

    console.error("Gemini Translation Error:", error);
    throw new Error("Gagal translate. Google membatasi akses (Rate Limit). Tunggu sebentar lalu coba lagi.");
  }
};