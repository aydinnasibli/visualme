'use client';

import Link from 'next/link';
import { UserButton, SignInButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { motion } from 'framer-motion';

export default function Header() {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/75"
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2"
          >
            <div className="relative h-8 w-8">
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-75 blur-sm" />
              <div className="relative flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white font-bold text-sm">
                V
              </div>
            </div>
            <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              VisualMe
            </span>
          </motion.div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
          >
            Home
          </Link>
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Dashboard
            </Link>
            <Link
              href="/gallery"
              className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
            >
              Gallery
            </Link>
          </SignedIn>
          <Link
            href="/pricing"
            className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
          >
            Pricing
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="hidden sm:block text-sm font-medium text-gray-300 transition-colors hover:text-white">
                Sign In
              </button>
            </SignInButton>
            <SignInButton mode="modal">
              <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white text-sm font-semibold rounded-lg transition-all transform hover:scale-105">
                Get Started
              </button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-9 w-9',
                  userButtonPopoverCard: 'bg-gray-800 border-gray-700',
                  userButtonPopoverActionButton: 'hover:bg-gray-700',
                  userButtonPopoverActionButtonText: 'text-gray-200',
                  userButtonPopoverFooter: 'hidden',
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </motion.header>
  );
}
