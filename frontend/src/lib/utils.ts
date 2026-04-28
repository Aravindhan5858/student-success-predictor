import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid, parseISO } from "date-fns";
import type { RiskLevel, Role } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  if (date == null) return "";
  if (typeof date === "string" && date.trim() === "") return "";
  // Prefer ISO parse for strings, then fallback to Date constructor
  const d =
    typeof date === "string"
      ? isValid(parseISO(date))
        ? parseISO(date)
        : new Date(date)
      : date;
  if (!isValid(d)) return "";
  return format(d, "MMM d, yyyy");
}

export function formatDateTime(date: string | Date): string {
  if (date == null) return "";
  if (typeof date === "string" && date.trim() === "") return "";
  const d =
    typeof date === "string"
      ? isValid(parseISO(date))
        ? parseISO(date)
        : new Date(date)
      : date;
  if (!isValid(d)) return "";
  return format(d, "MMM d, yyyy HH:mm");
}

export function formatGrade(cgpa: number): string {
  if (cgpa >= 9.0) return "O";
  if (cgpa >= 8.0) return "A+";
  if (cgpa >= 7.0) return "A";
  if (cgpa >= 6.0) return "B+";
  if (cgpa >= 5.0) return "B";
  return "F";
}

export function getRiskColor(risk_level: RiskLevel): string {
  switch (risk_level) {
    case "low":
      return "text-green-600 bg-green-100";
    case "medium":
      return "text-yellow-600 bg-yellow-100";
    case "high":
      return "text-red-600 bg-red-100";
  }
}

export function getRoleBadgeColor(role: Role): string {
  switch (role) {
    case "super_admin":
      return "text-red-600 bg-red-100";
    case "admin":
      return "text-purple-600 bg-purple-100";
    case "professor":
      return "text-blue-600 bg-blue-100";
    case "student":
      return "text-green-600 bg-green-100";
    default:
      return "text-gray-600 bg-gray-100";
  }
}
