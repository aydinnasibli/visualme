'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/dashboard/Header';
import { useUser } from '@clerk/nextjs';
import { User, Mail, CheckCircle, Check, Zap, RotateCcw, CalendarDays, Network, Trash2 } from 'lucide-react';
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

  const handleClearNodes = async () => {
    if (!confirm('Clear all expanded node history? This cannot be undone.')) return;
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

  const plan = profile?.plan === 'pro'
    ? 'Pro Plan'
    : profile?.plan === 'enterprise'
      ? 'Enterprise Plan'
      : 'Free Plan';

  const usedPct = limits ? Math.min(limits.tokens.percentageUsed, 100) : 0;

  const resetDate = limits
    ? new Date(limits.tokens.resetDate).toLocaleDateString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '—';

  return (
    <div className="h-full overflow-y-auto bg-background relative selection:bg-primary/20">
      <Header user={user || null} />
      <div className="max-w-4xl mx-auto p-6 pt-24">
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

        <div className="space-y-6">
          {/* ── Profile ── */}
          <section className="bg-surface-dark border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-stone-400">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={user?.fullName || ''}
                    disabled
                    className="w-full bg-surface-darker border border-white/10 rounded-lg px-4 py-3 text-stone-300 opacity-60 cursor-not-allowed"
                  />
                  <User className="absolute right-3 top-3.5 text-gray-500 w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-stone-400">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={user?.primaryEmailAddress?.emailAddress || ''}
                    disabled
                    className="w-full bg-surface-darker border border-white/10 rounded-lg px-4 py-3 text-stone-300 opacity-60 cursor-not-allowed"
                  />
                  <Mail className="absolute right-3 top-3.5 text-gray-500 w-5 h-5" />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-stone-300 rounded-lg transition-colors text-sm">
                Manage Clerk Profile
              </button>
            </div>
          </section>

          {/* ── Token Usage ── */}
          <section className="bg-surface-dark border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold text-white">Monthly Usage</h2>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-stone-500">
                <RotateCcw className="w-3 h-3" />
                Resets {resetDate}
              </div>
            </div>

            {loading ? (
              <div className="h-16 bg-white/5 rounded-lg animate-pulse" />
            ) : limits ? (
              <>
                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm text-stone-400">Tokens used</span>
                    <span className="text-sm font-semibold text-white">
                      {limits.tokens.used.toLocaleString()}
                      <span className="text-stone-500 font-normal">
                        {' '}/ {limits.tokens.limit.toLocaleString()}
                      </span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${usedPct}%`,
                        background: usedPct >= 90
                          ? '#ef4444'
                          : usedPct >= 70
                            ? '#f59e0b'
                            : '#526efa',
                      }}
                    />
                  </div>
                  <div className="flex justify-between mt-1.5">
                    <span className="text-xs text-stone-600">
                      {limits.tokens.remaining.toLocaleString()} tokens remaining
                    </span>
                    <span className={`text-xs font-medium ${
                      usedPct >= 90 ? 'text-red-400' :
                      usedPct >= 70 ? 'text-amber-400' :
                      'text-stone-500'
                    }`}>
                      {usedPct.toFixed(1)}% used
                    </span>
                  </div>
                </div>

                {/* Estimated operations remaining */}
                <div className="grid grid-cols-3 gap-3 mt-5">
                  {[
                    { label: 'Visualizations', count: limits.estimatedOperations.visualizations, cost: limits.costs.generateVisualization },
                    { label: 'Edits', count: limits.estimatedOperations.edits, cost: limits.costs.editVisualization },
                    { label: 'Expansions', count: limits.estimatedOperations.expansions, cost: limits.costs.expandNode },
                  ].map(({ label, count, cost }) => (
                    <div
                      key={label}
                      className="bg-surface-darker border border-white/5 rounded-lg p-3 text-center"
                    >
                      <p className="text-2xl font-bold text-white">{count}</p>
                      <p className="text-xs text-stone-400 mt-0.5">{label} left</p>
                      <p className="text-[10px] text-stone-600 mt-1">{cost} tokens each</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-stone-500">Could not load usage data.</p>
            )}
          </section>

          {/* ── Subscription ── */}
          <section className="bg-surface-dark border border-white/10 rounded-xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-white">Subscription</h2>
                <p className="text-stone-400 text-sm mt-1">Manage your plan and billing</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                profile?.plan === 'pro'
                  ? 'bg-primary/20 text-primary border-primary/20'
                  : profile?.plan === 'enterprise'
                    ? 'bg-purple-500/20 text-purple-400 border-purple-500/20'
                    : 'bg-white/10 text-stone-400 border-white/10'
              }`}>
                {loading ? 'Loading...' : plan}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Free */}
              <div className={`relative border rounded-xl p-4 flex flex-col gap-3 ${
                profile?.plan === 'free' || !profile?.plan
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-white/10 bg-surface-darker/30 opacity-60'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Free</span>
                  {(profile?.plan === 'free' || !profile?.plan) && <CheckCircle className="text-primary w-5 h-5" />}
                </div>
                <div className="text-2xl font-bold text-white">$0<span className="text-sm font-normal text-stone-400">/mo</span></div>
                <ul className="space-y-2 text-sm text-stone-300 mb-2">
                  <li className="flex items-center gap-2"><Check className="text-primary w-4 h-4" /> 10 Visualizations/mo</li>
                  <li className="flex items-center gap-2"><Check className="text-primary w-4 h-4" /> Basic Formats</li>
                </ul>
                <button
                  disabled={profile?.plan === 'free' || !profile?.plan}
                  className={`mt-auto w-full py-2 rounded-lg text-sm font-medium ${
                    profile?.plan === 'free' || !profile?.plan
                      ? 'bg-primary/20 text-primary cursor-default'
                      : 'bg-white/10 hover:bg-white/20 text-white transition-colors'
                  }`}
                >
                  {profile?.plan === 'free' || !profile?.plan ? 'Current Plan' : 'Downgrade'}
                </button>
              </div>

              {/* Pro */}
              <div className={`relative border rounded-xl p-4 flex flex-col gap-3 ${
                profile?.plan === 'pro'
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-white/10 bg-surface-darker/50'
              } ${!profile?.plan || profile?.plan === 'free' ? 'opacity-100' : 'opacity-60'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Pro</span>
                  {profile?.plan === 'pro' && <CheckCircle className="text-primary w-5 h-5" />}
                </div>
                <div className="text-2xl font-bold text-white">$9.99<span className="text-sm font-normal text-stone-400">/mo</span></div>
                <ul className="space-y-2 text-sm text-stone-300 mb-2">
                  <li className="flex items-center gap-2"><Check className="text-primary w-4 h-4" /> Unlimited Visualizations</li>
                  <li className="flex items-center gap-2"><Check className="text-primary w-4 h-4" /> Advanced Formats</li>
                  <li className="flex items-center gap-2"><Check className="text-primary w-4 h-4" /> Priority Support</li>
                </ul>
                <button
                  disabled={profile?.plan === 'pro'}
                  className={`mt-auto w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    profile?.plan === 'pro'
                      ? 'bg-primary/20 text-primary cursor-default'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {profile?.plan === 'pro' ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>

              {/* Enterprise */}
              <div className={`relative border rounded-xl p-4 flex flex-col gap-3 ${
                profile?.plan === 'enterprise'
                  ? 'border-purple-500/50 bg-purple-500/5'
                  : 'border-white/10 bg-surface-darker/50 opacity-60'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Enterprise</span>
                  {profile?.plan === 'enterprise' && <CheckCircle className="text-purple-400 w-5 h-5" />}
                </div>
                <div className="text-2xl font-bold text-white">Custom</div>
                <ul className="space-y-2 text-sm text-stone-300 mb-2">
                  <li className="flex items-center gap-2"><Check className="text-purple-400 w-4 h-4" /> Everything in Pro</li>
                  <li className="flex items-center gap-2"><Check className="text-purple-400 w-4 h-4" /> 10× token limit</li>
                  <li className="flex items-center gap-2"><Check className="text-purple-400 w-4 h-4" /> Dedicated support</li>
                </ul>
                <button
                  disabled={profile?.plan === 'enterprise'}
                  className={`mt-auto w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                    profile?.plan === 'enterprise'
                      ? 'bg-purple-500/20 text-purple-400 cursor-default'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {profile?.plan === 'enterprise' ? 'Current Plan' : 'Contact us'}
                </button>
              </div>
            </div>
          </section>

          {/* ── Account Info ── */}
          <section className="bg-surface-dark border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Account</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-surface-darker/50 border border-white/5 rounded-lg p-4 flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-stone-500 shrink-0" />
                <div>
                  <p className="text-xs text-stone-500">Member since</p>
                  <p className="text-sm font-medium text-stone-200 mt-0.5">
                    {loading ? '—' : profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </p>
                </div>
              </div>

              <div className="bg-surface-darker/50 border border-white/5 rounded-lg p-4 flex items-center gap-3">
                <Zap className="w-5 h-5 text-stone-500 shrink-0" />
                <div>
                  <p className="text-xs text-stone-500">Total visualizations</p>
                  <p className="text-sm font-medium text-stone-200 mt-0.5">
                    {loading ? '—' : (profile?.usageCount ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="bg-surface-darker/50 border border-white/5 rounded-lg p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Network className="w-5 h-5 text-stone-500 shrink-0" />
                  <div>
                    <p className="text-xs text-stone-500">Expanded nodes</p>
                    <p className="text-sm font-medium text-stone-200 mt-0.5">
                      {loading ? '—' : (profile?.extendedNodesCount ?? 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                {(profile?.extendedNodesCount ?? 0) > 0 && (
                  <button
                    onClick={handleClearNodes}
                    disabled={clearingNodes}
                    className="p-1.5 rounded-lg text-stone-600 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                    title="Clear expanded node history"
                  >
                    {clearingNodes
                      ? <div className="w-4 h-4 border-2 border-stone-600 border-t-transparent rounded-full animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* ── Preferences ── */}
          <section className="bg-surface-dark border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Preferences</h2>
            <div className="flex items-center justify-between py-3 border-b border-white/5">
              <div>
                <h3 className="text-sm font-medium text-white">Dark Mode</h3>
                <p className="text-xs text-stone-400">Always on for that sleek look</p>
              </div>
              <div className="w-10 h-6 bg-primary rounded-full relative cursor-not-allowed opacity-80">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <h3 className="text-sm font-medium text-white">Email Notifications</h3>
                <p className="text-xs text-stone-400">Receive updates and tips</p>
              </div>
              <button className="w-10 h-6 bg-stone-700 rounded-full relative transition-colors hover:bg-stone-600">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white/50 rounded-full shadow-sm" />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
