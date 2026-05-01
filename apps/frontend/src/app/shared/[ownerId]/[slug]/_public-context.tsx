'use client';

import { createContext, useContext } from 'react';

/**
 * When present, signals descendant components (widgets, tables) to fetch
 * data via the unauthenticated `/public/*` endpoints instead of the
 * owner-scoped CRUD routes.
 *
 * Absent outside the `/shared/*` tree — the regular runner continues to
 * use authenticated endpoints.
 */
export interface PublicViewCtx {
  ownerId: string;
  slug: string;
}

export const PublicViewContext = createContext<PublicViewCtx | null>(null);

export function usePublicView(): PublicViewCtx | null {
  return useContext(PublicViewContext);
}
