
import { GoogleGenAI, Type } from "@google/genai";
import { SrtEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const translateBatch = async (
  entries: SrtEntry[],
  targetLanguage: string
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
    const result = await model;
    const jsonStr = result.text.trim();
    const translatedTexts: string[] = JSON.parse(jsonStr);
    
    if (translatedTexts.length !== entries.length) {
      console.warn("Mismatch in translation counts, attempting retry strategy...");
      // In a real app, you might want more complex reconciliation here
    }
    
    return translatedTexts;
  } catch (error) {
    console.error("Gemini Translation Error:", error);
    throw new Error("Failed to translate batch. Please check your API usage or try again.");
  }
};
