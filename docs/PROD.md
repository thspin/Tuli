# Finance Tracker - PRD (Product Requirements Document)

## 1. OBJETIVO DEL PROYECTO
**Pregunta**: ¿Cuál es el objetivo principal de esta aplicación? 
¿Qué problema específico quieres resolver?

Tu respuesta:
El objetivo de esta aplicación es poder traquear íntegramente las finanzas personales de una persona para su posterior procesamiento, y que estos datos sirvan para que un agente de inteligencia artificial pueda ayudarlo a llegar a sus objetivos de ahorro e inversión.

Los problemas específicos son muchos, pero podríamos sintetizarlos en dos a las personas se les hace muy tedioso tener que estar llevando un control y un traqueo de todos sus gastos e ingresos y además a menudo sus acciones financieras son ejecutadas por impulsos y sentimientos que por un plan concreto.

---

## 2. MVP (Versión Mínima Viable)
**Pregunta**: ¿Cuáles son las 3-5 funcionalidades MÍNIMAS que necesitas 
para considerar que la app funciona? (Ya mencionaste: formulario de cuentas, 
formulario de transacciones, mini dashboard. ¿Algo más?)

Tu respuesta:
Si tenemos que hablar de una mínima versión, esta debería permitirme que yo simule o creer dentro de mi aplicación todas las cuentas financieras con sus productos. Además, me debería permitir mediante un formulario crear las transacciones que ejecuto cuando me ingresa dinero cuando hago gastos o cuando me adeudo o pido un crédito asimismo cuando los pago. Una tercera función importante es poder en alguna parte del mes hacer un Stop y que rápidamente un Dashboard me de un pantallazo de cuánto dinero tengo cuánto dinero debo cuánto llevo gastado en que rubros en qué categorías y si estoy cumpliendo con mi objetivo del mes o del cuatrimestre o el anual que me propuse.

---

## 3. REGLAS DE NEGOCIO - Cuentas
**Pregunta 3.1**: ¿Qué tipos de cuentas quieres manejar? 
(Ej: efectivo, banco, tarjeta de crédito, inversiones, etc.)

Tu respuesta:
Vamos a manejar efectivo, bancos, tanto en cajas de ahorros como en cuenta, corriente, tarjetas de crédito bancarizadas y no bancarizadas, préstamos, créditos, seguros, etc.

**Pregunta 3.2**: ¿Qué información MÍNIMA necesitas guardar de cada cuenta?
(Ej: nombre, tipo, saldo inicial, moneda)

Tu respuesta:
La información mínima que necesitamos de cada cuenta puede variar, pero en general necesitaremos saber de qué institución financiera es el producto cuál es el producto si tiene fecha de vencimiento o fecha de cierre, si tiene límites de uso, cuál es su saldo, qué monedas puede operar si el producto es gratuito o está bonificado, y si esa bonificación necesita de alguna acción en el mes tener un calendario, un recordatorio para no olvidarlo.

**Pregunta 3.3**: ¿Un usuario puede tener varias cuentas del mismo tipo?
(Ej: dos cuentas de banco diferentes)

Tu respuesta:
Sí, un usuario puede tener varias cuentas del mismo tipo, por ejemplo dos cuentas de banco diferentes.

---

## 4. REGLAS DE NEGOCIO - Transacciones
**Pregunta 4.1**: ¿Qué tipos de transacciones quieres registrar?
(Ej: ingreso, egreso, transferencia entre cuentas, deuda)

Tu respuesta:
Vamos a manejar ingresos, egresos, transferencias entre cuentas y deudas. en las deudas cabe aclarar que pueden ser deudas contraídas por tarjetas de crédito, deudas contraídas por un préstamo o deudas contraídas por fiado, es decir que se le debe a una persona, pero eso no es tras registrado en ninguna aplicación.

**Pregunta 4.2**: ¿Qué información MÍNIMA necesitas de cada transacción?
(Ej: monto, categoría, fecha, descripción)

