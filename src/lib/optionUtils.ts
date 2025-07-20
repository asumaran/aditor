import type { Option } from '@/types';
import { generateId } from './utils';

export const createOption = (text: string = ''): Option => ({
  id: generateId(),
  text,
});

export const createDefaultOptions = (): readonly Option[] => [
  createOption('Option 1'),
  createOption('Option 2'),
];

export const addOption = (options: readonly Option[], text: string = ''): readonly Option[] => [
  ...options,
  createOption(text),
];

export const updateOption = (
  options: readonly Option[],
  optionId: number,
  newText: string
): readonly Option[] =>
  options.map(option =>
    option.id === optionId ? { ...option, text: newText } : option
  );

export const removeOption = (options: readonly Option[], optionId: number): readonly Option[] =>
  options.filter(option => option.id !== optionId);