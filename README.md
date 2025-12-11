# Tuli - Aplicación de Gestión Financiera Personal

Sistema completo de gestión financiera personal construido con Next.js 15, Prisma y PostgreSQL.

## 🚀 Características

- **Gestión de Cuentas**: Administra bancos, billeteras virtuales y efectivo
- **Productos Financieros**: Tarjetas de crédito, préstamos, cuentas corrientes
- **Transacciones**: Registro de ingresos y egresos con categorización
- **Resúmenes**: Generación automática de resúmenes mensuales para tarjetas
- **Multi-moneda**: Soporte para ARS, USD y conversión automática
- **Temas**: 3 temas disponibles (Claro, Oscuro, Azul Sobrio)

## 🛠️ Stack Tecnológico

- **Framework**: Next.js 15 (App Router)
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Estilos**: Tailwind CSS con sistema de diseño OKLCH
- **TypeScript**: Tipado completo
- **Deployment**: Vercel (recomendado)

## 📋 Requisitos Previos

- Node.js 20+
- PostgreSQL 14+
- npm o pnpm

## 🔧 Instalación

1. **Clonar el repositorio**

```bash
git clone <repository-url>
cd tuli
```

2. **Instalar dependencias**

```bash
npm install
```

3. **Configurar variables de entorno**

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/tuli"
```

4. **Configurar base de datos**

```bash
npx prisma generate
npx prisma db push
```

5. **Ejecutar en desarrollo**

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
tuli/
├── app/                    # Next.js App Router
│   ├── accounts/          # Página de cuentas
│   ├── categories/        # Página de categorías
│   ├── summaries/         # Página de resúmenes
│   ├── globals.css        # Estilos globales
│   └── layout.tsx         # Layout principal
├── src/
│   ├── actions/           # Server Actions
│   ├── components/        # Componentes React
│   │   ├── accounts/
│   │   ├── categories/
│   │   ├── summaries/
│   │   ├── transactions/
│   │   └── ui/           # Componentes UI reutilizables
│   ├── types/            # Definiciones TypeScript
│   └── utils/            # Utilidades
├── prisma/
│   └── schema.prisma     # Esquema de base de datos
└── docs/                 # Documentación

```

## 🎨 Sistema de Diseño

El proyecto utiliza un sistema de diseño moderno con:

- **Variables CSS OKLCH** para colores consistentes
- **3 Temas**: Light, Dark, Blue-Sober
- **Componentes UI reutilizables**: Button, Input, Select, Modal
- **Responsive design** con Tailwind CSS

## 📚 Documentación

- [Guía de Producción](./docs/PROD.md)
- [Resumen del Rediseño](./docs/REDISENO-COMPLETO.md)

## 🚀 Deployment

### Vercel (Recomendado)

1. Conecta tu repositorio en Vercel
2. Configura las variables de entorno
3. Deploy automático en cada push

### Manual

```bash
npm run build
npm start
```

## 🔐 Variables de Entorno

```env
# Base de datos
DATABASE_URL="postgresql://..."

# Opcional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID="..."
```

## 📝 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run start        # Servidor producción
npm run lint         # Linter
npm run prisma:studio # Prisma Studio
```

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y de uso personal.

## 👤 Autor

Pablo Moreno

---

**Nota**: Este es un proyecto en desarrollo activo. Algunas características pueden estar en progreso.
# tuli-v1
