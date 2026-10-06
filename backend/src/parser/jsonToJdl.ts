import { SystemAnalysis, Entity, Field, Relationship, EnumDefinition } from '../types/schema.js';

export interface JdlGenerationOptions {
  includeApplicationConfig?: boolean;
  baseName?: string;
  packageName?: string;
  authenticationType?: 'jwt' | 'session' | 'oauth2';
  databaseType?: 'sql';
  prodDatabaseType?: 'postgresql' | 'mysql' | 'mariadb';
  devDatabaseType?: 'h2Disk' | 'h2Memory';
  buildTool?: 'maven' | 'gradle';
  clientFramework?: 'angular' | 'react' | 'vue';
  includeDefaultOptions?: boolean; // dto, service, paginate
}

export function generateJdlFromAnalysis(
  analysis: SystemAnalysis,
  options: JdlGenerationOptions = {}
): string {
  const lines: string[] = [];

  // 1. Configuración de aplicación JHipster si se solicita
  if (options.includeApplicationConfig) {
    const appName = sanitizeIdentifier(options.baseName || analysis.systemName.toLowerCase() || 'myapp');
    lines.push('application {');
    lines.push('  config {');
    lines.push(`    baseName ${appName}`);
    lines.push(`    applicationType monolith`);
    lines.push(`    packageName ${options.packageName || 'com.mycompany.myapp'}`);
    lines.push(`    authenticationType ${options.authenticationType || 'jwt'}`);
    lines.push(`    prodDatabaseType ${options.prodDatabaseType || 'postgresql'}`);
    lines.push(`    devDatabaseType ${options.devDatabaseType || 'h2Disk'}`);
    lines.push(`    buildTool ${options.buildTool || 'maven'}`);
    lines.push(`    clientFramework ${options.clientFramework || 'react'}`);
    lines.push(`    testFrameworks []`);
    lines.push('  }');
    lines.push('  entities *');
    lines.push('}');
    lines.push('');
  }

  // 2. Enums
  if (analysis.enums && analysis.enums.length > 0) {
    for (const enumDef of analysis.enums) {
      lines.push(generateEnumJdl(enumDef));
      lines.push('');
    }
  }

  // 3. Entidades y sus campos
  for (const entity of analysis.entities) {
    lines.push(generateEntityJdl(entity));
    lines.push('');
  }

  // 4. Relaciones
  if (analysis.relationships && analysis.relationships.length > 0) {
    const relationshipsByType = groupRelationshipsByType(analysis.relationships);

    for (const [relType, relList] of Object.entries(relationshipsByType)) {
      lines.push(`relationship ${relType} {`);
      for (const rel of relList) {
        const fromEnt = sanitizeEntityName(rel.from);
        const toEnt = sanitizeEntityName(rel.to);
        const fromField = rel.fromField ? `{${sanitizeFieldName(rel.fromField)}}` : '';
        const toField = rel.toField ? `{${sanitizeFieldName(rel.toField)}}` : '';
        const requiredClause = rel.required ? ' required' : '';

        // Formato estándar JDL: EntidadOrigen{campoDestino} to EntidadDestino{campoOrigen}
        lines.push(`  ${fromEnt}${fromField} to ${toEnt}${toField}${requiredClause}`);
      }
      lines.push('}');
      lines.push('');
    }
  }

  // 5. Opciones por defecto para enriquecer el proyecto JHipster
  if (options.includeDefaultOptions !== false) {
    lines.push('// Opciones de arquitectura para JHipster');
    lines.push('dto * with mapstruct');
    lines.push('service * with serviceClass');
    lines.push('paginate * with pagination');
  }

  return lines.join('\n').trim() + '\n';
}

function generateEntityJdl(entity: Entity): string {
  const entityName = sanitizeEntityName(entity.name);
  const lines: string[] = [];

  if (entity.description) {
    lines.push(`/** ${entity.description} */`);
  }
  lines.push(`entity ${entityName} {`);

  for (const field of entity.fields) {
    const fieldName = sanitizeFieldName(field.name);
    const fieldType = sanitizeFieldType(field.type);
    const constraints: string[] = [];

    if (field.required) {
      constraints.push('required');
    }
    if (field.unique) {
      constraints.push('unique');
    }
    if (field.min !== undefined) {
      constraints.push(`min(${field.min})`);
    }
    if (field.max !== undefined) {
      constraints.push(`max(${field.max})`);
    }
    if (field.pattern) {
      constraints.push(`pattern(/${field.pattern}/)`);
    }

    const constraintStr = constraints.length > 0 ? ` ${constraints.join(' ')}` : '';
    lines.push(`  ${fieldName} ${fieldType}${constraintStr}`);
  }

  lines.push('}');
  return lines.join('\n');
}

function generateEnumJdl(enumDef: EnumDefinition): string {
  const enumName = sanitizeEntityName(enumDef.name);
  const values = enumDef.values.map((v) => sanitizeIdentifier(v).toUpperCase()).join(', ');
  return `enum ${enumName} {\n  ${values}\n}`;
}

function groupRelationshipsByType(relationships: Relationship[]): Record<string, Relationship[]> {
  const grouped: Record<string, Relationship[]> = {
    OneToMany: [],
    ManyToOne: [],
    ManyToMany: [],
    OneToOne: [],
  };

  for (const rel of relationships) {
    const typeKey = mapRelationshipType(rel.type);
    if (!grouped[typeKey]) {
      grouped[typeKey] = [];
    }
    grouped[typeKey].push(rel);
  }

  // Filtrar grupos vacíos
  const result: Record<string, Relationship[]> = {};
  for (const [key, val] of Object.entries(grouped)) {
    if (val.length > 0) {
      result[key] = val;
    }
  }
  return result;
}

function mapRelationshipType(type: string): string {
  switch (type.toLowerCase()) {
    case 'one-to-many':
    case 'onetomany':
      return 'OneToMany';
    case 'many-to-one':
    case 'manytoone':
      return 'ManyToOne';
    case 'many-to-many':
    case 'manytomany':
      return 'ManyToMany';
    case 'one-to-one':
    case 'onetoone':
      return 'OneToOne';
    default:
      return 'ManyToOne';
  }
}

export function sanitizeEntityName(name: string): string {
  // PascalCase: primera letra mayúscula, sin caracteres raros
  const clean = name.replace(/[^a-zA-Z0-9]/g, '');
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function sanitizeFieldName(name: string): string {
  // camelCase: primera letra minúscula
  const clean = name.replace(/[^a-zA-Z0-9]/g, '');
  return clean.charAt(0).toLowerCase() + clean.slice(1);
}

export function sanitizeIdentifier(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '');
}

export function sanitizeFieldType(type: string): string {
  const standardTypes: Record<string, string> = {
    string: 'String',
    text: 'String',
    number: 'Integer',
    int: 'Integer',
    integer: 'Integer',
    long: 'Long',
    bigdecimal: 'BigDecimal',
    float: 'Float',
    double: 'Double',
    boolean: 'Boolean',
    bool: 'Boolean',
    date: 'LocalDate',
    localdate: 'LocalDate',
    datetime: 'Instant',
    instant: 'Instant',
    zoneddatetime: 'ZonedDateTime',
    uuid: 'UUID',
    blob: 'Blob',
    imageblob: 'ImageBlob',
  };

  const lower = type.toLowerCase();
  if (standardTypes[lower]) {
    return standardTypes[lower];
  }
  // Podría ser un Enum en PascalCase
  return sanitizeEntityName(type);
}
