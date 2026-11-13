# Fundación Jóvenes por una Mejor Ciudad — Sistema de Gestión Integral

Sistema web completo para la organización **"Fundación Jóvenes por una Mejor Ciudad"**. Integra una **página web pública**, un **CRM de clientes**, un **chatbot con inteligencia artificial**, un **módulo de cursos con inscripciones** y un **panel administrativo** con control de contenido.

## Descripción del proyecto

La plataforma publica la información de la organización, administra clientes con interacciones y seguimientos, ofrece cursos con inscripción y aula extendida de materiales, y atiende de forma automatizada mediante un chatbot con base de conocimientos administrable.

### Módulos principales

| Módulo | Descripción |
|---|---|
| **Página web pública** | Inicio, Quiénes somos, Temas, Actividades, Cursos, Información corporativa y Contacto. Contenido administrable desde el panel. |
| **Autenticación y roles** | Registro y login con JWT. Roles: Administrador, Colaborador y Usuario/Cliente con control de acceso por rol. |
| **Cursos e inscripciones** | Catálogo público, inscripción con aprobación por colaborador, cancelación y aula virtual con 3 módulos, progreso y cuestionarios. |
| **CRM** | Fichas de clientes, búsqueda y filtros, interacciones, seguimientos, asignación de responsables y estados personalizables. |
| **Chatbot con IA** | Atención automática con base de conocimientos, contexto conversacional, historial y escalamiento a colaboradores. Modo mock sin API. |
| **Información corporativa** | Documentos oficiales de la fundación con descarga pública. |
| **Contenido web (CMS)** | Textos de las páginas, imágenes de temas y actividades realizadas, editables desde el panel. |
| **Panel administrativo** | Dashboard con estadísticas, gestión de usuarios, clientes, cursos, inscripciones, materiales, conversaciones y contenido. |

## Tecnologías utilizadas

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS** (diseño responsive)
- **React Router v6**
- **Axios**

### Backend
- **Node.js** + **Express**
- **Prisma ORM**
- **JWT** (autenticación) + **bcrypt** (hash de contraseñas)
- **Multer** (carga de archivos)

### Base de datos
- **SQLite** en desarrollo (`backend/prisma/dev.db`)
- Listo para **PostgreSQL** en producción (cambiar `provider` en `schema.prisma`)

## Requisitos para ejecutar el proyecto

- **Node.js** 18 o superior (recomendado 20+)
- **npm** 9 o superior
- No requiere PostgreSQL instalado (usa SQLite por defecto)

## Instalación

```bash
# 1. Clonar o copiar el proyecto
# 2. Instalar dependencias del backend
cd backend
npm install

# 3. Instalar dependencias del frontend
cd ../frontend
npm install
```

En Windows también puedes ejecutar `levantar-sistema.cmd` en la raíz: instala dependencias si faltan, compila el panel y arranca el servidor en http://localhost:3001.

## Configuración de variables de entorno

### Backend (`backend/.env`)

Copia `backend/.env.example` a `backend/.env`:

```env
# Base de datos (SQLite en desarrollo)
DATABASE_URL="file:./dev.db"

# JWT
JWT_SECRET="cambia-esta-frase-secreta-en-produccion"
JWT_EXPIRES_IN="7d"

# Servidor
PORT=3001
NODE_ENV=development

# CORS (URL del frontend)
FRONTEND_URL="http://localhost:5173"

# IA — opcional. Sin clave, el chatbot usa modo mock automáticamente.
OPENAI_API_KEY=""
AI_MODEL="gpt-3.5-turbo"
```

> **Nota:** Si se configura `OPENAI_API_KEY`, el chatbot usará la IA real de OpenAI. Sin ella, funciona en **modo mock** con la base de conocimientos administrable desde el panel.

## Configuración de la base de datos

```bash
cd backend
npx prisma generate   # Generar el cliente de Prisma
npx prisma db push    # Crear la base de datos y las tablas
node prisma/seed.js   # Cargar datos iniciales
```

O de una sola vez: `npm run db:setup`

### Migraciones

Para SQLite/desarrollo es suficiente `npx prisma db push`. Para usar migraciones formales:

```bash
npx prisma migrate dev --name init
```

