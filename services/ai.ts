import { GoogleGenAI, Type } from "@google/genai";
import { ActivitySuggestion } from "../types";
import { getStoredApiKey } from "./storage";

// Helper to safely get env var without crashing in browser if process is undefined
const getEnvApiKey = () => {
  try {
    return typeof process !== 'undefined' && process.env ? process.env.API_KEY : undefined;
  } catch (e) {
    return undefined;
  }
};

const cleanJson = (text: string): string => {
  return text.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/```$/, '').trim();
};

export const suggestActivity = async (input: string): Promise<ActivitySuggestion | null> => {
  // Prioritize stored key, then env key
  const apiKey = getStoredApiKey() || getEnvApiKey();

  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Suggest a standardized activity name, point value, and category for a child's activity described as: "${input}". 
      If it sounds like a chore or good behavior, points should be positive (1-100). 
      If it sounds like a redemption (buying a toy, screen time), points should be negative.
      Be fair and consistent.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING, description: "A clean, short title for the activity (e.g. 'Washed Dishes')" },
            points: { type: Type.INTEGER, description: "The suggested point value (positive or negative)" },
            category: { 
              type: Type.STRING, 
              enum: ['chore', 'behavior', 'redemption', 'other'],
              description: "The category of the activity" 
            }
          },
          required: ["description", "points", "category"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    
    // Clean potential markdown formatting
    const cleanedText = cleanJson(text);
    return JSON.parse(cleanedText) as ActivitySuggestion;

  } catch (error) {
    console.error("Gemini AI Error:", error);
    return null;
  }
};

export const fetchLiveBankRates = async (): Promise<{ rates: Record<string, number>, sources: { title: string, uri: string }[] } | null> => {
  const apiKey = getStoredApiKey() || getEnvApiKey();
  if (!apiKey) return null;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const today = new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' });

    // Using gemini-3-flash-preview for search grounding tools
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Perform a Google Search to find the **highest available** 12-month Fixed Deposit (FD) interest rates for Maybank, CIMB Bank, and Public Bank in Malaysia as of today, ${today}.
      
      **CRITICAL:** Look specifically for **Promotional Rates**, **Campaign Special Rates**, or **e-FD** offers, as these are higher than standard board rates.
      If a promotional rate is available for a 12-month tenure (or close to it), use that rate. If no promotion is found, fallback to the board rate.
      
      Return the data as a JSON object where keys are the IDs ('mbank', 'cbank', 'ubank') and values are the rates as numbers (e.g., 3.65).`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mbank: { type: Type.NUMBER, description: "Best available 12-month FD rate (Promo/Board) for Maybank" },
            cbank: { type: Type.NUMBER, description: "Best available 12-month FD rate (Promo/Board) for CIMB" },
            ubank: { type: Type.NUMBER, description: "Best available 12-month FD rate (Promo/Board) for Public Bank" }
          },
          required: ["mbank", "cbank", "ubank"]
        }
      }
    });

    const text = response.text;
    if (!text) return null;

    // Clean potential markdown formatting
    const cleanedText = cleanJson(text);
    const rates = JSON.parse(cleanedText) as Record<string, number>;
    
    // Extract grounding chunks
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    // Extract web sources
    const sources = chunks
      .map((c: any) => c.web)
      .filter((w: any) => w)
      .map((w: any) => ({ title: w.title, uri: w.uri }));

    // De-duplicate sources by URI
    const uniqueSources = Array.from(new Map(sources.map((s:any) => [s.uri, s])).values()) as { title: string, uri: string }[];

    return { rates, sources: uniqueSources };

  } catch (error) {
    console.error("Gemini Live Rates Error:", error);
    return null;
  }
};