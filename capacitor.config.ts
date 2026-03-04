import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  getDoc,
  setDoc,
  writeBatch,
  Firestore,
  onSnapshot
} from "firebase/firestore";
import { db } from "../firebase";
import { Category, Item, Transaction, Summary } from "../types";

const CATEGORIES_COL = "categories";
const ITEMS_COL = "items";
const TRANSACTIONS_COL = "transactions";

const ensureDb = (db: Firestore | null) => {
  if (!db) throw new Error("Firebase is not initialized. Please check your configuration.");
  return db;
};

export const firebaseService = {
  subscribeToCategories(userId: string, callback: (categories: any[]) => void) {
    const firestore = ensureDb(db);
    const q = query(collection(firestore, CATEGORIES_COL), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const cats = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(cats);
    });
  },

  subscribeToItems(userId: string, callback: (items: any[]) => void) {
    const firestore = ensureDb(db);
    const q = query(collection(firestore, ITEMS_COL), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(items);
    });
  },

  subscribeToTransactions(userId: string, callback: (transactions: any[]) => void) {
    const firestore = ensureDb(db);
    const q = query(
      collection(firestore, TRANSACTIONS_COL), 
      where("userId", "==", userId),
      orderBy("date", "desc"), 
      orderBy("created_at", "desc")
    );
    return onSnapshot(q, (snapshot) => {
      const trans = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(trans);
    });
  },

  async addTransaction(userId: string, transaction: any) {
    const firestore = ensureDb(db);
    const docRef = await addDoc(collection(firestore, TRANSACTIONS_COL), {
      ...transaction,
      userId,
      created_at: new Date().toISOString()
    });
    return docRef.id;
  },

  async updateTransaction(id: string, transaction: any) {
    const firestore = ensureDb(db);
    const docRef = doc(firestore, TRANSACTIONS_COL, id);
    await updateDoc(docRef, transaction);
  },

  async deleteTransaction(id: string) {
    const firestore = ensureDb(db);
    const docRef = doc(firestore, TRANSACTIONS_COL, id);
    await deleteDoc(docRef);
  },

  async addCategory(userId: string, category: any) {
    const firestore = ensureDb(db);
    const docRef = await addDoc(collection(firestore, CATEGORIES_COL), { ...category, userId });
    return docRef.id;
  },

  async addItem(userId: string, item: any) {
    const firestore = ensureDb(db);
    const docRef = await addDoc(collection(firestore, ITEMS_COL), { ...item, userId });
    return docRef.id;
  },

  async deleteCategory(id: string) {
    const firestore = ensureDb(db);
    const docRef = doc(firestore, CATEGORIES_COL, id);
    await deleteDoc(docRef);
  },

  async deleteItem(id: string) {
    const firestore = ensureDb(db);
    const docRef = doc(firestore, ITEMS_COL, id);
    await deleteDoc(docRef);
  },

  async seedInitialData(userId: string, seedData: Record<string, string[]>) {
    const firestore = ensureDb(db);
    const batch = writeBatch(firestore);
    
    for (const [catName, items] of Object.entries(seedData)) {
      const catRef = doc(collection(firestore, CATEGORIES_COL));
      batch.set(catRef, { name: catName, type: 'expense', userId });
      
      for (const itemName of items) {
        const itemRef = doc(collection(firestore, ITEMS_COL));
        batch.set(itemRef, { category_id: catRef.id, name: itemName, userId });
      }
    }
    
    const salaryRef = doc(collection(firestore, CATEGORIES_COL));
    batch.set(salaryRef, { name: 'Salary', type: 'income', userId });
    
    await batch.commit();
  }
};
