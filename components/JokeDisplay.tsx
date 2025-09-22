import React from 'react';
import { Joke, VoteType } from '../types';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';

interface JokeDisplayProps {
  joke: Joke | null;
  isLoading: boolean;
  error: string | null;
  onVote: (voteType: VoteType) => void;
  voteFeedback: string | null;
  voteFeedbackType: 'success' | 'error' | null;
  isVoting: boolean;
}

const JokeDisplay: React.FC<JokeDisplayProps> = ({ joke, isLoading, error, onVote, voteFeedback, voteFeedbackType, isVoting }) => {
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

  return (
    <section id="txiste-erakuslea" className="bg-white p-6 rounded-lg shadow-lg text-center">
      <h2 className="text-2xl font-bold mb-4 text-red-600">Eguneko txistea</h2>
      <div id="txiste-edukia" className="min-h-[100px] mb-2 text-lg text-gray-700 flex justify-center items-center">
        {contentArea}
      </div>
      
      {!isLoading && !error && joke && joke.submitted_by_izena && (
        <div className="mb-4 text-sm text-gray-600">
          <p>
            Nork bidalia: {joke.submitted_by_izena} {joke.submitted_by_abizenak}
            {joke.submitted_by_pueblo ? ` (${joke.submitted_by_pueblo})` : ''}
          </p>
        </div>
      )}
      
      {!isLoading && !error && joke && (
        <>
          <div id="botoiak" className="space-x-4">
            <Button
              onClick={() => onVote('gora')}
              className="text-3xl px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300"
              aria-label="Bozkatu gora"
              disabled={isVoting}
            >
              👍
            </Button>
            <Button
              onClick={() => onVote('behera')}
              className="text-3xl px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300"
              aria-label="Bozkatu behera"
              disabled={isVoting}
            >
              👎
            </Button>
          </div>
          {voteFeedback && (
            <p className={`mt-4 text-sm ${voteFeedbackType === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {voteFeedback}
            </p>
          )}
        </>
      )}
    </section>
  );
};

export default JokeDisplay;