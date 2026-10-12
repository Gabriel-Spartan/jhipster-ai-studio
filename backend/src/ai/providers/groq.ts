import Groq from 'groq-sdk';
import { envConfig } from '../../config/env.js';
import { SystemAnalysis } from '../../types/schema.js';
import { SYSTEM_ANALYSIS_PROMPT, REPAIR_JDL_PROMPT } from '../prompt.js';
import { extractAndValidateJson, cleanJdlOutput } from './base.js';
import { AIProvider, AIProviderResponse } from '../types.js';

export class GroqProvider implements AIProvider {
  public readonly name = 'groq';
  public readonly model = envConfig.groq.model;
  private client: Groq | null = null;

  constructor() {
    if (envConfig.groq.apiKey) {
      this.client = new Groq({ apiKey: envConfig.groq.apiKey });
    }
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(this.client && envConfig.groq.apiKey.trim().length > 0);
  }

  async analyzeRequirements(userPrompt: string): Promise<AIProviderResponse> {
    if (!this.client) {
      throw new Error('Proveedor Groq no está configurado (falta GROQ_API_KEY).');
    }

    const startTime = Date.now();
    const chatCompletion = await this.client.chat.completions.create({
      messages: [
        { role: 'system', content: SYSTEM_ANALYSIS_PROMPT },
        { role: 'user', content: `Requisitos del sistema a modelar:\n"""\n${userPrompt}\n"""` },
      ],
      model: this.model,
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    const rawResponse = chatCompletion.choices[0]?.message?.content || '{}';
    const durationMs = Date.now() - startTime;
    const analysis = extractAndValidateJson(rawResponse);

    return {
      analysis,
      provider: 'Groq',
      model: this.model,
      durationMs,
      rawResponse,
    };
  }

  async repairJdl(currentJdl: string, validationErrors: string[], originalAnalysis: SystemAnalysis): Promise<string> {
    if (!this.client) {
      throw new Error('Proveedor Groq no está configurado.');
    }

    const prompt = `
Código JDL actual:
\`\`\`jdl
${currentJdl}
\`\`\`

Errores de validación detectados:
${validationErrors.map((e) => `- ${e}`).join('\n')}

Por favor corrige el código JDL para que sea válido y no tenga errores. Devuelve únicamente el JDL corregido.
`;

    const chatCompletion = await this.client.chat.completions.create({
      messages: [
        { role: 'system', content: REPAIR_JDL_PROMPT },
        { role: 'user', content: prompt },
      ],
      model: this.model,
      temperature: 0.1,
    });

    const rawText = chatCompletion.choices[0]?.message?.content || '';
    return cleanJdlOutput(rawText);
  }
}
