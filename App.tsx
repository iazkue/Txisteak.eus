import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/Header';
import Footer from './components/Footer';
import JokeDisplay from './components/JokeDisplay';
import RankingList from './components/RankingList';
const SubmitJokeModal = lazy(() => import('./components/SubmitJokeModal'));
import { Joke, Submitter, SubmitJokePayload, VoteType } from './types';
import * as api from './services/api';
import { Trophy, Calendar, Users, Info, ThumbsUp, ThumbsDown } from 'lucide-react';
import Button from './components/Button';

const App: React.FC = () => {
  // Main joke display state
  const [currentJoke, setCurrentJoke] = useState<Joke | null>(null);
  const [jokeLoading, setJokeLoading] = useState<boolean>(true);
  const [jokeError, setJokeError] = useState<string | null>(null);
  const [voteFeedback, setVoteFeedback] = useState<string | null>(null);
  const [voteFeedbackType, setVoteFeedbackType] = useState<'success' | 'error' | null>(null);
  const [isVoting, setIsVoting] = useState<boolean>(false);
  const [voteCooldown, setVoteCooldown] = useState<number>(0);

  // Joke Ranking state
  const [jokeRanking, setJokeRanking] = useState<Joke[]>([]);
  const [jokeRankingLoading, setJokeRankingLoading] = useState<boolean>(true);
  const [jokeRankingError, setJokeRankingError] = useState<string | null>(null);
  const [hasMoreJokes, setHasMoreJokes] = useState<boolean>(false);

  // Submitter Ranking state
  const [submitterRanking, setSubmitterRanking] = useState<Submitter[]>([]);
  const [submitterRankingLoading, setSubmitterRankingLoading] = useState<boolean>(true);
  const [submitterRankingError, setSubmitterRankingError] = useState<string | null>(null);
  const [hasMoreSubmitters, setHasMoreSubmitters] = useState<boolean>(false);

  // Monthly Joke Ranking state
  const [monthlyJokeRanking, setMonthlyJokeRanking] = useState<Joke[]>([]);
  const [monthlyJokeRankingLoading, setMonthlyJokeRankingLoading] = useState<boolean>(true);
  const [monthlyJokeRankingError, setMonthlyJokeRankingError] = useState<string | null>(null);
  const [hasMoreMonthlyJokes, setHasMoreMonthlyJokes] = useState<boolean>(false);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Pagination states
  const [visibleJokesCount, setVisibleJokesCount] = useState<number>(6);
  const [visibleMonthlyJokesCount, setVisibleMonthlyJokesCount] = useState<number>(6);
  const [visibleSubmittersCount, setVisibleSubmittersCount] = useState<number>(6);

  useEffect(() => {
    if (voteCooldown > 0) {
      const timer = setTimeout(() => setVoteCooldown(voteCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [voteCooldown]);

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
    // Start all ranking fetches in parallel
    setJokeRankingLoading(true);
    setJokeRankingError(null);
    setSubmitterRankingLoading(true);
    setSubmitterRankingError(null);
    setMonthlyJokeRankingLoading(true);
    setMonthlyJokeRankingError(null);

    const [jokeRankData, submitterRankData, monthlyRankData] = await Promise.all([
      api.fetchJokeRanking(),
      api.fetchSubmitterRanking(),
      api.fetchMonthlyBestJokes(),
    ]);

    // Joke Ranking
    if ('error' in jokeRankData) {
      setJokeRankingError(jokeRankData.error);
      setJokeRanking([]);
    } else {
      setJokeRanking(jokeRankData.jokes);
    }
    setJokeRankingLoading(false);

    // Submitter Ranking
    if ('error' in submitterRankData) {
      setSubmitterRankingError(submitterRankData.error);
      setSubmitterRanking([]);
    } else {
      setSubmitterRanking(submitterRankData.submitters);
    }
    setSubmitterRankingLoading(false);

    // Monthly Joke Ranking
    if ('error' in monthlyRankData) {
      setMonthlyJokeRankingError(monthlyRankData.error);
      setMonthlyJokeRanking([]);
    } else {
      setMonthlyJokeRanking(monthlyRankData.jokes);
    }
    setMonthlyJokeRankingLoading(false);
  }, []);


  useEffect(() => {
    loadJoke();
    loadInitialRankings();
  }, [loadJoke, loadInitialRankings]);

  const handleVote = async (voteType: VoteType) => {
    if (!currentJoke || isVoting || voteCooldown > 0) return;
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
        setVoteCooldown(5);
        await loadJoke();
        await loadInitialRankings();

        setTimeout(() => {
          setVoteFeedback(null);
          setVoteFeedbackType(null);
        }, 3000);
      }
    } catch (err) {
      setVoteFeedback('Errorea bozkatzean.');
      setVoteFeedbackType('error');
    } finally {
      setIsVoting(false);
    }
  };

  const handleSubmitJoke = async (data: SubmitJokePayload) => {
    try {
      const response = await api.submitJoke(data);
      if ('error' in response) {
        return { success: false, message: response.error };
      }

      await loadInitialRankings();
      await loadJoke();
      return { success: response.success, message: response.message };
    } catch (err) {
      return { success: false, message: 'Errore bat gertatu da txistea bidaltzean.' };
    }
  };

  // --- Load More Handlers for Rankings ---
  const handleLoadMoreJokes = () => {
    setVisibleJokesCount(prev => prev + 6);
  };

  const handleLoadMoreSubmitters = () => {
    setVisibleSubmittersCount(prev => prev + 6);
  };

  const handleLoadMoreMonthlyJokes = () => {
    setVisibleMonthlyJokesCount(prev => prev + 6);
  };

  const renderJokeRankingItem = (joke: Joke, index: number) => (
    <div key={joke.id} className="group">
      <div className="flex items-start gap-4">
        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-stone-200 text-stone-700 rounded-lg text-sm font-bold group-hover:bg-basque-red group-hover:text-white transition-colors">
          {index + 1}
        </span>
        <div className="flex-grow min-w-0">
          <p className="text-stone-800 mb-2 whitespace-pre-wrap">{joke.testua}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium uppercase tracking-wider text-stone-600">
            <span className="flex items-center gap-1">
              <span className="text-basque-red">★</span>
              {(joke.puntuazioa ?? 0).toFixed(2)}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsUp size={10} className="text-stone-400" />
              {joke.boto_positiboak}
            </span>
            <span className="flex items-center gap-1">
              <ThumbsDown size={10} className="text-stone-400" />
              {joke.boto_negatiboak}
            </span>
            {joke.submitted_by_izena && (
              <span className="text-stone-500 flex items-center gap-1">
                <span>✏️</span>
                {joke.submitted_by_izena} {joke.submitted_by_abizenak}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSubmitterRankingItem = (submitter: Submitter, index: number) => (
    <div key={submitter.id} className="group">
      <div className="flex items-center gap-4">
        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-stone-200 text-stone-700 rounded-lg text-sm font-bold group-hover:bg-blue-500 group-hover:text-white transition-colors">
          {index + 1}
        </span>
        <div className="flex-grow">
          <p className="text-stone-800 font-bold">{submitter.izena} {submitter.abizenak}</p>
          <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-stone-600">
            <span>{submitter.txiste_kopurua} Txiste</span>
            <span className="w-1 h-1 bg-stone-300 rounded-full" />
            <span>Batezbestekoa: {submitter.puntuazio_batazbestekoa.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header onOpenSubmitModal={() => setIsModalOpen(true)} />

      <main className="container mx-auto px-4 py-12 flex-grow max-w-6xl">
        <div className="mb-16 animate-fade-in-up">
          <JokeDisplay
            joke={currentJoke}
            isLoading={jokeLoading}
            error={jokeError}
            onVote={handleVote}
            voteFeedback={voteFeedback}
            voteFeedbackType={voteFeedbackType}
            isVoting={isVoting}
            cooldown={voteCooldown}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div
            className="lg:col-span-2 space-y-8 animate-fade-in-up animate-delay-200"
          >
            <section className="glass-card p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-basque-red/10 p-2 rounded-lg">
                  <Trophy className="text-basque-red" size={24} />
                </div>
                <h3 className="text-xl font-bold">Txiste onenak</h3>
              </div>
              <RankingList<Joke>
                title="Txiste Onenen Sailkapena"
                items={jokeRanking.slice(0, visibleJokesCount)}
                renderItem={renderJokeRankingItem}
                isLoading={jokeRankingLoading}
                onLoadMore={handleLoadMoreJokes}
                hasMore={jokeRanking.length > visibleJokesCount}
                error={jokeRankingError}
              />
            </section>

            <section className="glass-card p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-basque-green/10 p-2 rounded-lg">
                  <Calendar className="text-basque-green" size={24} />
                </div>
                <h3 className="text-xl font-bold">Azken hilabeteko onenak</h3>
              </div>
              <RankingList<Joke>
                title="Azken hilabeteko txiste onenak"
                items={monthlyJokeRanking.slice(0, visibleMonthlyJokesCount)}
                renderItem={renderJokeRankingItem}
                isLoading={monthlyJokeRankingLoading}
                onLoadMore={handleLoadMoreMonthlyJokes}
                hasMore={monthlyJokeRanking.length > visibleMonthlyJokesCount}
                error={monthlyJokeRankingError}
              />
            </section>

            <section className="glass-card p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-blue-500/10 p-2 rounded-lg">
                  <Users className="text-blue-500" size={24} />
                </div>
                <h3 className="text-xl font-bold">Txistegile onenak</h3>
              </div>
              <RankingList<Submitter>
                title="Txistegile Onenen Sailkapena"
                items={submitterRanking.slice(0, visibleSubmittersCount)}
                renderItem={renderSubmitterRankingItem}
                isLoading={submitterRankingLoading}
                onLoadMore={handleLoadMoreSubmitters}
                hasMore={submitterRanking.length > visibleSubmittersCount}
                error={submitterRankingError}
              />
            </section>
          </div>

          <aside
            className="space-y-8 animate-fade-in-up animate-delay-400"
          >
            <section id="honi-buruz-atala" className="glass-card p-8 sticky top-24">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-stone-100 p-2 rounded-lg">
                  <Info className="text-stone-600" size={24} />
                </div>
                <h2 className="text-xl font-bold text-stone-900">Webguneari Buruz</h2>
              </div>
              <div className="space-y-4 text-stone-600 leading-relaxed">
                <p>Ongi etorri <span className="font-bold text-basque-red">Txisteak.eus</span> webgunera! Hemen euskarazko txisteak partekatu eta baloratu ditzakezu.</p>
                <p>Webgunea Xanti eta Iñaki lagunen(txistegile amorratuak) umore beharra asetzeko nahiarekin sortu zen. Helburua umore ona zabaltzea eta gure hizkuntzan txiste bilduma dibertigarri bat sortzea da.</p>
                <p>Bozkatu gustuko dituzun txisteak eta bidali zurea komunitatearekin partekatzeko!</p>
                <div className="pt-4 border-t border-stone-100 text-xs italic">
                  Gogoratu, txiste berriak berrikusi egingo dira argitaratu aurretik.
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>

      <Footer />

      <AnimatePresence>
        {isModalOpen && (
          <Suspense fallback={null}>
            <SubmitJokeModal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              onSubmit={handleSubmitJoke}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
