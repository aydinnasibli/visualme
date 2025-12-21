'use client';

import { useUser } from '@clerk/nextjs';
import { useState } from 'react';

export default function SettingsPage() {
  const { user } = useUser();
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('Data visualization enthusiast and product designer.');
  
  return (
    <div className="flex-1 overflow-y-auto bg-[#0f1419]">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0f1419]/80 backdrop-blur-md px-6 py-4 border-b border-[#282e39] flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Profile Settings</h2>
          <p className="text-sm text-gray-400">Manage your personal information and preferences.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg border border-[#282e39] text-gray-400 text-sm font-medium hover:bg-[#1c1f27] hover:text-white transition-colors">Cancel</button>
          <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-primary/30">Save Changes</button>
        </div>
      </header>

      <div className="p-6 md:p-10 max-w-5xl mx-auto flex flex-col gap-10">
        {/* Profile Section */}
        <section>
          <div className="flex items-start justify-between border-b border-[#282e39] pb-4 mb-6">
            <h3 className="text-lg font-semibold text-white">Personal Information</h3>
          </div>
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Avatar */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative group cursor-pointer">
                <div className="size-32 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-[#1c1f27]">
                  {user?.firstName?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white">edit</span>
                </div>
              </div>
              <button className="text-sm font-medium text-primary hover:text-blue-400">Change Avatar</button>
            </div>

            {/* Fields */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-400">Full Name</span>
                <div className="relative">
                  <input 
                    className="w-full bg-[#1c1f27] border border-[#282e39] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                    type="text" 
                    value={user?.fullName || fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3.5 text-gray-500 text-[20px]">person</span>
                </div>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm font-medium text-gray-400">Display Name</span>
                <div className="relative">
                  <input 
                    className="w-full bg-[#1c1f27] border border-[#282e39] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                    type="text" 
                    value={user?.username || displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3.5 text-gray-500 text-[20px]">badge</span>
                </div>
              </label>
              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-sm font-medium text-gray-400">Email Address</span>
                <div className="relative">
                  <input 
                    className="w-full bg-[#1c1f27] border border-[#282e39] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" 
                    type="email" 
                    value={user?.emailAddresses?.[0]?.emailAddress || ''}
                    readOnly
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3.5 text-gray-500 text-[20px]">mail</span>
                </div>
              </label>
              <label className="flex flex-col gap-2 md:col-span-2">
                <span className="text-sm font-medium text-gray-400">Bio</span>
                <textarea 
                  className="w-full bg-[#1c1f27] border border-[#282e39] rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none" 
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
                <span className="text-xs text-gray-500 text-right">{bio.length} / 240 characters</span>
              </label>
            </div>
          </div>
        </section>

        {/* Notifications Section */}
        <section>
          <div className="flex items-start justify-between border-b border-[#282e39] pb-4 mb-6">
            <h3 className="text-lg font-semibold text-white">Notifications</h3>
          </div>
          <div className="bg-[#1c1f27] rounded-xl border border-[#282e39] overflow-hidden">
            <div className="p-6 flex items-center justify-between border-b border-[#282e39]">
              <div className="flex flex-col gap-1">
                <span className="text-base font-medium text-white">Visualization Complete</span>
                <span className="text-sm text-gray-400">Receive an email when your data processing is finished.</span>
              </div>
              <button className="bg-primary relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none">
                <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>
            <div className="p-6 flex items-center justify-between border-b border-[#282e39]">
              <div className="flex flex-col gap-1">
                <span className="text-base font-medium text-white">Weekly Digest</span>
                <span className="text-sm text-gray-400">A summary of your weekly visualization stats.</span>
              </div>
              <button className="bg-[#3b4354] relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none">
                <span className="translate-x-0 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>
            <div className="p-6 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-base font-medium text-white">Product Updates</span>
                <span className="text-sm text-gray-400">News about new visualization types and features.</span>
              </div>
              <button className="bg-primary relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none">
                <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
              </button>
            </div>
          </div>
        </section>

        {/* API & Integrations Section */}
        <section>
          <div className="flex items-start justify-between border-b border-[#282e39] pb-4 mb-6">
            <h3 className="text-lg font-semibold text-white">API & Integrations</h3>
          </div>
          <div className="flex flex-col gap-6">
            <div className="bg-[#1c1f27] p-6 rounded-xl border border-[#282e39]">
              <h4 className="text-base font-medium text-white mb-4">API Keys</h4>
              <p className="text-sm text-gray-400 mb-4">Use this key to authenticate your requests to the VisualMe API. Treat this key like a password.</p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <input className="w-full bg-[#111318] border border-[#3b4354] rounded-lg px-4 py-3 text-gray-400 font-mono text-sm focus:outline-none" readOnly type="text" value="vm_live_8392849284928492..." />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                    <button className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-[#282e39] transition-colors" title="Copy">
                      <span className="material-symbols-outlined text-[20px]">content_copy</span>
                    </button>
                  </div>
                </div>
                <button className="px-4 py-2 rounded-lg border border-[#282e39] text-white text-sm font-medium hover:bg-[#282e39] transition-colors flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                  Regenerate
                </button>
              </div>
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-2xl font-bold text-white">Free Plan</h4>
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary/20 text-primary border border-primary/30">CURRENT</span>
                </div>
                <p className="text-gray-400 mb-4">You are currently on the free plan.</p>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-white">
                    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    5 Visualizations/month
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
                    All 19 Types
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 w-full md:w-auto">
                <div className="text-right mb-2">
                  <span className="text-3xl font-bold text-white">$0</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <button className="w-full md:w-auto px-6 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-primary/30">Upgrade to Pro</button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
