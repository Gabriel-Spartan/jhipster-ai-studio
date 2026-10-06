# JHipster AI Studio 🚀

> **Prototipo de Ingeniería de Software:** Modelado asistido por IA y generación de aplicaciones empresariales con **JHipster** y **JDL (JHipster Domain Language)**.  
> **Lema del proyecto:** *"Tú describes. La IA modela. Tú validas. JHipster construye."*

---

## 📖 Descripción General

Este sistema implementa una arquitectura **Human-in-the-Loop** para el desarrollo rápido de software empresarial:
1. El usuario describe un sistema en **lenguaje natural**.
2. Un motor de IA (Google Gemini, Groq con Llama, u Ollama local) analiza la descripción y produce una **representación estructurada (JSON)** compuesta por entidades, atributos, tipos compatibles con JDL, relaciones y un panel de **observaciones y ambigüedades**.
3. El sistema transforma deterministamente la estructura en un **modelo JDL candidato**.
4. Un **validador semántico y sintáctico** examina la consistencia del modelo y ofrece auto-reparación asistida con IA si se detectan errores.
5. Tras la **aprobación humana explícita**, el modelo es entregado a **JHipster** para generar la aplicación completa (Spring Boot, Frontend React/Angular, Base de Datos y pruebas).

---

## 🛠️ Requisitos Previos

- **Node.js**: v20 o superior (probado en Node v22.x).
- **npm**: v10 o superior.
- **Java**: JDK 17 o 21+ (probado con OpenJDK 25).
- **JHipster** (opcional para ejecución CLI en vivo): `npm install -g generator-jhipster` o ejecutado mediante `npx`.
- **Claves de IA** (al menos una de las siguientes):
  - Google Gemini API Key (`GEMINI_API_KEY`).
  - Groq API Key (`GROQ_API_KEY`).
  - O servicio de Ollama corriendo en `http://localhost:11434`.

---

## ⚙️ Instalación y Configuración

1. **Instalar dependencias del proyecto:**
   ```bash
   npm run install:all
   ```

2. **Configurar variables de entorno:**
   Copia la plantilla `.env.example` a `.env`:
   ```bash
   cp .env.example .env
   ```
   Edita `.env` y coloca tu clave de API:
   ```env
   AI_DEFAULT_PROVIDER=auto

   GEMINI_API_KEY=tu_clave_de_gemini
   GEMINI_MODEL=gemini-2.5-flash

   GROQ_API_KEY=tu_clave_de_groq
   GROQ_MODEL=llama-3.3-70b-versatile

   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3
   ```

---

## 🚀 Ejecución del Sistema

Para iniciar el Backend (puerto 3001) y el Frontend (puerto 3000) simultáneamente en modo desarrollo:

```bash
npm run dev
```

Abre tu navegador en:
```text
http://localhost:3000
```

---

## 🧪 Pruebas Unitarias e Integración

Para ejecutar la suite completa de pruebas automatizadas:

```bash
npm run test
```

Incluye:
- Sanitización de entidades y campos JDL.
- Generador determinista de JSON a JDL.
- Validador sintáctico y semántico (detección de entidades huérfanas y errores de sintaxis).
- Pruebas de integración con fixtures de Biblioteca, Veterinaria, Inventario y Caso Inválido.

---

## 📁 Estructura del Proyecto

```text
presentation/
├── activities.md              # Documento maestro con las directrices de la actividad
├── package.json               # Orquestador del monorepo con scripts dev, build, test
├── .env.example               # Plantilla de variables de entorno segura
├── .gitignore                 # Exclusión de credenciales y dependencias
├── docs/
│   └── DEMO.md                # Guión detallado para la exposición en clase (20 min)
├── fixtures/                  # Casos de contingencia y prueba offline
│   ├── library.json           # Caso A: Biblioteca
│   ├── veterinary.json        # Caso B: Clínica Veterinaria
│   ├── inventory.json         # Caso C: Sistema de Inventario
│   └── invalid.jdl            # Caso Inválido para demostración de validación
├── backend/                   # API REST con Express y TypeScript
│   ├── src/
│   │   ├── ai/                # Abstracción de proveedores (Gemini, Groq, Ollama) y Router
│   │   ├── config/            # Carga segura de variables de entorno
│   │   ├── parser/            # Generador determinista JSON -> JDL
│   │   ├── validator/         # Validador de consistencia y sintaxis JDL
│   │   ├── jhipster/          # Adaptador de ejecución segura para JHipster
│   │   └── types/             # Esquemas de validación Zod y tipos
│   └── tests/                 # Pruebas con Vitest
└── frontend/                  # Interfaz web interactiva con Vite y React
    └── src/
        ├── App.tsx            # UI guiada de 4 pantallas
        ├── index.css          # Sistema de diseño dark-mode profesional
        └── types.ts           # Interfaces compartidas
```

---

## 🛡️ Principios de Seguridad y Calidad Cumplidos

- **Sin filtración de secretos:** Las API keys solo se procesan en el backend y nunca son transmitidas al navegador.
- **Sin inyección de comandos shell:** La ejecución de JHipster utiliza `spawn` con parámetros fijos y nombres de proyecto sanitizados.
- **Alta resiliencia (Modo Contingencia):** Si no hay conexión a internet durante la exposición, la interfaz permite cargar fixtures locales para realizar la demostración completa sin interrupciones.
