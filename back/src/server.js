import express from 'express';
import cors from 'cors';
import './db.js'; // инициализация БД + схемы при старте
import plantsRouter from './routes/plants.js';
import authRouter from './routes/auth.js';
import collectionRouter from './routes/collection.js';
import favoritesRouter from './routes/favorites.js';
import remindersRouter from './routes/reminders.js';

const app = express();
const PORT = process.env.PORT || 3000;

// --- middleware ---
app.use(cors());
app.use(express.json());

// --- health-check (Шаг 1) ---
app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// --- роутеры ---
app.use('/api/auth', authRouter);           // регистрация / логин (публичные)
app.use('/api/plants', plantsRouter);       // справочник (публичный)
app.use('/api/collection', collectionRouter); // личный список (защищён)
app.use('/api/favorites', favoritesRouter);   // избранное (защищён)
app.use('/api/reminders', remindersRouter);   // напоминания (защищён)

app.listen(PORT, () => {
  console.log(`Plant Helper API запущен: http://localhost:${PORT}`);
});
