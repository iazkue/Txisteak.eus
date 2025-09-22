
import { db } from '../firebaseConfig';
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  runTransaction,
  startAfter,
  getCountFromServer,
  QueryDocumentSnapshot,
  DocumentData,
  serverTimestamp,
} from 'firebase/firestore';
import { Joke, Submitter, SubmitJokePayload, VoteType, ApiError, VoteResponse, SubmitResponse } from '../types';

const JOKES_COLLECTION = 'txisteak';
const SUBMITTERS_COLLECTION = 'bidaltzaileak';

const UNAVAILABLE_ERROR_MESSAGE = 'Ezin da datu-basera konektatu. Egiaztatu internet konexioa eta Firebase konfigurazioa. (Firestore unavailable)';

const calculateScore = (positive: number, negative: number): number => {
  return (positive + 1) / (positive + negative + 2); // Wilson score interval lower bound approximation
};

const jokeFromDoc = (docSnapshot: QueryDocumentSnapshot<DocumentData>): Joke => {
  const data = docSnapshot.data();
  return {
    id: docSnapshot.id,
    testua: data.testua,
    boto_positiboak: data.boto_positiboak,
    // FIX: Corrected typo in property name from 'boto_negatioak' to 'boto_negatiboak'.
    boto_negatiboak: data.boto_negatiboak,
    puntuazioa: data.puntuazioa,
    sortze_data: data.sortze_data instanceof Timestamp ? data.sortze_data.toDate().toISOString() : (data.sortze_data ? String(data.sortze_data) : new Date().toISOString()), // Handle potential string or missing
    submitted_by_izena: data.submitted_by_izena,
    submitted_by_abizenak: data.submitted_by_abizenak,
    submitted_by_email: data.submitted_by_email,
    submitted_by_pueblo: data.submitted_by_pueblo, // Added pueblo
    pending_review: data.pending_review,
  };
};

export const fetchJoke = async (): Promise<Joke | ApiError> => {
  try {
    const q = query(
      collection(db, JOKES_COLLECTION),
      where('pending_review', '==', false),
      orderBy('puntuazioa', 'desc'),
      limit(20) 
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) {
      return { error: 'Ez dago txisterik eskuragarri une honetan.' };
    }
    const jokes = querySnapshot.docs.map(jokeFromDoc);
    const randomIndex = Math.floor(Math.random() * jokes.length);
    return jokes[randomIndex];
  } catch (error: any) {
    console.error("Error fetching joke:", error);
    if (error.code === 'unavailable') {
      return { error: UNAVAILABLE_ERROR_MESSAGE };
    }
    return { error: 'Errore bat gertatu da txistea kargatzean.' };
  }
};

