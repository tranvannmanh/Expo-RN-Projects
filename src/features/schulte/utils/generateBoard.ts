import { shuffle } from '@/utils';

export function generateBoard(size: number): number[] {
  const total = size * size;

  const numbers = Array.from({ length: total }, (_, index) => index + 1);

  return shuffle(numbers);
}
