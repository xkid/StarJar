import { GoogleGenAI, Type } from "@google/genai";
import { ActivitySuggestion } from "../types";
import { getStoredApiKey } from "./storage";

export const suggestActivity = async (input: string): Promise<ActivitySuggestion | null> => {
  // Prioritize stored key, then env key
  const apiKey = getStoredApiKey() || process.env.API_KEY;

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
    return JSON.parse(text) as ActivitySuggestion;

  } catch (error) {
    console.error("Gemini AI Error:", error);
    return null;
  }
};
