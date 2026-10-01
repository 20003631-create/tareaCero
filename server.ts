import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());

  // API endpoint para estrategia sugerida de estudio con Gemini
  app.post('/api/gemini/estrategia', async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        return res.status(503).json({
          error: 'API Key de Gemini no configurada en el servidor.',
          isConfigError: true
        });
      }

      const { tasks } = req.body;
      if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ error: 'No hay tareas escolares pendientes para analizar.' });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `Sos un tutor pedagógico experto para estudiantes de bachillerato.
Analizá la siguiente lista de tareas escolares pendientes y generá una estrategia sugerida de estudio priorizando qué tarea hacer primero y estimando el tiempo recomendado para cada una.

Tareas pendientes a analizar:
${JSON.stringify(tasks, null, 2)}
`;

      let responseText: string | undefined;
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'Sos un orientador educativo para estudiantes de bachillerato. Tu misión es organizar su tiempo y reducir el estrés escolar. Respondé con un objeto JSON estructurado.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                prioridad_sugerida: {
                  type: Type.STRING,
                  description: 'Nombre o título exacto de la tarea que conviene realizar primero'
                },
                razon: {
                  type: Type.STRING,
                  description: 'Explicación breve y motivadora de por qué comenzar por esta tarea'
                },
                plan_estudio: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Pasos secuenciales y tiempos recomendados de estudio (ej: Paso 1: Repasar apuntes durante 25 min)'
                }
              },
              required: ['prioridad_sugerida', 'razon', 'plan_estudio']
            }
          }
        });
        responseText = response.text;
      } catch (primaryErr) {
        console.warn('Reintento con gemini-flash-latest por congestión temporal...', primaryErr);
        const retryResp = await ai.models.generateContent({
          model: 'gemini-flash-latest',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          }
        });
        responseText = retryResp.text;
      }
      if (!responseText) {
        throw new Error('No se recibió texto en la respuesta de Gemini.');
      }

      const parsed = JSON.parse(responseText);
      return res.json(parsed);
    } catch (err: any) {
      console.error('Error al generar estrategia con Gemini:', err);
      return res.status(500).json({
        error: 'No se pudo generar la estrategia en línea.',
        message: err?.message || 'Error en el servidor de IA'
      });
    }
  });

  // Montar Vite middlewares en desarrollo
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(Number(port), '0.0.0.0', () => {
    console.log(`Servidor TAREA CERO activo en http://0.0.0.0:${port}`);
  });
}

startServer();
