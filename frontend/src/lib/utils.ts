import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function getErrorMessage(err: any, defaultMessage: string = 'An error occurred'): string {
  if (!err) return defaultMessage;
  
  const detail = err.response?.data?.detail;
  
  if (!detail) return defaultMessage;
  
  if (typeof detail === 'string') return detail;
  
  if (Array.isArray(detail)) {
    return detail.map((e: any) => {
      const loc = e.loc ? e.loc.join('.') : '';
      return loc ? `${loc}: ${e.msg}` : e.msg;
    }).join(', ');
  }
  
  return defaultMessage;
}
