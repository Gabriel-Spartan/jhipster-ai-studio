# Guía de Exposición en Vivo — JHipster AI Studio

> **Lema de la presentación:**  
> *"Tú describes. La IA modela. Tú validas. JHipster construye."*

Duración estimada: **15 - 20 minutos**.

---

## 1. Preparación Previa a la Exposición

1. Abre una terminal en la raíz del proyecto:
   ```bash
   npm run dev
   ```
2. Abre en tu navegador (en pantalla completa `F11`):
   ```text
   http://localhost:3000
   ```
3. Verifica que en el encabezado aparezca el estado del sistema y el selector de motores.

---

## 2. Flujo Principal de la Demostración (Paso a Paso)

### Minuto 0 - 3: Introducción del Problema y la Filosofía
* **Explicar el rol de JHipster:** Es la herramienta central de generación de software empresarial (Spring Boot, Angular/React, BD, seguridad).
* **Explicar el rol de la IA:** La IA actúa como un **asistente de modelado previo**, transformando lenguaje natural en un modelo JDL candidato.
* **Principio Human-in-the-Loop:** La IA nunca genera la app a ciegas. El desarrollador revisa, valida y aprueba.

---

### Minuto 3 - 7: Caso 1 — Clínica Veterinaria (o Biblioteca)
1. En la **Pantalla 1 (Requisitos)**:
   - Haz clic en el botón de ejemplo rápido **🐾 Clínica Veterinaria** (o **📚 Biblioteca**).
   - En el selector de Motor, deja **Automático** (o elige Gemini / Groq).
   - Haz clic en **Analizar Sistema con IA**.
2. En la **Pantalla 2 (Análisis Estructurado)**:
   - Muestra cómo la IA detectó las entidades (`Cliente`, `Mascota`, `Veterinario`, `Cita`, `Tratamiento`) y sus tipos de datos.
   - Muestra las **Relaciones** identificadas (`Cliente 1 ---- N Mascota`).
   - **Punto clave a destacar ante la clase — Panel de Observaciones:**
     - Muestra las alertas con `⚠` (ej: *"No se especificó si los tratamientos tienen fechas independientes de la cita"*).
     - Explica: *"La IA hace explícitas las ambigüedades en lugar de inventar suposiciones silenciosas"*.
   - Haz clic en **Generar JDL Candidato**.

---

### Minuto 7 - 11: Editor, Validación y Mini-Reto
1. En la **Pantalla 3 (Editor & Validador JDL)**:
   - Muestra el código JDL generado de manera determinista.
   - Observa la tarjeta verde: **"JDL Válido para JHipster"**.
2. **Dinámica del Mini-Reto (Participación de compañeros):**
   - Pregunta a la clase: *"¿Qué pasa si ahora el cliente nos pide que una mascota pueda tener varios veterinarios o agregar un campo nuevo?"*
   - Modifica el JDL manualmente en el editor o regresa al paso 1 y usa el botón de mini-reto.
   - Muestra cómo el validador en tiempo real comprueba la sintaxis al instante.

---

### Minuto 11 - 14: Demostración del Caso Inválido (Seguridad del Validador)
1. En la Pantalla 3, haz clic en el botón:
   ```text
   [Simular Caso Inválido de Prueba]
   ```
2. Observa cómo el estado cambia a rojo:
   - Se alertan los errores: entidad `Usuario` inexistente en la relación, llaves sin cerrar o tipos no válidos.
3. Haz clic en **"Corregir con IA"**:
   - Observa cómo la IA auto-repara el JDL enviando los errores detectados y el validador vuelve a verde.

---

### Minuto 14 - 18: Aprobación Humana y Generación con JHipster
1. Haz clic en el botón verde de aprobación:
   ```text
   [Usar este JDL con JHipster 🚀]
   ```
2. En la **Pantalla 4 (JHipster)**:
   - Muestra el nombre del proyecto.
   - Haz clic en **Generar Aplicación**.
   - Muestra en pantalla la consola de logs en vivo mientras JHipster procesa el archivo `.jdl`.
   - Al terminar, muestra el directorio generado o descarga el archivo `.jdl` listo para producción.

---

## 3. Protocolo de Contingencia en Vivo (Si falla Internet o las APIs)

* **Si falla una API:** El modo **Automático** intentará con otro motor disponible.
* **Si falla la conexión a internet por completo:**
  - En la Pantalla 1, haz clic en **"Cargar Fixture Biblioteca"** o **"Cargar Fixture Veterinaria"**.
  - El sistema cargará el modelo local de contingencia instantáneamente, permitiendo continuar con toda la explicación sin retrasos.
