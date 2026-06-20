'use client';

import React from 'react';
import Header from '@/components/dashboard/Header';
import { ChevronDown, Mail } from 'lucide-react';

export default function HelpPage() {

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
      answer: "Every AI generation consumes tokens based on complexity. Your monthly token balance resets on the 1st of each month. Check your Settings page for your current usage and limits."
    }
  ];

  return (
    <div className="min-h-screen bg-surface-0 relative selection:bg-accent/20">
      <Header label="Help" />
      <div className="max-w-4xl mx-auto p-6 pt-24">
        <h1 className="font-display text-3xl font-bold text-ink mb-2">Help & Support</h1>
        <p className="text-ink-muted mb-8">Find answers to common questions and learn how to use Visuologia.</p>

        <h2 className="text-2xl font-bold text-ink mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4 mb-12">
          {faqs.map((faq, index) => (
            <details key={index} className="group surface-panel rounded-xl overflow-hidden">
              <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-2/60 transition-colors list-none">
                <span className="font-medium text-ink">{faq.question}</span>
                <ChevronDown className="transition-transform group-open:rotate-180 text-ink-faint w-5 h-5" />
              </summary>
              <div className="px-4 pb-4 text-ink-muted text-sm leading-relaxed border-t border-edge pt-4">
                {faq.answer}
              </div>
            </details>
          ))}
        </div>

        <div className="bg-accent/8 border border-accent/20 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-ink mb-2">Still need help?</h2>
          <p className="text-ink-muted mb-6">Our support team is available to assist you with any questions or issues.</p>
          <div className="flex items-center justify-center gap-4">
            <a
              href="mailto:aydinnasibli7@gmail.com"
              className="px-6 py-2.5 bg-accent text-surface-0 font-medium rounded-lg hover:bg-accent-hover transition-colors flex items-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
