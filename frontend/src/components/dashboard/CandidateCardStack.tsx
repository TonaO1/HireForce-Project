import { useState } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Candidate } from '../../types';
import { CandidateCard } from './CandidateCard';

const SWIPE_THRESHOLD = 80;

interface CandidateCardStackProps {
  candidates: Candidate[];
}

export function CandidateCardStack({ candidates }: CandidateCardStackProps) {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  if (candidates.length === 0) {
    return (
      <div className="flex h-[420px] items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/50">
        <p className="text-slate-500">No candidates match this filter</p>
      </div>
    );
  }

  const visible = candidates.slice(index, index + 3);
  const current = candidates[index];

  const goNext = () => setIndex((i) => Math.min(i + 1, candidates.length - 1));
  const goPrev = () => setIndex((i) => Math.max(i - 1, 0));

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) goNext();
    else if (info.offset.x > SWIPE_THRESHOLD) goPrev();
  };

  return (
    <div className="flex flex-col items-center">
      <div className="card-perspective relative h-[420px] w-full max-w-sm">
        <AnimatePresence mode="popLayout">
          {visible.map((candidate, stackPos) => {
            const isTop = stackPos === 0;
            return (
              <motion.div
                key={`${candidate.id}-${index}`}
                drag={isTop ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={isTop ? handleDragEnd : undefined}
                onClick={() => isTop && navigate(`/hr/candidates/${candidate.id}`)}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                animate={{
                  scale: 1 - stackPos * 0.05,
                  y: stackPos * 20,
                  rotateX: 8 + stackPos * 3,
                  opacity: 1 - stackPos * 0.2,
                  zIndex: 10 - stackPos,
                }}
                exit={{ opacity: 0, x: -200, rotateY: -15 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                style={{ transformStyle: 'preserve-3d' }}
                className={`absolute inset-x-0 top-0 mx-auto h-[380px] w-full max-w-sm rounded-2xl border border-slate-700/80 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-2xl shadow-indigo-950/40 ${
                  isTop ? 'cursor-pointer' : 'pointer-events-none'
                }`}
              >
                <CandidateCard candidate={candidate} />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          className="rounded-full border border-slate-700 bg-slate-800 p-2 text-slate-300 transition hover:bg-slate-700 disabled:opacity-30"
          aria-label="Previous candidate"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-300">
            {current.name}
          </p>
          <p className="text-xs text-slate-500">
            {index + 1} of {candidates.length} — swipe or click for details
          </p>
        </div>
        <button
          type="button"
          onClick={goNext}
          disabled={index === candidates.length - 1}
          className="rounded-full border border-slate-700 bg-slate-800 p-2 text-slate-300 transition hover:bg-slate-700 disabled:opacity-30"
          aria-label="Next candidate"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
