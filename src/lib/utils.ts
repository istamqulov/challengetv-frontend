import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO, differenceInDays, isBefore, isAfter } from 'date-fns';
import { ru } from 'date-fns/locale';

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

export function getErrorMessage(error: any): string {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'Произошла ошибка';
}
