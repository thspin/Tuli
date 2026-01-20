# Ingreso por Crédito - Documentación

## Descripción General
Funcionalidad especial para registrar ingresos de efectivo tomados a crédito desde una tarjeta de crédito (adelantos en efectivo o "cash advances").

## Flujo de Operación

### Ejemplo Real:
- **Recibo en Astropay**: $100 ARS
- **Cargo en Tarjeta VISA Galicia**: $105 ARS (incluye $5 de comisión)

### Transacciones Creadas:
1. ✅ **Ingreso** en cuenta destino (Astropay): +$100
2. ✅ **Consumo** en tarjeta de crédito (VISA): -$100 (categoría seleccionada)
3. ✅ **Comisión** en tarjeta de crédito (VISA): -$5 (categoría "Intereses")

## Implementación

### Componentes Modificados:
- **`src/components/accounts/AddIncomeButton.tsx`**
  - Detecta cuando se selecciona la categoría "Ingreso por crédito"
  - Muestra campos adicionales:
    - Selector de tarjeta de crédito origen (solo MercadoPago y Astropay)
    - Campo de comisión
  - Llama al action correspondiente según el tipo de ingreso

### Actions Creados:
- **`src/actions/accounts/income-by-credit-actions.ts`**
  - Maneja la lógica de "Ingreso por crédito"
  - Crea 3 transacciones atómicamente:
    1. Ingreso en cuenta destino
    2. Cargo principal en tarjeta
    3. Cargo por comisión (categoría "Intereses")
  - Actualiza los balances correspondientes

## Requisitos
- ✅ Categoría "Ingreso por crédito" debe existir
- ✅ Categoría "Intereses" debe existir (se usa para la comisión)
- ✅ Solo permite tarjetas de MercadoPago o Astropay como origen

## Validaciones
- Monto debe ser mayor a 0
- Comisión debe ser >= 0
- Debe seleccionar cuenta destino
- Debe seleccionar tarjeta de crédito
- Descripción es requerida

## Integración con Resúmenes
Cuando se cierre el resumen de la tarjeta de crédito:
- Aparecerán 2 transacciones:
  1. Adelanto (con categoría original)
  2. Comisión (con categoría "Intereses")
- Al pagar el resumen, se registrará correctamente el monto total con la comisión incluida
