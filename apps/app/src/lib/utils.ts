import tw from '@/lib/tw';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return tw.style(twMerge(clsx(inputs)));
}
