'use client';

import React from 'react';
import Header from '@/components/dashboard/Header';
import { useUser } from '@clerk/nextjs';
import { Rocket, Database, Activity, Wrench, ChevronRight, ChevronDown, Mail, MessageSquare } from 'lucide-react';

export default function HelpPage() {
  const { user } = useUser();

  const faqs = [
    {
      question: "How do I create a new visualization?",
      answer: "Go to the dashboard and type your request in the input box. You can describe what you want to visualize or paste your data directly."
    },
    {
      question: "What formats are supported?",
      answer: "We support Network Graphs, Mind Maps, Tree Diagrams, Flowcharts, Timelines, Gantt Charts, Sankey Diagrams, and various charts (Bar, Line, Pie, etc.)."
    },
    {
      question: "Can I export my diagrams?",
      answer: "Yes, you can save your visualizations to your library. Image and code export features are coming soon!"
    },
    {
        question: "How does the token system work?",
        answer: "Every AI generation consumes tokens. Free users get 100 tokens/month, while Pro users get 2000. Tokens reset on the 1st of each month."
    }
  ];

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20">
      <Header user={user || null} />
      <div className="max-w-4xl mx-auto p-6 pt-24">
        <h1 className="text-3xl font-bold text-white mb-2">Help & Support</h1>
        <p className="text-stone-400 mb-8">Find answers to common questions and learn how to use VisualMe.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-surface-dark border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-colors group cursor-pointer">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                    <Rocket className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Getting Started</h3>
                <p className="text-stone-400 text-sm">Learn the basics of creating your first visualization in seconds.</p>
                <div className="mt-4 flex items-center text-primary text-sm font-medium">
                    Read Guide <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
            </div>

             <div className="bg-surface-dark border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-colors group cursor-pointer">
                <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-4 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <Database className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Data Formatting</h3>
                <p className="text-stone-400 text-sm">Best practices for structuring your prompts and data for best results.</p>
                <div className="mt-4 flex items-center text-primary text-sm font-medium">
                    View Examples <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
            </div>

             <div className="bg-surface-dark border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-colors group cursor-pointer">
                <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 mb-4 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                    <Activity className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Tips & Tricks</h3>
                <p className="text-stone-400 text-sm">Advanced techniques to get the most out of the AI engine.</p>
                <div className="mt-4 flex items-center text-primary text-sm font-medium">
                    Learn More <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
            </div>

             <div className="bg-surface-dark border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-colors group cursor-pointer">
                <div className="w-12 h-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <Wrench className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Troubleshooting</h3>
                <p className="text-stone-400 text-sm">Solutions for common issues and error messages.</p>
                <div className="mt-4 flex items-center text-primary text-sm font-medium">
                    Get Help <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
            </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4 mb-12">
            {faqs.map((faq, index) => (
                <details key={index} className="group bg-surface-dark border border-white/10 rounded-xl overflow-hidden">
                    <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition-colors list-none">
                        <span className="font-medium text-stone-200">{faq.question}</span>
                        <ChevronDown className="transition-transform group-open:rotate-180 text-gray-400 w-5 h-5" />
                    </summary>
                    <div className="px-4 pb-4 text-stone-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                        {faq.answer}
                    </div>
                </details>
            ))}
        </div>

        <div className="bg-gradient-to-r from-primary/20 to-purple-500/20 border border-white/10 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Still need help?</h2>
            <p className="text-stone-300 mb-6">Our support team is available to assist you with any questions or issues.</p>
            <div className="flex items-center justify-center gap-4">
                <button className="px-6 py-2.5 bg-white text-black font-medium rounded-lg hover:bg-stone-200 transition-colors flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Contact Support
                </button>
                 <button className="px-6 py-2.5 bg-surface-darker border border-white/10 text-white font-medium rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Join Community
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}
