import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const generateQuizQuestions = async (text: string, count: number = 30) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate ${count} multiple-choice questions based on the following text. Each question should have 4 options (A, B, C, D), a correct answer, and an explanation. Return the result in JSON format matching the schema provided.`,
    config: {
      systemInstruction: "You are an expert academic examiner. Your goal is to create high-quality, challenging multiple-choice questions that test deep understanding.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            correctAnswer: { type: Type.STRING, description: "The full text of the correct option" },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctAnswer", "explanation"]
        }
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateSummary = async (text: string) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Summarize the following text for a student. Include key concepts, definitions, and a set of 5-10 flashcards (Question/Answer pairs). Return the result in JSON format.`,
    config: {
      systemInstruction: "You are a helpful teaching assistant helping students revise. Create concise and clear summaries.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          keyConcepts: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          flashcards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING }
              },
              required: ["question", "answer"]
            }
          }
        },
        required: ["summary", "keyConcepts", "flashcards"]
      }
    }
  });

  return JSON.parse(response.text);
};
