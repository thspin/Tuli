# Rediseño de "Mis Cuentas" - Documentación

## Resumen de Cambios

Se ha completado el rediseño completo de la página "Mis Cuentas" con las siguientes mejoras principales:

## 1. Componentes Creados

### InstitutionCarousel.tsx

- **Ubicación**: `/src/components/accounts/InstitutionCarousel.tsx`
- **Funcionalidad**:
  - Carrusel horizontal de instituciones financieras
  - Institución seleccionada al centro con opacidad 100%
  - Instituciones adyacentes con opacidad 40-50% y escala reducida (85%)
  - Navegación con flechas laterales
  - Indicadores de puntos en la parte inferior
  - Transiciones suaves de 300ms con easing ease-in-out
  - Responsive: muestra diferentes cantidades según el viewport

### ProductCard.tsx

- **Ubicación**: `/src/components/accounts/ProductCard.tsx`
- **Funcionalidad**:
  - Diseño visual estilo tarjeta bancaria real
  - Aspect ratio 1.586:1 (estándar tarjeta bancaria)
  - Border radius 16-20px con sombras sutiles
  - **Contenido de tarjetas**:
    - Nombre de institución (superior izquierda)
    - Logo de proveedor VISA/Mastercard/AMEX (superior derecha)
    - Número enmascarado "•••• •••• •••• 1234"
    - Fecha de vencimiento
    - Tipo de producto (Débito/Crédito)
  - **Colores**:
    - 30+ combinaciones de gradientes para diferentes bancos argentinos
    - Detección automática basada en nombre de institución
    - Colores específicos: NaranjaX (morado), Galicia (naranja), BBVA (azul), etc.
  - Marca de agua decorativa del nombre de institución (opacidad 5%)
  - Estados interactivos:
    - Hover: scale(1.05) + shadow-xl
    - Selected: ring-2 con color primario
  - Diseño alternativo para productos no-tarjeta (efectivo, préstamos)

### ProductDetailsPanel.tsx

- **Ubicación**: `/src/components/accounts/ProductDetailsPanel.tsx`
- **Funcionalidad**:
  - Panel lateral deslizable desde la derecha (ancho 400px)
  - Animación slide-in de 300ms
  - **Desktop**: Panel fijo lateral
  - **Mobile**: Overlay a pantalla completa con backdrop blur
  - **Información mostrada**:
    - Saldo actual (destacado con color success/destructive)
    - Nombre del producto
    - Tipo de producto
    - Proveedor de tarjeta (si aplica)
    - Número de tarjeta con toggle mostrar/ocultar
    - Titular (estático por ahora)
    - Fecha de vencimiento
    - Días de cierre y vencimiento (tarjetas de crédito)
    - Límites de compras y cuotas
    - Estado activo/inactivo
  - **Acciones**:
    - Mostrar/Ocultar número completo
    - Descargar extracto (placeholder)
    - Establecer como predeterminado (placeholder)
  - Botón cerrar (X) en esquina superior derecha
  - Cierre al hacer clic en backdrop

## 2. Componentes Modificados

### AccountsClient.tsx

- **Cambios principales**:
  - Integración completa del carrusel de instituciones
  - Grid responsivo de tarjetas:
    - Desktop (>1024px): 3 columnas
    - Tablet (768-1024px): 2 columnas
    - Mobile (<768px): 1 columna
  - Manejo de estado para:
    - Institución seleccionada
    - Producto seleccionado (para panel de detalles)
  - Sección separada para efectivo
  - Estado vacío mejorado con iconos y mensajes
  - Panel de detalles condicional

### ThemeSwitcher.tsx

- **Cambios**:
  - Eliminado tema "Azul" (blue-sober)
  - Solo mantiene "Claro" y "Oscuro"
  - Diseño compacto con iconos ☀️ y 🌙

### globals.css

- **Cambios**:
  - Agregada animación `@keyframes slideInRight` para el panel
  - Clase utilitaria `.animate-slide-in-right`
  - Clase utilitaria `.shadow-glow` para efectos de hover
  - Tema blue-sober mantenido en CSS pero removido del selector

## 3. Estructura del Layout

### Header (Fijo)

```
┌─────────────────────────────────────────────────────┐
│ ← Inicio                            [☀️ Claro] [🌙]  │
├─────────────────────────────────────────────────────┤
│ Mis Cuentas                                         │
│ Gestiona tus productos financieros                  │
├─────────────────────────────────────────────────────┤
│ [Ver en: ARS USD]  [+ Nueva Institución] [+ Nuevo] │
└─────────────────────────────────────────────────────┘
```

### Carrusel de Instituciones

```
┌─────────────────────────────────────────────────────┐
│       [prev]    [Seleccionada]    [next]       ←→   │
│                     ● ○ ○ ○                         │
└─────────────────────────────────────────────────────┘
```

