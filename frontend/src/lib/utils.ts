import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import type { RiskLevel, Role } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy HH:mm');
}

export function formatGrade(cgpa: number): string {
  if (cgpa >= 9.0) return 'O';
  if (cgpa >= 8.0) return 'A+';
  if (cgpa >= 7.0) return 'A';
  if (cgpa >= 6.0) return 'B+';
  if (cgpa >= 5.0) return 'B';
  return 'F';
}

export function getRiskColor(risk_level: RiskLevel): string {
  switch (risk_level) {
    case 'low': return 'text-green-600 bg-green-100';
    case 'medium': return 'text-yellow-600 bg-yellow-100';
    case 'high': return 'text-red-600 bg-red-100';
  }
}

export function getRoleBadgeColor(role: Role): string {
  switch (role) {
    case 'admin': return 'text-purple-600 bg-purple-100';
    case 'professor': return 'text-blue-600 bg-blue-100';
    case 'student': return 'text-green-600 bg-green-100';
  }
}
