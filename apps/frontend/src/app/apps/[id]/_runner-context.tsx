'use client';

/**
 * Shared React context for the app-runner shell.
 *
 * Split out of `layout.tsx` so child routes can import the hook without
 * pulling in the layout component (and so Next.js route tree stays clean).
 */

import { createContext, useContext } from 'react';
import type { AppConfig, PublicApp } from '@ai-gen/shared';

export interface AppRunnerCtx {
  app: PublicApp;
  config: AppConfig;
  reload: () => Promise<void>;
}

export const AppRunnerContext = createContext<AppRunnerCtx | null>(null);

export function useAppRunner(): AppRunnerCtx {
  const ctx = useContext(AppRunnerContext);
  if (!ctx) {
    throw new Error(
      '[app-runner] useAppRunner must be used inside the /apps/[id] layout',
    );
  }
  return ctx;
}
