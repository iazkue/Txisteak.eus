
import { Joke, Submitter, SubmitJokePayload, VoteResponse, SubmitResponse, VoteType, ApiError } from '../types';

// In-memory store for mock data
let mockJokes: Joke[] = [
  { id: 1, testua: "Zergatik sartu zuen oiloak errepidea? Beste aldera iristeko! Klasikoa!", boto_positiboak: 20, boto_negatiboak: 5, puntuazioa: (20+1)/(20+5+2), sortze_data: new Date().toISOString() },
  { id: 2, testua: "Zer esaten dio tomate batek beste bati lasterketa batean? Ketchup! (Harrapatu!)", boto_positiboak: 15, boto_negatiboak: 2, puntuazioa: (15+1)/(15+2+2), sortze_data: new Date().toISOString() },
  { id: 3, testua: "Zer da horia eta arriskutsua? Marrazo bat platanozko pijama batekin.", boto_positiboak: 10, boto_negatiboak: 10, puntuazioa: (10+1)/(10+10+2), sortze_data: new Date().toISOString() },
  { id: 4, testua: "Bi legatz ari dira hizketan: - Zer moduz? - Arrantzaka!", boto_positiboak: 8, boto_negatiboak: 1, puntuazioa: (8+1)/(8+1+2), sortze_data: new Date().toISOString() },
  { id: 5, testua: "Zer egiten du sagu batek erratz batekin? Sagu-rrats!", boto_positiboak: 5, boto_negatiboak: 0, puntuazioa: (5+1)/(5+0+2), sortze_data: new Date().toISOString() },
];

let mockSubmitters: Submitter[] = [
    { id: 'user1@example.com', izena: 'Ane', abizenak: 'Lopetegi', email: 'user1@example.com', txiste_kopurua: 2, puntuazio_batazbestekoa: 0.85 },
    { id: 'user2@example.com', izena: 'Jon', abizenak: 'Etxebarria', email: 'user2@example.com', txiste_kopurua: 1, puntuazio_batazbestekoa: 0.70 },
];

let nextJokeId = mockJokes.length + 1;

const calculateScore = (positive: number, negative: number): number => {
    return (positive + 1) / (positive + negative + 2);
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchJoke = async (): Promise<Joke | ApiError> => {
  await delay(500);
  if (mockJokes.length === 0) {
    return { error: 'Ez dago txisterik eskuragarri' };
  }
  // Simulate probabilistic selection by picking a random one,
  // actual probabilistic logic is backend.
  const randomIndex = Math.floor(Math.random() * mockJokes.length);
  const joke = mockJokes[randomIndex];
  return { ...joke, puntuazioa: calculateScore(joke.boto_positiboak, joke.boto_negatiboak) };
};

export const voteJoke = async (jokeId: number, voteType: VoteType): Promise<VoteResponse | ApiError> => {
  await delay(300);
  const jokeIndex = mockJokes.findIndex(j => j.id === jokeId);
  if (jokeIndex === -1) {
    return { error: 'Txistea ez da aurkitu' };
  }
  if (voteType === 'gora') {
    mockJokes[jokeIndex].boto_positiboak++;
  } else {
    mockJokes[jokeIndex].boto_negatiboak++;
  }
  mockJokes[jokeIndex].puntuazioa = calculateScore(mockJokes[jokeIndex].boto_positiboak, mockJokes[jokeIndex].boto_negatiboak);
  
  // Update submitter scores if joke had submitter info (simplified for mock)
  const joke = mockJokes[jokeIndex];
  if (joke.submitted_by_email) {
    const submitter = mockSubmitters.find(s => s.email === joke.submitted_by_email);
    if (submitter) {
        // This is a simplification. Backend would properly recalculate average.
        // For mock, let's just assume a slight change.
        const relatedJokes = mockJokes.filter(j => j.submitted_by_email === submitter.email);
        const totalScore = relatedJokes.reduce((sum, j) => sum + (j.puntuazioa || 0), 0);
        submitter.puntuazio_batazbestekoa = relatedJokes.length > 0 ? totalScore / relatedJokes.length : 0;
    }
  }

  return { success: true, message: 'Botoa erregistratu da' };
};

export const submitJoke = async (payload: SubmitJokePayload): Promise<SubmitResponse | ApiError> => {
  await delay(700);
  if (!payload.testua || payload.testua.trim().length < 5) {
    return { error: 'Txistea hutsik dago edo laburregia da' };
  }
  if (mockJokes.some(j => j.testua.toLowerCase() === payload.testua.toLowerCase())) {
    return { error: 'Txiste hori jada existitzen da' };
  }
  const newJoke: Joke = {
    id: nextJokeId++,
    testua: payload.testua.trim(),
    boto_positiboak: 0,
    boto_negatiboak: 0,
    puntuazioa: calculateScore(0, 0),
    sortze_data: new Date().toISOString(),
    submitted_by_izena: payload.izena,
    submitted_by_abizenak: payload.abizenak,
    submitted_by_email: payload.email,
  };
  mockJokes.push(newJoke);

  // Update/add submitter
  let submitter = mockSubmitters.find(s => s.email === payload.email);
  if (submitter) {
    submitter.txiste_kopurua++;
    // Recalculate average score (simplified)
    const relatedJokes = mockJokes.filter(j => j.submitted_by_email === submitter!.email);
    const totalScore = relatedJokes.reduce((sum, j) => sum + (j.puntuazioa || 0), 0);
    submitter.puntuazio_batazbestekoa = relatedJokes.length > 0 ? totalScore / relatedJokes.length : 0;
  } else {
    mockSubmitters.push({
      id: payload.email,
      izena: payload.izena,
      abizenak: payload.abizenak,
      email: payload.email,
      txiste_kopurua: 1,
      puntuazio_batazbestekoa: newJoke.puntuazioa || 0,
    });
  }

  return { success: true, message: 'Txistea ondo bidali da!', id: newJoke.id };
};

export const fetchJokeRanking = async (limit: number = 10): Promise<Joke[] | ApiError> => {
  await delay(600);
  const sortedJokes = [...mockJokes].sort((a, b) => {
    const scoreA = a.puntuazioa || 0;
    const scoreB = b.puntuazioa || 0;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    return b.boto_positiboak - a.boto_positiboak; // Tie-breaker
  });
  return sortedJokes.slice(0, limit);
};

export const fetchSubmitterRanking = async (limit: number = 10): Promise<Submitter[] | ApiError> => {
  await delay(600);
  const sortedSubmitters = [...mockSubmitters].sort((a, b) => {
    if (b.puntuazio_batazbestekoa !== a.puntuazio_batazbestekoa) {
        return b.puntuazio_batazbestekoa - a.puntuazio_batazbestekoa;
    }
    return b.txiste_kopurua - a.txiste_kopurua; // Tie-breaker
  });
  return sortedSubmitters.slice(0, limit);
};

// Helper to get total counts for "hasMore" logic
export const getTotalJokeCount = async (): Promise<number> => {
    await delay(50);
    return mockJokes.length;
};

export const getTotalSubmitterCount = async (): Promise<number> => {
    await delay(50);
    return mockSubmitters.length;
};
