import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimestamp(x: number) {
  // x is given in seconds
  const hours = Math.floor(x / 3600);
  const minutes = Math.floor((x - hours * 3600) / 60);
  const seconds = Math.floor(x - hours * 3600 - minutes * 60);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
