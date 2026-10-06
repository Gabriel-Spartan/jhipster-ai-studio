# PROMPT MAESTRO — Desarrollo del prototipo JHipster + IA + JDL

## Contexto general

Objetivo: **JHipster** como herramienta de generación de aplicaciones, complementándolo con una capa de inteligencia artificial que permita transformar una descripción escrita en lenguaje natural en un **modelo JDL candidato**, validarlo y posteriormente utilizarlo con JHipster para generar una aplicación funcional.

La herramienta principal de la actividad es **JHipster**. La inteligencia artificial es una extensión desarrollada por el grupo para facilitar la creación del modelo JDL; no debe sustituir a JHipster ni convertirse en un generador independiente de miles de líneas de código.

Repositorio oficial de referencia de JHipster:

`https://github.com/jhipster/generator-jhipster/tree/main`

El repositorio oficial debe utilizarse principalmente como **referencia técnica** para comprender comandos, JDL, generadores y mecanismos de integración. **No debes realizar un fork ni modificar el núcleo de JHipster salvo que exista una necesidad técnica real y previamente justificada.**

El objetivo es construir una capa independiente que prepare, valide y entregue el JDL a JHipster utilizando mecanismos oficiales.

---

# 1. Objetivo funcional del prototipo

El sistema debe permitir realizar el siguiente flujo:

```text
Usuario describe un sistema
        ↓
Selecciona motor de IA
Auto / Gemini / Groq / Ollama
        ↓
IA analiza la descripción
        ↓
Representación estructurada
Entidades + atributos + relaciones + observaciones
        ↓
Usuario revisa el análisis
        ↓
Generación de JDL candidato
        ↓
Validación del JDL
        ↓
Corrección o revisión si existen errores
        ↓
Aprobación humana
        ↓
JHipster
        ↓
Generación de aplicación
        ↓
Frontend + backend + BD + API + seguridad + pruebas
```

El prototipo debe ser suficientemente estable para utilizarse en una exposición en vivo con compañeros de clase.

---

# 2. Principios obligatorios

Debes respetar estos principios durante todo el desarrollo.

## 2.1 JHipster es la herramienta central

La IA no genera directamente el proyecto completo.

La IA debe encargarse principalmente de:

- interpretar requisitos;
- detectar entidades;
- detectar atributos;
- proponer tipos de datos;
- detectar relaciones;
- detectar validaciones cuando sean explícitas o razonablemente inferibles;
- detectar ambigüedades;
- generar una representación estructurada;
- producir un JDL candidato.

JHipster será responsable de generar la aplicación.

## 2.2 Human-in-the-loop

Nunca debes pasar directamente el resultado de la IA a JHipster sin mostrarlo primero al usuario.

Flujo obligatorio:

```text
IA
→ análisis
→ JDL candidato
→ validación
→ revisión humana
→ aprobación
→ JHipster
```

## 2.3 No ocultar incertidumbre

Si el requerimiento es ambiguo, la aplicación debe mostrar una observación.

Ejemplo:

```text
⚠ No se especificó si un libro puede tener varios autores.
```

No inventes silenciosamente decisiones importantes.

## 2.4 No exponer API keys

Gemini/Groq u otras credenciales deben permanecer en backend/configuración segura.

Nunca enviar API keys al navegador.

## 2.5 Independencia del proveedor

La generación JDL no debe quedar acoplada directamente a Gemini o Groq.

Crear una abstracción de proveedor.

Conceptualmente:

```text
AIProvider
├── GeminiProvider
├── GroqProvider
└── OllamaProvider
```

y:

```text
AIProviderRouter
```

para `Auto`.

## 2.6 Degradación segura

Si una API falla:

- mostrar un error entendible;
- permitir cambiar de proveedor;
- conservar la descripción ingresada;
- no perder el JDL que ya haya sido generado;
- no bloquear el uso manual del sistema.

---

# 3. Alcance exacto de V1 del prototipo

Implementar únicamente lo necesario para una demostración académica robusta.

## Debe incluir

- interfaz web;
- área para escribir descripción del sistema;
- selector de motor IA;
- modo `Automático`;
- Gemini;
- Groq;
- Ollama local;
- análisis estructurado;
- entidades;
- atributos;
- relaciones;
- observaciones/ambigüedades;
- generación de JDL;
- editor/visor de JDL;
- validación de JDL;
- capacidad de regenerar;
- capacidad de editar manualmente;
- aprobación humana;
- integración con JHipster;
- generación de una aplicación;
- visualización clara de estados y errores;
- casos demo;
- documentación de instalación;
- configuración mediante `.env.example`;
- pruebas básicas;
- modo de contingencia para la exposición.

