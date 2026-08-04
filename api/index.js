// Ponto de entrada da função serverless da Vercel. Reexporta o mesmo app Express
// usado em desenvolvimento local (backend/src/server.js) — nenhuma rota é duplicada.
import app from '../backend/src/app.js';

export default app;