El módulo de cursos por módulos incluye un script de migración de datos que crea los tres
módulos y sus cuestionarios en cada curso existente y asigna los materiales al Módulo 1:

```bash
cd backend
npm run db:migrate:courses
```

Es idempotente: puede ejecutarse varias veces sin duplicar registros.

Los materiales de cursos se guardan en una carpeta privada (`backend/src/private-uploads`) que no es
pública. Los archivos anteriores se mueven con:

```bash
cd backend
npm run db:migrate:private-files
```

### Seguridad: variables de entorno

- `JWT_SECRET`: al crear `backend/.env`, `levantar-sistema.cmd` genera un secreto aleatorio. Si lo editas
  a mano, usa un valor largo y aleatorio. El servidor avisa si el secreto es débil.
- `TRUST_PROXY=1`: obligatorio si el servidor está detrás de un proxy (Render, etc.). Sin esto, el límite de
  intentos de inicio de sesión cuenta a todos los usuarios como una sola IP.
- `SEED_PASSWORD`: contraseña de las cuentas de prueba del seed. Si no se define, se usa una de desarrollo.
  No ejecutes el seed en producción con la contraseña por defecto.
- Las cuentas que ya existen con la contraseña de desarrollo deben cambiarse manualmente en producción.

Para producción con **PostgreSQL**, cambiar en `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Y actualizar `DATABASE_URL` en `.env` (ej. `postgresql://user:pass@localhost:5432/jovenes_ciudad`), luego ejecutar `npx prisma migrate deploy`.

## Despliegue en producción

El repositorio incluye el código, pero no la base de datos, los archivos subidos ni el archivo `.env`.
Cada despliegue debe seguir estos pasos en orden.

### 1. Variables de entorno (en el panel del hosting)

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | Ruta de la base de datos. SQLite: `file:./dev.db` |
| `JWT_SECRET` | Sí | Secreto largo y aleatorio (48 bytes o más). Generarlo con: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `NODE_ENV` | Sí | `production` |
| `FRONTEND_URL` | Sí | URL pública del sitio, por ejemplo `https://fundacionjimc.org` |
| `TRUST_PROXY` | Sí, si hay proxy | `1` en Render y hostings similares |
| `SEED_PASSWORD` | Solo para el seed | Contraseña de las cuentas iniciales. Debe ser fuerte |
| `OPENAI_API_KEY` | No | Activa las respuestas con IA del chatbot. Sin esta variable se usan respuestas predefinidas |

### 2. Instalación y build

Ejecutar en cada despliegue:

```bash
cd backend && npm install && npx prisma generate
cd ../frontend && npm install && npm run build
```

### 3. Base de datos

Ejecutar en cada despliegue que cambie el esquema, incluido el primero:

```bash
cd backend
npx prisma db push
```

### 4. Datos iniciales y migraciones

```bash
cd backend
npm run db:seed                   # solo en el primer despliegue
npm run db:migrate:courses        # crea los 3 módulos de cada curso (se puede repetir)
npm run db:migrate:private-files  # mueve los materiales de cursos a la carpeta privada (se puede repetir)
```

### 5. Iniciar el servidor

```bash
cd backend && npm start
```

El servidor crea las carpetas de subidas si no existen.

### 6. Cuentas de administrador

- El seed crea las cuentas de administrador, colaborador y cliente con la contraseña definida en `SEED_PASSWORD`.
- Cambia la contraseña de cada administrador. Para actualizarla, ejecuta:

```bash
cd backend
node crear-usuario.js <correo> <nombre> <apellido> <nueva-contraseña>
```

El script solo actualiza cuentas de administrador y rechaza las demás.

### Consideraciones de hosting

- En hostings con disco efímero, la base SQLite y los archivos subidos se pierden al reiniciar. Para producción usa PostgreSQL y almacenamiento persistente.
- El límite de intentos de inicio de sesión se guarda en memoria. Si hay varias instancias del servidor, cada una lleva su propio conteo.

## Cómo iniciar frontend y backend

### Backend (terminal 1)

```bash
cd backend
npm run dev
# API disponible en http://localhost:3001
```

### Frontend (terminal 2)

