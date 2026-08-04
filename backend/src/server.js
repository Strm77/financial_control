import app from './app.js';
import { ensureReady } from './db.js';

const PORT = process.env.PORT || 4000;

ensureReady()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Financial Control API rodando em http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Não foi possível conectar ao banco de dados:', err);
    process.exit(1);
  });
