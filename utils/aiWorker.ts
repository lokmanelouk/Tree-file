import { GoogleGenAI } from "@google/genai";

self.onmessage = async (e) => {
  // 1. Extract apiKey from the message sent by React
  const { apiKey, model, contents, config } = e.data;
  
  try {
    if (!apiKey) {
      throw new Error("API Key missing. Please check your .env file.");
    }

    // 2. Initialize AI with the passed key
    const ai = new GoogleGenAI({ apiKey });
    
    const responseStream = await ai.models.generateContentStream({
      model,
      contents,
      config,
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (typeof text === "string" && text) {
        self.postMessage({ type: 'chunk', text: text });
      }
    }
    
    self.postMessage({ type: 'complete' });
  } catch (error: any) {
    self.postMessage({ 
      type: 'error', 
      message: error.message || 'Neural logic error.' 
    });
  }
};