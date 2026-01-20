# MoneyInput - Formateo Automático de Montos

## 📝 Resumen

Se ha implementado un nuevo componente `MoneyInput` que formatea automáticamente los montos mientras el usuario escribe, utilizando el formato argentino (punto para miles, coma para decimales).

## ✨ Características

### Formateo Automático
- **Formato en tiempo real**: `100000` → `100.000`
- **Decimales**: `100000,5` → `100.000,5`
- **Auto-completado**: Al salir del campo, `100.000,5` → `100.000,50`
- **Formato argentino**: Punto (.) para separador de miles, coma (,) para decimales

### Integración
- ✅ Símbolo de moneda dinámico: $ o US$ según la moneda seleccionada
- ✅ Validación HTML5 integrada (required, min, max)
- ✅ Input hidden para envío de formularios en formato estándar
- ✅ Mantiene cursor en posición correcta durante el formateo

## 🛠️ Implementación Técnica

### Componente Principal
**Archivo**: `src/components/ui/MoneyInput.tsx`

```typescript
<MoneyInput
    label="Monto"
    currency="$"  // o "US$"
    value={amount}
    onChange={(value) => setAmount(value)}
    required
    placeholder="0,00"
/>
```

### Funciones Clave

1. **`formatArgentineNumber(value)`**: Formatea mientras se escribe
2. **`unformatArgentineNumber(value)`**: Convierte a formato estándar (100000.50)
3. **`standardToArgentine(value)`**: Convierte de estándar a argentino al cargar valores

## 📋 Formularios Actualizados

### 1. AddIncomeButton (Agregar Ingreso)
**Archivo**: `src/components/accounts/AddIncomeButton.tsx`
- ✅ Campo **Monto** con formateo automático
- ✅ Campo **Comisión** (modo "Ingreso por crédito") con formateo automático
- ✅ Símbolo de moneda dinámico basado en la cuenta seleccionada

### 2. AddTransactionButton (Agregar Egreso)
**Archivo**: `src/components/transactions/AddTransactionButton.tsx`
- ✅ Campo **Monto** con formateo automático
- ✅ Campo **Valor de cada cuota** con formateo automático (cuando hay cuotas)
- ✅ Símbolo de moneda dinámico basado en la cuenta seleccionada

### 3. AddTransferButton (Transferir)
**Archivo**: `src/components/accounts/AddTransferButton.tsx`
- ✅ Campo **Monto a transferir** con formateo automático
- ✅ Campo **Monto a recibir** (conversión de moneda) con formateo automático
- ✅ Símbolos de moneda dinámicos para origen y destino

## 💡 Ejemplo de Uso en el Código

### Antes:
```tsx
<Input
    type="number"
    label="Monto"
    name="amount"
    step="0.01"
    required
    placeholder="0.00"
/>
```

### Después:
```tsx
<div>
    <MoneyInput
        label="Monto"
        currency={selectedProduct?.currency === 'USD' ? 'US$' : '$'}
        value={amount}
        onChange={(value) => setAmount(value)}
        required
        placeholder="0,00"
    />
    <input type="hidden" name="amount" value={amount} />
</div>
```

## 🎯 Flujo de Datos

1. **Usuario escribe**: `100000`
2. **MoneyInput formatea**: `100.000`
3. **Estado interno**: `100000` (formato estándar: "100000")
4. **Hidden input**: Envía `100000` en el form submit
5. **Usuario sale del campo**: Auto-completa a `100.000,00`

## 🚀 Beneficios

- ✅ Mejor **experiencia de usuario**: más fácil leer y entender los montos
- ✅ **Reduce errores**: formato inmediato ayuda a detectar errores de tipeo
- ✅ **Profesional**: apariencia más pulida y moderna
- ✅ **Accesible**: funciona con validación HTML5 nativa
- ✅ **Consistente**: mismo formato en toda la aplicación

## 📦 Exportación

El componente está exportado desde: `src/components/ui/index.ts`

```typescript
export { default as MoneyInput } from './MoneyInput';
```

## 🔧 Propiedades del Componente

| Propiedad | Tipo | Requerido | Default | Descripción |
|-----------|------|-----------|---------|-------------|
| `label` | string | No | - | Etiqueta del campo |
| `currency` | string | No | '$' | Símbolo de moneda a mostrar |
| `value` | string | No | '' | Valor en formato estándar |
| `onChange` | (value: string) => void | No | - | Callback con valor sin formato |
| `required` | boolean | No | false | Campo requerido |
| `placeholder` | string | No | '' | Texto de placeholder |
| Otros props HTML input | - | No | - | Se pasan directamente al input |

## 🎨 Estilo Visual

- **Símbolo de moneda**: Posicionado absolutamente a la izquierda
- **Padding izquierdo**: Ajustado para no superponer el símbolo
- **Color del símbolo**: Gris claro (`text-slate-400`)
- **Consistencia**: Usa los mismos estilos que el componente `Input` base
