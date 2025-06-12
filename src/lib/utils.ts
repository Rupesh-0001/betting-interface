import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isAdmin(email?: string | null): boolean {
  return email === "rupesh.ahuja@greyb.com"
}