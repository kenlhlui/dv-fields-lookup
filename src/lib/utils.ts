import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toggleInSet<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const newSet = new Set(set);
  if (!newSet.delete(value)) newSet.add(value);
  return newSet;
}
