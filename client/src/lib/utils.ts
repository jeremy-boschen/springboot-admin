import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from 'date-fns';
import { ServiceStatus } from '@shared/schema';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUptime(startTime: Date): string {
  return formatDistanceToNow(startTime, { addSuffix: false });
}

export function formatDate(date: Date): string {
  try {
    return format(date, 'yyyy-MM-dd HH:mm:ss');
  } catch (error) {
    console.error('Invalid date format:', error);
    return 'Invalid date';
  }
}

export function formatMemory(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  else if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  else return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function getStatusColor(status: ServiceStatus) {
  switch (status) {
    case 'UP':
      return {
        bg: 'bg-green-500',
        text: 'text-green-600 dark:text-green-500',
        bgLight: 'bg-green-100',
        textLight: 'text-green-800',
        bgDark: 'dark:bg-green-900 dark:bg-opacity-30',
        textDark: 'dark:text-green-400'
      };
    case 'WARNING':
      return {
        bg: 'bg-yellow-500',
        text: 'text-yellow-600 dark:text-yellow-500',
        bgLight: 'bg-yellow-100',
        textLight: 'text-yellow-800',
        bgDark: 'dark:bg-yellow-900 dark:bg-opacity-30',
        textDark: 'dark:text-yellow-400'
      };
    case 'DOWN':
      return {
        bg: 'bg-red-500',
        text: 'text-red-600 dark:text-red-500',
        bgLight: 'bg-red-100',
        textLight: 'text-red-800',
        bgDark: 'dark:bg-red-900 dark:bg-opacity-30',
        textDark: 'dark:text-red-400'
      };
    default:
      return {
        bg: 'bg-gray-500',
        text: 'text-gray-600 dark:text-gray-400',
        bgLight: 'bg-gray-100',
        textLight: 'text-gray-800',
        bgDark: 'dark:bg-gray-700',
        textDark: 'dark:text-gray-400'
      };
  }
}

export function getLogLevelColor(level: string) {
  switch (level) {
    case 'INFO':
      return {
        bg: 'bg-green-100 text-green-800 dark:bg-green-900 dark:bg-opacity-30 dark:text-green-400'
      };
    case 'WARNING':
      return {
        bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:bg-opacity-30 dark:text-yellow-400'
      };
    case 'ERROR':
      return {
        bg: 'bg-red-100 text-red-800 dark:bg-red-900 dark:bg-opacity-30 dark:text-red-400'
      };
    case 'DEBUG':
      return {
        bg: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
      };
    default:
      return {
        bg: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
      };
  }
}

export function getResourceUtilizationClass(percentage: number) {
  if (percentage < 70) {
    return 'bg-green-500';
  } else if (percentage >= 70 && percentage < 90) {
    return 'bg-yellow-500';
  } else {
    return 'bg-red-500';
  }
}
