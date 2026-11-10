# JÃ³venes por una Mejor Ciudad â€” Sistema de GestiÃ³n Integral

Sistema web completo para la organizaciÃ³n **"JÃ³venes por una Mejor Ciudad"**. Integra una **pÃ¡gina web pÃºblica**, un **CRM de clientes**, un **chatbot con inteligencia artificial**, un **mÃ³dulo de cursos con inscripciones** y un **panel administrativo** con control de contenido.

## DescripciÃ³n del proyecto

La plataforma publica la informaciÃ³n de la organizaciÃ³n, administra clientes con interacciones y seguimientos, ofrece cursos con inscripciÃ³n y aula extendida de materiales, y atiende de forma automatizada mediante un chatbot con base de conocimientos administrable.

### MÃ³dulos principales

| MÃ³dulo | DescripciÃ³n |
|---|---|
| **PÃ¡gina web pÃºblica** | Inicio, QuiÃ©nes somos, Temas, Actividades, Cursos, InformaciÃ³n corporativa y Contacto. Contenido administrable desde el panel. |
| **AutenticaciÃ³n y roles** | Registro y login con JWT. Roles: Administrador, Colaborador y Usuario/Cliente con control de acceso por rol. |
| **Cursos e inscripciones** | CatÃ¡logo pÃºblico, inscripciÃ³n con aprobaciÃ³n por colaborador, cancelaciÃ³n y aula virtual con 3 mÃ³dulos, progreso y cuestionarios. |
| **CRM** | Fichas de clientes, bÃºsqueda y filtros, interacciones, seguimientos, asignaciÃ³n de responsables y estados personalizables. |
| **Chatbot con IA** | AtenciÃ³n automÃ¡tica con base de conocimientos, contexto conversacional, historial y escalamiento a colaboradores. Modo mock sin API. |
| **InformaciÃ³n corporativa** | Documentos oficiales de la fundaciÃ³n con descarga pÃºblica. |
| **Contenido web (CMS)** | Textos de las pÃ¡ginas, imÃ¡genes de temas y actividades realizadas, editables desde el panel. |
| **Panel administrativo** | Dashboard con estadÃ­sticas, gestiÃ³n de usuarios, clientes, cursos, inscripciones, materiales, conversaciones y contenido. |

## TecnologÃ­as utilizadas

### Frontend
- **React 18** + **Vite**
- **Tailwind CSS** (diseÃ±o responsive)
- **React Router v6**
- **Axios**

### Backend
- **Node.js** + **Express**
- **Prisma ORM**
- **JWT** (autenticaciÃ³n) + **bcrypt** (hash de contraseÃ±as)
- **Multer** (carga de archivos)

### Base de datos
- **SQLite** en desarrollo (`backend/prisma/dev.db`)
- Listo para **PostgreSQL** en producciÃ³n (cambiar `provider` en `schema.prisma`)

## Requisitos para ejecutar el proyecto

- **Node.js** 18 o superior (recomendado 20+)
- **npm** 9 o superior
- No requiere PostgreSQL instalado (usa SQLite por defecto)

## InstalaciÃ³n

```bash
# 1. Clonar o copiar el proyecto
# 2. Instalar dependencias del backend
cd backend
npm install

# 3. Instalar dependencias del frontend
cd ../frontend
npm install
```

En Windows tambiÃ©n puedes ejecutar `levantar-sistema.cmd` en la raÃ­z: instala dependencias si faltan, compila el panel y arranca el servidor en http://localhost:3001.

## ConfiguraciÃ³n de variables de entorno

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

# IA â€” opcional. Sin clave, el chatbot usa modo mock automÃ¡ticamente.
OPENAI_API_KEY=""
AI_MODEL="gpt-3.5-turbo"
```

> **Nota:** Si se configura `OPENAI_API_KEY`, el chatbot usarÃ¡ la IA real de OpenAI. Sin ella, funciona en **modo mock** con la base de conocimientos administrable desde el panel.

## ConfiguraciÃ³n de la base de datos

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

El mÃ³dulo de cursos por mÃ³dulos incluye un script de migraciÃ³n de datos que crea los tres
mÃ³dulos y sus cuestionarios en cada curso existente y asigna los materiales al MÃ³dulo 1:

```bash
cd backend
npm run db:migrate:courses
```

Es idempotente: puede ejecutarse varias veces sin duplicar registros.

Para producciÃ³n con **PostgreSQL**, cambiar en `backend/prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Y actualizar `DATABASE_URL` en `.env` (ej. `postgresql://user:pass@localhost:5432/jovenes_ciudad`), luego ejecutar `npx prisma migrate deploy`.

