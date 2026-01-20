# Guía de Setup - Tuli v1

## 🚀 Instalación Rápida

### Requisitos Previos
- **Node.js**: >= 18.0.0
- **PostgreSQL**: >= 14.0
- **npm**: >= 9.0.0
- **Git**: Cualquier versión moderna

### Pasos de Instalación

#### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd tuli-v1
```

#### 2. Instalar Dependencias
```bash
npm install
```

#### 3. Configurar Variables de Entorno
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar .env con tus valores
# - DATABASE_URL: Tu conexión a PostgreSQL
# - DIRECT_URL: Misma URL (usado en serverless)
```

**Ejemplo de .env:**
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/tuli_db"
DIRECT_URL="postgresql://postgres:password@localhost:5432/tuli_db"
NODE_ENV="development"
```

#### 4. Configurar Base de Datos
```bash
# Crear la base de datos (desde psql o PgAdmin)
createdb tuli_db

# Ejecutar migraciones de Prisma
npx prisma migrate dev

# (Opcional) Abrir Prisma Studio para ver la BD
npm run prisma:studio
```

#### 5. Iniciar el Servidor de Desarrollo
``` bash
npm run dev
```

La aplicación estará disponible en: `http://localhost:3000`

---

## 🔧 Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo (hot reload) |
| `npm run build` | Build de producción |
| `npm run start` | Inicia servidor de producción |
| `npm run lint` | Ejecuta ESLint |
| `npm run prisma:studio` | Abre GUI de Prisma para explorar BD |
| `npm run migrate:dev` | Crea nueva migración (desarrollo) |
| `npm run migrate:deploy` | Aplica migraciones (producción) |
| `npm run migrate:status` | Ver estado de migraciones |

---

## 🗄️ Configuración de PostgreSQL

### Opción 1: PostgreSQL Local

**Instalación en Windows:**
1. Descargar desde [postgresql.org](https://www.postgresql.org/download/windows/)
2. Instalar con valores por defecto
3. Recordar el password del usuario `postgres`
4. Crear base de datos: `createdb tuli_db`

**Instalación en macOS:**
```bash
brew install postgresql@14
brew services start postgresql@14
createdb tuli_db
```

**Instalación en Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb tuli_db
```

### Opción 2: PostgreSQL en la Nube (Gratis)

**Supabase** (Recomendado para desarrollo):
1. Ir a [supabase.com](https://supabase.com)
2. Crear cuenta y nuevo proyecto
3. Copiar `DATABASE_URL` desde Settings → Database
4. Pegar en tu `.env`

**Alternativas:**
- **Neon** ([neon.tech](https://neon.tech)) - 10 GB gratis
- **Railway** ([railway.app](https://railway.app)) - Plan hobby con límites
- **Render** ([render.com](https://render.com)) - PostgreSQL gratis (30 días)

---

## 🐛 Troubleshooting

### Error: "connect ECONNREFUSED ::1:5432"
**Causa:** PostgreSQL no está corriendo o la conexión está mal configurada.

**Solución:**
1. Verificar que PostgreSQL esté corriendo:
   ```bash
   # Windows
   Get-Service postgresql*
   
   # macOS/Linux
   pg_isready
   ```
2. Revisar `DATABASE_URL` en `.env`

### Error: "Schema prisma is out of sync"
**Causa:** Los modelos de Prisma no coinciden con la BD.

**Solución:**
```bash
npx prisma migrate reset  # ⚠️ Borra todos los datos
# O
npx prisma db push        # Sync sin migración formal
```

### Error: "Module not found" después de npm install
**Causa:** Caché corrupto de Next.js o node_modules

**Solución:**
```bash
rm -rf node_modules .next
npm install
npm run dev
```

### Puerto 3000 ya en uso
**Solución:**
```bash
# Cambiar puerto manualmente
PORT=3001 npm run dev

# O matar proceso en puerto 3000 (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 📝 Primeros Pasos Después de Setup

1. **Acceder a la aplicación:**
   - Ir a `http://localhost:3000`
   - Automáticamente se crea usuario demo: `demo@financetracker.com`

2. **Crear primera institución:**
   - Ir a `/accounts`
   - Click en "+ Nueva Institución"
   - Tipo: Banco o Billetera

3. **Crear primer producto:**
   - Seleccionar institución creada
   - Click en "+ Nuevo Producto"
   - Ejemplo: Tarjeta de Crédito VISA

4. **Registrar transacciones:**
   - Click en el producto
   - "+ Nueva Transacción" o "+Ingreso"

5. **Importar PDF** (Opcional):
   - Si tienes un resumen de Galicia, Nación, Naranja o Rioja
   - Click en "Importar Resumen"
   - Subir PDF y seguir wizard

---

## 🔐 Notas de Seguridad

- ⚠️ **Nunca** commitear el archivo `.env` al repositorio
- ✅ `.env` está en `.gitignore` por defecto
- ✅ Use `.env.example` como plantilla (sin credenciales reales)
- 🔒 En producción, usar variables de entorno del hosting (Vercel, Railway, etc.)

---

## 📚 Recursos Adicionales

- [Documentación Principal](../TECHNICAL_ANALYSIS.md)
- [Sistema de Diseño](../DESIGN_SYSTEM.md)
- [Product Requirements](../PROD.md)
- [Changelog](../CHANGELOG.md)
- [Troubleshooting Avanzado](./guides/troubleshooting.md)

---

**¿Encontraste algún problema?** Abrir un issue o consultar la documentación interna en `/docs`.
