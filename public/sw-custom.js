// Custom Service Worker for daily progress checks
// This file will be merged with the generated service worker

const CHECK_TIME_HOUR = 22; // 22:00

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_PROGRESS') {
    checkProgressAndNotify(event.data.token);
  }
  
  if (event.data && event.data.type === 'STORE_TOKEN') {
    // Store token for background sync
    storeToken(event.data.token);
  }
});

// Function to check if it's time to check (after 22:00)
function shouldCheckNow() {
  const now = new Date();
  const currentHour = now.getHours();
  return currentHour >= CHECK_TIME_HOUR;
}

// Function to get stored data from IndexedDB
async function getStoredData(key) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('challengetv-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('storage')) {
        resolve(null);
        return;
      }
      const transaction = db.transaction(['storage'], 'readonly');
      const store = transaction.objectStore('storage');
      const getRequest = store.get(key);
      getRequest.onsuccess = () => resolve(getRequest.result?.value || null);
      getRequest.onerror = () => reject(getRequest.error);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('storage')) {
        db.createObjectStore('storage');
      }
    };
  });
}

// Function to store data in IndexedDB
async function setStoredData(key, value) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('challengetv-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['storage'], 'readwrite');
      const store = transaction.objectStore('storage');
      const putRequest = store.put({ value }, key);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('storage')) {
        db.createObjectStore('storage');
      }
    };
  });
}

// Function to get today's date string
function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Function to check if we already checked today
async function hasCheckedToday() {
  const lastCheck = await getStoredData('last_progress_check');
  const today = getTodayDateString();
  return lastCheck === today;
}

// Function to mark that we checked today
async function markCheckedToday() {
  const today = getTodayDateString();
  await setStoredData('last_progress_check', today);
}

// Store token in memory (will be sent from main app)
let storedToken = null;

function storeToken(token) {
  storedToken = token;
}

// Function to get auth token
async function getAuthToken() {
  // First try to get from memory
  if (storedToken) {
    return storedToken;
  }
  
  // Try to get from IndexedDB
  try {
    const authData = await getStoredData('auth_tokens');
    return authData?.access || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

// Function to get API base URL
function getApiBaseUrl() {
  // Try to get from environment or use default
  return 'http://127.0.0.1:8000/api/v1';
}

// Function to check daily progress
async function checkDailyProgress() {
  try {
    const token = await getAuthToken();
    if (!token) {
      console.log('No auth token available');
      return;
    }

    const apiBaseUrl = getApiBaseUrl();
    
    // Get challenges
    const challengesResponse = await fetch(`${apiBaseUrl}/challenges/`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!challengesResponse.ok) {
      console.error('Failed to fetch challenges');
      return;
    }

    const challengesData = await challengesResponse.json();
    const challenges = challengesData.results || [];

    // Find first active challenge where user is joined
    let mainChallenge = null;
    for (const challenge of challenges) {
      const startDate = new Date(challenge.start_date);
      const endDate = new Date(challenge.end_date);
      const now = new Date();
      
      if (challenge.joined && now >= startDate && now <= endDate) {
        mainChallenge = challenge;
        break;
      }
    }

    if (!mainChallenge) {
      // Try to find any joined challenge
      mainChallenge = challenges.find(c => c.joined) || null;
    }

    if (!mainChallenge) {
      console.log('No active challenge found');
      return;
    }

    // Get today's date
    const today = getTodayDateString();

    // Get daily progress
    const progressResponse = await fetch(
      `${apiBaseUrl}/challenges/${mainChallenge.slug}/participants/me/daily-progress/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!progressResponse.ok) {
      console.error('Failed to fetch daily progress');
      return;
    }

    const progressData = await progressResponse.json();
    const todayProgress = progressData.results?.find(p => p.date === today);

    if (!todayProgress || !todayProgress.is_completed) {
      // Show notification
      await showNotification(mainChallenge.title);
      await markCheckedToday();
    } else {
      // Progress is completed, just mark as checked
      await markCheckedToday();
    }
  } catch (error) {
    console.error('Error checking daily progress:', error);
  }
}

// Function to show notification
async function showNotification(challengeTitle) {
  const permission = await self.registration.showNotification('ChallengeTV - Напоминание', {
    body: `Вы еще не отправили свой прогресс за сегодня в челлендже "${challengeTitle}". Не забудьте отправить отчет!`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'daily-progress-reminder',
    requireInteraction: false,
    data: {
      url: '/send-progress',
    },
  });
}

// Main function to check progress and notify
async function checkProgressAndNotify(token = null) {
  if (!shouldCheckNow()) {
    return;
  }

  if (await hasCheckedToday()) {
    return;
  }

  // Use provided token or get from storage
  if (token) {
    storedToken = token;
  }

  await checkDailyProgress();
}

// Handle background sync events
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-progress-now' || event.tag === 'daily-progress-check') {
    event.waitUntil(
      checkProgressAndNotify()
    );
  }
});

// Handle periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-progress-check') {
    event.waitUntil(
      checkProgressAndNotify()
    );
  }
});

// Check immediately when service worker is activated (only if it's after 22:00)
self.addEventListener('activate', (event) => {
  if (shouldCheckNow()) {
    event.waitUntil(
      checkProgressAndNotify()
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If there's already a window open, focus it
      for (const client of clientList) {
        if (client.url === event.notification.data?.url || 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data?.url || '/send-progress');
      }
    })
  );
});