## CÃ³mo iniciar frontend y backend

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
# AplicaciÃ³n disponible en http://localhost:5173
```

El frontend usa un proxy que reenvÃ­a `/api` y `/uploads` al backend, por lo que no requiere configuraciÃ³n adicional en desarrollo.

En producciÃ³n, compila el panel (`npm run build` en `frontend/`) y sirve `frontend/dist` desde el backend: la misma URL (puerto 3001) entrega sitio y API.

### Permisos por rol

| AcciÃ³n | Admin | Colaborador | Usuario/Cliente |
|---|---|---|---|
| Panel de gestiÃ³n | âœ… | âœ… | âŒ |
| Gestionar usuarios del sistema | âœ… | Ver solamente | âŒ |
| Crear/editar clientes | âœ… | âœ… | âŒ |
| Interacciones y seguimientos | âœ… | âœ… | âŒ |
| Crear/editar cursos y materiales | âœ… | âœ… | âŒ |
| Aprobar/rechazar inscripciones | âœ… | âœ… | âŒ |
| Administrar contenido web y chatbot | âœ… | âŒ | âŒ |
| Inscribirse en cursos | âœ… | âœ… | âœ… |
| Usar el chatbot | âœ… | âœ… | âœ… |

## Estructura general del proyecto

```
jovenes-ciudad/
â”œâ”€â”€ backend/                      # API REST
â”‚   â”œâ”€â”€ prisma/
â”‚   â”‚   â”œâ”€â”€ schema.prisma         # Modelo de datos
â”‚   â”‚   â””â”€â”€ seed.js               # Datos iniciales
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ config/               # ConfiguraciÃ³n (Prisma client)
â”‚   â”‚   â”œâ”€â”€ controllers/          # LÃ³gica de cada mÃ³dulo
â”‚   â”‚   â”œâ”€â”€ middleware/           # Auth, roles, validaciÃ³n, errores
â”‚   â”‚   â”œâ”€â”€ routes/               # DefiniciÃ³n de rutas REST
â”‚   â”‚   â”œâ”€â”€ services/             # Servicio de IA (mock + OpenAI)
â”‚   â”‚   â”œâ”€â”€ uploads/              # Archivos subidos
â”‚   â”‚   â””â”€â”€ utils/                # Helpers y constantes
â”‚   â””â”€â”€ .env.example
â”œâ”€â”€ frontend/                     # AplicaciÃ³n React
â”‚   â”œâ”€â”€ public/
â”‚   â””â”€â”€ src/
â”‚       â”œâ”€â”€ api/                  # Cliente Axios
â”‚       â”œâ”€â”€ components/
â”‚       â”‚   â”œâ”€â”€ auth/             # Rutas protegidas
â”‚       â”‚   â”œâ”€â”€ chatbot/          # Widget del chatbot
â”‚       â”‚   â”œâ”€â”€ layout/           # Navbar, Footer, Sidebar, AdminLayout
â”‚       â”‚   â””â”€â”€ ui/               # Componentes reutilizables (Alertas, Tablas, Modales...)
â”‚       â”œâ”€â”€ context/              # Contexto de autenticaciÃ³n
â”‚       â”œâ”€â”€ pages/
â”‚       â”‚   â”œâ”€â”€ admin/            # Dashboard, CRM, cursos, recursos, chat, contenido
â”‚       â”‚   â”œâ”€â”€ auth/             # Login y registro
â”‚       â”‚   â””â”€â”€ public/           # PÃ¡ginas del sitio pÃºblico
â”‚       â”œâ”€â”€ App.jsx               # DefiniciÃ³n de rutas
â”‚       â””â”€â”€ main.jsx              # Punto de entrada
â”œâ”€â”€ levantar-sistema.cmd          # Arranque de un paso (Windows)
â””â”€â”€ reconstruir-panel.cmd         # Recompila el frontend tras editar cÃ³digo
```

## Modelo de datos

Base de datos relacional con las siguientes entidades:

- **Roles** y **Usuarios** (autenticaciÃ³n y permisos)
- **Clientes** (fichas del CRM con estados y responsable asignado)
- **Interacciones** y **Seguimientos** (historial por cliente)
- **Cursos** e **Inscripciones** (catÃ¡logo, estados y aula virtual con mÃ³dulos, progreso y cuestionarios)
- **Recursos** (materiales de cursos: documentos, presentaciones y enlaces, organizados por mÃ³dulo)
- **MÃ³dulos de curso** (exactamente 3 por curso), **Cuestionarios**, **Preguntas**, **Opciones** y **Intentos**
- **Progreso de recursos** (finalizaciÃ³n automÃ¡tica por usuario)
- **Conversaciones** y **Mensajes** (chatbot con escalamiento)
- **Contenido de pÃ¡ginas** (CMS: textos, temas e actividades realizadas)
- **Conocimiento del chatbot** (base administrable de preguntas/respuestas)
- **Notificaciones** (asignaciones, seguimientos y escalamientos)
- **Documentos corporativos** (informaciÃ³n oficial de la fundaciÃ³n)

## Copias de seguridad

- **Base de datos SQLite:** copiar el archivo `backend/prisma/dev.db`.
- **Archivos subidos:** copiar los archivos de `backend/src/uploads/`.
- Las credenciales siempre van en `.env` (nunca en el cÃ³digo).

## Licencia

Uso interno de la organizaciÃ³n. Desarrollado con tecnologÃ­as de cÃ³digo abierto.
