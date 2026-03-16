import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Header from './components/Header';
import Footer from './components/Footer';
import JokeDisplay from './components/JokeDisplay';
import RankingList from './components/RankingList';
import SubmitJokeModal from './components/SubmitJokeModal';
import { Joke, Submitter, SubmitJokePayload, VoteType } from './types';
import * as api from './services/api';
import { Trophy, Calendar, Users, Info } from 'lucide-react';
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
    // Joke Ranking
    setJokeRankingLoading(true);
    setJokeRankingError(null);
    const jokeRankData = await api.fetchJokeRanking();
    if ('error' in jokeRankData) {
      setJokeRankingError(jokeRankData.error);
      setJokeRanking([]);
    } else {
      setJokeRanking(jokeRankData.jokes);
      setHasMoreJokes(false);
    }
    setJokeRankingLoading(false);

    // Submitter Ranking
    setSubmitterRankingLoading(true);
    setSubmitterRankingError(null);
    const submitterRankData = await api.fetchSubmitterRanking();
    if ('error' in submitterRankData) {
      setSubmitterRankingError(submitterRankData.error);
      setSubmitterRanking([]);
    } else {
      setSubmitterRanking(submitterRankData.submitters);
      setHasMoreSubmitters(false);
    }
    setSubmitterRankingLoading(false);

    // Monthly Joke Ranking
    setMonthlyJokeRankingLoading(true);
    setMonthlyJokeRankingError(null);
    const monthlyRankData = await api.fetchMonthlyBestJokes();
    if ('error' in monthlyRankData) {
      setMonthlyJokeRankingError(monthlyRankData.error);
      setMonthlyJokeRanking([]);
    } else {
      setMonthlyJokeRanking(monthlyRankData.jokes);
      setHasMoreMonthlyJokes(false);
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
  const handleLoadMoreJokes = async () => {
    // Simplified for now
  };

  const handleLoadMoreSubmitters = async () => {
    // Simplified for now
  };

  const handleLoadMoreMonthlyJokes = async () => {
    // Simplified for now
  };

  // --- Render Item Functions ---
  const renderJokeRankingItem = (joke: Joke, index: number) => (
    <div key={joke.id} className="group">
      <div className="flex items-start gap-4">
        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-stone-100 text-stone-500 rounded-lg text-sm font-bold group-hover:bg-basque-red group-hover:text-white transition-colors">
          {index + 1}
        </span>
        <div className="flex-grow min-w-0">
          <p className="text-stone-800 mb-2 whitespace-pre-wrap">{joke.testua}</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-medium uppercase tracking-wider text-stone-400">
            <span className="flex items-center gap-1">
              <span className="text-basque-red">★</span>
              {(joke.puntuazioa ?? 0).toFixed(2)}
            </span>
            <span>👍 {joke.boto_positiboak}</span>
            <span>👎 {joke.boto_negatiboak}</span>
            {joke.submitted_by_izena && (
              <span className="text-stone-300">✍️ {joke.submitted_by_izena}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderSubmitterRankingItem = (submitter: Submitter, index: number) => (
    <div key={submitter.id} className="group">
      <div className="flex items-center gap-4">
        <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-stone-100 text-stone-500 rounded-lg text-sm font-bold group-hover:bg-blue-500 group-hover:text-white transition-colors">
          {index + 1}
        </span>
        <div className="flex-grow">
          <p className="text-stone-800 font-bold">{submitter.izena} {submitter.abizenak}</p>
          <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-wider text-stone-400">
            <span>{submitter.txiste_kopurua} Txiste</span>
            <span className="w-1 h-1 bg-stone-200 rounded-full" />
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
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
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-8"
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
                items={jokeRanking}
                renderItem={renderJokeRankingItem}
                isLoading={jokeRankingLoading}
                onLoadMore={handleLoadMoreJokes}
                hasMore={hasMoreJokes}
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
                items={monthlyJokeRanking}
                renderItem={renderJokeRankingItem}
                isLoading={monthlyJokeRankingLoading}
                onLoadMore={handleLoadMoreMonthlyJokes}
                hasMore={hasMoreMonthlyJokes}
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
                items={submitterRanking}
                renderItem={renderSubmitterRankingItem}
                isLoading={submitterRankingLoading}
                onLoadMore={handleLoadMoreSubmitters}
                hasMore={hasMoreSubmitters}
                error={submitterRankingError}
              />
            </section>
          </motion.div>

          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-8"
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
          </motion.aside>
        </div>
      </main>

      <Footer />

      <AnimatePresence>
        {isModalOpen && (
          <SubmitJokeModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSubmit={handleSubmitJoke}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
