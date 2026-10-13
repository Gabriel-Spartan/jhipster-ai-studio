import { AIProviderRouter } from '../src/ai/router.js';
import fs from 'fs';
import path from 'path';

async function test() {
  const router = new AIProviderRouter();
  const invalidJdl = fs.readFileSync(path.resolve(__dirname, '../../fixtures/invalid.jdl'), 'utf-8');
  const errors = [
    'Faltan 1 llave(s) de cierre "}" en el archivo JDL.',
    'La relación "OneToMany" hace referencia a la entidad origen "Usuario", pero "Usuario" no está definida.'
  ];
  try {
    console.log('Testing repairJdl with auto router...');
    const result = await router.repairJdl('auto', invalidJdl, errors, { systemName: 'Test', entities: [], relationships: [], observations: [] });
    console.log('--- REPAIRED JDL RESULT ---');
    console.log(result);
  } catch (e: any) {
    console.error('Error during repair:', e.message || e);
  }
}
test();
