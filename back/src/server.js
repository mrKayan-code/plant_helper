import express from 'express';
import cors from 'cors';
import { join } from 'node:path';
import './db.js'; 
import plantsRouter from './routes/plants.js';
import authRouter from './routes/auth.js';
import collectionRouter from './routes/collection.js';
import favoritesRouter from './routes/favorites.js';
import remindersRouter from './routes/reminders.js';
import adminRouter from './routes/admin.js';
import pushRouter from './routes/push.js';
import { initPush, startPushScheduler } from './push.service.js';

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());



app.use('/assets', express.static(join(import.meta.dirname, '..', '..', 'assets')));


app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});


app.use('/api/auth', authRouter);           
app.use('/api/plants', plantsRouter);       
app.use('/api/collection', collectionRouter); 
app.use('/api/favorites', favoritesRouter);   
app.use('/api/reminders', remindersRouter);   
app.use('/api/push', pushRouter);             


if (process.env.ADMIN_ENABLED === 'true') {
  app.use('/api/admin', adminRouter);
  app.get('/admin', (req, res) => {
    res.sendFile(join(import.meta.dirname, '..', 'public', 'admin.html'));
  });
  console.log('⚠️  Админка включена: http://localhost:' + PORT + '/admin');
}


app.use((req, res) => {
  res.status(404).json({ error: 'Эндпоинт не найден' });
});



app.use((err, req, res, next) => {
  
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: 'Некорректный JSON в теле запроса' });
  }
  console.error('Необработанная ошибка:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});


initPush();
startPushScheduler();

app.listen(PORT, () => {
  console.log(`Plant Helper API запущен: http://localhost:${PORT}`);
});
