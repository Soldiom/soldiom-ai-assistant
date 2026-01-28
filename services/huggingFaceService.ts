const HF_TOKEN = process.env.HF_TOKEN;

async function query(model: string, data: any, contentType: string = "application/json") {
  if (!HF_TOKEN) {
    throw new Error("Missing HF_TOKEN environment variable. Please add your Hugging Face token.");
  }
  
  const response = await fetch(
    `https://api-inference.huggingface.co/models/${model}`,
    {
      headers: {
        Authorization: `Bearer ${HF_TOKEN}`,
        "Content-Type": contentType,
      },
      method: "POST",
      body: contentType === "application/json" ? JSON.stringify(data) : data,
    }
  );

  if (!response.ok) {
     const error = await response.text();
     // Try to parse error if json
     try {
       const jsonErr = JSON.parse(error);
       throw new Error(jsonErr.error || "Hugging Face API Error");
     } catch (e) {
       throw new Error(`HF API Error: ${response.status} ${response.statusText}`);
     }
  }
  return response;
}

export const generateImage = async (prompt: string): Promise<Blob> => {
    const response = await query("black-forest-labs/FLUX.1-schnell", { inputs: prompt });
    return await response.blob();
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
    // Determine content type based on blob or default to audio/wav
    const response = await query("openai/whisper-large-v3", audioBlob, audioBlob.type || "audio/wav");
    const result = await response.json();
    return result.text || "";
};

export const textToSpeech = async (text: string): Promise<Blob> => {
     const response = await query("facebook/mms-tts-eng", { inputs: text });
     return await response.blob();
};

export const translateText = async (text: string, src: string, tgt: string): Promise<string> => {
    // NLLB usually detects src, but good to be explicit if model supports it.
    // For Inference API simple usage: { inputs: text, parameters: { src_lang, tgt_lang } }
    const response = await query("facebook/nllb-200-distilled-600M", { 
        inputs: text, 
        parameters: { src_lang: src, tgt_lang: tgt } 
    });
    const result = await response.json();
    // API might return array or object
    return Array.isArray(result) ? result[0]?.translation_text : result?.translation_text;
};

export const generateCode = async (prompt: string): Promise<string> => {
    // StarCoder2 is a text generation model.
    const response = await query("bigcode/starcoder2-15b", { inputs: prompt });
    const result = await response.json();
    return Array.isArray(result) ? result[0]?.generated_text : result?.generated_text;
};

export const summarizeText = async (text: string): Promise<string> => {
    const response = await query("facebook/bart-large-cnn", { inputs: text });
    const result = await response.json();
    return Array.isArray(result) ? result[0]?.summary_text : result?.summary_text;
};