Tu respuesta:
La información mínima que necesitamos de cada transacción puede variar, pero en general necesitaremos saber el monto, la fecha, la descripción, la categoría y la cuenta de origen y de destino. Es decir, necesito saber de cada transacción cuál fue el monto cuando se hizo una pequeña descripción que me indique algo por si me olvide cuál es que me digas desde qué cuenta salió hacia que cuenta fue y que asuma una categoría para poder hacer un resumen en el futuro esto al principio el usuario debería poder elegir la categoría pero a medida de que alguna gente aprenda de cuáles son las descripciones y esas descripciones a qué categoría corresponden esto podría empezar a probarse de automatizarse entonces por ejemplo si yo gasto en un supermercado en la gente ya debería saber que el gasto es de Mercado y no de salud.

**Pregunta 4.3**: ¿Quieres que las transacciones tengan categorías predefinidas 
o el usuario las escribe libremente?

Tu respuesta:
La idea es que el usuario pueda escribir libremente la descripción de la transacción y que el agente de IA pueda clasificarla en una categoría. Aunque no me molestaría en una primera versión que el usuario pueda agregar o eliminar categorías y que después pueda seleccionarlas para su propio uso.

**Pregunta 4.4**: Si te equivocas al cargar una transacción, ¿prefieres poder 
borrarla completamente o solo marcarla como "cancelada" pero mantenerla en 
el historial?

Tu respuesta:
Lo importante es que el usuario tenga pleno control de todos sus datos, por lo tanto, si se equivoca al cargar una transacción debería poder modificarla o eliminarla.

---

## 5. REGLAS DE NEGOCIO - Deudas
**Pregunta 5.1**: Mencionaste "deudas". ¿Las deudas son:
a) Transacciones normales con una categoría "deuda"?
b) Una entidad separada que tiene pagos parciales?
c) Otro modelo?

Tu respuesta:
La idea es que las deudas sean una entidad separada que tiene pagos parciales. Por lo tanto, si se pide un préstamo o un crédito, se debe registrar como una deuda y se debe registrar el pago parcial que se hizo. Además, las deudas tienen intereses que tienen que estar explícitos tienen fechas de pago, se pueden hacer en muchas cuotas, Y estas cuotas se ingresan en determinadas fechas y a veces ingresan en los resúmenes de las tarjetas de crédito y yo debería poder en algún punto del mes saber cuál es el monto del próximo resumen para no tener que esperar que Aylen te financiero me lo envíe a mi correo.

**Pregunta 5.2**: ¿Una deuda puede tener cuotas o pagos parciales?

Tu respuesta:
La idea es que las deudas puedan tener cuotas o pagos parciales. Pues tener cuotas pagos parciales, pero también puede pagarse en una sola vez.

---

## 6. DASHBOARD
**Pregunta 6.1**: En el mini dashboard del MVP, ¿qué 3-5 datos MÁS IMPORTANTES 
quieres ver? (Ej: saldo total, gastos del mes, ingresos del mes, 
últimas 5 transacciones, gráfico simple)

Tu respuesta:
Saldo total, gastos del mes, ingresos del mes, últimas 5 transacciones, gráfico simple. Esto no es un aspecto que al principio nos interesa, porque después el Dashboard seguramente se complejísima mucho.

---

## 7. FUTURO (post-MVP) - Prioridades
**Pregunta 7.1**: Después del MVP, ¿cuál es la PRIMERA funcionalidad que 
quieres agregar? (Mencionaste: WhatsApp, agente IA, metas de ahorro)

Tu respuesta:
WhatsApp, agente IA, metas de ahorro. Quiero que todo lo que se cargue por un formulario en el futuro uno lo pueda cargar por WhatsApp ya sea con texto o con audios o fotos. Además quiero que una gente inteligencia artificial aprenda de el comportamiento del usuario y puedas recomendarle, gastos, promociones, inversiones ahorros y lo ayude a llegar a sus metas, limitándole los gastos y recordándole todos los días los vencimientos para que estos no se pasen de fecha. Sería como tener un asesor financiero en tu teléfono.


[SECCIÓN TÉCNICA - YO LA COMPLETO DESPUÉS]
## Tech Stack y Arquitectura
(Esta sección la completo yo una vez que termines tus respuestas)