## No es necesario para V1

- sistema complejo de usuarios;
- base de datos propia del asistente;
- historial multiusuario;
- pagos;
- despliegue cloud automático;
- sistema de permisos avanzado;
- múltiples workspaces;
- almacenamiento permanente complejo;
- analítica avanzada;
- aplicación móvil;
- microservicios del propio prototipo;
- modificación interna profunda de JHipster;
- entrenamiento de modelos.

Mantén el prototipo pequeño, claro y confiable.

---

# 4. Arquitectura recomendada

Antes de programar, inspecciona el entorno y decide una arquitectura simple.

Se recomienda separar:

```text
Frontend
   ↓
Backend API
   ↓
AIProviderRouter
   ├── Gemini
   ├── Groq
   └── Ollama
   ↓
Structured Analysis
   ↓
JDL Generator
   ↓
JDL Validator
   ↓
JHipster Adapter
```

El backend debe encargarse de:

- acceso a proveedores IA;
- protección de claves;
- validación;
- generación JDL;
- ejecución controlada de comandos JHipster si se decide automatizar esa etapa.

El frontend debe encargarse de:

- captura del requerimiento;
- selector de motor;
- mostrar resultados;
- permitir edición;
- mostrar errores;
- solicitar validación;
- solicitar generación con JHipster.

---

# 5. Selector de Motor de IA

La interfaz debe mostrar:

```text
Motor de IA
[ Automático ▼ ]

Automático
Gemini
Groq
Ollama local
```

No llamarlo simplemente "Modelo", porque Groq y Ollama no representan exactamente lo mismo que una familia de modelos.

## 5.1 Automático

Implementar una política simple y explícita.

Ejemplo:

1. leer proveedores configurados;
2. comprobar disponibilidad;
3. priorizar proveedor gratuito/configurado;
4. usar el primero disponible;
5. si falla, intentar fallback permitido;
6. informar qué proveedor/modelo terminó utilizándose.

Nunca seleccionar silenciosamente un proveedor de pago si no está permitido por configuración.

La interfaz debe indicar:

- proveedor usado;
- modelo usado, cuando sea conocido;
- duración aproximada de la generación;
- error si el proveedor falla.

---

# 6. Configuración de proveedores

Definir variables en `.env.example`.

Ejemplo conceptual:

```env
AI_DEFAULT_PROVIDER=auto

GEMINI_API_KEY=
GEMINI_MODEL=

GROQ_API_KEY=
GROQ_MODEL=

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=
```

No colocar valores reales.

Crear validación de configuración.

Si un proveedor no está configurado, debe aparecer como:

```text
No disponible
```

o quedar deshabilitado.

---

# 7. Representación estructurada antes del JDL

No pedir al modelo únicamente:

> "Devuelve JDL".

Primero solicitar una estructura JSON validable.

Diseña un esquema similar a:

```json
{
  "systemName": "Biblioteca",
  "entities": [
    {
      "name": "Libro",
      "fields": [
        {
          "name": "titulo",
          "type": "String",
          "required": true,
          "constraints": []
        }
      ]
    }
  ],
  "relationships": [
    {
      "from": "Autor",
      "to": "Libro",
      "type": "one-to-many",
      "description": "Un autor puede tener varios libros"
    }
  ],
  "observations": [
    "No se especificó si un libro puede tener más de un autor"
  ]
}
```

El formato exacto puedes mejorarlo, pero debe existir validación mediante schema.

No confiar en texto libre del LLM para construir el JDL.

---

# 8. Generación de entidades

La IA debe intentar detectar:

- nombre;
- entidades;
- atributos;
- tipos compatibles con JDL;
- campos obligatorios;
- validaciones;
- enumeraciones si se justifican.

No agregar docenas de atributos que no estén presentes ni puedan deducirse razonablemente.

Si no hay suficiente información, mantener el modelo mínimo y generar una observación.

---

# 9. Relaciones

Soportar como mínimo:

- OneToOne;
- OneToMany;
- ManyToOne;
- ManyToMany.

La aplicación debe mostrar las relaciones en formato entendible antes del JDL.

Ejemplo:

