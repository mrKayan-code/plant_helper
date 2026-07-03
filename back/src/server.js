import express from 'express';
import cors from 'cors';
import './db.js'; // инициализация БД + схемы при старте

const app = express();
const PORT = process.env.PORT || 3000;

// --- middleware ---
app.use(cors());
app.use(express.json());

// --- health-check (Шаг 1) ---
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// --- роутеры (подключаются по мере готовности) ---
// import plantsRouter from './routes/plants.js';
// app.use('/api/plants', plantsRouter);

app.listen(PORT, () => {
  console.log(`Plant Helper API запущен: http://localhost:${PORT}`);
});
