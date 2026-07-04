import webpush from 'web-push';
import { pushRepo } from './repositories/push.repo.js';
import { computeReminders, todayISO } from './reminders.service.js';

let enabled = false;


export function initPush() {
  const publicKey = process.env.VAPID_PUBLIC;
  const privateKey = process.env.VAPID_PRIVATE;
  if (!publicKey || !privateKey) {
    console.warn('⚠️  VAPID ключи не заданы — web-push отключён');
    return false;
  }
  webpush.setVapidDetails('mailto:admin@planthelper.local', publicKey, privateKey);
  enabled = true;
  return true;
}


function buildPayload(r) {
  const isWater = r.action === 'water';
  return {
    title: isWater ? 'Пора полить 🌱' : 'Пора пересадить 🪴',
    body: isWater ? `«${r.name}» ждёт воды` : `«${r.name}» пора пересадить`,
    url: '/',
  };
}


export async function sendToUser(userId, payload) {
  if (!enabled) return;
  const subs = pushRepo.byUser(userId);
  for (const sub of subs) {
    try {
      await webpush.sendNotification(sub, JSON.stringify(payload));
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        pushRepo.deleteByEndpoint(sub.endpoint); 
      } else {
        console.error('push error:', err.statusCode || err.message);
      }
    }
  }
}


async function tick() {
  const today = todayISO();
  for (const userId of pushRepo.subscribedUserIds()) {
    const due = computeReminders(userId).filter((r) => r.dueDate <= today);
    for (const r of due) {
      
      
      const key = `${r.collectionId}:${r.action}:${today}`;
      if (pushRepo.wasSent(userId, key)) continue;
      await sendToUser(userId, buildPayload(r));
      pushRepo.markSent(userId, key);
    }
  }
}

export function startPushScheduler() {
  if (!enabled) return;
  const interval = Number(process.env.PUSH_INTERVAL_MS) || 60000;
  setInterval(() => tick().catch((e) => console.error('scheduler:', e)), interval);
  console.log(`Пуш-планировщик запущен (каждые ${interval} мс)`);
}