```text
Cliente 1 ---- N Pedido
Pedido 1 ---- N DetallePedido
Producto 1 ---- N DetallePedido
```

Mostrar también la representación técnica.

---

# 10. Observaciones y ambigüedades

Esta función es importante para la exposición.

El sistema debe incluir una sección:

```text
Observaciones
```

Ejemplos:

```text
⚠ No se especificó si un préstamo puede renovarse.
⚠ No está claro si un libro puede tener más de un autor.
⚠ No se indicó si los pagos pueden ser parciales.
```

El objetivo es mostrar que la IA no debe inventar silenciosamente requisitos.

---

# 11. Generación de JDL

La generación de JDL debe realizarse preferentemente de forma determinista desde el JSON estructurado.

Es decir:

```text
LLM
↓
JSON válido
↓
JDL Generator determinista
↓
JDL
```

Evitar:

```text
LLM
↓
texto JDL sin estructura
```

si es posible.

Esto mejora reproducibilidad y validación.

El usuario debe poder ver y editar el JDL antes de continuar.

---

# 12. Editor de JDL

Crear una vista que permita:

- visualizar JDL;
- copiar;
- editar;
- descargar `.jdl`;
- regenerar;
- validar;
- restablecer a la última versión generada.

Añadir resaltado de sintaxis solo si no complica excesivamente el prototipo.

---

# 13. Validación de JDL

Esta etapa es obligatoria.

Debe existir un:

```text
JDLValidator
```

La validación debe comprobar tanto como resulte viable usando mecanismos oficiales de JHipster/JDL.

Objetivos:

- sintaxis válida;
- entidades válidas;
- tipos soportados;
- relaciones coherentes;
- opciones compatibles;
- referencias existentes.

Si JHipster proporciona parser/validator reutilizable, priorizarlo.

No crear un parser completo desde cero si existe una herramienta oficial adecuada.

Mostrar errores de forma comprensible.

Ejemplo:

```text
Error:
La entidad "Prestamo" hace referencia a "Usuario",
pero "Usuario" no está definida.

Línea aproximada: 24
```

---

# 14. Corrección del JDL

Si la validación falla, ofrecer:

```text
[Editar manualmente]
[Intentar corregir con IA]
```

La corrección automática debe recibir:

- JDL actual;
- error de validación;
- representación estructurada original.

Limitar intentos automáticos para evitar ciclos infinitos.

Por ejemplo:

```text
MAX_REPAIR_ATTEMPTS=2
```

Después, exigir edición humana.

---

# 15. Aprobación humana

Antes de ejecutar JHipster debe existir un botón explícito similar a:

```text
[Usar este JDL con JHipster]
```

No ejecutar JHipster automáticamente apenas termine la IA.

---

# 16. Integración con JHipster

Investiga la forma oficial y más estable de utilizar JDL con la versión instalada.

Prioridades:

1. mecanismos oficiales de JHipster;
2. CLI;
3. APIs/utilidades internas estables si son adecuadas;
4. evitar modificar el core.

El prototipo debe permitir, al menos, exportar un `.jdl` válido.

Idealmente también permitir:

```text
Generar proyecto
```

desde la propia interfaz/backend.

Si ejecutar JHipster desde el backend introduce demasiada complejidad o riesgos para la demo, mantener ambas opciones:

```text
Opción A — descargar JDL
Opción B — generar automáticamente en entorno controlado
```

Documentar claramente qué opción quedó implementada.

---

# 17. Ejecución controlada de JHipster

Si implementas ejecución automática:

- no aceptar comandos shell arbitrarios del usuario;
- utilizar un comando predefinido;
- validar el nombre/ruta del proyecto;
- crear directorio temporal/controlado;
- capturar stdout/stderr;
- mostrar progreso;
- definir timeout;
- evitar path traversal;
- no ejecutar con privilegios elevados.

Los comandos deben estar definidos por la aplicación, no por el LLM.

---

# 18. Pantallas mínimas

## Pantalla 1 — Inicio

Debe explicar brevemente:

```text
Describe tu sistema y genera un modelo JDL para JHipster.
```

Elementos:

- textarea;
- ejemplos rápidos;
- selector Motor IA;
- botón `Analizar sistema`.

## Pantalla 2 — Análisis

Mostrar:

- nombre del sistema;
- entidades;
- atributos;
- relaciones;
- observaciones;
- proveedor/modelo utilizado.

Acciones:

