importScripts("meals.js");
var CACHE = "lunch-v1";
var ASSETS = ["./", "index.html", "meals.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(function (r) { return r || fetch(e.request); }));
});

function todayNotif() {
  var m = MEALS[(new Date().getDate() - 1) % 30];
  var icon = { low: "🟢", mid: "🟡", high: "🔴" }[m.price];
  return self.registration.showNotification("🍽️ غداء النهاردة: " + m.name, {
    body: icon + " تكلفة " + PRICE_LABELS[m.price] + " • ⏱ " + m.time + " دقيقة\nاضغط لعرض الوصفة",
    icon: "icon-192.png", badge: "icon-192.png", tag: "lunch-" + m.id, lang: "ar", dir: "rtl", data: { id: m.id }
  });
}

/* مزامنة دورية في الخلفية (كروم على أندرويد للتطبيق المثبّت) */
self.addEventListener("periodicsync", function (e) {
  if (e.tag === "daily-lunch") {
    var h = new Date().getHours();
    if (h >= 11 && h <= 14) e.waitUntil(todayNotif());
  }
});

self.addEventListener("notificationclick", function (e) {
  e.notification.close();
  var id = e.notification.data && e.notification.data.id;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if ("focus" in list[i]) { list[i].postMessage({ meal: id }); return list[i].focus(); }
    }
    return self.clients.openWindow("./?meal=" + (id || ""));
  }));
});
