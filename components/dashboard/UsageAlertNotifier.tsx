'use client';

import { useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { getUsageAlertStatus } from '@/lib/actions/profile';

const DISMISS_KEY_PREFIX = 'usage-alert-shown:';

export default function UsageAlertNotifier() {
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    let cancelled = false;

    const check = async () => {
      try {
        const res = await getUsageAlertStatus();
        if (cancelled || !res.success || !res.data || !res.data.shouldAlert) return;

        const { percentageUsed, resetDate } = res.data;
        const dismissKey = `${DISMISS_KEY_PREFIX}${resetDate}`;
        if (sessionStorage.getItem(dismissKey)) return;

        sessionStorage.setItem(dismissKey, '1');
        toast.warning(
          `You've used ${percentageUsed.toFixed(0)}% of your monthly tokens`,
          {
            description: `Your usage resets on ${new Date(resetDate).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}. Manage alerts in Settings.`,
            duration: 8000,
          }
        );
      } catch {
        // Silently ignore — usage alerts are a non-critical convenience feature
      }
    };

    check();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn]);

  return null;
}
