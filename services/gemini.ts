
import { GoogleGenAI, Type } from "@google/genai";
import { NoteFormat, ProcessingResult } from "../types";

const API_KEY = process.env.API_KEY || "";

export const processAudioToNotes = async (
  base64Audio: string,
  mimeType: string,
  format: NoteFormat
): Promise<ProcessingResult> => {
  if (!API_KEY) {
    throw new Error("API Key is missing. Please ensure it's configured in the environment.");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const prompt = `
    Analyze the provided lecture audio.
    1. Transcribe the audio content accurately.
    2. Generate clean, high-quality study notes based on the lecture.
    
    Format the notes strictly as ${format === NoteFormat.BULLET ? 'a detailed bulleted list' : 'a well-structured series of paragraphs'}.
    
    Return the response in JSON format with exactly two fields:
    - "transcription": The full transcribed text.
    - "notes": The generated study notes.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Audio,
            mimeType: mimeType,
          },
        },
        { text: prompt },
      ],
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          transcription: { type: Type.STRING },
          notes: { type: Type.STRING },
        },
        required: ["transcription", "notes"],
      },
    },
  });

  if (!response.text) {
    throw new Error("Failed to receive content from the AI model.");
  }

  try {
    const json = JSON.parse(response.text);
    return {
      transcription: json.transcription,
      notes: json.notes,
      format: format
    };
  } catch (err) {
    console.error("JSON Parsing Error:", err);
    throw new Error("Failed to parse the AI response.");
  }
};