export const voteJoke = async (jokeId: string, voteType: VoteType): Promise<VoteResponse | ApiError> => {
  const jokeRef = doc(db, JOKES_COLLECTION, jokeId);
  try {
    await runTransaction(db, async (transaction) => {
      // 1. READ PHASE: Perform all reads at the beginning.
      const jokeDoc = await transaction.get(jokeRef);

      if (!jokeDoc.exists()) {
        throw new Error('Txistea ez da aurkitu');
      }

      const jokeData = jokeDoc.data();
      if (jokeData.pending_review) {
        throw new Error('Ezin da berrikuspenaren zain dagoen txiste bat bozkatu.');
      }

      let submitterRef = null;
      let submitterDoc = null;
      if (jokeData.submitted_by_email) {
        submitterRef = doc(db, SUBMITTERS_COLLECTION, jokeData.submitted_by_email);
        submitterDoc = await transaction.get(submitterRef); // Read submitter doc now
      }

      // 2. CALCULATION PHASE
      const newPositiveVotes = jokeData.boto_positiboak + (voteType === 'gora' ? 1 : 0);
      const newNegativeVotes = jokeData.boto_negatiboak + (voteType === 'behera' ? 1 : 0);
      const newScore = calculateScore(newPositiveVotes, newNegativeVotes);
      
      let newAverageScore = null;
      if (submitterDoc && submitterDoc.exists()) {
        const submitterData = submitterDoc.data();
        // Efficiently calculate new average score without re-querying all jokes
        const oldTotalScore = (submitterData.puntuazio_batazbestekoa || 0) * (submitterData.txiste_kopurua || 0);
        const newTotalScore = oldTotalScore - jokeData.puntuazioa + newScore;
        if (submitterData.txiste_kopurua > 0) {
          newAverageScore = newTotalScore / submitterData.txiste_kopurua;
        } else {
          newAverageScore = 0;
        }
      }

      // 3. WRITE PHASE: Perform all writes at the end.
      transaction.update(jokeRef, {
        boto_positiboak: newPositiveVotes,
        boto_negatiboak: newNegativeVotes,
        puntuazioa: newScore,
      });

      if (submitterRef && newAverageScore !== null) {
        transaction.update(submitterRef, { puntuazio_batazbestekoa: newAverageScore });
      }
    });

    return { success: true, message: 'Botoa erregistratu da!' };
  } catch (error: any) {
    console.error("Error voting joke:", error);
    if (error.code === 'unavailable') {
      return { error: UNAVAILABLE_ERROR_MESSAGE };
    }
    if (error.code === 'permission-denied') {
        return { error: 'Baimenik ez. Egiaztatu Firestore-ko segurtasun arauak.'};
    }
    return { error: error.message || 'Errore bat gertatu da bozkatzean.' };
  }
};


export const submitJoke = async (payload: SubmitJokePayload): Promise<SubmitResponse | ApiError> => {
  try {
    if (!payload.testua || payload.testua.trim().length < 5) {
      return { error: 'Txistea hutsik dago edo laburregia da.' };
    }
    if (payload.testua.trim().length > 1000) {
        return { error: 'Txistea luzeegia da (gehienez 1000 karaktere).' };
    }
    if (!payload.izena || payload.izena.trim().length === 0) {
        return { error: 'Izena beharrezkoa da.'}
    }
    if (!payload.abizenak || payload.abizenak.trim().length === 0) {
        return { error: 'Abizenak beharrezkoak dira.'}
    }
    if (!payload.pueblo || payload.pueblo.trim().length === 0) {
        return { error: 'Herria beharrezkoa da.'}
    }
    if (!payload.email || payload.email.trim().length === 0) { 
        return { error: 'Posta elektronikoa beharrezkoa da.'}
    }

    const qCheck = query(
        collection(db, JOKES_COLLECTION), 
        where("testua", "==", payload.testua.trim()),
        where("pending_review", "==", false) 
    );
    const querySnapshotCheck = await getDocs(qCheck);
    if (!querySnapshotCheck.empty) {
        return { error: 'Txiste hori jada existitzen da (onartutakoen artean).' };
    }

    const newJokeInitialScore = calculateScore(0, 0);
    const newJokeData = {
      testua: payload.testua.trim(),
      boto_positiboak: 0,
      boto_negatiboak: 0,
      puntuazioa: newJokeInitialScore,
      sortze_data: serverTimestamp(),
      submitted_by_izena: payload.izena.trim(),
      submitted_by_abizenak: payload.abizenak.trim(),
      submitted_by_email: payload.email.trim(),
      submitted_by_pueblo: payload.pueblo.trim(),
      pending_review: true, 
    };

    const jokeDocRef = await addDoc(collection(db, JOKES_COLLECTION), newJokeData);

    const submitterRef = doc(db, SUBMITTERS_COLLECTION, payload.email.trim());
    await runTransaction(db, async (transaction) => {
        const submitterDoc = await transaction.get(submitterRef);
        if (!submitterDoc.exists()) {
            transaction.set(submitterRef, {
                izena: payload.izena.trim(),
                abizenak: payload.abizenak.trim(),
                email: payload.email.trim(),
                txiste_kopurua: 1,
                puntuazio_batazbestekoa: newJokeInitialScore,
            });
        } else {
            const currentData = submitterDoc.data();
            const oldTxisteKopurua = currentData.txiste_kopurua || 0;
            const oldPuntuazioBatazbestekoa = currentData.puntuazio_batazbestekoa || 0;
            const newTxisteKopurua = oldTxisteKopurua + 1;
            const submitterJokesQuery = query(
                collection(db, JOKES_COLLECTION),
                where('submitted_by_email', '==', payload.email.trim()),
                where('pending_review', '==', false) 
            );
            await getDocs(submitterJokesQuery); // Intentionally not using snapshot directly for calculation as logic is complex
            const newTotalScore = oldPuntuazioBatazbestekoa * oldTxisteKopurua + newJokeInitialScore;
            const newAverageScore = newTxisteKopurua > 0 ? newTotalScore / newTxisteKopurua : 0;

            transaction.update(submitterRef, {
                txiste_kopurua: newTxisteKopurua,
                puntuazio_batazbestekoa: newAverageScore
            });
        }
    });
    return { success: true, message: 'Txistea ondo bidali da! Berrikusi ondoren agertuko da.', id: jokeDocRef.id };
  } catch (error: any) {
    console.error("Error submitting joke:", error);
     if (error.code === 'unavailable') {
      return { error: UNAVAILABLE_ERROR_MESSAGE };
    }
    if (error instanceof Error && 'code' in error) { 
        const firebaseError = error as any; 
        console.error("Firebase error details:", JSON.stringify({
            code: firebaseError.code,
            message: firebaseError.message,
            name: firebaseError.name
        }, null, 2));
         if (firebaseError.code === 'permission-denied') {
            return { error: 'Baimenik ez txistea bidaltzeko. Egiaztatu Firestore-ko segurtasun arauak.'};
        }
    }
    return { error: 'Errore bat gertatu da txistea bidaltzean.' };
  }
};

