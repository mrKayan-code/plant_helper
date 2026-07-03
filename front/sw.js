// Service Worker — принимает web-push и показывает уведомление,
// в т.ч. когда вкладка приложения закрыта (браузер запущен).

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Plant Helper 🌱";
  const options = {
    body: data.body || "",
    data: { url: data.url || "/" },
    tag: data.tag || undefined, // одинаковый tag заменяет старое уведомление, а не плодит
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Клик по уведомлению — открыть/сфокусировать приложение.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
