'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { getUserProfile } from '@/lib/actions/profile';

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [plan, setPlan] = useState<'free' | 'pro' | 'enterprise'>('free');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setUsername(user.username || '');
      setEmail(user.emailAddresses?.[0]?.emailAddress || '');
      loadUserProfile();
    }
  }, [isLoaded, user]);

  const loadUserProfile = async () => {
    try {
      const result = await getUserProfile();
      if (result.success && result.data) {
        setPlan(result.data.plan);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Update Clerk user data
      await user.update({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        username: username || undefined,
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.errors?.[0]?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setUsername(user.username || '');
      setEmail(user.emailAddresses?.[0]?.emailAddress || '');
      setError(null);
      setSuccess(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#0f1419]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0f1419]/80 backdrop-blur-md px-6 py-4 border-b border-[#282e39] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Profile Settings</h2>
          <p className="text-sm text-gray-400">Manage your personal information and preferences.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-[#282e39] text-gray-400 text-sm font-medium hover:bg-[#1c1f27] hover:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-primary/30 disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </header>

      <div className="p-6 md:p-10 max-w-5xl mx-auto flex flex-col gap-10">
        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-900/20 border border-green-500/50 text-green-200 px-4 py-3 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined">check_circle</span>
            Profile updated successfully!
          </div>
        )}
        {error && (
          <div className="bg-red-900/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* Profile Section */}
        <section>
          <div className="flex items-start justify-between border-b border-[#282e39] pb-4 mb-6">
            <h3 className="text-lg font-semibold text-white">Personal Information</h3>
          </div>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group">
                <div className="size-32 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-[#1c1f27]">
                  {firstName?.[0]?.toUpperCase() || user?.firstName?.[0]?.toUpperCase() || 'U'}
                </div>
              </div>
            </div>

            {/* Fields */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-400">First Name</span>
                <div className="relative">
                  <input
                    className="w-full bg-[#1c1f27] border border-[#282e39] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter first name"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3.5 text-gray-500 text-[20px]">person</span>
                </div>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-400">Last Name</span>
                <div className="relative">
                  <input
                    className="w-full bg-[#1c1f27] border border-[#282e39] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter last name"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3.5 text-gray-500 text-[20px]">person</span>
                </div>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-400">Username</span>
                <div className="relative">
                  <input
                    className="w-full bg-[#1c1f27] border border-[#282e39] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3.5 text-gray-500 text-[20px]">badge</span>
                </div>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-400">Email Address</span>
                <div className="relative">
                  <input
                    className="w-full bg-[#1c1f27] border border-[#282e39] rounded-lg px-4 py-3 text-gray-400 placeholder-gray-500 focus:outline-none transition-all cursor-not-allowed"
                    type="email"
                    value={email}
                    readOnly
                    disabled
                    title="Email cannot be changed"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3.5 text-gray-500 text-[20px]">mail</span>
                </div>
                <span className="text-xs text-gray-500">Email cannot be changed for security reasons</span>
              </label>
            </div>
          </div>
        </section>

        {/* Billing Section */}
        <section className="mb-20">
          <div className="flex items-start justify-between border-b border-[#282e39] pb-4 mb-6">
            <h3 className="text-lg font-semibold text-white">Subscription</h3>
          </div>
          <div className="bg-gradient-to-br from-[#1c1f27] to-[#111318] p-6 rounded-xl border border-[#282e39] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-2xl font-bold text-white">
                      {plan === 'free' && 'Free Plan'}
                      {plan === 'pro' && 'Pro Plan'}
                      {plan === 'enterprise' && 'Enterprise Plan'}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary/20 text-primary border border-primary/30">CURRENT</span>
                  </div>
                  <p className="text-gray-400 mb-4">
                    {plan === 'free' && 'You are currently on the free plan.'}
                    {plan === 'pro' && 'You are currently on the pro plan with unlimited features.'}
                    {plan === 'enterprise' && 'You are currently on the enterprise plan with all features unlocked.'}
                  </p>
                  <div className="flex items-center gap-4 text-sm flex-wrap">
                    <div className="flex items-center gap-2 text-white">
                      <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                      {plan === 'free' && '5 Visualizations/month'}
                      {plan === 'pro' && 'Unlimited Visualizations'}
                      {plan === 'enterprise' && 'Unlimited Visualizations'}
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                      All 20 Types
                    </div>
                    {(plan === 'pro' || plan === 'enterprise') && (
                      <>
                        <div className="flex items-center gap-2 text-white">
                          <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                          Priority Support
                        </div>
                        <div className="flex items-center gap-2 text-white">
                          <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                          Advanced Analytics
                        </div>
                      </>
                    )}
                    {plan === 'enterprise' && (
                      <div className="flex items-center gap-2 text-white">
                        <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                        Custom Integrations
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                  <div className="text-right mb-2">
                    <span className="text-3xl font-bold text-white">
                      {plan === 'free' && '$0'}
                      {plan === 'pro' && '$29'}
                      {plan === 'enterprise' && '$99'}
                    </span>
                    <span className="text-gray-400">/month</span>
                  </div>
                  {plan === 'free' && (
                    <button className="w-full md:w-auto px-6 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/30">
                      Upgrade to Pro
                    </button>
                  )}
                  {plan === 'pro' && (
                    <button className="w-full md:w-auto px-6 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/30">
                      Upgrade to Enterprise
                    </button>
                  )}
                  {plan === 'enterprise' && (
                    <button className="w-full md:w-auto px-6 py-2 rounded-lg border border-[#282e39] text-gray-400 text-sm font-medium hover:bg-[#1c1f27] hover:text-white transition-colors">
                      Manage Subscription
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
