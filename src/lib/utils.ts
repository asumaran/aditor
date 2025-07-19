import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const generateId = (): number => {
  return Date.now() + Math.random();
};

export const isValidBlockType = (type: string): type is 'text' => {
  return type === 'text';
};
