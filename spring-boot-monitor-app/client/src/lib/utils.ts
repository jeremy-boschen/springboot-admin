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
  const upperLevel = level.toUpperCase();
  
  switch (upperLevel) {
    case 'ERROR':
      return 'text-destructive bg-destructive/10 border-destructive/20 dark:bg-destructive/20';
    case 'WARNING':
    case 'WARN':
      return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
    case 'INFO':
      return 'text-primary bg-primary/10 border-primary/20 dark:bg-primary/20';
    case 'DEBUG':
      return 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800';
    case 'TRACE':
      return 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800';
    case 'OFF':
      return 'text-gray-600 bg-gray-100 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    default:
      return 'text-muted-foreground bg-muted/50 border-muted';
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
