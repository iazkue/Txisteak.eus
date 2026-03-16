import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Joke, VoteType } from '../types';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { ThumbsUp, ThumbsDown, Pencil, MapPin } from 'lucide-react';

interface JokeDisplayProps {
  joke: Joke | null;
  isLoading: boolean;
  error: string | null;
  onVote: (voteType: VoteType) => void;
  voteFeedback: string | null;
  voteFeedbackType: 'success' | 'error' | null;
  isVoting: boolean;
  cooldown: number;
}

const JokeDisplay: React.FC<JokeDisplayProps> = ({ joke, isLoading, error, onVote, voteFeedback, voteFeedbackType, isVoting, cooldown }) => {
  return (
    <section id="txiste-erakuslea" className="glass-card p-8 md:p-12 text-center relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-basque-red" />

      <h2 className="text-sm font-bold uppercase tracking-widest text-stone-600 mb-8">Eguneko Txistea</h2>

      <div id="txiste-edukia" className="min-h-[200px] flex flex-col justify-center items-center mb-8">
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LoadingSpinner />
            </motion.div>
          ) : error ? (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-red-500 text-xl font-medium"
            >
              {error}
            </motion.p>
          ) : !joke ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-stone-400 text-xl italic"
            >
              Ez da txisterik aurkitu.
            </motion.p>
          ) : (
            <motion.div
              key={joke.id}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.05, y: -20 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="w-full"
            >
              <p className="txiste-text mb-8">{joke.testua}</p>

              {joke.submitted_by_izena && (
                <div className="flex items-center justify-center gap-4 text-sm text-stone-500 mb-8">
                  <div className="flex items-center gap-1">
                    <span className="text-basque-red text-xs">✏️</span>
                    <span className="font-medium">{joke.submitted_by_izena} {joke.submitted_by_abizenak}</span>
                  </div>
                  {joke.submitted_by_pueblo && (
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-stone-400" />
                      <span>{joke.submitted_by_pueblo}</span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isLoading && !error && joke && (
        <div className="flex flex-col items-center gap-4">
          <div id="botoiak" className="flex gap-4">
            <Button
              variant="primary"
              onClick={() => onVote('gora')}
              disabled={isVoting || cooldown > 0}
              className="rounded-full w-16 h-16 p-0"
              aria-label="Bozkatu gora"
            >
              <ThumbsUp size={24} />
            </Button>
            <Button
              variant="danger"
              onClick={() => onVote('behera')}
              disabled={isVoting || cooldown > 0}
              className="rounded-full w-16 h-16 p-0"
              aria-label="Bozkatu behera"
            >
              <ThumbsDown size={24} />
            </Button>
          </div>

          <AnimatePresence>
            {(voteFeedback || cooldown > 0) && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`text-sm font-medium ${voteFeedbackType === 'success' ? 'text-stone-600' : 'text-red-600'}`}
              >
                {cooldown > 0 ? `Itxaron ${cooldown} segundo...` : voteFeedback}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}
    </section>
  );
};

export default JokeDisplay;