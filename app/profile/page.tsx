"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  getUserProfile,
  getUserVisualizations,
  deleteVisualization,
  type UserProfile,
} from "@/lib/actions/profile";
import type { SavedVisualization } from "@/lib/types/visualization";
import { Trash2, Calendar, Eye, Sparkles } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [visualizations, setVisualizations] = useState<SavedVisualization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
      return;
    }

    if (isSignedIn) {
      loadProfileData();
    }
  }, [isSignedIn, isLoaded, router]);

  const loadProfileData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [profileResult, visualizationsResult] = await Promise.all([
        getUserProfile(),
        getUserVisualizations(),
      ]);

      if (profileResult.success && profileResult.data) {
        setProfile(profileResult.data);
      } else {
        setError(profileResult.error || "Failed to load profile");
      }

      if (visualizationsResult.success && visualizationsResult.data) {
        setVisualizations(visualizationsResult.data);
      }
    } catch (err) {
      setError("An error occurred while loading your profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this visualization?")) return;

    setDeletingId(id);
    const result = await deleteVisualization(id);

    if (result.success) {
      setVisualizations(prev => prev.filter(v => v._id !== id));
    } else {
      alert(result.error || "Failed to delete visualization");
    }
    setDeletingId(null);
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-zinc-400 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-900/20 to-cyan-900/20 border border-zinc-800 rounded-2xl p-8 mb-8 backdrop-blur-sm"
        >
          <div className="flex items-center gap-6">
            {profile?.imageUrl && (
              <img
                src={profile.imageUrl}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-purple-500"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">
                {profile?.firstName || profile?.username || "User"}'s Profile
              </h1>
              {profile?.email && (
                <p className="text-zinc-400 mb-4">{profile.email}</p>
              )}
              <div className="flex gap-4 flex-wrap">
                <div className="px-4 py-2 bg-purple-600/20 border border-purple-500/50 rounded-lg">
                  <p className="text-xs text-purple-300 uppercase tracking-wide">Plan</p>
                  <p className="text-xl font-bold text-purple-400 capitalize">{profile?.plan}</p>
                </div>
                <div className="px-4 py-2 bg-cyan-600/20 border border-cyan-500/50 rounded-lg">
                  <p className="text-xs text-cyan-300 uppercase tracking-wide">Saved</p>
                  <p className="text-xl font-bold text-cyan-400">{profile?.totalSavedVisualizations}</p>
                </div>
                <div className="px-4 py-2 bg-emerald-600/20 border border-emerald-500/50 rounded-lg">
                  <p className="text-xs text-emerald-300 uppercase tracking-wide">Extended Nodes</p>
                  <p className="text-xl font-bold text-emerald-400">{profile?.extendedNodesCount}</p>
                </div>
                <div className="px-4 py-2 bg-zinc-700/50 border border-zinc-600/50 rounded-lg">
                  <p className="text-xs text-zinc-400 uppercase tracking-wide">Usage</p>
                  <p className="text-xl font-bold text-white">{profile?.usageCount}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Saved Visualizations */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Saved Visualizations
          </h2>
        </div>

        {visualizations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-zinc-900/50 border border-zinc-800 rounded-xl"
          >
            <p className="text-zinc-400 text-lg mb-4">No saved visualizations yet</p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition font-medium"
            >
              Create Your First Visualization
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {visualizations.map((viz, index) => (
                <motion.div
                  key={viz._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-all group relative overflow-hidden"
                >
                  {/* Background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-bold text-white line-clamp-2 flex-1">
                        {viz.title}
                      </h3>
                      <button
                        onClick={() => viz._id && handleDelete(viz._id)}
                        disabled={deletingId === viz._id}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition text-zinc-400 hover:text-red-400 disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-purple-600/20 border border-purple-500/50 rounded-full text-xs font-medium text-purple-300 capitalize">
                        {viz.type.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(viz.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <button
                      onClick={() => router.push(`/?load=${viz._id}`)}
                      className="w-full px-4 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg transition font-medium flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
