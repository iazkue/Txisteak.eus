import React, { useState, useEffect, useRef } from 'react';
import { Joke, VoteType } from '../types';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

interface JokeDisplayProps {
  joke: Joke | null;
  isLoading: boolean;
  error: string | null;
  onVote: (voteType: VoteType) => void;
  onLoadNextJoke: () => void;
  voteFeedback: string | null;
  voteFeedbackType: 'success' | 'error' | null;
  isVoting: boolean;
}

const JokeDisplay: React.FC<JokeDisplayProps> = ({ joke, isLoading, error, onVote, onLoadNextJoke, voteFeedback, voteFeedbackType, isVoting }) => {
  const loadTimestampRef = useRef<number>(0);

  // Set the timestamp when a new joke is loaded
  useEffect(() => {
    if (joke && !isLoading) {
      loadTimestampRef.current = Date.now();
    }
  }, [joke, isLoading]);


  const handleVoteClick = (voteType: VoteType) => {
    if (isVoting) return;

    // Check if 6 seconds have passed since the joke was loaded
    if (Date.now() - loadTimestampRef.current < 6000) {
      // If not, just load the next joke without voting
      onLoadNextJoke();
    } else {
      // If 6 seconds have passed, proceed with the vote
      onVote(voteType);
    }
  };

  let contentArea;

  if (isLoading) {
    contentArea = <LoadingSpinner />;
  } else if (error) {
    contentArea = <p className="text-red-500 text-xl">{error}</p>;
  } else if (!joke) {
    contentArea = <p className="text-gray-600 text-xl">Ez da txisterik aurkitu.</p>;
  } else {
    contentArea = <p>{joke.testua}</p>;
  }

  // Buttons are only disabled while a vote is actively being processed.
  const isDisabled = isVoting;

  return (
    <section id="txiste-erakuslea" className="bg-white p-6 rounded-lg shadow-lg text-center">
      <div id="txiste-edukia" className="min-h-[100px] mb-2 text-lg text-gray-700 whitespace-pre-line flex justify-center items-center">
        {contentArea}
      </div>
      
      {!isLoading && !error && joke && joke.submitted_by_izena && (
        <div className="mb-4 text-sm text-gray-600">
          <br />
          <p>
            Bidalia: {joke.submitted_by_izena} {joke.submitted_by_abizenak}
            {joke.submitted_by_pueblo ? ` (${joke.submitted_by_pueblo})` : ''}
          </p>
        </div>
      )}
      
      {!isLoading && !error && joke && (
        <>
          <div id="botoiak" className="space-x-4">
            <Button
              onClick={() => handleVoteClick('gora')}
              className="text-3xl px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              aria-label="Bozkatu gora"
              disabled={isDisabled}
            >
              👍
            </Button>
            <Button
              onClick={() => handleVoteClick('behera')}
              className="text-3xl px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              aria-label="Bozkatu behera"
              disabled={isDisabled}
            >
              👎
            </Button>
          </div>
          <div className="mt-4 text-sm min-h-[20px]">
             {voteFeedback && (
              <p className={`${voteFeedbackType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                {voteFeedback}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default JokeDisplay;