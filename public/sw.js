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