```bash
cd frontend
npm run dev
# Aplicación disponible en http://localhost:5173
```

El frontend usa un proxy que reenvía `/api` y `/uploads` al backend, por lo que no requiere configuración adicional en desarrollo.

En producción, compila el panel (`npm run build` en `frontend/`) y sirve `frontend/dist` desde el backend: la misma URL (puerto 3001) entrega sitio y API.

### Permisos por rol

| Acción | Admin | Colaborador | Usuario/Cliente |
|---|---|---|---|
| Panel de gestión | ✅ | ✅ | ❌ |
| Gestionar usuarios del sistema | ✅ | Ver solamente | ❌ |
| Crear/editar clientes | ✅ | ✅ | ❌ |
| Interacciones y seguimientos | ✅ | ✅ | ❌ |
| Crear/editar cursos y materiales | ✅ | ✅ | ❌ |
| Aprobar/rechazar inscripciones | ✅ | ✅ | ❌ |
| Administrar contenido web y chatbot | ✅ | ❌ | ❌ |
| Inscribirse en cursos | ✅ | ✅ | ✅ |
| Usar el chatbot | ✅ | ✅ | ✅ |

## Estructura general del proyecto

```
jovenes-ciudad/
├── backend/                      # API REST
│   ├── prisma/
│   │   ├── schema.prisma         # Modelo de datos
│   │   └── seed.js               # Datos iniciales
│   ├── src/
│   │   ├── config/               # Configuración (Prisma client)
│   │   ├── controllers/          # Lógica de cada módulo
│   │   ├── middleware/           # Auth, roles, validación, errores
│   │   ├── routes/               # Definición de rutas REST
│   │   ├── services/             # Servicio de IA (mock + OpenAI)
│   │   ├── uploads/              # Archivos subidos
│   │   └── utils/                # Helpers y constantes
│   └── .env.example
├── frontend/                     # Aplicación React
│   ├── public/
│   └── src/
│       ├── api/                  # Cliente Axios
│       ├── components/
│       │   ├── auth/             # Rutas protegidas
│       │   ├── chatbot/          # Widget del chatbot
│       │   ├── layout/           # Navbar, Footer, Sidebar, AdminLayout
│       │   └── ui/               # Componentes reutilizables (Alertas, Tablas, Modales...)
│       ├── context/              # Contexto de autenticación
│       ├── pages/
│       │   ├── admin/            # Dashboard, CRM, cursos, recursos, chat, contenido
│       │   ├── auth/             # Login y registro
│       │   └── public/           # Páginas del sitio público
│       ├── App.jsx               # Definición de rutas
│       └── main.jsx              # Punto de entrada
├── levantar-sistema.cmd          # Arranque de un paso (Windows)
└── reconstruir-panel.cmd         # Recompila el frontend tras editar código
```

## Modelo de datos

Base de datos relacional con las siguientes entidades:

- **Roles** y **Usuarios** (autenticación y permisos)
- **Clientes** (fichas del CRM con estados y responsable asignado)
- **Interacciones** y **Seguimientos** (historial por cliente)
- **Cursos** e **Inscripciones** (catálogo, estados y aula virtual con módulos, progreso y cuestionarios)
- **Recursos** (materiales de cursos: documentos, presentaciones y enlaces, organizados por módulo)
- **Módulos de curso** (3 por defecto; el administrador puede agregar más, numerados desde 0), **Cuestionarios**, **Preguntas**, **Opciones** y **Intentos**
- **Progreso de recursos** (finalización automática por usuario)
- **Conversaciones** y **Mensajes** (chatbot con escalamiento)
- **Contenido de páginas** (CMS: textos, temas e actividades realizadas)
- **Conocimiento del chatbot** (base administrable de preguntas/respuestas)
- **Notificaciones** (asignaciones, seguimientos y escalamientos)
- **Documentos corporativos** (información oficial de la fundación)

## Copias de seguridad

- **Base de datos SQLite:** copiar el archivo `backend/prisma/dev.db`.
- **Archivos subidos:** copiar los archivos de `backend/src/uploads/`.
- Las credenciales siempre van en `.env` (nunca en el código).

## Licencia

Uso interno de la organización. Desarrollado con tecnologías de código abierto.
