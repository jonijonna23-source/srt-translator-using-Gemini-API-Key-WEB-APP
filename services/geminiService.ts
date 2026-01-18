import { GoogleGenerativeAI } from "@google/generative-ai";

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const translateBatch = async (
  entries: { text: string }[],
  targetLanguage: string,
  apiKey: string // Sekarang menerima API Key dari input user
): Promise<string[]> => {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `You are a professional movie subtitle translator. 
  Translate the following subtitle lines into ${targetLanguage}.
  
  STRICT RULES:
  1. Use NATURAL, CONVERSATIONAL, and INFORMAL language (Slang is okay if context fits).
  2. DO NOT be literal. Translate the MEANING, not just words.
  3. Maintain the emotional tone of the scene.
  4. Return ONLY a JSON array of strings in the exact same order.
  
  Subtitles to translate:
  ${JSON.stringify(entries.map(e => e.text))}`;

  try {
    await sleep(2000); // Delay agar tidak limit
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Membersihkan string jika AI memberikan markdown ```json
    const cleanJson = text.replace(/```json|```/g, "");
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Translation Error:", error);
    throw error;
  }
};