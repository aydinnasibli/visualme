'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/dashboard/Header';
import { useUser } from '@clerk/nextjs';
import { User, Mail, CheckCircle, Check } from 'lucide-react';
import { getUserProfile, UserProfile } from '@/lib/actions/profile';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const result = await getUserProfile();
        if (result.success && result.data) {
          setProfile(result.data);
        } else {
          console.error("Failed to load profile:", result.error);
          toast.error("Failed to load profile data");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const plan = profile?.plan === 'pro' ? 'Pro Plan' : (profile?.plan === 'enterprise' ? 'Enterprise Plan' : 'Free Plan');

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      <Header user={user || null} />
      <div className="max-w-4xl mx-auto p-6 pt-24">
        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Profile Section */}
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

          {/* Subscription Section */}
          <section className="bg-surface-dark border border-white/10 rounded-xl p-6">
            <div className="flex items-start justify-between mb-6">
               <div>
                  <h2 className="text-xl font-semibold text-white">Subscription</h2>
                  <p className="text-stone-400 text-sm mt-1">Manage your plan and billing</p>
               </div>
               <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                 profile?.plan === 'pro' ? 'bg-primary/20 text-primary border-primary/20' :
                 profile?.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-400 border-purple-500/20' :
                 'bg-white/10 text-stone-400 border-white/10'
               }`}>
                  {loading ? 'Loading...' : plan}
               </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Free Plan */}
                <div className={`relative border rounded-xl p-4 flex flex-col gap-3 ${
                  profile?.plan === 'free' || !profile?.plan ? 'border-primary/50 bg-primary/5' : 'border-white/10 bg-surface-darker/30 opacity-60'
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

                {/* Pro Plan */}
                <div className={`relative border rounded-xl p-4 flex flex-col gap-3 ${
                  profile?.plan === 'pro' ? 'border-primary/50 bg-primary/5' : 'border-white/10 bg-surface-darker/50 hover:opacity-100 transition-opacity'
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
            </div>
          </section>

          {/* Preferences */}
           <section className="bg-surface-dark border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Preferences</h2>
            <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div>
                    <h3 className="text-sm font-medium text-white">Dark Mode</h3>
                    <p className="text-xs text-stone-400">Always on for that sleek look</p>
                </div>
                <div className="w-10 h-6 bg-primary rounded-full relative cursor-not-allowed opacity-80">
                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                </div>
            </div>
            <div className="flex items-center justify-between py-3">
                <div>
                    <h3 className="text-sm font-medium text-white">Email Notifications</h3>
                    <p className="text-xs text-stone-400">Receive updates and tips</p>
                </div>
                <button className="w-10 h-6 bg-stone-700 rounded-full relative transition-colors hover:bg-stone-600">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white/50 rounded-full shadow-sm"></div>
                </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