```text
Editar descripción
Regenerar
Generar JDL
```

## Pantalla 3 — JDL

Mostrar:

- editor;
- estado de validación;
- errores;
- botones de corrección;
- descargar `.jdl`;
- continuar a JHipster.

## Pantalla 4 — JHipster / Generación

Mostrar:

- estado;
- pasos;
- logs resumidos;
- resultado;
- ubicación/descarga del proyecto si aplica.

No es necesario crear un dashboard complejo.

---

# 19. Estados de interfaz

Implementar correctamente:

- idle;
- loading;
- success;
- warning;
- validation error;
- provider unavailable;
- timeout;
- JHipster error.

Nunca dejar un spinner infinito sin explicación.

---

# 20. Ejemplos rápidos

Incluir prompts predefinidos.

## Biblioteca

```text
Crear un sistema de biblioteca que permita gestionar usuarios,
libros, autores y préstamos. Un autor puede escribir varios libros,
un usuario puede realizar varios préstamos y cada préstamo corresponde
a un libro.
```

## Clínica veterinaria

```text
Crear un sistema para una clínica veterinaria que gestione clientes,
mascotas, veterinarios, citas y tratamientos.
```

## Inventario

```text
Crear un sistema de inventario que gestione productos, categorías,
proveedores, existencias y movimientos de inventario.
```

Añadir botones tipo:

```text
Usar ejemplo
```

---

# 21. Práctica que debe soportar el prototipo

La aplicación será utilizada por compañeros durante la exposición.

La práctica será:

> **Del requisito a una aplicación en aproximadamente 20 minutos.**

Debe ser fácil hacer:

```text
Descripción
→ IA
→ revisión
→ JDL
→ validación
→ mini-reto
→ regeneración
→ JHipster
```

La interfaz debe optimizarse para este escenario.

---

# 22. Mini-retos

Preparar soporte para modificar fácilmente el requerimiento.

Ejemplos:

### Biblioteca

```text
Ahora un libro puede tener varios autores.
```

### Hotel

```text
Añadir servicios adicionales a una reserva.
```

### Veterinaria

```text
Una mascota puede recibir varios tratamientos.
```

### Tienda

```text
Un pedido debe contener varios productos.
```

La herramienta debe permitir regenerar conservando el flujo entendible.

---

# 23. Comparación de motores

Debe ser posible usar el mismo prompt con dos proveedores diferentes.

No hace falta desarrollar un módulo estadístico complejo.

Basta con permitir:

```text
Prompt
→ Gemini
→ resultado A

Prompt
→ Groq
→ resultado B
```

y que los resultados puedan visualizarse/copiarse para comparación durante la exposición.

Si implementar comparación simultánea añade demasiada complejidad, permitir generar de forma sucesiva y conservar el resultado anterior temporalmente.

---

# 24. Modo demostración y contingencia

Esta aplicación se utilizará en una exposición.

Debe ser resistente a fallos.

Implementar o documentar:

## Contingencia 1

Si Gemini falla:

```text
Auto → Groq / Ollama
```

## Contingencia 2

Si todos los proveedores fallan:

- permitir pegar/cargar JSON estructurado preparado;
- o cargar un JDL preparado.

## Contingencia 3

Si JHipster tarda demasiado:

- disponer de proyecto previamente generado.

## Contingencia 4

Si no hay Internet:

- Ollama si está preparado;
- ejemplos JDL locales;
- proyecto de respaldo.

Añadir una carpeta de demo/fixtures con ejemplos estables.

---

# 25. Casos de prueba obligatorios

Probar como mínimo:

## Caso A — Biblioteca

Debe generar:

- Usuario;
- Libro;
- Autor;
- Prestamo;
- relaciones coherentes.

## Caso B — Clínica veterinaria

Debe manejar:

- Cliente;
- Mascota;
- Veterinario;
- Cita;
- Tratamiento.

## Caso C — Inventario

Debe manejar:

- Producto;
- Categoria;
- Proveedor;
- Inventario;
- Movimiento.

No hardcodear estos dominios.

Son fixtures de evaluación.

---

# 26. Caso inválido obligatorio

Crear al menos una prueba donde:

- el JDL sea inválido;
- el validador detecte el error;
- la interfaz informe el problema;
- el usuario pueda corregirlo.

Esto se utilizará para demostrar que la herramienta no confía ciegamente en la IA.

---

# 27. Seguridad mínima

Cumplir:

