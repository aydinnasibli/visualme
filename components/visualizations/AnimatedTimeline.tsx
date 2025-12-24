"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AnimatedTimelineData,
  AnimatedTimelineStep,
} from "@/lib/types/visualization";
import VisualizationContainer from "./VisualizationContainer";
import { ChevronRight, ChevronLeft, Play, Pause, RefreshCcw } from "lucide-react";

interface AnimatedTimelineProps {
  data: AnimatedTimelineData;
  readOnly?: boolean;
}

export default function AnimatedTimeline({
  data,
  readOnly = false,
}: AnimatedTimelineProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev < data.steps.length - 1) return prev + 1;
          setIsPlaying(false);
          return prev;
        });
      }, 2000); // 2 seconds per step
    }
    return () => clearInterval(interval);
  }, [isPlaying, data.steps.length]);

  const handleNext = () => {
    if (currentStep < data.steps.length - 1) setCurrentStep((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((prev) => prev - 1);
  };

  const handleReset = () => {
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const step: AnimatedTimelineStep = data.steps[currentStep];

  return (
    <VisualizationContainer onReset={handleReset}>
      <div className="w-full h-full flex flex-col items-center justify-center p-8 relative overflow-hidden">

        {/* Progress Bar Background */}
        <div className="absolute top-1/4 left-10 right-10 h-0.5 bg-zinc-800 z-0" />

        {/* Animated Progress Line */}
        <motion.div
            className="absolute top-1/4 left-10 h-0.5 bg-gradient-to-r from-purple-600 to-cyan-500 z-0"
            animate={{ width: `${(currentStep / (data.steps.length - 1)) * 100}%` }}
            // Fix for calc issue in framer motion width animation if needed, but percentage usually works.
            // Better to use a container with right: 10 if simple width% doesn't account for padding correctly.
            // For now, simpler approximation:
            style={{ width: `calc(${ (currentStep / (data.steps.length - 1)) * 100 }% - 5rem)` }}
            transition={{ duration: 0.5 }}
        />

        {/* Current Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="z-10 w-full max-w-2xl"
          >
            {/* Main Card */}
            <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-700/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
              {/* Glowing Orb Background */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-purple-600/20 rounded-full blur-[80px] pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-600/20 rounded-full blur-[80px] pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-zinc-700 to-zinc-800 select-none">
                        {String(currentStep + 1).padStart(2, '0')}
                    </span>
                    {step.timestamp && (
                        <div className="px-3 py-1 bg-zinc-800/50 rounded-full text-xs font-mono text-zinc-400 border border-zinc-700/50">
                            {step.timestamp}
                        </div>
                    )}
                </div>

                <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">
                  {step.title}
                </h2>
                <p className="text-lg text-zinc-400 leading-relaxed">
                  {step.description}
                </p>

                {/* Optional Data visualization within step if data property exists */}
                {step.data && (
                    <div className="mt-6 p-4 bg-zinc-950/50 rounded-xl border border-zinc-800/50 font-mono text-sm text-green-400 overflow-x-auto">
                        <pre>{JSON.stringify(step.data, null, 2)}</pre>
                    </div>
                )}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controls */}
        <div className="absolute bottom-8 flex items-center gap-6 z-20 bg-zinc-900/80 backdrop-blur-md p-2 px-6 rounded-full border border-zinc-800 shadow-xl">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="p-2 rounded-full hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-300 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-3 rounded-full bg-white text-black hover:bg-zinc-200 transition-transform active:scale-95 shadow-lg shadow-white/10"
          >
            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
          </button>

          <button
            onClick={handleNext}
            disabled={currentStep === data.steps.length - 1}
            className="p-2 rounded-full hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent text-zinc-300 transition-colors"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Step Indicators */}
        <div className="absolute bottom-28 flex gap-2">
            {data.steps.map((_, idx) => (
                <button
                    key={idx}
                    onClick={() => setCurrentStep(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentStep ? 'w-8 bg-white' : 'w-2 bg-zinc-700 hover:bg-zinc-600'
                    }`}
                />
            ))}
        </div>

      </div>
    </VisualizationContainer>
  );
}
