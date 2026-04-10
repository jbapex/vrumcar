'use client';

import { markAsReadAction } from '@/app/[orgSlug]/inbox/actions';
import { useEffect } from 'react';

export function MarkConversationRead({
  orgSlug,
  conversationId,
}: {
  orgSlug: string;
  conversationId: string;
}) {
  useEffect(() => {
    void markAsReadAction(orgSlug, conversationId);
  }, [orgSlug, conversationId]);
  return null;
}
