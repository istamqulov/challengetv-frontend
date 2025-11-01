import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, differenceInDays, isBefore, isAfter } from 'date-fns';
import { ru } from 'date-fns/locale';

// Re-export parseISO for use in other components
export { parseISO };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, formatString: string = 'dd MMMM yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatString, { locale: ru });
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'dd MMMM yyyy, HH:mm', { locale: ru });
}

export function getDaysUntil(date: string | Date): number {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return differenceInDays(dateObj, new Date());
}

export function getDaysBetween(startDate: string | Date, endDate: string | Date): number {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  return differenceInDays(end, start);
}

export function isChallengeActive(startDate: string, endDate: string): boolean {
  const now = new Date();
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return isAfter(now, start) && isBefore(now, end);
}

export function isChallengeUpcoming(startDate: string): boolean {
  return isBefore(new Date(), parseISO(startDate));
}

export function isChallengeCompleted(endDate: string): boolean {
  return isAfter(new Date(), parseISO(endDate));
}

export function getChallengeStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    draft: 'Черновик',
    active: 'Активный',
    completed: 'Завершен',
    cancelled: 'Отменен',
  };
  return statusMap[status] || status;
}

export function getParticipantStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Активен',
    completed: 'Завершен',
    failed: 'Не завершен',
    withdrew: 'Покинул',
  };
  return statusMap[status] || status;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('ru-RU').format(num);
}

export function formatHP(hp: number): string {
  return `${formatNumber(hp)} HP`;
}

export function getInitials(firstName?: string, lastName?: string, username?: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }
  if (username) {
    return username.slice(0, 2).toUpperCase();
  }
  return '??';
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function getAvatarUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  return `${apiBaseUrl}${url}`;
}

export function getImageUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http')) return url;
  const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
  return `${apiBaseUrl}${url}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Format date as YYYY-MM-DD in local timezone (not UTC)
 * This ensures dates are correct for the user's timezone, e.g., Asia/Dushanbe
 */
export function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date in local timezone as YYYY-MM-DD
 */
export function getTodayLocalDate(): string {
  return formatLocalDate(new Date());
}

/**
 * Parse a date string (YYYY-MM-DD) and format it in local timezone
 * Handles date strings that might be interpreted as UTC
 */
export function parseAndFormatLocalDate(dateString: string): string {
  // If the date string is in YYYY-MM-DD format, create date in local timezone
  // by parsing it as a local date instead of UTC
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return formatLocalDate(date);
}

export function getErrorMessage(error: any): string {
  // Handle axios errors with response data
  if (error.response?.data) {
    const data = error.response.data;
    
    // Check for detail field (common in Django REST Framework)
    if (data.detail) {
      return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
    }
    
    // Check for message field
    if (data.message) {
      return typeof data.message === 'string' ? data.message : JSON.stringify(data.message);
    }
    
    // Check for error field
    if (data.error) {
      return typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    }
    
    // Handle field-specific validation errors (common in Django)
    // Format: { field_name: ["error message"] } or { field_name: "error message" }
    const fieldErrors: string[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'detail' && key !== 'message' && key !== 'error') {
        if (Array.isArray(value)) {
          value.forEach((msg) => {
            if (typeof msg === 'string') {
              fieldErrors.push(`${key}: ${msg}`);
            } else if (typeof msg === 'object') {
              // Handle nested error objects
              Object.entries(msg).forEach(([subKey, subMsg]) => {
                if (Array.isArray(subMsg)) {
                  subMsg.forEach((m) => {
                    fieldErrors.push(`${key}.${subKey}: ${m}`);
                  });
                } else {
                  fieldErrors.push(`${key}.${subKey}: ${subMsg}`);
                }
              });
            }
          });
        } else if (typeof value === 'string') {
          fieldErrors.push(`${key}: ${value}`);
        } else if (typeof value === 'object') {
          // Handle nested objects
          Object.entries(value).forEach(([subKey, subValue]) => {
            if (Array.isArray(subValue)) {
              subValue.forEach((msg) => {
                fieldErrors.push(`${key}.${subKey}: ${msg}`);
              });
            } else {
              fieldErrors.push(`${key}.${subKey}: ${subValue}`);
            }
          });
        }
      }
    }
    
    if (fieldErrors.length > 0) {
      return fieldErrors.join('\n');
    }
    
    // If data is a string or can be stringified
    if (typeof data === 'string') {
      return data;
    }
    
    // Try to stringify the entire response for debugging
    try {
      const stringified = JSON.stringify(data);
      if (stringified !== '{}') {
        return stringified;
      }
    } catch (e) {
      // Ignore JSON stringify errors
    }
  }
  
  // Fallback to error message
  if (error.message) {
    return error.message;
  }
  
  return 'Произошла ошибка';
}
