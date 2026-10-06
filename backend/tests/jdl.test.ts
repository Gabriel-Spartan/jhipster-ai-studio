import { describe, it, expect } from 'vitest';
import { generateJdlFromAnalysis, sanitizeEntityName, sanitizeFieldName } from '../src/parser/jsonToJdl.js';
import { validateJdlContent } from '../src/validator/jdlValidator.js';
import { SystemAnalysis } from '../src/types/schema.js';

describe('JDL Generator & Sanitizer', () => {
  it('debe sanitizar nombres de entidades a PascalCase', () => {
    expect(sanitizeEntityName('libro_prestamo')).toBe('Libroprestamo');
    expect(sanitizeEntityName('autor')).toBe('Autor');
  });

  it('debe sanitizar nombres de campos a camelCase', () => {
    expect(sanitizeFieldName('Fecha_Nacimiento')).toBe('fechaNacimiento');
    expect(sanitizeFieldName('titulo')).toBe('titulo');
  });

  it('debe generar código JDL determinista a partir de un JSON válido', () => {
    const analysis: SystemAnalysis = {
      systemName: 'Biblioteca',
      entities: [
        {
          name: 'Libro',
          fields: [
            { name: 'titulo', type: 'String', required: true },
            { name: 'precio', type: 'BigDecimal', required: false, min: 0 },
          ],
        },
        {
          name: 'Autor',
          fields: [{ name: 'nombre', type: 'String', required: true }],
        },
      ],
      relationships: [
        {
          from: 'Autor',
          to: 'Libro',
          type: 'one-to-many',
          description: 'Un autor tiene varios libros',
        },
      ],
      observations: ['⚠ Prueba'],
    };

    const jdl = generateJdlFromAnalysis(analysis);
    expect(jdl).toContain('entity Libro');
    expect(jdl).toContain('titulo String required');
    expect(jdl).toContain('precio BigDecimal min(0)');
    expect(jdl).toContain('relationship OneToMany');
    expect(jdl).toContain('Autor to Libro');
  });
});

describe('JDL Validator', () => {
  it('debe validar con éxito un JDL correcto', () => {
    const validJdl = `
entity Libro {
  titulo String required
  paginas Integer
}

entity Autor {
  nombre String required
}

relationship OneToMany {
  Autor to Libro
}
`;
    const result = validateJdlContent(validJdl);
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.entitiesFound).toContain('Libro');
    expect(result.entitiesFound).toContain('Autor');
    expect(result.relationshipsFound).toBe(1);
  });

  it('debe detectar entidades no definidas en las relaciones', () => {
    const invalidJdl = `
entity Libro {
  titulo String required
}

// Usuario no está definida
relationship OneToMany {
  Usuario to Libro
}
`;
    const result = validateJdlContent(invalidJdl);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('Usuario') && e.message.includes('no está definida'))).toBe(true);
  });

  it('debe detectar llaves desbalanceadas', () => {
    const invalidJdl = `
entity Libro {
  titulo String
`;
    const result = validateJdlContent(invalidJdl);
    expect(result.isValid).toBe(false);
    expect(result.errors.some((e) => e.message.includes('llave'))).toBe(true);
  });
});
