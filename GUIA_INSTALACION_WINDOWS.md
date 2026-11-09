# Guía de Instalación y Configuración en Windows 🪟

Esta guía detalla paso a paso todo el software necesario, cómo instalarlo en **Windows 10 / Windows 11**, cómo clonar el repositorio, configurar el entorno y ejecutar tanto **JHipster AI Studio** como las aplicaciones generadas.

---

## 📋 Resumen de Software Necesario

| Componente | Versión Recomendada | ¿Para qué sirve? |
| :--- | :--- | :--- |
| **Git** | 2.40 o superior | Clonar el repositorio y control de versiones |
| **Node.js & npm** | v20.x o v22.x LTS (npm 10+) | Ejecutar Frontend, Backend Express y herramientas CLI |
| **Java JDK** | JDK 21 (o superior, ej. JDK 25) | Compilar y ejecutar las aplicaciones Spring Boot generadas |
| **Maven** | 3.9+ *(o el wrapper `mvnw.cmd` incluido)* | Gestionar dependencias y construcción de proyectos Java |
| **Ollama** *(Opcional)* | Última versión para Windows | Ejecutar modelos de IA locales (Qwen, Llama) sin conexión a internet |

---

## ⚡ Método Rápido (Recomendado): Instalación con Windows Package Manager (`winget`)

Abre **PowerShell como Administrador** (clic derecho en el botón de Inicio -> *Terminal Windows (Administrador)* o *PowerShell (Administrador)*) y ejecuta:

```powershell
# 1. Instalar Git
winget install --id Git.Git -e --source winget

# 2. Instalar Node.js LTS
winget install --id OpenJS.NodeJS.LTS -e --source winget

# 3. Instalar Java JDK 21 (Eclipse Temurin)
winget install --id EclipseAdoptium.Temurin.21.JDK -e --source winget

# 4. Instalar Apache Maven (Opcional, pero muy útil)
winget install --id Apache.Maven -e --source winget
```

> **IMPORTANTE:** Una vez finalizadas las instalaciones, **cierra PowerShell y vuelve a abrir una nueva ventana** para que se carguen las nuevas variables de entorno en el sistema.

---

## 🌐 Método Manual (Descarga de Instaladores Oficiales)

Si prefieres instalar cada herramienta manualmente con sus asistentes de instalación (.exe / .msi):

