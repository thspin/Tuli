import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';

// Cargar variables de entorno del archivo .env
dotenv.config();

// PRUEBA DIRECTA: Si esto falla, es tu cuenta/key. Si funciona, es tu entorno de desarrollo.
async function run() {
    const apiKey = process.env.GEMINI_API_KEY; // O reemplaza con tu clave directamente aquí: "TU_CLAVE"

    if (!apiKey) {
        console.error("ERROR: No se encontró GEMINI_API_KEY. Asegúrate de tener un archivo .env o pega tu clave en el script.");
        return;
    }

    console.log(`Usando API Key: ${apiKey.substring(0, 5)}...`);

    const genAI = new GoogleGenerativeAI(apiKey);

    // Probamos primero con el nombre específico
    // model: 'gemini-1.5-flash-001'
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

    try {
        console.log("Probando conexión con gemini-1.5-flash-001...");
        const result = await model.generateContent("Hola, ¿estás funcionando?");
        // text() is a function on the response text part, but sometimes result.response.text() works directly depending on SDK version
        const responseText = result.response.text();
        console.log("¡ÉXITO! Respuesta:", responseText);
    } catch (error) {
        console.error("ERROR FATAL:", error.message);

        // Si falla, listamos qué modelos REALMENTE ve tu llave (opcional, puede no funcionar en todas las versiones)
        console.log("\n--- INTENTANDO LISTAR MODELOS DISPONIBLES ---");
        // Esto es solo informativo y podría fallar si la API key no tiene permisos de listado
    }
}

run();
