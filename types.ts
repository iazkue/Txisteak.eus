
export interface Joke {
  id: number;
  testua: string;
  boto_positiboak: number;
  boto_negatiboak: number;
  puntuazioa?: number; // Calculated by backend for ranking
  sortze_data?: string; // ISO date string
  // Optional submitter info, if API provides it directly with joke
  submitted_by_izena?: string;
  submitted_by_abizenak?: string;
  submitted_by_email?: string;
}

export interface Submitter {
  id: string; // Could be email or a generated ID
  izena: string;
  abizenak: string;
  email: string;
  txiste_kopurua: number;
  puntuazio_batazbestekoa: number; // Average score of their jokes
}

export interface SubmitJokePayload {
  testua: string;
  email: string;
  izena: string;
  abizenak: string;
}

export interface VoteResponse {
  success: boolean;
  message: string;
}

export interface SubmitResponse {
  success: boolean;
  message: string;
  id?: number;
}

export type VoteType = 'gora' | 'behera';

export interface ApiError {
  error: string;
}
