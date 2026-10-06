import { GoogleGenerativeAI } from '@google/generative-ai';
import { envConfig } from '../../config/env.js';
import { SystemAnalysis } from '../../types/schema.js';
import { SYSTEM_ANALYSIS_PROMPT, REPAIR_JDL_PROMPT } from '../prompt.js';
import { extractAndValidateJson } from './base.js';
import { AIProvider, AIProviderResponse } from '../types.js';

export class GeminiProvider implements AIProvider {
  public readonly name = 'gemini';
  public readonly model = envConfig.gemini.model;
  private client: GoogleGenerativeAI | null = null;

  constructor() {
    if (envConfig.gemini.apiKey) {
      this.client = new GoogleGenerativeAI(envConfig.gemini.apiKey);
    }
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.client && envConfig.gemini.apiKey.trim().length > 0);
  }

  async analyzeRequirements(userPrompt: string): Promise<AIProviderResponse> {
    if (!this.client) {
      throw new Error('Proveedor Gemini no está configurado (falta GEMINI_API_KEY).');
    }

    const startTime = Date.now();
    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
      systemInstruction: SYSTEM_ANALYSIS_PROMPT,
    });

    const result = await model.generateContent(`Requisitos del sistema a modelar:\n"""\n${userPrompt}\n"""`);
    const rawResponse = result.response.text();
    const durationMs = Date.now() - startTime;

    const analysis = extractAndValidateJson(rawResponse);

    return {
      analysis,
      provider: 'Gemini',
      model: this.model,
      durationMs,
      rawResponse,
    };
  }

  async repairJdl(currentJdl: string, validationErrors: string[], originalAnalysis: SystemAnalysis): Promise<string> {
    if (!this.client) {
      throw new Error('Proveedor Gemini no está configurado.');
    }

    const model = this.client.getGenerativeModel({
      model: this.model,
      generationConfig: {
        temperature: 0.1,
      },
      systemInstruction: REPAIR_JDL_PROMPT,
    });

    const prompt = `
Código JDL actual:
\`\`\`jdl
${currentJdl}
\`\`\`

Errores de validación detectados:
${validationErrors.map((e) => `- ${e}`).join('\n')}

Por favor corrige el código JDL para que sea válido y no tenga errores. Devuelve únicamente el JDL corregido.
`;

    const result = await model.generateContent(prompt);
    let text = result.response.text().trim();
    if (text.startsWith('```jdl')) {
      text = text.replace(/^```jdl\s*/i, '').replace(/```\s*$/, '').trim();
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
    }
    return text;
  }
}
