import type { CSSProperties } from 'react';

export interface ColorOption
{
  value: string;
  name: string;
  style?: CSSProperties;
  className?: string;
}

export const PINNED_SITE_COLORS: ColorOption[] = [
  { name: 'Gray', value: '#6b7280', style: { backgroundColor: '#6b7280' } },
  { name: 'Red', value: '#ef4444', style: { backgroundColor: '#ef4444' } },
  { name: 'Orange', value: '#f97316', style: { backgroundColor: '#f97316' } },
  { name: 'Yellow', value: '#eab308', style: { backgroundColor: '#eab308' } },
  { name: 'Green', value: '#22c55e', style: { backgroundColor: '#22c55e' } },
  { name: 'Teal', value: '#14b8a6', style: { backgroundColor: '#14b8a6' } },
  { name: 'Blue', value: '#3b82f6', style: { backgroundColor: '#3b82f6' } },
  { name: 'Purple', value: '#a855f7', style: { backgroundColor: '#a855f7' } },
  { name: 'Pink', value: '#ec4899', style: { backgroundColor: '#ec4899' } },
];

export const DEFAULT_ICON_COLOR = '#6b7280';
