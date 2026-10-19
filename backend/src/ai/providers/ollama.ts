import { envConfig } from '../../config/env.js';
import { SystemAnalysis } from '../../types/schema.js';
import { SYSTEM_ANALYSIS_PROMPT, REPAIR_JDL_PROMPT } from '../prompt.js';
import { extractAndValidateJson, cleanJdlOutput } from './base.js';
import { AIProvider, AIProviderResponse } from '../types.js';

export class OllamaProvider implements AIProvider {
  public readonly name = 'ollama';
  public readonly model = envConfig.ollama.model;
  private baseUrl = envConfig.ollama.baseUrl;

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(2000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene la lista de modelos descargados localmente en Ollama.
   * Funciona idénticamente en Linux y Windows a través de la API REST local.
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(2500),
      });
      if (!response.ok) return [];
      const data: any = await response.json();
      if (Array.isArray(data.models)) {
        return data.models.map((m: any) => m.name).filter(Boolean);
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Resuelve el modelo a utilizar si no se pasa una anulación explícita.
   * Si el modelo configurado existe, se usa; de lo contrario toma el primer modelo descargado.
   */
  async resolveModelToUse(modelOverride?: string): Promise<string> {
    if (modelOverride && modelOverride.trim().length > 0) {
      return modelOverride.trim();
    }
    const models = await this.getAvailableModels();
    if (models.includes(this.model)) {
      return this.model;
    }
    if (models.length > 0) {
      return models[0];
    }
    return this.model;
  }

  async analyzeRequirements(userPrompt: string, modelOverride?: string): Promise<AIProviderResponse> {
    const available = await this.isAvailable();
    if (!available) {
      throw new Error(`Ollama no está disponible en ${this.baseUrl}. Asegúrate de que el servicio de Ollama esté ejecutándose.`);
    }

    const activeModel = await this.resolveModelToUse(modelOverride);
    const startTime = Date.now();
    const response = await fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: activeModel,
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
      throw new Error(`Error en Ollama (${activeModel}): ${response.status} ${response.statusText}`);
    }

    const data: any = await response.json();
    const rawResponse = data.response || '{}';
    const durationMs = Date.now() - startTime;
    const analysis = extractAndValidateJson(rawResponse);

    return {
      analysis,
      provider: 'Ollama',
      model: activeModel,
      durationMs,
      rawResponse,
    };
  }

  async repairJdl(
    currentJdl: string,
    validationErrors: string[],
    originalAnalysis: SystemAnalysis,
    modelOverride?: string
  ): Promise<string> {
    const activeModel = await this.resolveModelToUse(modelOverride);
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
        model: activeModel,
        system: REPAIR_JDL_PROMPT,
        prompt,
        stream: false,
        options: {
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Error en Ollama repair (${activeModel}): ${response.statusText}`);
    }

    const data: any = await response.json();
    const rawText = (data.response || '').trim();
    return cleanJdlOutput(rawText);
  }
}
