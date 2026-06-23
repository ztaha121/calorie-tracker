self.addEventListener('fetch', e => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)))
})

self.addEventListener('install', e => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(self.clients.openWindow('/'))
})

self.addEventListener('message', e => {
  if (e.data?.type === 'SCHEDULE_REMINDER') {
    const { time } = e.data
    scheduleReminder(time)
  }
  if (e.data?.type === 'CHECK_STREAK') {
    checkStreak(e.data.streak)
  }
})

function scheduleReminder(targetHour) {
  const now = new Date()
  const target = new Date()
  target.setHours(targetHour, 0, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  const delay = target.getTime() - now.getTime()
  setTimeout(() => {
    self.registration.showNotification('Mizan 🍎', {
      body: "You haven't logged today. Stay on track — tap to log a meal!",
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'daily-reminder',
      renotify: true,
    })
    scheduleReminder(targetHour)
  }, delay)
}

function checkStreak(streak) {
  const messages = {
    3:  { title: "3-day streak! 🔥", body: "You're building a habit. Don't break the chain — log today!" },
    7:  { title: "One week streak! 🏆", body: "7 days of tracking. You're on a roll — keep going!" },
    14: { title: "Two weeks strong! ✦", body: "14 days of consistency. This is how habits are made." },
    30: { title: "30-day streak! 🌟", body: "One full month. You're unstoppable." },
  }
  const msg = messages[streak]
  if (!msg) return
  self.registration.showNotification(msg.title, {
    body: msg.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: `streak-${streak}`,
  })
}