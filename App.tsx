
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import JokeDisplay from './components/JokeDisplay';
import RankingList from './components/RankingList';
import SubmitJokeModal from './components/SubmitJokeModal';
// import Button from './components/Button'; // Button is used by other components, not directly here.
import { Joke, Submitter, SubmitJokePayload, VoteType } from './types';
import * as api from './services/api';

const App: React.FC = () => {
  const [currentJoke, setCurrentJoke] = useState<Joke | null>(null);
  const [jokeLoading, setJokeLoading] = useState<boolean>(true);
  const [jokeError, setJokeError] = useState<string | null>(null);
  const [voteFeedback, setVoteFeedback] = useState<string | null>(null);
  const [voteFeedbackType, setVoteFeedbackType] = useState<'success' | 'error' | null>(null);
  const [isVoting, setIsVoting] = useState<boolean>(false);

  const [jokeRanking, setJokeRanking] = useState<Joke[]>([]);
  const [jokeRankingLoading, setJokeRankingLoading] = useState<boolean>(true);
  const [jokeRankingError, setJokeRankingError] = useState<string | null>(null);
  const [jokeRankingLimit, setJokeRankingLimit] = useState<number>(5);
  const [hasMoreJokes, setHasMoreJokes] = useState<boolean>(true);


  const [submitterRanking, setSubmitterRanking] = useState<Submitter[]>([]);
  const [submitterRankingLoading, setSubmitterRankingLoading] = useState<boolean>(true);
  const [submitterRankingError, setSubmitterRankingError] = useState<string | null>(null);
  const [submitterRankingLimit, setSubmitterRankingLimit] = useState<number>(5);
  const [hasMoreSubmitters, setHasMoreSubmitters] = useState<boolean>(true);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const loadJoke = useCallback(async () => {
    setJokeLoading(true);
    setJokeError(null);
    setVoteFeedback(null); // Clear previous vote feedback when loading a new joke
    try {
      const jokeOrError = await api.fetchJoke();
      if ('error' in jokeOrError) {
        setJokeError(jokeOrError.error);
        setCurrentJoke(null);
      } else {
        setCurrentJoke(jokeOrError);
      }
    } catch (err) {
      setJokeError('Errore bat gertatu da txistea kargatzean.');
      setCurrentJoke(null);
    } finally {
      setJokeLoading(false);
    }
  }, []);

  const loadJokeRanking = useCallback(async (currentLimit: number, loadMore = false) => {
    setJokeRankingLoading(true);
    if (!loadMore) { // If not loading more, clear previous error
        setJokeRankingError(null);
    }
    try {
      const rankingOrError = await api.fetchJokeRanking(currentLimit); // Use currentLimit
       if ('error' in rankingOrError) {
        setJokeRankingError(rankingOrError.error);
        if (!loadMore) setJokeRanking([]); // Clear ranking on error if not loading more
      } else {
        // For "loadMore", we fetch all items up to the new limit.
        // The API mock currently returns only items for that limit, not incremental.
        // So, we replace the list if the API gives us the full list up to `currentLimit`.
        // If API were incremental: setJokeRanking(prev => loadMore ? [...prev, ...rankingOrError.filter(newItem => !prev.find(pItem => pItem.id === newItem.id))] : rankingOrError);
        setJokeRanking(rankingOrError);
        const totalJokes = await api.getTotalJokeCount();
        setHasMoreJokes(rankingOrError.length < totalJokes);
      }
    } catch (err) {
      setJokeRankingError('Errorea ranking-a kargatzean.');
      if (!loadMore) setJokeRanking([]);
    } finally {
      setJokeRankingLoading(false);
    }
  }, []); // Removed jokeRanking.length as dependency, limit is passed directly

  const loadSubmitterRanking = useCallback(async (currentLimit: number, loadMore = false) => {
    setSubmitterRankingLoading(true);
    if (!loadMore) {
        setSubmitterRankingError(null);
    }
    try {
      const rankingOrError = await api.fetchSubmitterRanking(currentLimit);
       if ('error' in rankingOrError) {
        setSubmitterRankingError(rankingOrError.error);
        if (!loadMore) setSubmitterRanking([]);
      } else {
        // Similar to joke ranking, assuming API returns full list up to currentLimit
        setSubmitterRanking(rankingOrError);
        const totalSubmitters = await api.getTotalSubmitterCount();
        setHasMoreSubmitters(rankingOrError.length < totalSubmitters);
      }
    } catch (err) {
      setSubmitterRankingError('Errorea txistegileen ranking-a kargatzean.');
      if (!loadMore) setSubmitterRanking([]);
    } finally {
      setSubmitterRankingLoading(false);
    }
  }, []); // Removed submitterRanking.length

  useEffect(() => {
    loadJoke();
    loadJokeRanking(jokeRankingLimit);
    loadSubmitterRanking(submitterRankingLimit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initial load

  const handleVote = async (voteType: VoteType) => {
    if (!currentJoke || isVoting) return;
    setIsVoting(true);
    setVoteFeedback(null);
    try {
      const response = await api.voteJoke(currentJoke.id, voteType);
      if ('error'in response) {
         setVoteFeedback(response.error);
         setVoteFeedbackType('error');
      } else {
        setVoteFeedback(response.message);
        setVoteFeedbackType('success');
        // Reload current joke
        await loadJoke();
        // Reset and reload ONLY submitter ranking
        // setJokeRanking([]); // REMOVED - Do not reset joke ranking
        // await loadJokeRanking(jokeRankingLimit, false);  // REMOVED - Do not reload joke ranking
        
        // To update submitter ranking, we need to fetch it again with the current limit
        // We should ensure the submitter ranking list is fresh
        await loadSubmitterRanking(submitterRankingLimit, false);
      }
    } catch (err) {
      setVoteFeedback('Errorea bozkatzean.');
      setVoteFeedbackType('error');
    } finally {
      setIsVoting(false);
      setTimeout(() => {
        setVoteFeedback(null);
        setVoteFeedbackType(null);
      }, 3000);
    }
  };

  const handleSubmitJoke = async (data: SubmitJokePayload) => {
    try {
      const response = await api.submitJoke(data);
      if ('error' in response) {
        return { success: false, message: response.error };
      }
      // Reload rankings after successful submission
      await loadJokeRanking(jokeRankingLimit, false); 
      await loadSubmitterRanking(submitterRankingLimit, false);
      // Optionally, load a new joke or the submitted joke if API provided it
      // For now, let's just reload a random joke.
      await loadJoke();
      return { success: response.success, message: response.message };
    } catch (err) {
      return { success: false, message: 'Errore bat gertatu da txistea bidaltzean.' };
    }
  };

  const handleLoadMoreJokes = () => {
    const newLimit = jokeRankingLimit + 5;
    setJokeRankingLimit(newLimit);
    loadJokeRanking(newLimit, true); 
  };
  
  const handleLoadMoreSubmitters = () => {
    const newLimit = submitterRankingLimit + 5;
    setSubmitterRankingLimit(newLimit);
    loadSubmitterRanking(newLimit, true);
  };


  const renderJokeRankingItem = (joke: Joke, index: number) => (
    <li key={joke.id} className="p-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 rounded">
      <p className="text-sm text-gray-700">{index + 1}. {joke.testua}</p>
      <p className="text-xs text-gray-500">
        Puntuazioa: {(joke.puntuazioa ?? 0).toFixed(3)} (👍{joke.boto_positiboak} / 👎{joke.boto_negatiboak})
      </p>
    </li>
  );

  const renderSubmitterRankingItem = (submitter: Submitter, index: number) => (
     <li key={submitter.id} className="p-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 rounded">
      <p className="text-sm text-gray-700">{index + 1}. {submitter.izena} {submitter.abizenak}</p>
      <p className="text-xs text-gray-500">
        Txisteak: {submitter.txiste_kopurua} | Batezbesteko Puntuazioa: {submitter.puntuazio_batazbestekoa.toFixed(3)}
      </p>
    </li>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header onOpenSubmitModal={() => setIsModalOpen(true)} />
      <main className="flex-grow container mx-auto p-4 sm:p-6 space-y-6">
        <JokeDisplay
          joke={currentJoke}
          isLoading={jokeLoading}
          error={jokeError}
          onVote={handleVote}
          voteFeedback={voteFeedback}
          voteFeedbackType={voteFeedbackType}
          isVoting={isVoting}
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
             <RankingList<Joke>
              title="Txiste Onenen Sailkapena"
              items={jokeRanking}
              renderItem={renderJokeRankingItem}
              isLoading={jokeRankingLoading}
              onLoadMore={handleLoadMoreJokes}
              hasMore={hasMoreJokes}
              error={jokeRankingError}
            />
             <RankingList<Submitter>
              title="Txistegile Onenen Sailkapena"
              items={submitterRanking}
              renderItem={renderSubmitterRankingItem}
              isLoading={submitterRankingLoading}
              onLoadMore={handleLoadMoreSubmitters}
              hasMore={hasMoreSubmitters}
              error={submitterRankingError}
            />
          </div>

          <section id="honi-buruz-atala" className="bg-white p-6 rounded-lg shadow-lg lg:col-span-1">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Webguneari Buruz</h2>
            <div className="space-y-3 text-gray-700">
              <p>Ongi etorri Euskal Txisteak webgunera! Hemen euskarazko txisteak partekatu eta baloratu ditzakezu.</p>
              <p>Helburua umore ona zabaltzea eta gure hizkuntzan txiste bilduma dibertigarri bat sortzea da.</p>
              <p>Bozkatu gustuko dituzun txisteak eta bidali zurea komunitatearekin partekatzeko!</p>
            </div>
          </section>
        </div>
      </main>
      <Footer />
      <SubmitJokeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitJoke}
      />
    </div>
  );
};

export default App;
