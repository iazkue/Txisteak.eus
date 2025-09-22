import { Timestamp } from 'firebase/firestore';

export interface Joke {
  id: string; // Firestore document ID
  testua: string;
  boto_positiboak: number;
  boto_negatiboak: number;
  puntuazioa: number; 
  sortze_data: Timestamp | string; // Firestore Timestamp, or string for API transfer
  submitted_by_izena?: string;
  submitted_by_abizenak?: string;
  submitted_by_email?: string;
  submitted_by_pueblo?: string; // Added field for submitter's town
  pending_review: boolean; // True if awaiting admin approval
}

export interface Submitter {
  id: string; // Email will be used as ID
  izena: string;
  abizenak: string;
  email: string;
  txiste_kopurua: number;
  puntuazio_batazbestekoa: number; 
}

export interface SubmitJokePayload {
  testua: string;
  email: string;
  izena: string;
  abizenak: string;
  pueblo: string; // Added field for submitter's town
}

// VoteResponse and SubmitResponse can remain similar, or be simplified
// if API calls directly return data or throw errors.
export interface VoteResponse {
  success: boolean;
  message: string;
}

export interface SubmitResponse {
  success: boolean;
  message: string;
  id?: string; // Firestore ID
}

export type VoteType = 'gora' | 'behera';

export interface ApiError {
  error: string;
}