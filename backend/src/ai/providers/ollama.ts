import { envConfig } from '../../config/env.js';
import { SystemAnalysis } from '../../types/schema.js';
import { SYSTEM_ANALYSIS_PROMPT, REPAIR_JDL_PROMPT } from '../prompt.js';
import { extractAndValidateJson } from './base.js';
import { AIProvider, AIProviderResponse } from '../types.js';

export class OllamaProvider implements AIProvider {
  public readonly name = 'ollama';
  public readonly model = envConfig.ollama.model;
  private baseUrl = envConfig.ollama.baseUrl;

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(1500),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async analyzeRequirements(userPrompt: string): Promise<AIProviderResponse> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error(`Ollama no está disponible en ${this.baseUrl}. Asegúrate de que el servicio de Ollama esté ejecutándose.`);
    }

    const startTime = Date.now();
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        system: SYSTEM_ANALYSIS_PROMPT,
        prompt: `Requisitos del sistema a modelar:\n"""\n${userPrompt}\n"""`,
        format: 'json',
        stream: false,
        options: {
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en Ollama: ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    const rawResponse = data.response || '{}';
    const durationMs = Date.now() - startTime;
    const analysis = extractAndValidateJson(rawResponse);

    return {
      analysis,
      provider: 'Ollama',
      model: this.model,
      durationMs,
      rawResponse,
    };
  }

  async repairJdl(currentJdl: string, validationErrors: string[], originalAnalysis: SystemAnalysis): Promise<string> {
    const prompt = `
Código JDL actual:
\`\`\`jdl
${currentJdl}
\`\`\`

Errores de validación detectados:
${validationErrors.map((e) => `- ${e}`).join('\n')}

Por favor corrige el código JDL para que sea válido y no tenga errores. Devuelve únicamente el JDL corregido.
`;

    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        system: REPAIR_JDL_PROMPT,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en Ollama repair: ${response.statusText}`);
    }

    const data: any = await response.json();
    let text = (data.response || '').trim();
    if (text.startsWith('```jdl')) {
      text = text.replace(/^```jdl\s*/i, '').replace(/```\s*$/, '').trim();
    } else if (text.startsWith('```')) {
      text = text.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
    }
    return text;
  }
}