const fetchRankedItems = async <T>(
    colName: string,
    orderByField: string,
    secondaryOrderByField: string | null,
    currentLimit: number,
    lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null,
    filters: { field: string, operator: any, value: any }[] = []
): Promise<{ items: T[], lastVisible: QueryDocumentSnapshot<DocumentData> | null }> => {
    // This internal function will let its errors bubble up to the calling public functions
    // So error handling (like for 'unavailable') will be done in fetchJokeRanking, etc.
    let q = query(collection(db, colName));

    filters.forEach(f => {
        q = query(q, where(f.field, f.operator, f.value));
    });

    q = query(q, orderBy(orderByField, 'desc'));
    if (secondaryOrderByField) {
      q = query(q, orderBy(secondaryOrderByField, 'desc'));
    }
    
    if (lastVisibleDoc) {
        q = query(q, startAfter(lastVisibleDoc));
    }
    q = query(q, limit(currentLimit));

    const documentSnapshots = await getDocs(q);
    const items = documentSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    const newLastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1] || null;
    
    return { items, lastVisible: newLastVisible };
};


export const fetchJokeRanking = async (
    currentLimit: number, 
    lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<{ jokes: Joke[], newLastVisible: QueryDocumentSnapshot<DocumentData> | null } | ApiError> => {
  try {
    const result = await fetchRankedItems<Joke>(
        JOKES_COLLECTION, 
        'puntuazioa', 
        'boto_positiboak', 
        currentLimit, 
        lastVisibleDoc,
        [{ field: 'pending_review', operator: '==', value: false }]
    );
    const jokesWithIsoDate = result.items.map(joke => ({
      ...joke,
      sortze_data: joke.sortze_data instanceof Timestamp 
                    ? joke.sortze_data.toDate().toISOString() 
                    : String(joke.sortze_data || new Date().toISOString()), 
    }));

    return { jokes: jokesWithIsoDate, newLastVisible: result.lastVisible };
  } catch (error: any) {
    console.error("Error fetching joke ranking:", error);
    if (error.code === 'unavailable') {
      return { error: UNAVAILABLE_ERROR_MESSAGE };
    }
    return { error: 'Errore bat gertatu da txisteen ranking-a kargatzean.' };
  }
};


export const fetchSubmitterRanking = async (
    currentLimit: number, 
    lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<{ submitters: Submitter[], newLastVisible: QueryDocumentSnapshot<DocumentData> | null } | ApiError> => {
  try {
    const result = await fetchRankedItems<Submitter>(
        SUBMITTERS_COLLECTION, 
        'puntuazio_batazbestekoa', 
        'txiste_kopurua', 
        currentLimit, 
        lastVisibleDoc
    );
    return { submitters: result.items, newLastVisible: result.lastVisible };
  } catch (error: any) {
    console.error("Error fetching submitter ranking:", error);
    if (error.code === 'unavailable') {
      return { error: UNAVAILABLE_ERROR_MESSAGE };
    }
    return { error: 'Errore bat gertatu da bidaltzaileen ranking-a kargatzean.' };
  }
};

export const fetchMonthlyBestJokes = async (
    currentLimit: number, 
    lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null
): Promise<{ jokes: Joke[], newLastVisible: QueryDocumentSnapshot<DocumentData> | null } | ApiError> => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const result = await fetchRankedItems<Joke>(
        JOKES_COLLECTION,
        'puntuazioa',
        'boto_positiboak',
        currentLimit,
        lastVisibleDoc,
        [
            { field: 'pending_review', operator: '==', value: false },
            { field: 'sortze_data', operator: '>=', value: Timestamp.fromDate(startOfMonth) },
            { field: 'sortze_data', operator: '<=', value: Timestamp.fromDate(endOfMonth) }
        ]
    );
     const jokesWithIsoDate = result.items.map(joke => ({
      ...joke,
      sortze_data: joke.sortze_data instanceof Timestamp 
                    ? joke.sortze_data.toDate().toISOString() 
                    : String(joke.sortze_data || new Date().toISOString()),
    }));
    return { jokes: jokesWithIsoDate, newLastVisible: result.lastVisible };
  } catch (error: any) {
    console.error("Error fetching monthly best jokes:", error);
    if (error.code === 'unavailable') {
      return { error: UNAVAILABLE_ERROR_MESSAGE };
    }
    return { error: 'Errore bat gertatu da hilabeteko txiste onenak kargatzean.' };
  }
};

