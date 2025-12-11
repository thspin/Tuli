Rol: Actúa como un Arquitecto de Software Senior y experto en integración de LLMs.

Contexto: Conoces perfectamente la estructura del proyecto "Tuli" (gestión de finanzas personales), incluyendo su base de datos, lógica de negocio y UI actual.

Objetivo: Implementar un Agente de Chat IA en la Home de la aplicación que permita controlar la totalidad de la aplicación mediante lenguaje natural utilizando la API de Google Gemini 1.5 Flash con la funcionalidad de Function Calling (Tools).

Requisitos de Implementación:

Capa de Servicios de IA (Backend):

Crea un servicio o controlador dedicado para la interacción con la API de Google Generative AI.

Api key: AIzaSyBHugtoeOud98NFP7A77p8IvsARXJzPnW4

Mapeo de Herramientas (Tools): Debes abstraer TODAS las funciones "CRUD" y de lógica de negocio existentes en Tuli (Crear/Editar/Borrar: Egresos, Ingresos, Cuentas, Productos, Servicios, Resúmenes) y definirlas como tools (declaraciones de función) para que el modelo las reconozca.

Asegúrate de tipar correctamente los parámetros de cada herramienta (ej: monto como float, fecha como string ISO, categoría como enum si aplica).

Lógica del Agente (System Instruction): Configura el modelo con una instrucción de sistema estricta que defina:

Personalidad: Extremadamente breve, robótica y eficiente. Cero charla social.

Manejo de Errores: Si faltan argumentos obligatorios para una función (ej: usuario dice "gasté 100" pero falta la categoría), el modelo debe generar una respuesta de texto solicitando solo el dato faltante, no ejecutar la función aún.

Contexto: Inyecta dinámicamente el estado actual si es necesario (ej: lista de nombres de cuentas válidas) para evitar alucinaciones.

Flujo de Ejecución (Ciclo de Chat): Implementa el siguiente bucle lógico:

Recibir input del usuario.

Enviar input + historial al API de Gemini con las tools habilitadas.

Caso A (Respuesta de Texto): Si el modelo pide más datos, mostrar respuesta al usuario.

Caso B (Llamada a Función): Si el modelo retorna una function_call:

Interceptar la llamada.

Ejecutar la función localmente en el backend de Tuli usando los argumentos provistos por la IA.

Capturar el resultado (éxito o error).

Enviar el resultado de vuelta a Gemini (Function Response).

Mostrar la confirmación final generada por Gemini al usuario.

Interfaz de Usuario (Frontend):

Añade un componente de chat minimalista en la Home.

Debe ser no intrusivo pero accesible.

Debe mantener el historial de la sesión actual visualmente.

Restricciones Técnicas:

No uses librerías pesadas de orquestación (como LangChain) a menos que sea estrictamente necesario; prefiere la integración directa con el SDK de Google para no consumir memoria local innecesaria.

El código debe ser modular: separa la definición de las herramientas de la lógica de conexión con la API.

Instrucción Final: Genera el código necesario para integrar esto en el stack actual del proyecto, asegurando que el agente pueda manejar el ciclo completo de una transacción (desde la intención vaga hasta la confirmación de base de datos) sin errores.
