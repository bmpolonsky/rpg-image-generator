
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { LoreFile, GenerationMode } from "../types";
import { STYLES, MODE_CONFIG } from "../config/prompts";

export class AIController {
  
  static async generateVisualDescription(
    loreFiles: LoreFile[],
    userRequest: string,
    sketchBase64: string | null,
    model: string,
    mode: GenerationMode,
    styleKey: string = 'realistic'
  ): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const loreContext = loreFiles
        .map((f) => `--- File: ${f.name} ---\n${f.content}\n`)
        .join("\n");

      const selectedStyle = STYLES[styleKey] || STYLES.realistic;
      const config = MODE_CONFIG[mode];

      const sketchInstruction = sketchBase64 
        ? `3. Sketch: ${config.sketchInterpretation} Use it as the primary structure.`
        : `3. Sketch: No sketch provided. Generate based on text solely.`;

      const prompt = `
        Role: ${config.role}
        
        Task: Write a highly detailed visual prompt for an image generation AI.
        
        Input Context:
        1. World Lore: History and atmosphere.
        2. User Request: ${userRequest}
        ${sketchInstruction}

        Instructions:
        - Analyze the Lore to ensure consistency (race, culture, biome).
        - Combine Lore + Request into a vivid description.
        - VIEWPOINT: ${config.viewpoint}
        - NEGATIVE CONSTRAINTS: ${config.negative}
        - ART STYLE: ${selectedStyle}
        - FOCUS: ${config.focus}
        
        IMPORTANT OUTPUT RULES (STRICT):
        1. OUTPUT LANGUAGE MUST BE ENGLISH ONLY. Even if input is Russian.
        2. OUTPUT RAW TEXT ONLY. 
        3. ABSOLUTELY NO INTRODUCTIONS (e.g., "Here is the prompt", "Below is...").
        4. NO MARKDOWN HEADERS, NO conversational filler.
        5. JUST RETURN THE PROMPT TEXT.
        
        User Request: "${userRequest}"

        Lore Content:
        ${loreContext}
      `;

      const parts: any[] = [{ text: prompt }];

      if (sketchBase64) {
          parts.unshift({
              inlineData: {
                mimeType: "image/png",
                data: sketchBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, ""),
              },
          });
      }

      const response: GenerateContentResponse = await ai.models.generateContent({
        model: model, 
        contents: { parts },
      });

      return response.text || "Failed to generate description.";
    } catch (error: any) {
      console.error("Error generating description:", error);
      throw new Error(error.message || "Unknown error");
    }
  }

  static async generateNarrativeText(
    loreFiles: LoreFile[],
    userRequest: string,
    mode: GenerationMode,
    language: 'ru' | 'en' = 'en'
  ): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      const loreContext = loreFiles
        .map((f) => `--- File: ${f.name} ---\n${f.content}\n`)
        .join("\n");

      const prompt = `
        Role: Expert Dungeon Master and Storyteller.
        Task: Write a short, immersive, atmospheric description of the following scene to be read aloud to players.
        
        Context:
        Mode: ${mode}
        User Request: "${userRequest}"
        
        Lore Context (Optional, use if relevant):
        ${loreContext}
        
        Instructions:
        1. LANGUAGE: The user prefers language: "${language === 'ru' ? 'Russian' : 'English'}". Write your response in THIS language.
        2. TONE: Immersive, sensory (smells, sounds, lighting), and dramatic.
        3. LENGTH: 1-2 paragraphs. Concise but evocative.
        4. CONTENT: Describe what the characters see/feel. Do not mention "polygons" or "pixels". Treat it as real.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: { text: prompt },
      });

      return response.text || "";
    } catch (error) {
      console.error("Narrative Gen Error:", error);
      return "";
    }
  }

  static async generateSingleImage(
    description: string,
    sketchBase64: string | null,
    model: string,
    mode: GenerationMode,
    styleKey: string = 'realistic'
  ): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const selectedStyle = STYLES[styleKey] || STYLES.realistic;
      const config = MODE_CONFIG[mode];

      let finalPrompt = `
        STYLE: ${selectedStyle}
        VIEWPOINT: ${config.viewpoint}

        VISUAL DESCRIPTION:
        ${description}
        
        INSTRUCTIONS:
        1. RENDER: High quality art matching the style and perspective.
      `;

      if (sketchBase64) {
          finalPrompt += `
          INPUT INTERPRETATION:
          The attached image is a strict layout/pose guide on a black background.
          ${config.sketchInterpretation}
          2. GEOMETRY/POSE: Follow the white lines of the sketch exactly for placement/pose.
          3. CLEANUP: Replace the white sketch lines with realistic high-quality art. DO NOT leave the white lines visible.
          `;
      }

      const parts: any[] = [{ text: finalPrompt }];
      
      if (sketchBase64) {
           parts.unshift({
              inlineData: {
                mimeType: "image/png",
                data: sketchBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, ""),
              },
           });
      }

      const response = await ai.models.generateContent({
        model: model,
        contents: { parts },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
      
      throw new Error("No image data returned from API");
    } catch (error: any) {
      console.error("Error generating image:", error);
      throw new Error(error.message || "Unknown error");
    }
  }

  static async editProjectImage(
    currentImageBase64: string,
    editPrompt: string,
    model: string,
    mode: GenerationMode,
    styleKey: string = 'realistic'
  ): Promise<string> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const selectedStyle = STYLES[styleKey] || STYLES.realistic;
      const config = MODE_CONFIG[mode];
      
      const enhancedPrompt = `
      Edit this Image: ${editPrompt}. 
      STRICT CONSTRAINT: Maintain the original perspective (${config.viewpoint}).
      STYLE: ${selectedStyle}.
      Maintain original layout/pose. High quality, seamless blend.
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: "image/png",
                data: currentImageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, ""),
              },
            },
            { text: enhancedPrompt },
          ],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }

      throw new Error("No image data returned from API");
    } catch (error: any) {
      console.error("Error editing image:", error);
      throw new Error(error.message || "Unknown error");
    }
  }
}