### 1. Git para Windows
- **Descarga:** [https://git-scm.com/download/win](https://git-scm.com/download/win)
- **Instalación:** Ejecuta el instalador `.exe`. Puedes dejar todas las opciones por defecto recomendadas. Asegúrate de marcar la casilla *"Git from the command line and also from 3rd-party software"*.

### 2. Node.js (LTS)
- **Descarga:** [https://nodejs.org/](https://nodejs.org/) (Selecciona la versión **LTS**, ej. v22.x).
- **Instalación:** Sigue el asistente `.msi`. Asegúrate de que la opción *"Add to PATH"* esté marcada.

### 3. Java Development Kit (JDK 21)
- **Descarga:** [Eclipse Temurin JDK 21 (Adoptium)](https://adoptium.net/temurin/releases/?version=21) o [Microsoft Build of OpenJDK](https://learn.microsoft.com/es-es/java/openjdk/download).
- **Instalación:**
  1. Ejecuta el archivo `.msi`.
  2. En la pantalla de componentes personalizados, **asegúrate de activar**:
     - `Set JAVA_HOME variable` -> Seleccionar *"Will be installed on local hard drive"*.
     - `Add to PATH`.

### 4. Apache Maven
- **Descarga:** [https://maven.apache.org/download.cgi](https://maven.apache.org/download.cgi) (descarga el archivo `apache-maven-x.x.x-bin.zip`).
- **Instalación:**
  1. Descomprime la carpeta en `C:\Program Files\Maven` (o `C:\maven`).
  2. Agrega la ruta `C:\Program Files\Maven\bin` a la variable de entorno `PATH`.
  *(Nota: Los proyectos generados por JHipster ya traen el script `mvnw.cmd` incluido, por lo que Maven global es opcional).*

---

## 🔍 Comprobación de Instalación

Abre una ventana de **Símbolo del sistema (CMD)** o **PowerShell** y ejecuta los siguientes comandos para verificar que todo esté correctamente reconocido:

```cmd
git --version
node --version
npm --version
java -version
javac -version
mvn -version
```

Deberías ver las versiones de cada herramienta sin ningún mensaje de error como *"no se reconoce como un comando interno o externo"*.

---

## 🛠️ Configuración de Variables de Entorno en Windows (Si `java` no es detectado)

Si al escribir `java -version` sale error, configúralo manualmente:
1. Presiona `Windows + R`, escribe `sysdm.cpl` y pulsa **Enter**.
2. Ve a la pestaña **Opciones avanzadas** y haz clic en **Variables de entorno**.
3. En **Variables del sistema**, haz clic en **Nueva**:
   - **Nombre de la variable:** `JAVA_HOME`
   - **Valor de la variable:** `C:\Program Files\Eclipse Adoptium\jdk-21.x.x-hotspot` *(la ruta donde se instaló tu JDK)*.
4. En **Variables del sistema**, busca la variable `Path`, selecciónala y haz clic en **Editar**:
   - Haz clic en **Nuevo** y escribe: `%JAVA_HOME%\bin`
5. Haz clic en **Aceptar** en todas las ventanas y reinicia la terminal.

---

## 📥 Clonación del Repositorio y Configuración

1. Abre tu terminal (CMD o PowerShell) y ubícate en la carpeta donde guardas tus proyectos:
   ```cmd
   cd C:\Users\%USERNAME%\Desktop
   ```

2. Clona el repositorio:
   ```cmd
   git clone https://github.com/Gabriel-Spartan/jhipster-ai-studio.git
   cd jhipster-ai-studio
   ```

3. Instala todas las dependencias (Backend y Frontend de JHipster AI Studio):
   ```cmd
   npm run install:all
   ```

4. Configura el archivo de variables de entorno `.env`:
   ```cmd
   copy .env.example .env
   ```
   Abre el archivo `.env` con tu editor preferido (Notepad, VS Code, etc.) y añade tu clave de IA (por ejemplo de Google Gemini o Groq):
   ```env
   AI_DEFAULT_PROVIDER=auto

   GEMINI_API_KEY=tu_clave_de_gemini_aqui
   GEMINI_MODEL=gemini-2.0-flash

   GROQ_API_KEY=tu_clave_de_groq_aqui
   GROQ_MODEL=llama-3.3-70b-versatile

   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=qwen2.5:7b
   ```

---

## 🚀 Ejecución de JHipster AI Studio

Para iniciar tanto el Backend como el Frontend de la plataforma con un solo comando:

```cmd
npm run dev
```

- **Frontend:** Abre tu navegador en **`http://localhost:3000`**
- **Backend API:** Corriendo en **`http://localhost:3001`**

Desde esta interfaz podrás describir sistemas, resolver ambigüedades, validar modelos JDL y generar proyectos oficiales de JHipster.

---

## 💻 ¿Cómo ejecutar un Proyecto Generado en Windows (Login & CRUD)?

Cuando generes un proyecto (por ejemplo `cinemamanagementsystem`), este se guardará dentro de la carpeta `output\cinemamanagementsystem`. Para levantarlo y ver el CRUD completo:

### 1. Instalar dependencias del cliente React
En tu terminal:
```cmd
cd output\cinemamanagementsystem
npm install --legacy-peer-deps
```

### 2. Levantar el Backend (Spring Boot + Base de Datos H2 embebida)
En esa misma carpeta:
```cmd
mvnw.cmd
```
*(Se descargará automáticamente todo lo necesario para Spring Boot y arrancará en `http://localhost:8080` sin necesidad de Docker ni PostgreSQL externos)*.

### 3. Levantar el Frontend (React + Vite)
En **otra ventana de terminal**:
```cmd
cd output\cinemamanagementsystem
npm start
```
*(Se abrirá el cliente en `http://localhost:9000` con conexión directa al backend)*.

### 4. Iniciar Sesión y ver el CRUD
- Ve a: **`http://localhost:9000`**
- Clic en **Account -> Sign in**:
  - **Admin:** usuario `admin` | contraseña `admin`
  - **User:** usuario `user` | contraseña `user`
- Menú **Entities**: Aquí podrás crear, editar, listar y borrar registros de todas las tablas generadas.
- **Swagger UI:** Consulta los endpoints en **`http://localhost:9000/admin/docs`** o **`http://localhost:8080/swagger-ui/index.html`**.

---

## 🦙 (Opcional) Uso de Ollama en Windows

Si deseas usar modelos de IA locales sin depender de internet ni claves de API:
1. Descarga el instalador de Ollama para Windows desde: [https://ollama.com/download/windows](https://ollama.com/download/windows).
2. Ejecuta el archivo `OllamaSetup.exe`.
3. Abre una terminal y descarga tu modelo preferido:
   ```cmd
   ollama run qwen2.5:7b
   ```
   o
   ```cmd
   ollama run llama3
   ```
4. En **JHipster AI Studio**, selecciona en el combo de Motor de IA la opción **OLLAMA**; la plataforma detectará automáticamente tus modelos instalados tanto en Windows como en Linux.
