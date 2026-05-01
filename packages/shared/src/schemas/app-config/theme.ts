import { z } from 'zod';
import { HexColorSchema } from './primitives.js';

/**
 * Theme — visual tokens consumed by the runtime renderer.
 */
export const ThemeModeSchema = z.enum(['light', 'dark', 'system']).catch('light');

export const ThemeSchema = z
  .object({
    mode: ThemeModeSchema.default('light'),
    primaryColor: HexColorSchema.default('#1e293b'),
    accentColor: HexColorSchema.default('#6366f1'),
    backgroundColor: HexColorSchema.default('#ffffff'),
    textColor: HexColorSchema.default('#0f172a'),
    fontFamily: z.string().trim().min(1).max(120).default('Inter, system-ui, sans-serif'),
    borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']).catch('md').default('md'),
  })
  .default({});

export type Theme = z.infer<typeof ThemeSchema>;
export type ThemeMode = z.infer<typeof ThemeModeSchema>;
