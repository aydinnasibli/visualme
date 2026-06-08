'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/dashboard/Header';
import { useUser } from '@clerk/nextjs';
import { User, Mail, CheckCircle, Check, Zap, RotateCcw, CalendarDays, Network, Trash2, Palette } from 'lucide-react';
import { getUserProfile, getUserLimits, UserProfile } from '@/lib/actions/profile';
import { clearExtendedNodes } from '@/lib/actions/extendedNodes';
import { toast } from 'sonner';

type Limits = Awaited<ReturnType<typeof getUserLimits>>['data'];

export default function SettingsPage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [limits, setLimits] = useState<Limits | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearingNodes, setClearingNodes] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [profileRes, limitsRes] = await Promise.all([
          getUserProfile(),
          getUserLimits(),
        ]);

        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        } else {
          toast.error('Failed to load profile data');
        }

        if (limitsRes.success && limitsRes.data) {
          setLimits(limitsRes.data);
        }
      } catch {
        toast.error('Failed to load settings');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const doClearNodes = async () => {
    setClearingNodes(true);
    try {
      const ok = await clearExtendedNodes();
      if (ok) {
        setProfile(p => p ? { ...p, extendedNodesCount: 0 } : p);
        toast.success('Extended node history cleared');
      } else {
        toast.error('Failed to clear history');
      }
    } catch {
      toast.error('Failed to clear history');
    } finally {
      setClearingNodes(false);
    }
  };

  const handleClearNodes = () => {
    toast('Clear all expanded node history? This cannot be undone.', {
      action: { label: 'Clear', onClick: doClearNodes },
      cancel: { label: 'Cancel', onClick: () => {} },
      duration: 5000,
    });
  };

  const plan = profile?.plan === 'pro'
    ? 'Pro Plan'
    : profile?.plan === 'enterprise'
      ? 'Enterprise Plan'
      : 'Free Plan';

  const usedPct = limits ? Math.min(limits.tokens.percentageUsed, 100) : 0;
  const usageBarColor = usedPct >= 90 ? 'var(--color-danger)' : usedPct >= 70 ? 'var(--color-warning)' : 'var(--color-accent)';

  const resetDate = limits
    ? new Date(limits.tokens.resetDate).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '—';

  return (
    <div className="h-full overflow-y-auto bg-surface-0 relative selection:bg-accent/20">
      <Header user={user || null} label="Settings" />
      <div className="max-w-4xl mx-auto p-6 pt-24">
        <h1 className="font-display text-3xl font-bold text-ink mb-8">Settings</h1>

        <div className="space-y-6">
          {/* ── Profile ── */}
          <section className="surface-panel rounded-xl p-6">
            <h2 className="text-xl font-semibold text-ink mb-4">Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-ink-muted">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={user?.fullName || ''}
                    disabled
                    className="w-full bg-surface-2 border border-edge rounded-lg px-4 py-3 text-ink-muted opacity-60 cursor-not-allowed"
                  />
                  <User className="absolute right-3 top-3.5 text-ink-faint w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-ink-muted">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={user?.primaryEmailAddress?.emailAddress || ''}
                    disabled
                    className="w-full bg-surface-2 border border-edge rounded-lg px-4 py-3 text-ink-muted opacity-60 cursor-not-allowed"
                  />
                  <Mail className="absolute right-3 top-3.5 text-ink-faint w-5 h-5" />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="px-4 py-2 surface-control text-ink-muted hover:text-ink rounded-lg transition-colors text-sm">
                Manage Clerk Profile
              </button>
            </div>
          </section>

          {/* ── Token Usage ── */}
          <section className="surface-panel rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-accent" />
                <h2 className="text-xl font-semibold text-ink">Monthly Usage</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-ink-faint">
                <RotateCcw className="w-3 h-3" />
                Resets {resetDate}
              </div>
            </div>

            {loading ? (
              <div className="h-16 bg-surface-2 rounded-lg animate-pulse" />
            ) : limits ? (
              <>
                <div className="mb-4">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-ink-muted">Tokens used</span>
                    <span className="text-sm font-semibold text-ink">
                      {limits.tokens.used.toLocaleString()}
                      <span className="text-ink-faint font-normal">
                        {' '}/ {limits.tokens.limit.toLocaleString()}
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-surface-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${usedPct}%`, background: usageBarColor }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-ink-faint">
                      {limits.tokens.remaining.toLocaleString()} tokens remaining
                    </span>
                    <span className={`text-xs font-medium ${
                      usedPct >= 90 ? 'text-danger' : usedPct >= 70 ? 'text-warning' : 'text-ink-faint'
                    }`}>
                      {usedPct.toFixed(1)}% used
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mt-5">
                  {[
                    { label: 'Visualizations', count: limits.estimatedOperations.visualizations, cost: limits.costs.generateVisualization },
                    { label: 'Edits', count: limits.estimatedOperations.edits, cost: limits.costs.editVisualization },
                    { label: 'Expansions', count: limits.estimatedOperations.expansions, cost: limits.costs.expandNode },
                  ].map(({ label, count, cost }) => (
                    <div key={label} className="bg-surface-2 border border-edge rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-ink">{count}</p>
                      <p className="text-xs text-ink-muted mt-0.5">{label} left</p>
                      <p className="text-[10px] text-ink-faint mt-1">{cost} tokens each</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-ink-faint">Could not load usage data.</p>
            )}
          </section>

          {/* ── Subscription ── */}
          <section className="surface-panel rounded-xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-ink">Subscription</h2>
                <p className="text-ink-muted text-sm mt-1">Manage your plan and billing</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                profile?.plan === 'pro' || profile?.plan === 'enterprise'
                  ? 'bg-accent/15 text-accent border-accent/25'
                  : 'bg-surface-2 text-ink-muted border-edge'
              }`}>
                {loading ? 'Loading...' : plan}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Free */}
              <div className={`relative border rounded-xl p-4 flex flex-col gap-3 ${
                profile?.plan === 'free' || !profile?.plan
                  ? 'border-accent/40 bg-accent/5'
                  : 'border-edge bg-surface-2/40 opacity-60'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">Free</span>
                  {(profile?.plan === 'free' || !profile?.plan) && <CheckCircle className="text-accent w-5 h-5" />}
                </div>
                <div className="text-2xl font-bold text-ink">$0<span className="text-sm font-normal text-ink-muted">/mo</span></div>
                <ul className="space-y-2 text-sm text-ink-muted mb-2">
                  <li className="flex items-center gap-2"><Check className="text-accent w-4 h-4" /> 10 Visualizations/mo</li>
                  <li className="flex items-center gap-2"><Check className="text-accent w-4 h-4" /> Basic Formats</li>
                </ul>
                <button
                  disabled={profile?.plan === 'free' || !profile?.plan}
                  className={`mt-auto w-full py-2 rounded-lg text-sm font-medium ${
                    profile?.plan === 'free' || !profile?.plan
                      ? 'bg-accent/15 text-accent cursor-default'
                      : 'surface-control text-ink transition-colors'
                  }`}
                >
                  {profile?.plan === 'free' || !profile?.plan ? 'Current Plan' : 'Downgrade'}
                </button>
              </div>

              {/* Pro */}
              <div className={`relative border rounded-xl p-4 flex flex-col gap-3 ${
                profile?.plan === 'pro'
                  ? 'border-accent/40 bg-accent/5'
                  : 'border-edge bg-surface-2/40'
              } ${!profile?.plan || profile?.plan === 'free' ? 'opacity-100' : 'opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">Pro</span>
                  {profile?.plan === 'pro' && <CheckCircle className="text-accent w-5 h-5" />}
                </div>
                <div className="text-2xl font-bold text-ink">$9.99<span className="text-sm font-normal text-ink-muted">/mo</span></div>
                <ul className="space-y-2 text-sm text-ink-muted mb-2">
                  <li className="flex items-center gap-2"><Check className="text-accent w-4 h-4" /> Unlimited Visualizations</li>
                  <li className="flex items-center gap-2"><Check className="text-accent w-4 h-4" /> Advanced Formats</li>
                  <li className="flex items-center gap-2"><Check className="text-accent w-4 h-4" /> Priority Support</li>
                </ul>
                <button
                  disabled={profile?.plan === 'pro'}
                  className={`mt-auto w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    profile?.plan === 'pro'
                      ? 'bg-accent/15 text-accent cursor-default'
                      : 'surface-control text-ink'
                  }`}
                >
                  {profile?.plan === 'pro' ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>

              {/* Enterprise */}
              <div className={`relative border rounded-xl p-4 flex flex-col gap-3 ${
                profile?.plan === 'enterprise'
                  ? 'border-accent/40 bg-accent/5'
                  : 'border-edge bg-surface-2/40 opacity-60'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-ink">Enterprise</span>
                  {profile?.plan === 'enterprise' && <CheckCircle className="text-accent w-5 h-5" />}
                </div>
                <div className="text-2xl font-bold text-ink">Custom</div>
                <ul className="space-y-2 text-sm text-ink-muted mb-2">
                  <li className="flex items-center gap-2"><Check className="text-accent w-4 h-4" /> Everything in Pro</li>
                  <li className="flex items-center gap-2"><Check className="text-accent w-4 h-4" /> 10× token limit</li>
                  <li className="flex items-center gap-2"><Check className="text-accent w-4 h-4" /> Dedicated support</li>
                </ul>
                <button
                  disabled={profile?.plan === 'enterprise'}
                  className={`mt-auto w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    profile?.plan === 'enterprise'
                      ? 'bg-accent/15 text-accent cursor-default'
                      : 'surface-control text-ink'
                  }`}
                >
                  {profile?.plan === 'enterprise' ? 'Current Plan' : 'Contact us'}
                </button>
              </div>
            </div>
          </section>

          {/* ── Account Info ── */}
          <section className="surface-panel rounded-xl p-6">
            <h2 className="text-xl font-semibold text-ink mb-4">Account</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface-2/60 border border-edge rounded-lg p-4 flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-ink-faint shrink-0" />
                <div>
                  <p className="text-xs text-ink-faint">Member since</p>
                  <p className="text-sm font-medium text-ink-muted mt-0.5">
                    {loading ? '—' : profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </p>
                </div>
              </div>

              <div className="bg-surface-2/60 border border-edge rounded-lg p-4 flex items-center gap-3">
                <Zap className="w-5 h-5 text-ink-faint shrink-0" />
                <div>
                  <p className="text-xs text-ink-faint">Total visualizations</p>
                  <p className="text-sm font-medium text-ink-muted mt-0.5">
                    {loading ? '—' : (profile?.usageCount ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-surface-2/60 border border-edge rounded-lg p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Network className="w-5 h-5 text-ink-faint shrink-0" />
                  <div>
                    <p className="text-xs text-ink-faint">Expanded nodes</p>
                    <p className="text-sm font-medium text-ink-muted mt-0.5">
                      {loading ? '—' : (profile?.extendedNodesCount ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                {(profile?.extendedNodesCount ?? 0) > 0 && (
                  <button
                    onClick={handleClearNodes}
                    disabled={clearingNodes}
                    className="p-1.5 rounded-lg text-ink-faint hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-40"
                    title="Clear expanded node history"
                  >
                    {clearingNodes
                      ? <div className="w-4 h-4 border-2 border-ink-faint border-t-transparent rounded-full animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ── Preferences ── */}
          <section className="surface-panel rounded-xl p-6">
            <h2 className="text-xl font-semibold text-ink mb-4">Preferences</h2>
            <div className="flex items-center justify-between py-3 border-b border-edge">
              <div className="flex items-center gap-3">
                <Palette className="w-4 h-4 text-ink-faint shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-ink">Theme</h3>
                  <p className="text-xs text-ink-muted">Switch between light, dark, and system using the toggle in the header</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="text-sm font-medium text-ink">Email Notifications</h3>
                <p className="text-xs text-ink-muted">Receive updates and tips</p>
              </div>
              <button className="w-10 h-6 bg-surface-3 rounded-full relative transition-colors hover:bg-surface-3/70" disabled title="Coming soon">
                <div className="absolute left-1 top-1 w-4 h-4 bg-ink-faint/50 rounded-full shadow-sm" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
