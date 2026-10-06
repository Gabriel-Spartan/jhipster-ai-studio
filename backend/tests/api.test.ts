import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { generateJdlFromAnalysis } from '../src/parser/jsonToJdl.js';
import { validateJdlContent } from '../src/validator/jdlValidator.js';

describe('Demo Fixtures Integration Tests', () => {
  const fixturesDir = path.resolve(__dirname, '../../fixtures');

  it('debe validar el fixture de Biblioteca y generar JDL válido', () => {
    const raw = fs.readFileSync(path.join(fixturesDir, 'library.json'), 'utf-8');
    const analysis = JSON.parse(raw);

    const jdl = generateJdlFromAnalysis(analysis);
    const validation = validateJdlContent(jdl);

    expect(validation.isValid).toBe(true);
    expect(validation.entitiesFound).toContain('Usuario');
    expect(validation.entitiesFound).toContain('Libro');
    expect(validation.entitiesFound).toContain('Autor');
    expect(validation.entitiesFound).toContain('Prestamo');
    expect(validation.relationshipsFound).toBeGreaterThanOrEqual(3);
  });

  it('debe validar el fixture de Veterinaria y generar JDL válido', () => {
    const raw = fs.readFileSync(path.join(fixturesDir, 'veterinary.json'), 'utf-8');
    const analysis = JSON.parse(raw);

    const jdl = generateJdlFromAnalysis(analysis);
    const validation = validateJdlContent(jdl);

    expect(validation.isValid).toBe(true);
    expect(validation.entitiesFound).toContain('Cliente');
    expect(validation.entitiesFound).toContain('Mascota');
    expect(validation.entitiesFound).toContain('Veterinario');
    expect(validation.entitiesFound).toContain('Cita');
    expect(validation.entitiesFound).toContain('Tratamiento');
  });

  it('debe validar el fixture de Inventario y generar JDL válido', () => {
    const raw = fs.readFileSync(path.join(fixturesDir, 'inventory.json'), 'utf-8');
    const analysis = JSON.parse(raw);

    const jdl = generateJdlFromAnalysis(analysis);
    const validation = validateJdlContent(jdl);

    expect(validation.isValid).toBe(true);
    expect(validation.entitiesFound).toContain('Producto');
    expect(validation.entitiesFound).toContain('Categoria');
    expect(validation.entitiesFound).toContain('Proveedor');
    expect(validation.entitiesFound).toContain('Inventario');
    expect(validation.entitiesFound).toContain('Movimiento');
  });

  it('debe detectar los errores del caso inválido obligatorio', () => {
    const invalidJdl = fs.readFileSync(path.join(fixturesDir, 'invalid.jdl'), 'utf-8');
    const validation = validateJdlContent(invalidJdl);

    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    // Debe haber error por Usuario no definida o por llaves
    expect(
      validation.errors.some((e) => e.message.includes('Usuario') || e.message.includes('llave'))
    ).toBe(true);
  });
});
