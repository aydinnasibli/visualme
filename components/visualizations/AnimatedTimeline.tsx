"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Play, RotateCcw } from "lucide-react";
import type { AnimatedTimelineData } from "@/lib/types/visualization";

interface AnimatedTimelineProps {
  data: AnimatedTimelineData;
  readOnly?: boolean;
}

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#6366f1"];

export default function AnimatedTimeline({ data }: AnimatedTimelineProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [direction, setDirection] = useState(1);
  const cancelRef = useRef(false);

  useEffect(() => () => { cancelRef.current = true; }, []);

  const steps = data?.steps || [];
  const total = steps.length;

  const goTo = (idx: number, dir: number) => {
    setDirection(dir);
    setActiveStep(Math.max(0, Math.min(idx, total - 1)));
  };

  const handlePlay = async () => {
    if (playing) return;
    cancelRef.current = false;
    setPlaying(true);
    setDirection(1);
    for (let i = 0; i < total; i++) {
      if (cancelRef.current) break;
      setActiveStep(i);
      await new Promise<void>((res) => setTimeout(res, 900));
    }
    if (!cancelRef.current) setPlaying(false);
  };

  const current = steps[activeStep];
  const color = COLORS[activeStep % COLORS.length];

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60 }),
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-6 p-6 select-none">
      {/* Step dots */}
      <div className="flex items-center gap-2">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > activeStep ? 1 : -1)}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === activeStep ? 28 : 10,
              height: 10,
              background: i === activeStep ? color : i < activeStep ? `${color}80` : "#3f3f46",
            }}
          />
        ))}
      </div>

      {/* Step counter */}
      <div className="text-xs font-mono text-zinc-500">
        {activeStep + 1} / {total}
      </div>

      {/* Card */}
      <div className="w-full max-w-2xl relative" style={{ minHeight: 220 }}>
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={activeStep}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="w-full rounded-2xl p-8 border backdrop-blur-sm"
            style={{
              background: `linear-gradient(135deg, ${color}12, ${color}06)`,
              borderColor: `${color}40`,
              boxShadow: `0 0 40px ${color}15`,
            }}
          >
            {/* Step number badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4"
              style={{ background: `${color}25`, color, border: `1px solid ${color}40` }}
            >
              Step {activeStep + 1}
            </div>

            <h2 className="text-2xl font-bold text-white mb-3">{current?.title}</h2>
            <p className="text-zinc-300 leading-relaxed text-sm">{current?.description}</p>

            {current?.timestamp && (
              <div className="mt-4 text-xs text-zinc-500 font-mono">{current.timestamp}</div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => goTo(0, -1)}
          disabled={activeStep === 0}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 transition-all"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => goTo(activeStep - 1, -1)}
          disabled={activeStep === 0}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handlePlay}
          disabled={playing}
          className="w-12 h-12 flex items-center justify-center rounded-full border transition-all"
          style={{
            background: `${color}20`,
            borderColor: `${color}60`,
            color,
          }}
        >
          <Play className="w-5 h-5 ml-0.5" />
        </button>
        <button
          onClick={() => goTo(activeStep + 1, 1)}
          disabled={activeStep === total - 1}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700 disabled:opacity-30 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-2xl h-1 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          animate={{ width: `${((activeStep + 1) / total) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}
