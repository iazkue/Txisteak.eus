import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import JokeDisplay from './components/JokeDisplay';
import RankingList from './components/RankingList';
import SubmitJokeModal from './components/SubmitJokeModal';
import { Joke, Submitter, SubmitJokePayload, VoteType } from './types';
import * as api from './services/api';
import { QueryDocumentSnapshot, DocumentData, Timestamp } from 'firebase/firestore';
import Button from './components/Button';

const App: React.FC = () => {
  // Main joke display state
  const [currentJoke, setCurrentJoke] = useState<Joke | null>(null);
  const [jokeLoading, setJokeLoading] = useState<boolean>(true);
  const [jokeError, setJokeError] = useState<string | null>(null);
  const [voteFeedback, setVoteFeedback] = useState<string | null>(null);
  const [voteFeedbackType, setVoteFeedbackType] = useState<'success' | 'error' | null>(null);
  const [isVoting, setIsVoting] = useState<boolean>(false);

  // Joke Ranking state
  const [jokeRanking, setJokeRanking] = useState<Joke[]>([]);
  const [jokeRankingLoading, setJokeRankingLoading] = useState<boolean>(true);
  const [jokeRankingError, setJokeRankingError] = useState<string | null>(null);
  const [lastJokeDoc, setLastJokeDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreJokes, setHasMoreJokes] = useState<boolean>(true);
  const JOKE_RANKING_LIMIT = 5;

  // Submitter Ranking state
  const [submitterRanking, setSubmitterRanking] = useState<Submitter[]>([]);
  const [submitterRankingLoading, setSubmitterRankingLoading] = useState<boolean>(true);
  const [submitterRankingError, setSubmitterRankingError] = useState<string | null>(null);
  const [lastSubmitterDoc, setLastSubmitterDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreSubmitters, setHasMoreSubmitters] = useState<boolean>(true);
  const SUBMITTER_RANKING_LIMIT = 5;
  
  // Monthly Joke Ranking state
  const [monthlyJokeRanking, setMonthlyJokeRanking] = useState<Joke[]>([]);
  const [monthlyJokeRankingLoading, setMonthlyJokeRankingLoading] = useState<boolean>(true);
  const [monthlyJokeRankingError, setMonthlyJokeRankingError] = useState<string | null>(null);
  const [lastMonthlyJokeDoc, setLastMonthlyJokeDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreMonthlyJokes, setHasMoreMonthlyJokes] = useState<boolean>(true);
  const MONTHLY_JOKE_RANKING_LIMIT = 5;

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const loadJoke = useCallback(async () => {
    setJokeLoading(true);
    setJokeError(null);
    setVoteFeedback(null);
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

  const loadInitialRankings = useCallback(async () => {
    // Joke Ranking
    setJokeRankingLoading(true);
    setJokeRankingError(null);
    const jokeRankData = await api.fetchJokeRanking(JOKE_RANKING_LIMIT, null);
    if ('error' in jokeRankData) {
      setJokeRankingError(jokeRankData.error);
      setJokeRanking([]);
    } else {
      setJokeRanking(jokeRankData.jokes);
      setLastJokeDoc(jokeRankData.newLastVisible);
      const totalApproved = await api.getTotalApprovedJokeCount();
      setHasMoreJokes(jokeRankData.jokes.length < totalApproved);
    }
    setJokeRankingLoading(false);

    // Submitter Ranking
    setSubmitterRankingLoading(true);
    setSubmitterRankingError(null);
    const submitterRankData = await api.fetchSubmitterRanking(SUBMITTER_RANKING_LIMIT, null);
    if ('error' in submitterRankData) {
      setSubmitterRankingError(submitterRankData.error);
      setSubmitterRanking([]);
    } else {
      setSubmitterRanking(submitterRankData.submitters);
      setLastSubmitterDoc(submitterRankData.newLastVisible);
      const totalSubmitters = await api.getTotalSubmitterCount();
      setHasMoreSubmitters(submitterRankData.submitters.length < totalSubmitters);
    }
    setSubmitterRankingLoading(false);
    
    // Monthly Joke Ranking
    setMonthlyJokeRankingLoading(true);
    setMonthlyJokeRankingError(null);
    const monthlyRankData = await api.fetchMonthlyBestJokes(MONTHLY_JOKE_RANKING_LIMIT, null);
    if ('error' in monthlyRankData) {
        setMonthlyJokeRankingError(monthlyRankData.error);
        setMonthlyJokeRanking([]);
    } else {
        setMonthlyJokeRanking(monthlyRankData.jokes);
        setLastMonthlyJokeDoc(monthlyRankData.newLastVisible);
        const totalMonthly = await api.getTotalMonthlyJokeCount();
        setHasMoreMonthlyJokes(monthlyRankData.jokes.length < totalMonthly);
    }
    setMonthlyJokeRankingLoading(false);

  }, []);


  useEffect(() => {
    loadJoke();
    loadInitialRankings();
  }, [loadJoke, loadInitialRankings]);

  const handleVote = async (voteType: VoteType) => {
    if (!currentJoke || isVoting) return;
    setIsVoting(true);
    setVoteFeedback(null);
    try {
      const response = await api.voteJoke(currentJoke.id, voteType);
      if ('error' in response) {
        setVoteFeedback(response.error);
        setVoteFeedbackType('error');
      } else {
        setVoteFeedback(response.message);
        setVoteFeedbackType('success');
        if (currentJoke) {
            const updatedJoke = {
                ...currentJoke,
                boto_positiboak: voteType === 'gora' ? currentJoke.boto_positiboak + 1 : currentJoke.boto_positiboak,
                boto_negatiboak: voteType === 'behera' ? currentJoke.boto_negatiboak + 1 : currentJoke.boto_negatiboak,
            };
             await loadJoke();
        }
        await loadInitialRankings(); // Reload all rankings as scores might have changed
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
      // Reload submitter ranking as a new submitter might have been added or stats updated.
      setSubmitterRankingLoading(true);
      const submitterRankData = await api.fetchSubmitterRanking(SUBMITTER_RANKING_LIMIT, null);
      if ('error' in submitterRankData) {
        setSubmitterRankingError(submitterRankData.error);
      } else {
        setSubmitterRanking(submitterRankData.submitters);
        setLastSubmitterDoc(submitterRankData.newLastVisible);
        const totalSubmitters = await api.getTotalSubmitterCount();
        setHasMoreSubmitters(submitterRankData.submitters.length < totalSubmitters);
      }
      setSubmitterRankingLoading(false);
      
      await loadJoke(); // Load a new random joke
      return { success: response.success, message: response.message };
    } catch (err) {
      return { success: false, message: 'Errore bat gertatu da txistea bidaltzean.' };
    }
  };

  // --- Load More Handlers for Rankings ---
  const handleLoadMoreJokes = async () => {
    if (!hasMoreJokes || jokeRankingLoading) return;
    setJokeRankingLoading(true);
    const rankData = await api.fetchJokeRanking(JOKE_RANKING_LIMIT, lastJokeDoc);
    if ('error' in rankData) {
      setJokeRankingError(rankData.error);
    } else {
      setJokeRanking(prev => [...prev, ...rankData.jokes]);
      setLastJokeDoc(rankData.newLastVisible);
       const totalApproved = await api.getTotalApprovedJokeCount();
       setHasMoreJokes((jokeRanking.length + rankData.jokes.length) < totalApproved);
    }
    setJokeRankingLoading(false);
  };
  
  const handleLoadMoreSubmitters = async () => {
    if (!hasMoreSubmitters || submitterRankingLoading) return;
    setSubmitterRankingLoading(true);
    const rankData = await api.fetchSubmitterRanking(SUBMITTER_RANKING_LIMIT, lastSubmitterDoc);
    if ('error' in rankData) {
      setSubmitterRankingError(rankData.error);
    } else {
      setSubmitterRanking(prev => [...prev, ...rankData.submitters]);
      setLastSubmitterDoc(rankData.newLastVisible);
      const totalSubmitters = await api.getTotalSubmitterCount();
      setHasMoreSubmitters((submitterRanking.length + rankData.submitters.length) < totalSubmitters);
    }
    setSubmitterRankingLoading(false);
  };

  const handleLoadMoreMonthlyJokes = async () => {
    if (!hasMoreMonthlyJokes || monthlyJokeRankingLoading) return;
    setMonthlyJokeRankingLoading(true);
    const rankData = await api.fetchMonthlyBestJokes(MONTHLY_JOKE_RANKING_LIMIT, lastMonthlyJokeDoc);
    if ('error' in rankData) {
        setMonthlyJokeRankingError(rankData.error);
    } else {
        setMonthlyJokeRanking(prev => [...prev, ...rankData.jokes]);
        setLastMonthlyJokeDoc(rankData.newLastVisible);
        const totalMonthly = await api.getTotalMonthlyJokeCount();
        setHasMoreMonthlyJokes((monthlyJokeRanking.length + rankData.jokes.length) < totalMonthly);
    }
    setMonthlyJokeRankingLoading(false);
  };

  // --- Render Item Functions ---
  const renderJokeRankingItem = (joke: Joke, index: number) => (
    <li key={joke.id} className="p-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 rounded">
      <p className="text-sm text-gray-700">{index + 1}. {joke.testua}</p>
      <p className="text-xs text-gray-500">
        Puntuazioa: {(joke.puntuazioa ?? 0).toFixed(3)} (👍{joke.boto_positiboak} / 👎{joke.boto_negatiboak})
      </p>
      <p className="text-xs text-gray-500">
        Data: {joke.sortze_data ? new Date(joke.sortze_data as string).toLocaleDateString('eu-ES') : 'N/A'}
      </p>
      {joke.submitted_by_izena && (
        <p className="text-xs text-gray-500 mt-1">
          Egilea: {joke.submitted_by_izena} {joke.submitted_by_abizenak}
          {joke.submitted_by_pueblo ? ` (${joke.submitted_by_pueblo})` : ''}
        </p>
      )}
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
            <RankingList<Joke>
              title="Hilabete Honetako Txiste Onenak"
              items={monthlyJokeRanking}
              renderItem={renderJokeRankingItem}
              isLoading={monthlyJokeRankingLoading}
              onLoadMore={handleLoadMoreMonthlyJokes}
              hasMore={hasMoreMonthlyJokes}
              error={monthlyJokeRankingError}
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
              <p>Bozkatu gustuko dituzun txisteak eta bidali zurea komunitatearekin partekatzeko! Gogoratu, txiste berriak berrikusi egingo dira argitaratu aurretik.</p>
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
