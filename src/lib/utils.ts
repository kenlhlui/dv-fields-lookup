import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toggleInSet<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const NewSet = new Set(set);
  if (!NewSet.delete(value)) NewSet.add(value);
  return NewSet;
}