- claves solo backend;
- `.env` ignorado por Git;
- `.env.example` sin secretos;
- validación de input;
- límites razonables de tamaño de prompt;
- sanitización de nombres de proyecto;
- no shell arbitrario;
- no exposición de stack traces al usuario;
- logs sin API keys.

---

# 28. Logs

Registrar información útil para depuración:

- provider solicitado;
- provider realmente usado;
- modelo;
- duración;
- éxito/error;
- validación JDL;
- ejecución de JHipster.

Nunca registrar claves completas.

---

# 29. Testing

Implementar pruebas proporcionales al prototipo.

Como mínimo:

## Unitarias

- transformación JSON → JDL;
- selección Auto;
- validaciones auxiliares;
- sanitización.

## Integración

- provider mocked → análisis estructurado;
- análisis → JDL;
- JDL → validator.

## Casos manuales documentados

- biblioteca;
- clínica;
- inventario;
- proveedor caído;
- JDL inválido;
- Ollama no disponible;
- generación JHipster.

Las pruebas normales no deben gastar créditos reales innecesariamente.

Mockear proveedores cuando corresponda.

---

# 30. Documentación requerida

Crear un `README.md` claro con:

1. descripción;
2. requisitos;
3. instalación;
4. variables de entorno;
5. configuración Gemini;
6. configuración Groq;
7. configuración Ollama;
8. instalación/configuración JHipster;
9. cómo ejecutar frontend/backend;
10. cómo usar el asistente;
11. cómo generar JDL;
12. cómo validar;
13. cómo generar con JHipster;
14. troubleshooting;
15. casos demo;
16. limitaciones conocidas.

Crear también:

```text
.env.example
```

y si resulta útil:

```text
docs/DEMO.md
```

con el flujo exacto para la exposición.

---

# 31. Flujo de demo que debe quedar probado

Debe poder demostrarse así:

```text
1. Abrir aplicación
2. Elegir Automático
3. Cargar ejemplo "Clínica veterinaria"
4. Analizar
5. Mostrar entidades
6. Mostrar relaciones
7. Mostrar observaciones
8. Generar JDL
9. Validar JDL
10. Aprobar
11. Ejecutar/entregar a JHipster
12. Mostrar aplicación generada
```

Preparar también el mismo flujo para biblioteca.

---

# 32. UX de la demo

La audiencia no es necesariamente experta en JHipster.

Por ello:

- evitar pantallas saturadas;
- mostrar nombres entendibles;
- usar estados claros;
- explicar qué ocurre en cada etapa;
- incluir pequeñas ayudas/tooltips cuando sean útiles;
- no mostrar logs técnicos como contenido principal;
- permitir expandir logs si alguien los necesita.

La experiencia debe comunicar:

> "La IA interpreta; el usuario valida; JHipster construye."

---

# 33. Restricciones académicas

El prototipo debe permitir explicar correctamente que:

- JHipster es la herramienta central;
- JDL es el lenguaje de modelado utilizado;
- IA es una integración adicional;
- el resultado de la IA requiere validación;
- JHipster realiza generación determinista;
- utilizar IA no elimina la responsabilidad del desarrollador.

No diseñar la UI o mensajes de forma que hagan parecer que JHipster es simplemente una API del LLM.

---

# 34. Git

Trabajar de manera ordenada.

Antes de modificar:

```text
git status
```

Usar commits claros.

Ejemplos:

```text
feat(ai): add provider router
feat(jdl): generate JDL from structured model
feat(validation): validate generated JDL
feat(jhipster): integrate JDL generation workflow
test(jdl): add library fixture
docs(demo): add classroom demo guide
```

No reescribir historial compartido.

No subir `.env`.

---

# 35. Forma de trabajar como agente

No intentes implementar todo de una sola vez.

Trabaja incrementalmente.

Orden recomendado:

```text
Fase 0 — inspección y arquitectura
Fase 1 — UI base
Fase 2 — provider abstraction
Fase 3 — structured output
Fase 4 — deterministic JDL generator
Fase 5 — validator
Fase 6 — editor/review
Fase 7 — JHipster adapter
Fase 8 — demo fixtures
Fase 9 — tests
Fase 10 — documentation
Fase 11 — hardening de demo
```

Después de cada fase:

- ejecutar pruebas relevantes;
- revisar errores;
- no continuar si se rompió el flujo principal.

---

# 36. Antes de empezar a programar

Primero debes:

