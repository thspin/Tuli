# 💰 Tuli v1 - Finance OS

**Sistema moderno de gestión financiera personal**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Aplicación web completa para trackear cuentas bancarias, tarjetas de crédito, transacciones y resúmenes financieros. Con importación automática de PDFs de bancos argentinos.

---

## ✨ Características Principales

- 🏦 **Gestión de Cuentas**: Bancos, billeteras, efectivo, tarjetas de crédito
- 💳 **Resúmenes Automáticos**: Generación y pago de resúmenes de tarjetas
- 📄 **Importación de PDFs**: Parsers para Galicia, Nación, Naranja, Rioja
- 💱 **Multi-Moneda**: ARS, USD, USDT, USDC, BTC
- 📊 **Dashboard Financiero**: Visualización de balances y transacciones
- 🔄 **Sistema de Cuotas**: Generación automática de cuotas futuras
- 🎨 **UI Premium**: Sistema de diseño "Tuli" con Tailwind CSS

## 🚀 Quick Start

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd tuli-v1

# 2. Instalar dependencias
npm install

# 3. Configurar base de datos
cp .env.example .env
# Editar .env con tu DATABASE_URL

# 4. Ejecutar migraciones
npx prisma migrate dev

# 5. Iniciar servidor
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

📘 **Guía completa de instalación:** [docs/SETUP.md](docs/SETUP.md)

---

## 📚 Documentación

| Documento | Descripción |
|-----------|-------------|
| **[docs/TECHNICAL_ANALYSIS.md](docs/TECHNICAL_ANALYSIS.md)** | 📖 Análisis técnico completo del proyecto |
| **[docs/AI_PROMPT.md](docs/AI_PROMPT.md)** | 🤖 Prompt maestro para vibe coding con IA |
| **[docs/RULES.md](docs/RULES.md)** | 🚫 Reglas absolutas de desarrollo (para IA) |
| **[docs/ANTI_PATTERNS.md](docs/ANTI_PATTERNS.md)** | ⚠️ Errores comunes y cómo evitarlos |
| **[docs/SCALABILITY.md](docs/SCALABILITY.md)** | 📈 Guía de escalabilidad y producción |
| **[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)** | 🎨 Sistema de diseño "Tuli" |
| **[docs/PROD.md](docs/PROD.md)** | 📋 Product Requirements Document |
| **[docs/CHANGELOG.md](docs/CHANGELOG.md)** | 📝 Historial de cambios |
| **[docs/SETUP.md](docs/SETUP.md)** | 🔧 Guía de instalación detallada |

---

## 🛠️ Stack Tecnológico

**Frontend:**
- Next.js 16.1 (App Router)
- React 19.2
- TypeScript 5.0+
- Tailwind CSS 3.4
- Framer Motion (animaciones)

**Backend:**
- Next.js Server Actions
- Prisma ORM 6.0
- PostgreSQL
- Zod (validación)

**Procesamiento:**
- pdf-parse / pdfjs-dist (PDFs bancarios)
- xlsx (Excel)
- date-fns (fechas)

---

## 📂 Estructura del Proyecto

```
tuli-v1/
├── app/              # Next.js App Router (páginas)
├── src/
│   ├── actions/      # Server Actions (lógica de negocio)
│   ├── components/   # Componentes React
│   ├── lib/          # Configuraciones (Prisma, Auth)
│   ├── types/        # Tipos TypeScript
│   └── utils/        # Utilidades (parsers, validaciones)
├── docs/             # Documentación completa
├── prisma/           # Schema y migraciones de BD
└── public/           # Assets estáticos
```

---

## 🎯 Roadmap

### ✅ Fase 1 - Completada (MVP)
- Sistema de cuentas e instituciones
- Transacciones (ingresos/egresos)
- Categorización manual
- Multi-moneda

### 🚧 Fase 2 - En Progreso (80%)
- ✅ Resúmenes de tarjetas
- ✅ Importación de PDFs
- ✅ UI moderna
- ⏳ Servicios recurrentes

### 📋 Fase 3 - Planificado
- Gráficos y analytics avanzados
- Metas de ahorro
- Exportación de datos
- Autenticación real (NextAuth)
- Tests automatizados

Ver [PROD.md](PROD.md) para más detalles.

---

## 🔐 Autenticación

**Estado Actual:** Usuario demo (`demo@financetracker.com`)  
**Próximamente:** NextAuth.js con Google/GitHub

⚠️ **Nota:** Actualmente NO está listo para multi-usuario en producción.

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add: Amazing Feature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

**Convenciones:**
- Commits en inglés usando [Conventional Commits](https://www.conventionalcommits.org/)
- TypeScript strict mode
- Seguir el Sistema de Diseño Tuli

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

---

## 🙏 Agradecimientos

- Next.js team por el excelente framework
- Prisma team por el ORM type-safe
- Tailwind CSS por el sistema de utilidades
- Comunidad open-source

---

## 📞 Soporte

- 📧 Email: [mailto:support@tuli.example.com](mailto:support@tuli.example.com)
- 🐛 Issues: [GitHub Issues](https://github.com/user/tuli-v1/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/user/tuli-v1/discussions)

---

**Hecho con ❤️ usando Next.js y TypeScript**

---

## 📊 Estado del Proyecto

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Coverage](https://img.shields.io/badge/coverage-0%25-red)
![Issues](https://img.shields.io/badge/issues-0-green)

**Última actualización:** 2026-01-14
