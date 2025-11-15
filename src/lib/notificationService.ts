import { apiClient } from './api';
import type { ChallengeList, DailyProgressResponse } from '@/types/api';
import { isChallengeActive, formatLocalDate, getTodayLocalDate } from './utils';

const NOTIFICATION_PERMISSION_KEY = 'notification_permission_requested';
const LAST_CHECK_KEY = 'last_progress_check';
const CHECK_TIME_HOUR = 22; // 22:00

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    localStorage.setItem(NOTIFICATION_PERMISSION_KEY, 'true');
    return permission === 'granted';
  }

  return false;
}

/**
 * Get the main active challenge for the user
 */
async function getMainChallenge(): Promise<ChallengeList | null> {
  try {
    const response = await apiClient.getChallenges();
    const challenges = response.results || [];
    
    // Find first active challenge where user is joined
    const activeJoined = challenges.find(challenge => {
      return isChallengeActive(challenge.start_date, challenge.end_date) && challenge.joined === true;
    });
    
    if (activeJoined) return activeJoined;
    
    // If not found, get first challenge where user is joined
    return challenges.find(challenge => challenge.joined === true) || null;
  } catch (error) {
    console.error('Error loading challenges:', error);
    return null;
  }
}

/**
 * Check if user has completed daily progress for today
 */
async function checkDailyProgress(challenge: ChallengeList): Promise<boolean> {
  try {
    const today = getTodayLocalDate();
    const progress = await apiClient.getDailyProgress(challenge.slug);
    
    // Find today's progress
    const todayProgress = progress.results?.find(p => p.date === today);
    
    if (!todayProgress) {
      return false;
    }
    
    // Check if progress is completed
    return todayProgress.is_completed;
  } catch (error) {
    console.error('Error checking daily progress:', error);
    return false;
  }
}

/**
 * Show notification if user hasn't completed daily progress
 */
function showProgressNotification(challengeTitle: string) {
  if (Notification.permission !== 'granted') {
    return;
  }

  const notification = new Notification('ChallengeTV - Напоминание', {
    body: `Вы еще не отправили свой прогресс за сегодня в челлендже "${challengeTitle}". Не забудьте отправить отчет!`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'daily-progress-reminder',
    requireInteraction: false,
    silent: false,
  });

  notification.onclick = () => {
    window.focus();
    notification.close();
  };
}

/**
 * Check if we should check progress today
 */
function shouldCheckToday(): boolean {
  const lastCheck = localStorage.getItem(LAST_CHECK_KEY);
  const today = getTodayLocalDate();
  
  // If we already checked today, don't check again
  if (lastCheck === today) {
    return false;
  }
  
  // Check current time - only check after 22:00
  const now = new Date();
  const currentHour = now.getHours();
  
  // If it's before 22:00, don't check yet
  if (currentHour < CHECK_TIME_HOUR) {
    return false;
  }
  
  return true;
}

/**
 * Mark that we checked today
 */
function markCheckedToday() {
  const today = getTodayLocalDate();
  localStorage.setItem(LAST_CHECK_KEY, today);
}

/**
 * Main function to check daily progress and show notification if needed
 */
export async function checkAndNotifyDailyProgress(): Promise<void> {
  // Check if notifications are allowed
  if (Notification.permission !== 'granted') {
    return;
  }

  // Check if we should check today
  if (!shouldCheckToday()) {
    return;
  }

  try {
    const mainChallenge = await getMainChallenge();
    
    if (!mainChallenge) {
      console.log('No active challenge found');
      return;
    }

    const isCompleted = await checkDailyProgress(mainChallenge);
    
    if (!isCompleted) {
      showProgressNotification(mainChallenge.title);
    }
    
    // Mark that we checked today
    markCheckedToday();
  } catch (error) {
    console.error('Error in checkAndNotifyDailyProgress:', error);
  }
}

/**
 * Schedule daily check using setInterval (checks every hour after 22:00)
 */
export function scheduleDailyCheck(): void {
  // Check immediately if it's after 22:00
  checkAndNotifyDailyProgress();

  // Set up interval to check every hour
  setInterval(() => {
    const now = new Date();
    const currentHour = now.getHours();
    
    // Only check if it's 22:00 or later
    if (currentHour >= CHECK_TIME_HOUR) {
      checkAndNotifyDailyProgress();
    }
  }, 60 * 60 * 1000); // Check every hour

  // Also register background sync for periodic checks
  registerBackgroundSync();
}

/**
 * Register background sync for periodic progress checks
 */
async function registerBackgroundSync(): Promise<void> {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Send token to service worker
      try {
        const { useAuthStore } = await import('@/stores/authStore');
        const token = useAuthStore.getState().tokens?.access;
        if (token && registration.active) {
          registration.active.postMessage({
            type: 'STORE_TOKEN',
            token: token,
          });
        }
      } catch (error) {
        console.log('Failed to send token to service worker:', error);
      }
      
      // Register periodic background sync (if supported)
      if ('periodicSync' in registration) {
        try {
          // @ts-ignore - periodicSync is experimental
          await registration.periodicSync.register('daily-progress-check', {
            minInterval: 24 * 60 * 60 * 1000, // 24 hours
          });
          console.log('Periodic background sync registered');
        } catch (error) {
          console.log('Periodic sync not supported or permission denied:', error);
        }
      }

      // Register one-time background sync for immediate check
      try {
        await registration.sync.register('check-progress-now');
      } catch (error) {
        console.log('Background sync registration failed:', error);
      }
    } catch (error) {
      console.log('Service worker not available:', error);
    }
  }
}

/**
 * Initialize notification service
 */
export async function initNotificationService(): Promise<void> {
  // Request permission if not already requested
  const permissionRequested = localStorage.getItem(NOTIFICATION_PERMISSION_KEY);
  if (!permissionRequested) {
    await requestNotificationPermission();
  }

  // Schedule daily checks
  scheduleDailyCheck();
}