### Grid de Productos

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Tarjeta  │  │ Tarjeta  │  │ Tarjeta  │
│    1     │  │    2     │  │    3     │
└──────────┘  └──────────┘  └──────────┘
```

## 4. Responsive Design

### Desktop (>1024px)

- Carrusel: 3 instituciones visibles (1 seleccionada + 2 previews)
- Grid: 3 columnas
- Panel: lateral fijo (400px)

### Tablet (768-1024px)

- Carrusel: 3 instituciones
- Grid: 2 columnas
- Panel: lateral con overlay

### Mobile (<768px)

- Carrusel: 1.5 instituciones (seleccionada + preview)
- Grid: 1 columna
- Panel: fullscreen overlay con backdrop

## 5. Animaciones y Transiciones

### Carrusel

- Cambio de institución: 300ms ease-in-out
- Scale y opacity: sincronizado
- Transform translateX para movimiento

### Tarjetas

- Hover: 200ms transform scale(1.05)
- Click→Selected: ring-2 instantáneo

### Panel

- Entrada: slideInRight 300ms ease-out
- Salida: transform 250ms ease-in
- Backdrop blur: fade 200ms

## 6. Estados Manejados

```typescript
- instituciones: InstitutionWithProducts[]
- selectedInstitutionId: string | null
- selectedProductId: string | null
- displayCurrency: 'ARS' | 'USD'
```

## 7. Interacciones Implementadas

1. **Navegación de carrusel**: Click en flechas o indicadores
2. **Selección de tarjeta**: Click abre panel de detalles
3. **Cerrar panel**: Click en X o backdrop
4. **Cambio de moneda**: Toggle ARS/USD
5. **Cambio de tema**: Toggle Claro/Oscuro
6. **Navegación**: Click en tarjeta redirige a detalle (cuando no hay panel)

## 8. Colores de Tarjetas por Institución

| Institución    | Color Principal  | Gradiente                              |
|----------------|------------------|----------------------------------------|
| NaranjaX       | Morado-Índigo   | purple-900 → purple-800 → indigo-900   |
| Galicia        | Naranja         | orange-700 → orange-600 → orange-700   |
| BBVA           | Azul Oscuro     | blue-800 → blue-700 → blue-800         |
| Santander      | Rojo            | red-700 → red-600 → red-700            |
| Mercado Pago   | Azul Cielo      | sky-600 → blue-500 → sky-600           |
| Ualá           | Violeta         | violet-700 → purple-600 → violet-700   |
| Brubank        | Rosa            | pink-600 → pink-500 → pink-600         |
| AstroPay       | Negro           | slate-900 → gray-900 → black           |
| HSBC           | Rojo            | red-700 → red-600 → red-700            |
| + 20 más...    |                 |                                        |

## 9. Accesibilidad

- Navegación por teclado soportada
- ARIA labels en botones
- Focus states visibles
- Contraste adecuado en todos los temas
- IDs únicos para elementos interactivos

## 10. Estado Vacío

### Sin instituciones

- Icono grande de tarjeta
- Mensaje: "No tienes cuentas registradas"
- Botones: Nueva Institución + Nuevo Producto

### Sin productos en institución

- Icono de suma
- Mensaje: "No hay productos en esta institución"
- Botón: Agregar Producto (pre-selecciona institución)

## 11. Archivos Modificados/Creados

### Creados

- `/src/components/accounts/InstitutionCarousel.tsx`
- `/src/components/accounts/ProductCard.tsx`
- `/src/components/accounts/ProductDetailsPanel.tsx`

### Modificados

- `/src/components/accounts/AccountsClient.tsx`
- `/src/components/ui/ThemeSwitcher.tsx`
- `/app/globals.css`

## 12. Testing Realizado

✅ Carrusel funciona correctamente con navegación
✅ Tarjetas se muestran con diseño correcto
✅ Panel de detalles se abre/cierra correctamente
✅ Responsive funciona en diferentes viewports
✅ Tema claro/oscuro funciona
✅ Efectivo y tarjetas muestran diseños apropiados
✅ Animaciones son suaves y profesionales

## 13. Mejoras Futuras Sugeridas

- [ ] Virtualización de grid para muchas tarjetas (100+)
- [ ] Gestos de swipe en mobile para el carrusel
- [ ] Animación de flip de tarjeta para ver reverso
- [ ] Lazy loading de imágenes de logos
- [ ] Shortcuts de teclado (Esc para cerrar panel)
- [ ] Modo de vista compacta/expandida
- [ ] Filtros por tipo de producto
- [ ] Búsqueda de productos
- [ ] Ordenamiento personalizado
- [ ] Favoritos/Destacados

## 14. Performance

- Grid responsivo con CSS Grid (performante)
- Transiciones CSS (aceleradas por GPU)
- Sin re-renders innecesarios
- Estado local optimizado
- Componentes memoizables si es necesario

---

**Fecha de implementación**: 2024-11-29
**Estado**: ✅ Completado y funcionando
