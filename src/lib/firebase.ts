import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, collection, onSnapshot, query, serverTimestamp, addDoc, deleteDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
      console.error("Firestore connection issue: ", error.message);
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);

export interface DayAvailability {
  status: 'available' | 'full' | 'partial-am' | 'partial-pm' | 'closed' | 'reading-workshop';
  updatedAt: any;
}

export const updateAvailability = async (date: string, status: DayAvailability['status']) => {
  const path = `availability/${date}`;
  try {
    const docRef = doc(db, 'availability', date);
    await setDoc(docRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const listenToAvailability = (callback: (data: Record<string, DayAvailability['status']>) => void) => {
  const path = 'availability';
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    const data: Record<string, DayAvailability['status']> = {};
    snapshot.forEach((doc) => {
      data[doc.id] = doc.data().status;
    });
    callback(data);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const addStudent = async (studentData: any) => {
  const path = 'students';
  try {
    const colRef = collection(db, path);
    return await addDoc(colRef, {
      ...studentData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateStudent = async (id: string, studentData: any) => {
  const path = `students/${id}`;
  try {
    const docRef = doc(db, 'students', id);
    await setDoc(docRef, studentData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteStudent = async (id: string) => {
  const path = `students/${id}`;
  try {
    const docRef = doc(db, 'students', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const listenToStudents = (callback: (students: any[]) => void) => {
  const path = 'students';
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(students);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const addSession = async (sessionData: any) => {
  const path = 'sessions';
  try {
    const colRef = collection(db, path);
    return await addDoc(colRef, {
      ...sessionData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const deleteSession = async (id: string) => {
  const path = `sessions/${id}`;
  try {
    const docRef = doc(db, 'sessions', id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const listenToSessions = (callback: (sessions: any[]) => void) => {
  const path = 'sessions';
  const q = query(collection(db, path));
  return onSnapshot(q, (snapshot) => {
    const sessions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(sessions);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};