1. inspeccionar el repositorio actual;
2. identificar stack existente;
3. revisar archivos/configuración;
4. verificar si ya existe código aprovechable;
5. revisar versión instalada de Node/Java/JHipster;
6. investigar en documentación/repo oficial los comandos adecuados;
7. proponer brevemente la arquitectura y estructura de carpetas;
8. identificar cualquier decisión bloqueante.

Si no existe un repositorio del prototipo, inicializa una estructura simple y documentada.

No pidas aclaraciones menores que puedas resolver con una opción segura y razonable.

Sí detente si una decisión puede cambiar de forma importante el alcance o impedir la demo.

---

# 37. Criterios de aceptación funcional

El trabajo no estará terminado hasta que:

- [ ] se pueda escribir un requerimiento;
- [ ] se pueda elegir Auto/Gemini/Groq/Ollama;
- [ ] al menos los proveedores realmente configurados funcionen;
- [ ] Auto seleccione un proveedor válido;
- [ ] la IA produzca estructura validable;
- [ ] se muestren entidades;
- [ ] se muestren relaciones;
- [ ] se muestren observaciones;
- [ ] se genere JDL;
- [ ] el usuario pueda editar JDL;
- [ ] se pueda validar JDL;
- [ ] los errores sean comprensibles;
- [ ] el usuario apruebe explícitamente antes de JHipster;
- [ ] se pueda utilizar el JDL con JHipster;
- [ ] al menos un proyecto completo haya sido generado correctamente;
- [ ] biblioteca funcione;
- [ ] clínica funcione;
- [ ] inventario funcione como prueba de generalidad;
- [ ] exista caso de JDL inválido;
- [ ] no se expongan claves;
- [ ] exista `.env.example`;
- [ ] exista README;
- [ ] exista guía de demo;
- [ ] exista proyecto/JDL de contingencia.

---

# 38. Criterios de aceptación de calidad

- [ ] código legible;
- [ ] TypeScript tipado si se usa TypeScript;
- [ ] errores manejados;
- [ ] sin secretos;
- [ ] sin dependencias innecesarias;
- [ ] sin hardcoding de biblioteca/clínica/inventario;
- [ ] providers desacoplados;
- [ ] JDL generator separado del LLM;
- [ ] validación separada de generación;
- [ ] interfaz usable;
- [ ] no hay spinners infinitos;
- [ ] logs sanitizados;
- [ ] pruebas pasan;
- [ ] build pasa;
- [ ] demo reproducible.

---

# 39. Resultado final esperado

El prototipo debe permitir que durante la exposición ocurra:

> Un compañero describe un sistema en lenguaje natural, la herramienta analiza el requerimiento y propone entidades y relaciones, el compañero revisa el resultado, genera un JDL, valida el modelo, modifica un requisito mediante un mini-reto y finalmente observa cómo JHipster utiliza ese modelo para producir una aplicación.

La experiencia debe demostrar claramente:

```text
Lenguaje natural
      ↓
IA
      ↓
Modelo estructurado
      ↓
Revisión humana
      ↓
JDL
      ↓
Validación
      ↓
JHipster
      ↓
Software
```

La frase conceptual de la demostración será:

> **Tú describes. La IA modela. Tú validas. JHipster construye.**

---

# 40. Forma de reportar cada avance

Después de cada bloque importante, reporta:

## Implementado

Qué se construyó.

## Archivos modificados

Lista breve.

## Pruebas realizadas

Comandos ejecutados y resultados reales.

## Pendientes

Qué falta para cumplir el siguiente gate.

## Riesgos

Solo problemas concretos que puedan afectar la demo.

No afirmes que algo funciona si no fue probado.

---

# 41. Instrucción final para el agente

Comienza inspeccionando el repositorio y el entorno.

Después:

1. resume el estado actual;
2. propone la estructura mínima;
3. identifica las dependencias necesarias;
4. implementa el proyecto por fases;
5. prueba cada fase;
6. mantén el flujo de demo funcionando;
7. no añadas características fuera del alcance sin necesidad;
8. prioriza estabilidad y claridad por encima de complejidad;
9. utiliza el repositorio oficial de JHipster como referencia cuando necesites confirmar comportamiento;
10. termina únicamente cuando se cumplan los criterios de aceptación anteriores.

La prioridad máxima es obtener una **demostración estable, reproducible, entendible y participativa**, no construir un producto comercial sobredimensionado.