// For count functions, if Firestore is unavailable, getCountFromServer will throw.
// We'll catch it and return 0 or handle as an error propagation if a more specific count error is needed.
// For simplicity here, returning 0, but in a real app, you might want to propagate the error.
const getCountOrZeroOnError = async (q: any): Promise<number> => {
    try {
        const snapshot = await getCountFromServer(q);
        return snapshot.data().count;
    } catch (error: any) {
        console.error("Error getting count:", error);
        if (error.code === 'unavailable') {
            // Optionally, you could throw a specific error or notify the UI
            console.warn("Could not get count from Firestore due to unavailability. Returning 0.");
        }
        return 0; // Or handle error differently
    }
};


export const getTotalApprovedJokeCount = async (): Promise<number> => {
    const q = query(collection(db, JOKES_COLLECTION), where('pending_review', '==', false));
    return getCountOrZeroOnError(q);
};

export const getTotalSubmitterCount = async (): Promise<number> => {
    const q = query(collection(db, SUBMITTERS_COLLECTION));
    return getCountOrZeroOnError(q);
};

export const getTotalMonthlyJokeCount = async (): Promise<number> => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const q = query(collection(db, JOKES_COLLECTION), 
        where('pending_review', '==', false),
        where('sortze_data', '>=', Timestamp.fromDate(startOfMonth)),
        where('sortze_data', '<=', Timestamp.fromDate(endOfMonth))
    );
    return getCountOrZeroOnError(q);
};