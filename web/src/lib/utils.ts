import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("ar-TN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

export function formatDateShort(date: string | Date) {
  return new Intl.DateTimeFormat("ar-TN", {
    day: "numeric",
    month: "short",
  }).format(new Date(date))
}

export function formatTime(date: string | Date) {
  return new Intl.DateTimeFormat("ar-TN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function formatTND(amount: number) {
  return `${new Intl.NumberFormat("fr-TN", { maximumFractionDigits: 3 }).format(amount)} د.ت`
}

export function formatRelativeDate(date: string | Date) {
  const d = new Date(date)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfThat = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((startOfToday.getTime() - startOfThat.getTime()) / 86400000)
  if (diffDays === 0) return formatTime(d)
  if (diffDays === 1) return "أمس"
  if (diffDays < 7) {
    return new Intl.DateTimeFormat("ar-TN", { weekday: "long" }).format(d)
  }
  return formatDateShort(d)
}
