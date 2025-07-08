import {
    collection,
    doc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    getDoc,
    addDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove,
    QueryConstraint,
  } from '@react-native-firebase/firestore';
  import { firestore } from './config';
  
  /**
   * Generic type-safe wrapper for Firestore operations
   */
  export class FirestoreService<T extends any> {
    private collectionRef: any;
  
    constructor(private collectionName: string) {
      this.collectionRef = collection(firestore, collectionName);
    }
  
    /**
     * Get all documents from collection with optional constraints
     */
    async getAll(constraints: QueryConstraint[] = []): Promise<T[]> {
      const q = query(this.collectionRef, ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data() || {}
      } as T));
    }
  
    /**
     * Get a single document by ID
     */
    async getById(id: string): Promise<T | null> {
      const docRef = doc(firestore, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
  
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as T;
    }
  
    /**
     * Add a new document
     */
    async add(data: Omit<T, 'id'>): Promise<T> {
      const docData = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(this.collectionRef, docData);
      const newDoc = await getDoc(docRef);
      
      return {
        id: newDoc.id,
        ...newDoc.data()
      } as T;
    }
  
    /**
     * Update an existing document
     */
    async update(id: string, data: Partial<T>): Promise<void> {
      const docRef = doc(firestore, this.collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    }
  
    /**
     * Delete a document
     */
    async delete(id: string): Promise<void> {
      const docRef = doc(firestore, this.collectionName, id);
      await deleteDoc(docRef);
    }
  
    /**
     * Set a document (create or overwrite)
     */
    async set(id: string, data: Omit<T, 'id'>): Promise<void> {
      const docRef = doc(firestore, this.collectionName, id);
      await setDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    }
  }
  
  /**
   * Helper function to convert Firestore timestamps to ISO strings
   */
  export const timestampToISO = (timestamp: any): string => {
    if (timestamp?.toDate) {
      return timestamp.toDate().toISOString();
    }
    return new Date().toISOString();
  };
  
  /**
   * Re-export commonly used Firestore functions
   */
  export {
    collection,
    doc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove
  };