import express from 'express';
import cors from 'cors';
import { join } from 'node:path';
import './db.js'; // инициализация БД + схемы при старте
import plantsRouter from './routes/plants.js';
import authRouter from './routes/auth.js';
import collectionRouter from './routes/collection.js';
import favoritesRouter from './routes/favorites.js';
import remindersRouter from './routes/reminders.js';
import adminRouter from './routes/admin.js';

const app = express();
const PORT = process.env.PORT || 3000;

// --- middleware ---
app.use(cors());
app.use(express.json());

// --- статика картинок справочника («полусервер»: не отдельное хранилище,
// но и не свалка на фронте — бэк раздаёт assets, imageUrl указывает сюда) ---
app.use('/assets', express.static(join(import.meta.dirname, '..', '..', 'assets')));

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

// --- админка (dev-only, включается ADMIN_ENABLED=true) ---
if (process.env.ADMIN_ENABLED === 'true') {
  app.use('/api/admin', adminRouter);
  app.get('/admin', (req, res) => {
    res.sendFile(join(import.meta.dirname, '..', 'public', 'admin.html'));
  });
  console.log('⚠️  Админка включена: http://localhost:' + PORT + '/admin');
}

// --- 404: ни один роут не подошёл → JSON, а не HTML ---
app.use((req, res) => {
  res.status(404).json({ error: 'Эндпоинт не найден' });
});

// --- централизованный обработчик ошибок (4 аргумента = error middleware) ---
// ловит битый JSON в теле, брошенные исключения из роутов и т.п.
app.use((err, req, res, next) => {
  // невалидный JSON в теле запроса (express.json бросает SyntaxError со status 400)
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: 'Некорректный JSON в теле запроса' });
  }
  console.error('Необработанная ошибка:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

app.listen(PORT, () => {
  console.log(`Plant Helper API запущен: http://localhost:${PORT}`);
});
