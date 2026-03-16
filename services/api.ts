import { Joke, Submitter, SubmitJokePayload, VoteType, ApiError, VoteResponse, SubmitResponse } from '../types';

const API_BASE = '/api';

export const fetchJoke = async (): Promise<Joke | ApiError> => {
  try {
    const response = await fetch(`${API_BASE}/jokes/random`);
    if (!response.ok) throw new Error('Errorea txistea lortzean');
    const data = await response.json();
    if (!data) return { error: 'Ez dago txisterik eskuragarri.' };
    return data;
  } catch (error: any) {
    return { error: error.message || 'Errore bat gertatu da txistea kargatzean.' };
  }
};

export const voteJoke = async (jokeId: number, voteType: VoteType): Promise<VoteResponse | ApiError> => {
  try {
    const response = await fetch(`${API_BASE}/jokes/${jokeId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: voteType }),
    });
    const data = await response.json();
    if (!response.ok) return { error: data.message || 'Errorea bozkatzean' };
    return data;
  } catch (error: any) {
    return { error: error.message || 'Errore bat gertatu da bozkatzean.' };
  }
};

export const submitJoke = async (payload: SubmitJokePayload): Promise<SubmitResponse | ApiError> => {
  try {
    const response = await fetch(`${API_BASE}/jokes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) return { error: data.message || 'Errorea txistea bidaltzean' };
    return data;
  } catch (error: any) {
    return { error: error.message || 'Errore bat gertatu da txistea bidaltzean.' };
  }
};

export const fetchJokeRanking = async (): Promise<{ jokes: Joke[] } | ApiError> => {
  try {
    const response = await fetch(`${API_BASE}/jokes/ranking`);
    if (!response.ok) throw new Error('Errorea sailkapena lortzean');
    const jokes = await response.json();
    return { jokes };
  } catch (error: any) {
    return { error: error.message || 'Errore bat gertatu da sailkapena kargatzean.' };
  }
};

export const fetchSubmitterRanking = async (): Promise<{ submitters: Submitter[] } | ApiError> => {
  try {
    const response = await fetch(`${API_BASE}/submitters/ranking`);
    if (!response.ok) throw new Error('Errorea txistegileak lortzean');
    const submitters = await response.json();
    return { submitters };
  } catch (error: any) {
    return { error: error.message || 'Errore bat gertatu da txistegileak kargatzean.' };
  }
};

export const fetchMonthlyBestJokes = async (): Promise<{ jokes: Joke[] } | ApiError> => {
  try {
    const response = await fetch(`${API_BASE}/jokes/monthly`);
    if (!response.ok) throw new Error('Errorea hileroko sailkapena lortzean');
    const jokes = await response.json();
    return { jokes };
  } catch (error: any) {
    return { error: error.message || 'Errore bat gertatu da hileroko sailkapena kargatzean.' };
  }
};

// These are no longer needed with the new API structure but kept for compatibility if needed
export const getTotalApprovedJokeCount = async () => 100; 
export const getTotalSubmitterCount = async () => 100;
export const getTotalMonthlyJokeCount = async () => 100;
