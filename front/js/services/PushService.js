// Включение web-push: разрешение → регистрация Service Worker → подписка
// (с VAPID-ключом бэка) → отправка подписки на сервер. Дальше пуши шлёт
// бэкенд-планировщик, и SW показывает их даже при закрытой вкладке.
export class PushService {
  constructor(httpClient) {
    this.http = httpClient;
  }

  isSupported() {
    return (
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  async enable() {
    if (!this.isSupported()) {
      throw new Error("Браузер не поддерживает уведомления");
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      throw new Error("Разрешение на уведомления не выдано");
    }

    const reg = await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;

    // Публичный VAPID-ключ с бэка → подписка у пуш-сервиса браузера
    const { publicKey } = await this.http.get("/push/vapid-public-key");
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

    // Сохранить подписку на сервере (привязка к текущему пользователю)
    await this.http.post("/push/subscribe", sub);
    return true;
  }
}

// VAPID-ключ (base64url) → Uint8Array, как требует pushManager.subscribe.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}
