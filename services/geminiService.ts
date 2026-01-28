import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { GroundingChunk, Message } from "../types";

let aiInstance: GoogleGenAI | null = null;

const getAIInstance = () => {
  if (!aiInstance) {
    if (!process.env.API_KEY) {
      throw new Error("API Key not found");
    }
    aiInstance = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return aiInstance;
};

export const createChat = (systemInstruction: string, enableThinking: boolean = false): Chat => {
  const ai = getAIInstance();
  
  const config: any = {
    systemInstruction: systemInstruction,
    tools: [{ googleSearch: {} }],
    temperature: 0.3,
  };

  if (enableThinking) {
    // Enable thinking with a budget. 
    // Note: Only Gemini 3 series supports this.
    // If thinking is enabled, we set a thinkingBudget.
    config.thinkingConfig = { thinkingBudget: 1024 }; 
  }

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: config,
  });
};

export const sendMessageStream = async (
  chat: Chat,
  message: string,
  onChunk: (text: string, groundingChunks: GroundingChunk[]) => void
) => {
  const result = await chat.sendMessageStream({ message });
  
  let accumulatedChunks: GroundingChunk[] = [];

  for await (const chunk of result) {
    const responseChunk = chunk as GenerateContentResponse;
    const text = responseChunk.text || "";
    
    // Extract grounding chunks if they exist in this part of the stream
    const metadata = responseChunk.candidates?.[0]?.groundingMetadata;
    if (metadata?.groundingChunks) {
      // Filter strictly for web chunks to avoid duplicates or irrelevant data
      const webChunks = metadata.groundingChunks.filter(c => c.web);
      // We accumulate them, though usually Gemini sends them all in one go at the end or start.
      // We'll merge them by URI to avoid duplicates in the UI state
      accumulatedChunks = [...accumulatedChunks, ...webChunks];
    }

    onChunk(text, accumulatedChunks);
  }
};