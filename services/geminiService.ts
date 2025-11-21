
import { GoogleGenAI, Type } from "@google/genai";
import { MultiverseNode, MultiverseTheme, FutureType } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const modelId = 'gemini-2.5-flash';

export const generateReflection = async (node: MultiverseNode): Promise<string> => {
  if (!apiKey) {
    return "API Key is missing. Please check your environment configuration.";
  }

  const prompt = `
    You are a critical design researcher and norm-critical facilitator (inspired by the Techne article "Designers in Multiverse").
    Your goal is to help a designer reflect on a specific "Future Self" they have visualized.
    
    The user has selected the following node in their multiverse map:
    Title: ${node.title}
    Type: ${node.type}
    Description: ${node.description}
    Core Principles: ${node.principles.join(', ')}

    Generate a concise, provocative, norm-critical reflection.
    It should challenge the assumptions embedded in this future.
    Use techniques like:
    - Backcasting (How did we get here?)
    - Dark Side analysis (Who suffers in this future?)
    - Excluded Voices (Who is not in the room?)

    Return ONLY the reflection text, max 3 sentences.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        temperature: 0.8,
      }
    });

    return response.text || "The multiverse is silent right now.";
  } catch (error) {
    console.error("Error generating reflection:", error);
    return "Static interference prevents a clear signal from the multiverse (API Error).";
  }
};

export const generateCulturalProbes = async (node: MultiverseNode): Promise<string[]> => {
  if (!apiKey) {
    return ["API Key missing. Imagine a probe here."];
  }
  
  const prompt = `
    Context: "Designers in Multiverse" - a reflective tool.
    The user is exploring a future self:
    Title: ${node.title}
    Description: ${node.description}
    Principles: ${node.principles.join(', ')}

    Generate 3 "Cultural Probe" assignments. These are small, creative, auto-ethnographic tasks for the designer to perform in their imagination or real life to better understand this future.
    Examples: "Draw the interface of your morning alarm," "Write a diary entry from 2040," "Photograph a sign of this future in today's streets."
    
    The output must be a JSON array of strings.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
      }
    });
    
    const text = response.text;
    if (!text) return ["The signal is weak."];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating probes:", error);
    return ["Static interference (API Error)."];
  }
};

export const generateMultiverseTheme = async (nodes: MultiverseNode[], selectedNode: MultiverseNode | null = null): Promise<MultiverseTheme | null> => {
  if (!apiKey) return null;

  // Extract context for the AI to base the colors on
  const contextSummary = nodes.map(n => `${n.type}: ${n.title} (${n.principles.join(', ')})`).join('\n');

  let focusText = "";
  if (selectedNode) {
    focusText = `
    The user is currently focusing on a specific timeline node:
    Title: ${selectedNode.title}
    Type: ${selectedNode.type}
    Description: ${selectedNode.description}
    
    Please let the aesthetic of this specific node heavily influence the overall theme, while still maintaining coherence for the rest of the multiverse.
    `;
  }

  const prompt = `
    You are an algorithmic art director. 
    Analyze the following set of "Multiverse Future Selves" created by a designer:
    
    ${contextSummary.slice(0, 2000)}... (truncated)

    ${focusText}

    Create a unique color theme that abstractly represents the mood, tension, and ethics of this specific multiverse.
    
    Return a JSON object with:
    1. "backgroundColor": A hex code for the deep space background (should be dark, e.g. #0a0a12, #1a0505, etc).
    2. "nodeColors": An object mapping each FutureType (ROOT, PROBABLE, PLAUSIBLE, POSSIBLE, PREPOSTEROUS) to a distinct hex color code.
    3. "uiAccentColor": A hex code for UI buttons/highlights.

    The colors should be cohesive but distinct enough to differentiate future types.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            backgroundColor: { type: Type.STRING },
            nodeColors: {
              type: Type.OBJECT,
              properties: {
                ROOT: { type: Type.STRING },
                PROBABLE: { type: Type.STRING },
                PLAUSIBLE: { type: Type.STRING },
                POSSIBLE: { type: Type.STRING },
                PREPOSTEROUS: { type: Type.STRING },
              },
              required: ['ROOT', 'PROBABLE', 'PLAUSIBLE', 'POSSIBLE', 'PREPOSTEROUS']
            },
            uiAccentColor: { type: Type.STRING }
          },
          required: ['backgroundColor', 'nodeColors', 'uiAccentColor']
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text) as MultiverseTheme;
  } catch (error) {
    console.error("Error generating theme:", error);
    return null;
  }
}
