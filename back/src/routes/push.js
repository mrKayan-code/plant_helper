import { Router } from 'express';
import { pushRepo } from '../repositories/push.repo.js';
import { sendToUser } from '../push.service.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = Router();

// Публичный VAPID-ключ — нужен фронту для подписки. Токен не требуется.
router.get('/vapid-public-key', (req, res) => {
  const publicKey = process.env.VAPID_PUBLIC;
  if (!publicKey) return res.status(503).json({ error: 'Push не настроен на сервере' });
  res.json({ publicKey });
});

// Сохранить подписку текущего пользователя.
router.post('/subscribe', requireAuth, (req, res) => {
  const sub = req.body;
  if (!sub || !sub.endpoint) {
    return res.status(400).json({ error: 'Некорректная подписка' });
  }
  pushRepo.save(req.userId, sub);
  res.status(201).json({ ok: true });

  // Приветственный пуш — мгновенное подтверждение, что всё работает.
  sendToUser(req.userId, {
    title: 'Уведомления включены 🔔',
    body: 'Теперь напомним, когда растениям понадобится уход 🌱',
    url: '/',
  });
});

// Тестовый пуш себе — удобно проверить, что всё работает (демо).
router.post('/test', requireAuth, async (req, res) => {
  await sendToUser(req.userId, {
    title: 'Plant Helper 🌱',
    body: 'Тестовое уведомление — всё работает!',
    url: '/',
  });
  res.json({ ok: true });
});

export default router;
