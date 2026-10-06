export interface ValidationError {
  line?: number;
  message: string;
  severity: 'error' | 'warning';
  entity?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  entitiesFound: string[];
  relationshipsFound: number;
}

const VALID_JDL_TYPES = new Set([
  'String',
  'Integer',
  'Long',
  'BigDecimal',
  'Float',
  'Double',
  'Boolean',
  'LocalDate',
  'ZonedDateTime',
  'Instant',
  'Duration',
  'UUID',
  'Blob',
  'AnyBlob',
  'ImageBlob',
  'TextBlob',
]);

export function validateJdlContent(jdlText: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const lines = jdlText.split('\n');

  // 1. Balance de llaves
  let openBraces = 0;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === '{') openBraces++;
      if (ch === '}') openBraces--;
    }
    if (openBraces < 0) {
      errors.push({
        line: i + 1,
        message: 'Llave de cierre "}" inesperada o huérfana.',
        severity: 'error',
      });
      openBraces = 0;
    }
  }

  if (openBraces > 0) {
    errors.push({
      line: lines.length,
      message: `Faltan ${openBraces} llave(s) de cierre "}" en el archivo JDL.`,
      severity: 'error',
    });
  }

  // 2. Extraer Enums
  const enumsFound = new Set<string>();
  const enumRegex = /^\s*enum\s+([A-Z][a-zA-Z0-9_]*)\s*\{/gm;
  let match: RegExpExecArray | null;
  while ((match = enumRegex.exec(jdlText)) !== null) {
    enumsFound.add(match[1]);
  }

  // 3. Extraer Entidades y sus campos
  const entitiesFound = new Set<string>();
  // JHipster permite implícitamente la entidad 'User' del sistema de seguridad
  entitiesFound.add('User');

  const entityRegex = /^\s*entity\s+([A-Z][a-zA-Z0-9_]*)\s*\{([^}]*)\}/gms;
  while ((match = entityRegex.exec(jdlText)) !== null) {
    const entityName = match[1];
    entitiesFound.add(entityName);

    const body = match[2];
    const fieldLines = body.split('\n');
    const seenFieldsInEntity = new Set<string>();

    for (let idx = 0; idx < fieldLines.length; idx++) {
      const trimmed = fieldLines[idx].trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

      const tokens = trimmed.split(/\s+/);
      const fieldName = tokens[0];
      const fieldType = tokens[1];

      if (fieldName && fieldType) {
        if (seenFieldsInEntity.has(fieldName)) {
          errors.push({
            entity: entityName,
            message: `El campo "${fieldName}" está duplicado en la entidad "${entityName}".`,
            severity: 'error',
          });
        }
        seenFieldsInEntity.add(fieldName);

        if (!VALID_JDL_TYPES.has(fieldType) && !enumsFound.has(fieldType)) {
          warnings.push({
            entity: entityName,
            message: `El tipo "${fieldType}" del campo "${fieldName}" en "${entityName}" no es un tipo estándar de JDL ni un enum reconocido.`,
            severity: 'warning',
          });
        }
      }
    }
  }

  // 4. Analizar bloques de relaciones
  let relationshipsFound = 0;
  const relBlockRegex = /relationship\s+(OneToOne|OneToMany|ManyToOne|ManyToMany)\s*\{([^}]+)\}/gm;
  while ((match = relBlockRegex.exec(jdlText)) !== null) {
    const relType = match[1];
    const relBody = match[2];
    const relLines = relBody.split('\n');

    for (let rIdx = 0; rIdx < relLines.length; rIdx++) {
      const relLine = relLines[rIdx].trim();
      if (!relLine || relLine.startsWith('//')) continue;

      relationshipsFound++;

      // Formato: FromEntity{fromField} to ToEntity{toField}
      const toIndex = relLine.indexOf(' to ');
      if (toIndex === -1) {
        errors.push({
          message: `Sintaxis de relación inválida en bloque ${relType}: "${relLine}". Debe usar la palabra clave "to".`,
          severity: 'error',
        });
        continue;
      }

      const leftPart = relLine.substring(0, toIndex).trim();
      const rightPart = relLine.substring(toIndex + 4).trim();

      const fromEntity = leftPart.replace(/\{.*\}/, '').trim();
      const toEntity = rightPart.split(/\s+/)[0].replace(/\{.*\}/, '').trim();

      if (!entitiesFound.has(fromEntity)) {
        errors.push({
          message: `La relación "${relType}" hace referencia a la entidad origen "${fromEntity}", pero "${fromEntity}" no está definida.`,
          severity: 'error',
          entity: fromEntity,
        });
      }

      if (!entitiesFound.has(toEntity)) {
        errors.push({
          message: `La relación "${relType}" hace referencia a la entidad destino "${toEntity}", pero "${toEntity}" no está definida.`,
          severity: 'error',
          entity: toEntity,
        });
      }
    }
  }

  // 5. Verificar que existan entidades si no es un archivo vacío
  if (entitiesFound.size <= 1 && jdlText.trim().length > 0) {
    errors.push({
      message: 'No se encontraron entidades definidas en el JDL.',
      severity: 'error',
    });
  }

  // Remover 'User' de la lista mostrada si no fue explícitamente definida en el archivo
  const displayEntities = Array.from(entitiesFound).filter((e) => e !== 'User' || jdlText.includes('entity User'));

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    entitiesFound: displayEntities,
    relationshipsFound,
  };
}
