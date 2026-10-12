import { SystemAnalysis, SystemAnalysisSchema } from '../../types/schema.js';

export function extractAndValidateJson(rawText: string): SystemAnalysis {
  let cleaned = rawText.trim();
  
  // Eliminar posibles bloques markdown ```json ... ```
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/```\s*$/, '').trim();
  }

  // Si hay texto antes o después del JSON, extraer entre la primera llave { y la última }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);
    const validated = SystemAnalysisSchema.parse(parsed);
    return validated;
  } catch (error: any) {
    throw new Error(`Error al procesar la respuesta estructurada de la IA: ${error.message}. Texto recibido: ${cleaned.substring(0, 200)}...`);
  }
}

export function cleanJdlOutput(rawText: string): string {
  let cleaned = rawText.trim();

  // Buscar bloque ```jdl ... ``` o ``` ... ```
  const codeBlockMatch = cleaned.match(/```(?:jdl)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    return codeBlockMatch[1].trim();
  }

  // Si no hay bloques de comillas triples pero hay texto explicativo antes,
  // buscar desde la primera aparición de palabras clave de JDL: entity, enum, relationship, application
  const firstKeywordIndex = cleaned.search(/\b(entity|enum|relationship|application)\b/);
  if (firstKeywordIndex !== -1) {
    cleaned = cleaned.substring(firstKeywordIndex).trim();
  }

  // Eliminar posibles backticks residuales
  cleaned = cleaned.replace(/```/g, '').trim();

  return cleaned;
}
