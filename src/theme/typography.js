// Sistema de tipografía
import { colors } from './colors';

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 28,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    color: colors.text,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    color: colors.textLight,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
};
