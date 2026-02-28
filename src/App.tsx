import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Calendar,
  User,
  Tag,
  ShoppingBag,
  FileText,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  Edit2,
  Trash2,
  ChevronLeft,
  Download,
  BarChart3,
  Filter,
  Settings,
  Database
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Item, Transaction, Summary } from './types';
import { firebaseService } from './services/firebaseService';
import { googleDriveService } from './services/googleDriveService';
import { isFirebaseConfigured, auth as firebaseAuth, googleProvider } from './firebase';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser, GoogleAuthProvider } from 'firebase/auth';

type View = 'dashboard' | 'add' | 'history' | 'insights' | 'manage';

const SEED_DATA: Record<string, string[]> = {
  "Groceries": ["Dals", "Flours", "Rice", "Oils", "Masalas", "Powders", "Cereals", "Pickles", "Papads", "Dry Fruits", "Sugar", "Jaggery", "Nuts", "Salt", "Millets", "Others"],
  "Dairy": ["Milk", "Curd", "Paneer", "Cheese", "Butter", "Ice Cream", "Ghee", "Milk Powder", "Butter Milk", "Others"],
  "Bath": ["Soap", "Shampoo", "Shower Gel", "Face Wash", "Hair Conditioner", "Body Scrubs", "Others"],
  "Vegetables": ["Veggies", "Onions", "Garlic", "Ginger", "Lemons", "Tomato", "Chilli", "Others"],
  "Electricity_Bill": ["Home@HYD", "Home@NNB", "Others"],
  "Internet_Bill": ["Home@HYD", "Others"],
  "Phone_Bills": ["My Self", "Wife", "Home@Pavitra", "TV EMI", "Tredmill EMI", "Others"],
  "Gas_Bill": ["Home@HYD", "Home@NNB", "Indus Ind (Pavitra)", "Mother", "Brother", "Sister", "Mother in law", "Others"],
  "Loan_Repayments": ["Indus Ind (PK)", "Yes Bank (Pavitra)", "Indus Ind", "HDFC", "RBL", "Others"],
  "Creditcard_Payments": ["Amazon ICICI", "TATA SBI", "Indus Ind", "HDFC", "RBL", "One Card", "Airtel Axis", "Flipkart Axis"],
  "Savings": ["General Savings"],
  "Toilet_Floor_Maintenance": ["Floor Cleaner", "Harpic", "Mop Sticks & Sets", "Mop Buckets", "Floor Mats", "Acids", "Toilet Brush", "Others"],
  "Trash_Management": ["Trash Vehicle", "Garbage Bags", "Brooms", "Dust Pan (Cheta)", "Dust Bin", "Others"],
  "Fruits": ["Apples", "Pomogranate", "Oranges", "Custard Apple (SithaPhal)", "Kiwi", "Papaya", "Jack Fruit", "Musk Melon", "Water Melon", "Strawberry", "Apricot", "Guava", "Dates", "Mango", "Avacado", "Cherry", "Peach", "Others"],
  "Beverages": ["Soft Drinks", "Tea", "Coffe", "Green Tea", "Juice", "Badam milk", "Others"],
  "Snacks": ["Chips", "Cookies", "Biscuits", "Savoury", "Chocolates", "Puffs", "Samosa", "Bajjis", "Panipuri", "Chat", "Pop Corn", "Rusk", "Others"],
  "Condiments_Sauces": ["Honey", "Tomato Ketchup", "Mayonnaise", "Choclate Syrup", "Condensed Milk", "Jams", "Others"],
  "Meat_Eggs": ["Eggs", "Chicken", "Fish", "Mutton", "Prawn", "Crabs", "Others"],
  "Body_Care": ["Body Lotions", "Hair Oil", "Hair Serum", "Tooth Paste", "Earbuds", "Lip Balm", "Perfume", "Scent", "Nails", "Hangers", "Others"],
  "Personal_Care": ["Shaving Gel", "Shaving Kit", "Razor", "Blades", "Cutting", "Sanitary Pads", "Hotel Charge", "Courier", "Petrol", "Car Charges", "Others"],
  "Transportation_Travel": ["Bike Charges", "Auto Charge", "Bus Charges", "Train Tickes", "Bus Tickets", "Metro Charges", "Flight Tickets", "Others"],
  "Washing_Care": ["Washing Liquid", "Fragrence Liqud", "Descaling Powder", "Surf powder", "Others"],
  "Entertainment": ["Cinema", "Amusement", "Trip", "Others"],
  "Bed": ["Bed", "Cot", "Bed Sheets", "Pillows", "Pillow Covers", "Navvar", "Vacuum Cleaner", "Oven Toaster Grill", "Microwave Oven", "Clocks"],
  "Appliances": ["TV", "Fridge", "Washing Machine", "AC", "Water Purifier", "Air Fryer", "Oven", "Microwave Oven"],
  "Security": ["Lockers", "Locks", "Keys", "Others"],
  "Home_Decor": ["Door Curtains", "Window Curtains", "Wall Stickers", "Floor Stickers", "Ceiling Stickers", "Flower pots", "Flower Pot Racks", "Decoration Items", "Mirrors", "Scented candles", "Candle Holders", "Tempered Glass", "Photot Frames"],
  "Electrical_Items": ["Lights", "Bulbs", "Cables", "Plugs", "Holders", "Serial Lights", "Decoration Lamps", "Cutting Plier", "Screw Driver", "Hammer", "Spanners", "Others"],
  "Electronis": ["Mobiles", "Earpods", "Earphones", "Data Cables", "HDMI Cables", "OTG Cable", "Pendrives", "Card Readers", "HDD", "SSD", "Laptop", "Desktop", "PC Cabin", "Mouse", "Others"],
  "Kitchen_Utensils": ["NS Kadai", "NS Pan", "Kadai", "Pan", "Spoons", "Laddles", "Chopping Board", "Knife", "Spatula (AtlaKada)", "Dosa Pan", "Dinner Set", "Plates", "Bowls", "Cups", "Glass Cups", "Egg Beater", "Tongs", "Slicer", "Cheese Grater", "Silicon Brush", "Others"],
  "Kitchen_Maintenance": ["Kitchen Towels", "Dishwash Bar", "Dishwash Liquid", "Scrunnbbers", "Cleaning Brush", "Drain Blockage Powder", "Synk Pipe", "Gas Stove Repair", "Others"],
  "Clothing_Footware": ["Prasanth", "Pavitra", "Satish", "Sharmila", "Father", "Mother", "Motherinlaw", "Fatherinlaw", "Shoes", "Chappals", "Socks", "Shoe Rack", "Laces", "Sticin Charges", "Others"],
  "House_Maintenance": ["Paints", "Painting Charges", "Drainage Work Charges", "Civil Work Charges", "Civil Work Material", "Alterations", "House Rent", "Others"],
  "Beauty_Care": ["Lipstick", "Eyeliner", "Stickers", "Kajal", "Powders", "Face cream", "Nails", "Parlor visit", "Others"],
  "Pooja_Needs": ["Deepam Oil", "Karpooram", "Agarbatti", "Prasadam Chips", "Dhoop Sticks", "Harathi Pallem", "Ganta", "Kalasam", "Deepam Kundulu", "Pasupu", "Chandanam", "Sindhooram", "Vatthulu", "Mandiram", "Tulasi Plant", "Idols", "Coconut", "Flowers", "Others"],
  "Food": ["Tiffins", "Curries", "Restaurant", "Fried Rice", "Noodles", "Shawarma", "Balms", "Sweets", "Others"],
  "Health": ["Tablets", "Syrups", "Injections", "Scanings", "Tests", "Ointments", "Oral Suppliments", "Kits", "Inhaler", "Ultra Sound Test", "Eye Glasses", "Drops", "Consultation", "X-ray", "Earbuds"],
  "Others": ["Carry Bags", "Tips", "Cakes", "Decoration", "Balloons", "Private Theatre", "Eeswar Send off", "Iron", "Books"],
  "Celebrations": ["Wedding Anniversary", "Birthday", "Function Hall", "Others"]
};

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [dashboardMonth, setDashboardMonth] = useState(new Date().toISOString().slice(0, 7));
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary>({
    total_income: 0,
    total_expense: 0,
    balance: 0,
    categoryBreakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  
  // Insights Filters
  const [insightPeriod, setInsightPeriod] = useState<'month' | '7d' | '30d' | 'ytd' | 'all'>('month');
  const [insightMonth, setInsightMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [insightCategory, setInsightCategory] = useState<string>('all');

  // Form State
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchasedBy, setPurchasedBy] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [isNewCategory, setIsNewCategory] = useState(false);
  const [isNewItem, setIsNewItem] = useState(false);

  // Manage State
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCatId, setNewItemCatId] = useState<number | ''>('');

  // Delete Modals State
  const [isDeleteCatModalOpen, setIsDeleteCatModalOpen] = useState(false);
  const [isDeleteItemModalOpen, setIsDeleteItemModalOpen] = useState(false);
  const [deleteCatId, setDeleteCatId] = useState<number | ''>('');
  const [deleteItemCatId, setDeleteItemCatId] = useState<number | ''>('');
  const [deleteItemId, setDeleteItemId] = useState<number | ''>('');
  const [isViewAllModalOpen, setIsViewAllModalOpen] = useState(false);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [driveFileId, setDriveFileId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load data from Google Drive
  const syncFromDrive = async (token: string) => {
    try {
      setIsSyncing(true);
      const file = await googleDriveService.findFile(token);
      if (file) {
        setDriveFileId(file.id);
        const content = await googleDriveService.getFileContent(token, file.id);
        if (content) {
          if (content.categories) setCategories(content.categories);
          if (content.items) setItems(content.items);
          if (content.transactions) setTransactions(content.transactions);
          console.log('Data synced from Google Drive');
        }
      } else {
        console.log('No backup found on Google Drive, using local/seed data');
        // Initial seed if first time
        if (categories.length === 0) {
          const cats: Category[] = [];
          const itemsList: Item[] = [];
          let catId = 1;
          let itemId = 1;
          for (const [catName, items] of Object.entries(SEED_DATA)) {
            cats.push({ id: catId, name: catName, type: 'expense' });
            for (const itemName of items) {
              itemsList.push({ id: itemId++, category_id: catId, name: itemName });
            }
            catId++;
          }
          cats.push({ id: catId++, name: 'Salary', type: 'income' });
          setCategories(cats);
          setItems(itemsList);
        }
      }
    } catch (error) {
      console.error('Drive sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Save data to Google Drive
  const syncToDrive = async () => {
    if (!googleAccessToken || !user) return;
    try {
      setIsSyncing(true);
      const content = {
        categories,
        items,
        transactions,
        lastUpdated: new Date().toISOString()
      };
      const result = await googleDriveService.saveFile(googleAccessToken, content, driveFileId || undefined);
      if (result.id && !driveFileId) setDriveFileId(result.id);
      console.log('Data backed up to Google Drive');
    } catch (error) {
      console.error('Drive backup error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Trigger backup on data change
  useEffect(() => {
    if (user && googleAccessToken && (categories.length > 0 || transactions.length > 0)) {
      const timer = setTimeout(() => {
        syncToDrive();
      }, 2000); // Debounce backup
      return () => clearTimeout(timer);
    }
  }, [categories, items, transactions, user, googleAccessToken]);

  useEffect(() => {
    if (isFirebaseConfigured && firebaseAuth) {
      const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
        setUser(currentUser);
        setAuthLoading(false);
        // Note: Access token is only available during sign-in result
      });
      return () => unsubscribe();
    } else {
      setAuthLoading(false);
    }
  }, []);

  const handleGoogleLogin = async () => {
    if (!firebaseAuth) return;
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;
      if (token) {
        setGoogleAccessToken(token);
        await syncFromDrive(token);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Failed to sign in with Google');
    }
  };

  const handleLogout = async () => {
    if (!firebaseAuth) return;
    try {
      await signOut(firebaseAuth);
      setView('dashboard');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const [isFirebaseMode] = useState(() => {
    return isFirebaseConfigured;
  });

  const [isStaticMode, setIsStaticMode] = useState(() => {
    if (isFirebaseConfigured) return false;
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname;
    return (
      hostname.includes('netlify.app') || 
      hostname.includes('vercel.app') ||
      hostname.includes('github.io') ||
      hostname === '' || 
      window.location.protocol === 'file:'
    );
  });

  const getLocal = (key: string) => {
    try {
      const data = localStorage.getItem(`tracker_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('LocalStorage access error:', e);
      return null;
    }
  };

  const setLocal = (key: string, data: any) => {
    try {
      localStorage.setItem(`tracker_${key}`, JSON.stringify(data));
    } catch (e) {
      console.error('LocalStorage write error:', e);
    }
  };

  const fetchData = async (selectedMonth?: string, retryCount = 0) => {
    const targetMonth = selectedMonth || dashboardMonth;

    if (isFirebaseMode) {
      // In Firebase mode, data is handled by real-time listeners in useEffect
      return;
    }

    const runStatic = () => {
      try {
        console.log('Running in Static Mode (LocalStorage)');
        let cats = getLocal('categories');
        let itemsList = getLocal('items');
        let trans = getLocal('transactions') || [];
        
        if (!cats || cats.length === 0) {
          // Initial seed if empty
          cats = [];
          itemsList = [];
          let catId = 1;
          let itemId = 1;
          for (const [catName, items] of Object.entries(SEED_DATA)) {
            cats.push({ id: catId, name: catName, type: 'expense' });
            for (const itemName of items) {
              itemsList.push({ id: itemId++, category_id: catId, name: itemName });
            }
            catId++;
          }
          // Add one income category
          cats.push({ id: catId++, name: 'Salary', type: 'income' });
          
          setLocal('categories', cats);
          setLocal('items', itemsList);
        }
        
        setCategories(cats);
        setItems(itemsList);
        setTransactions(trans);
        
        const monthlyTrans = trans.filter((t: any) => t.date.startsWith(targetMonth));

        const income = monthlyTrans.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
        const expenses = monthlyTrans.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
        
        // Calculate category breakdown for static mode (monthly - expenses only)
        const breakdownMap: Record<string, { name: string, total: number, type: string }> = {};
        monthlyTrans.filter((t: any) => t.type === 'expense').forEach((t: any) => {
          if (!breakdownMap[t.category_name]) {
            breakdownMap[t.category_name] = { name: t.category_name, total: 0, type: t.type };
          }
          breakdownMap[t.category_name].total += t.amount;
        });
        const categoryBreakdown = Object.values(breakdownMap).sort((a, b) => b.total - a.total);

        setSummary({ 
          total_income: income, 
          total_expense: expenses, 
          balance: income - expenses, // Reset balance monthly for a fresh start
          categoryBreakdown 
        });
      } catch (err) {
        console.error('Critical error in runStatic:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isStaticMode) {
      runStatic();
      return;
    }

    // Add a timeout to the fetch requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); 

    try {
      const [catRes, transRes, sumRes] = await Promise.all([
        fetch('/api/categories', { signal: controller.signal }).catch(err => ({ ok: false, error: err })),
        fetch('/api/transactions', { signal: controller.signal }).catch(err => ({ ok: false, error: err })),
        fetch(`/api/summary?month=${targetMonth}`, { signal: controller.signal }).catch(err => ({ ok: false, error: err }))
      ]);
      
      clearTimeout(timeoutId);

      if (!catRes.ok || !transRes.ok || !sumRes.ok) {
        if (retryCount < 2) {
          console.log(`API fetch failed, retrying (${retryCount + 1}/2)...`);
          setTimeout(() => fetchData(selectedMonth, retryCount + 1), 2000);
          return;
        }
        throw new Error('API failed or unreachable after retries');
      }

      const catData = await (catRes as Response).json();
      setCategories(catData.categories);
      setItems(catData.items);
      setTransactions(await (transRes as Response).json());
      setSummary(await (sumRes as Response).json());
    } catch (error) {
      console.error('Error fetching data, falling back to static mode:', error);
      setIsStaticMode(true);
      runStatic();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFirebaseMode && user) {
      // In Drive mode, we don't use Firebase real-time listeners
      setLoading(false);
    } else if (!isFirebaseMode) {
      fetchData(dashboardMonth);
    } else {
      setLoading(false);
    }
  }, [isFirebaseMode, user, dashboardMonth]);

  // Summary calculation for All Modes
  useEffect(() => {
    if (transactions.length > 0) {
      const monthlyTrans = transactions.filter((t: any) => t.date.startsWith(dashboardMonth));
      const income = monthlyTrans.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
      const expenses = monthlyTrans.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);

      const breakdownMap: Record<string, { name: string, total: number, type: string }> = {};
      monthlyTrans.filter((t: any) => t.type === 'expense').forEach((t: any) => {
        if (!breakdownMap[t.category_name]) {
          breakdownMap[t.category_name] = { name: t.category_name, total: 0, type: t.type };
        }
        breakdownMap[t.category_name].total += t.amount;
      });
      const categoryBreakdown = Object.values(breakdownMap).sort((a, b) => b.total - a.total);

      setSummary({
        total_income: income,
        total_expense: expenses,
        balance: income - expenses,
        categoryBreakdown
      });
    }
  }, [transactions, dashboardMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      type,
      amount: parseFloat(amount),
      date,
      purchased_by: purchasedBy,
      category_name: categoryName,
      item_name: itemName,
      description
    };

    if (isFirebaseMode && user) {
      // In Drive mode, we update local state and let the useEffect handle the backup
      if (editingId) {
        setTransactions(prev => prev.map(t => t.id === editingId ? { ...t, ...payload } : t));
      } else {
        setTransactions(prev => [{ ...payload, id: Date.now(), created_at: new Date().toISOString() }, ...prev]);
      }
      setView('dashboard');
      resetForm();
      return;
    }

    if (isStaticMode) {
      const trans = getLocal('transactions') || [];
      if (editingId) {
        const index = trans.findIndex((t: any) => t.id === editingId);
        if (index !== -1) trans[index] = { ...trans[index], ...payload };
      } else {
        trans.unshift({ ...payload, id: Date.now(), created_at: new Date().toISOString() });
      }
      setLocal('transactions', trans);
      await fetchData();
      setView('dashboard');
      resetForm();
      return;
    }

    try {
      const url = editingId ? `/api/transactions/${editingId}` : '/api/transactions';
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        await fetchData();
        setView('dashboard');
        resetForm();
      }
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    setType(t.type);
    setAmount(t.amount.toString());
    setDate(t.date);
    setPurchasedBy(t.purchased_by || '');
    setCategoryName(t.category_name);
    setItemName(t.item_name);
    setDescription(t.description || '');
    setIsNewCategory(false);
    setIsNewItem(false);
    setView('add');
  };

  const handleDelete = (id: number, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('DEBUG: Opening delete confirmation for ID:', id);
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    
    const id = deleteConfirmId;
    
    if (isFirebaseMode && user) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      setDeleteConfirmId(null);
      return;
    }

    if (isStaticMode) {
      const trans = getLocal('transactions') || [];
      setLocal('transactions', trans.filter((t: any) => t.id !== id));
      setDeleteConfirmId(null);
      await fetchData();
      return;
    }

    try {
      const res = await fetch(`/api/transactions/${id}`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (res.ok) {
        setDeleteConfirmId(null);
        await fetchData();
      } else {
        alert('Failed to delete transaction');
        setDeleteConfirmId(null);
      }
    } catch (error) {
      console.error('DEBUG: Network error during delete:', error);
      alert('Network error during delete');
      setDeleteConfirmId(null);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;

    if (isFirebaseMode && user) {
      const newId = Date.now();
      setCategories(prev => [...prev, { id: newId, name: newCatName, type: newCatType }]);
      setNewCatName('');
      setNewItemCatId(newId);
      alert('Category added! Now you can register items for this category below.');
      return;
    }

    if (isStaticMode) {
      const cats = getLocal('categories') || [];
      const newId = Date.now();
      cats.push({ id: newId, name: newCatName, type: newCatType });
      setLocal('categories', cats);
      await fetchData();
      setNewCatName('');
      setNewItemCatId(newId);
      alert('Category added! Now you can register items for this category below.');
      return;
    }

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName, type: newCatType })
      });
      if (res.ok) {
        await fetchData();
        setNewCatName('');
        const data = await res.json();
        if (data.id) setNewItemCatId(data.id);
        alert('Category added! Now you can register items for this category below.');
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName || !newItemCatId) return;

    if (isFirebaseMode && user) {
      const newId = Date.now();
      setItems(prev => [...prev, { id: newId, category_id: newItemCatId, name: newItemName }]);
      setNewItemName('');
      if (confirm('Item registered! Would you like to go to the Add Transaction screen now?')) {
        setView('add');
        const cat = categories.find(c => c.id === newItemCatId);
        if (cat) {
          setCategoryName(cat.name);
          setType(cat.type);
          setItemName(newItemName);
        }
      }
      return;
    }

    if (isStaticMode) {
      const itemsList = getLocal('items') || [];
      itemsList.push({ id: Date.now(), category_id: newItemCatId, name: newItemName });
      setLocal('items', itemsList);
      await fetchData();
      setNewItemName('');
      if (confirm('Item registered! Would you like to go to the Add Transaction screen now?')) {
        setView('add');
        const cat = categories.find(c => c.id === newItemCatId);
        if (cat) {
          setCategoryName(cat.name);
          setType(cat.type);
          setItemName(newItemName);
        }
      }
      return;
    }

    try {
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: newItemCatId, name: newItemName })
      });
      if (res.ok) {
        await fetchData();
        setNewItemName('');
        if (confirm('Item registered! Would you like to go to the Add Transaction screen now?')) {
          setView('add');
          const cat = categories.find(c => c.id === newItemCatId);
          if (cat) {
            setCategoryName(cat.name);
            setType(cat.type);
            setItemName(newItemName);
          }
        }
      }
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (isFirebaseMode && user) {
      setCategories(prev => prev.filter(c => c.id !== id));
      setItems(prev => prev.filter(i => i.category_id !== id));
      alert('Category deleted successfully');
      return;
    }

    if (isStaticMode) {
      const cats = getLocal('categories') || [];
      const trans = getLocal('transactions') || [];
      const hasTrans = trans.some((t: any) => t.category_id === id);
      if (hasTrans) {
        alert('Cannot delete category linked to transactions');
        return;
      }
      setLocal('categories', cats.filter((c: any) => c.id !== id));
      setLocal('items', (getLocal('items') || []).filter((i: any) => i.category_id !== id));
      await fetchData();
      alert('Category deleted successfully');
      return;
    }

    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
        alert('Category deleted successfully');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete category');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Network error while deleting category');
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (isFirebaseMode && user) {
      setItems(prev => prev.filter(i => i.id !== id));
      alert('Item deleted successfully');
      return;
    }

    if (isStaticMode) {
      const itemsList = getLocal('items') || [];
      setLocal('items', itemsList.filter((i: any) => i.id !== id));
      await fetchData();
      alert('Item deleted successfully');
      return;
    }

    try {
      const res = await fetch(`/api/items/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
        alert('Item deleted successfully');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Network error while deleting item');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setAmount('');
    setPurchasedBy('');
    setCategoryName('');
    setItemName('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setIsNewCategory(false);
    setIsNewItem(false);
  };

  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setDate(today);
    setIsCalendarOpen(false);
  };

  const handleDateSelect = (selectedDate: Date) => {
    setDate(selectedDate.toISOString().split('T')[0]);
    setIsCalendarOpen(false);
  };

  const changeMonth = (offset: number) => {
    const newMonth = new Date(calendarMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setCalendarMonth(newMonth);
  };

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding for start of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [calendarMonth]);

  const exportToCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export');
      return;
    }

    const headers = ['Date', 'Type', 'Category', 'Item', 'Amount', 'Purchased By', 'Description'];
    const rows = transactions.map(t => [
      t.date,
      t.type,
      t.category_name,
      t.item_name,
      t.amount.toString(),
      t.purchased_by || '',
      t.description || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expense_tracker_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredCategories = useMemo(() => 
    categories
      .filter(c => c.type === type)
      .sort((a, b) => a.name.localeCompare(b.name)), 
  [categories, type]);

  const sortedCategories = useMemo(() => 
    [...categories].sort((a, b) => a.name.localeCompare(b.name)),
  [categories]);

  const insightData = useMemo(() => {
    // Filter transactions for insights
    let filtered = transactions.filter(t => t.type === 'expense');
    
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    if (insightPeriod === 'month') {
      if (insightMonth !== 'all') {
        filtered = filtered.filter(t => t.date.startsWith(insightMonth));
      }
    } else if (insightPeriod === '7d') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
      filtered = filtered.filter(t => t.date >= sevenDaysAgoStr && t.date <= todayStr);
    } else if (insightPeriod === '30d') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      filtered = filtered.filter(t => t.date >= thirtyDaysAgoStr && t.date <= todayStr);
    } else if (insightPeriod === 'ytd') {
      const startOfYear = `${now.getFullYear()}-01-01`;
      filtered = filtered.filter(t => t.date >= startOfYear && t.date <= todayStr);
    }
    
    if (insightCategory !== 'all') {
      filtered = filtered.filter(t => t.category_name === insightCategory);
    }

    // Group by date
    const grouped: Record<string, number> = {};
    filtered.forEach(t => {
      grouped[t.date] = (grouped[t.date] || 0) + t.amount;
    });

    // Sort by date and format for Recharts
    return Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        amount
      }));
  }, [transactions, insightPeriod, insightMonth, insightCategory]);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach(t => months.add(t.date.slice(0, 7)));
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const filteredItems = useMemo(() => {
    const cat = categories.find(c => c.name === categoryName && c.type === type);
    if (!cat) return [];
    return items
      .filter(i => i.category_id === cat.id)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, categories, categoryName, type]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto h-[100dvh] bg-slate-50 flex flex-col shadow-2xl relative overflow-hidden font-sans">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-xl px-4 py-2 rounded-b-2xl shadow-sm border-b border-white/50 relative overflow-hidden">
        {/* Subtle decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-rose-50/50 rounded-full -ml-12 -mb-12 blur-2xl" />
        
        <div className="flex justify-between items-center mb-1 relative z-10">
          <div>
            <h1 className="text-xs font-black uppercase tracking-widest text-slate-800">
              {view === 'dashboard' ? 'Expense Tracker' : 
               view === 'add' ? 'Add Transaction' :
               view === 'insights' ? 'Financial Insights' : 
               view === 'manage' ? 'Manage Data' : 'Transaction History'}
            </h1>
          </div>
          {user && (
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 p-1 pl-2 bg-slate-100 rounded-full border border-slate-200 hover:bg-slate-200 transition-colors"
            >
              <span className="text-[9px] font-bold text-slate-600 truncate max-w-[80px]">{user.displayName || user.email}</span>
              {user.photoURL ? (
                <img src={user.photoURL} alt="profile" className="w-5 h-5 rounded-full border border-white" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] text-white font-bold">
                  {user.email?.[0].toUpperCase()}
                </div>
              )}
            </button>
          )}
        </div>

        {view === 'dashboard' && (
          <div className="space-y-3 relative z-10">
            <div className="bg-white/80 p-3 rounded-2xl border border-white shadow-sm">
              <div className="flex justify-between items-center mb-0.5">
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Available Balance</p>
                <div className="relative">
                  <select 
                    value={dashboardMonth}
                    onChange={(e) => setDashboardMonth(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  >
                    {availableMonths.map(m => (
                      <option key={m} value={m}>
                        {new Date(m + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </option>
                    ))}
                    {!availableMonths.includes(new Date().toISOString().slice(0, 7)) && (
                      <option value={new Date().toISOString().slice(0, 7)}>
                        {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </option>
                    )}
                  </select>
                  <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest flex items-center gap-1 border border-indigo-100">
                    {new Date(dashboardMonth + '-01').toLocaleDateString(undefined, { month: 'long' })}
                    <ChevronDown size={10} />
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className={`text-xl font-medium ${(summary?.balance || 0) >= 0 ? 'text-emerald-600/50' : 'text-rose-600/50'}`}>₹</span>
                <h2 className={`text-3xl font-black tracking-tight ${(summary?.balance || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {(summary?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </h2>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => { setType('income'); setView('add'); }}
                className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/50 backdrop-blur-sm text-left relative active:scale-95 transition-transform"
              >
                <Plus size={12} className="absolute top-3 right-3 text-emerald-600/50" />
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <TrendingUp size={12} />
                  <span className="text-[9px] font-black uppercase tracking-wider">Income</span>
                </div>
                <p className="font-black text-lg text-slate-800">₹{(summary?.total_income || 0).toLocaleString('en-IN')}</p>
              </button>
              <button 
                onClick={() => { setType('expense'); setView('add'); }}
                className="bg-rose-50/50 p-3 rounded-2xl border border-rose-100/50 backdrop-blur-sm text-left relative active:scale-95 transition-transform"
              >
                <Plus size={12} className="absolute top-3 right-3 text-rose-600/50" />
                <div className="flex items-center gap-2 text-rose-600 mb-1">
                  <TrendingDown size={12} />
                  <span className="text-[9px] font-black uppercase tracking-wider">Expense</span>
                </div>
                <p className="font-black text-lg text-slate-800">₹{(summary?.total_expense || 0).toLocaleString('en-IN')}</p>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24 max-w-2xl mx-auto w-full custom-scrollbar">
        {isFirebaseMode && !user && !authLoading && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-3xl border border-slate-100 shadow-xl text-center space-y-6"
          >
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
              <User size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
              <p className="text-sm text-slate-500">Sign in with your Google account to sync your data across all devices securely.</p>
            </div>
            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 p-4 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all shadow-sm"
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="google" className="w-5 h-5" />
              Sign in with Google
            </button>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Secure Cloud Storage via Firebase</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {(!isFirebaseMode || user) && view === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-slate-900 font-black text-lg flex items-center gap-2">
                    <History size={20} className="text-indigo-600" />
                    Recent Activity
                  </h3>
                  <button onClick={() => setView('history')} className="text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline">
                    View All
                  </button>
                </div>
                <div className="space-y-1.5">
                  {transactions
                    .filter(t => t.date.startsWith(dashboardMonth))
                    .slice(0, 5)
                    .map((t, idx) => (
                    <motion.div 
                      key={t.id} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {t.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 leading-tight text-xs">{t.item_name}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{t.category_name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-black text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                        </p>
                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                          {new Date(t.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <Wallet size={48} className="mx-auto mb-2 opacity-20" />
                      <p>No transactions yet</p>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-slate-800 font-black text-sm uppercase tracking-wider">Spending Analysis</h3>
                  <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-indigo-100">
                    {new Date(dashboardMonth + '-01').toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {summary?.categoryBreakdown
                    .map((cat, idx) => (
                    <motion.div 
                      key={cat.name} 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + idx * 0.05 }}
                      className="bg-white p-3 rounded-xl shadow-sm border border-slate-100"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <span className="text-[10px] font-black text-slate-700 uppercase tracking-wider">{cat.name}</span>
                        </div>
                        <span className="font-black text-slate-900 text-xs">₹{cat.total.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100 p-0.5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (cat.total / (summary.total_expense || 1)) * 100)}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {(!isFirebaseMode || user) && view === 'add' && (
            <motion.div
              key="add"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 shadow-xl border border-slate-100"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Record' : 'New Record'}</h2>
                <button onClick={() => { setView('dashboard'); resetForm(); }} className="text-slate-400">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Type Selector */}
                <div className="flex p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                  >
                    Income
                  </button>
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-lg"
                    />
                  </div>
                </div>

                {/* Date & Purchased By */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Date</label>
                    <button
                      type="button"
                      onClick={() => {
                        setCalendarMonth(new Date(date));
                        setIsCalendarOpen(true);
                      }}
                      className="w-full flex items-center gap-3 pl-3 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none text-left"
                    >
                      <Calendar size={16} className="text-slate-400 shrink-0" />
                      <span className="truncate font-medium text-slate-700">
                        {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </button>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">By</label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={purchasedBy}
                        onChange={(e) => setPurchasedBy(e.target.value)}
                        placeholder="Name"
                        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                    <button 
                      type="button"
                      onClick={() => {
                        setIsNewCategory(!isNewCategory);
                        setCategoryName('');
                        setItemName('');
                      }}
                      className="text-[10px] font-bold text-indigo-600 uppercase"
                    >
                      {isNewCategory ? 'Select Existing' : '+ New Category'}
                    </button>
                  </div>
                  <div className="relative">
                    <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    {isNewCategory ? (
                      <input
                        type="text"
                        required
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        placeholder="Enter category name"
                        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                      />
                    ) : (
                      <select
                        required
                        value={categoryName}
                        onChange={(e) => setCategoryName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none appearance-none"
                      >
                        <option value="">Select Category</option>
                        {filteredCategories.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Item Name */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase">Item Name</label>
                    {!isNewCategory && (
                      <button 
                        type="button"
                        onClick={() => setIsNewItem(!isNewItem)}
                        className="text-[10px] font-bold text-indigo-600 uppercase"
                      >
                        {isNewItem ? 'Select Existing' : '+ New Item'}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <ShoppingBag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    {isNewCategory || isNewItem ? (
                      <input
                        type="text"
                        required
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        placeholder="Enter item name"
                        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none"
                      />
                    ) : (
                      <select
                        required
                        value={itemName}
                        onChange={(e) => setItemName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none appearance-none"
                      >
                        <option value="">Select Item</option>
                        {filteredItems.map(i => (
                          <option key={i.id} value={i.name}>{i.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">Description</label>
                  <div className="relative">
                    <FileText size={16} className="absolute left-3 top-3 text-slate-400" />
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add notes..."
                      rows={2}
                      className="w-full pl-10 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
                >
                  {editingId ? 'Update Transaction' : 'Save Transaction'}
                </button>
              </form>
            </motion.div>
          )}

          {(!isFirebaseMode || user) && view === 'insights' && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Expense Insights</h2>
                <BarChart3 className="text-indigo-600" size={18} />
              </div>

              {/* Filters */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Filter size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Time Period</label>
                      <select
                        value={insightPeriod}
                        onChange={(e) => setInsightPeriod(e.target.value as any)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none appearance-none"
                      >
                        <option value="month">Specific Month</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                        <option value="ytd">Year to Date</option>
                        <option value="all">All Time</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
                      <select
                        value={insightCategory}
                        onChange={(e) => setInsightCategory(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none appearance-none"
                      >
                        <option value="all">All Categories</option>
                        {categories.filter(c => c.type === 'expense').map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {insightPeriod === 'month' && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-1"
                    >
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Select Month</label>
                      <select
                        value={insightMonth}
                        onChange={(e) => setInsightMonth(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none appearance-none"
                      >
                        <option value="all">All Months</option>
                        {availableMonths.map(m => (
                          <option key={m} value={m}>
                            {new Date(m + '-01').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                          </option>
                        ))}
                      </select>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Summary for filtered data */}
              <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-100 flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-[10px] font-black uppercase tracking-widest">Total Filtered Expense</p>
                  <h4 className="text-2xl font-black">
                    ₹{insightData.reduce((sum, d) => sum + d.amount, 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </h4>
                </div>
                <div className="bg-white/20 p-2 rounded-xl">
                  <TrendingDown size={20} />
                </div>
              </div>

              {/* Chart */}
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Expense Trend</h3>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-indigo-500" />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Spending</span>
                    </div>
                  </div>
                </div>
                <div className="h-72 w-full -ml-4">
                  {insightData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={insightData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                          minTickGap={30}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }}
                          tickFormatter={(value) => value >= 1000 ? `₹${(value/1000).toFixed(1)}k` : `₹${value}`}
                          width={45}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            borderRadius: '12px', 
                            border: '1px solid #f1f5f9', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            fontSize: '11px'
                          }}
                          itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                          formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Amount']}
                          labelStyle={{ fontWeight: 'bold', color: '#1e293b', marginBottom: '4px' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="amount" 
                          stroke="#4f46e5" 
                          strokeWidth={4}
                          fillOpacity={1} 
                          fill="url(#colorAmount)" 
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                      <BarChart3 size={48} className="opacity-20 mb-2" />
                      <p className="text-sm">No data for selected filters</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary for filtered data removed from here */}
            </motion.div>
          )}

          {(!isFirebaseMode || user) && view === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Transaction History</h2>
                <button 
                  onClick={exportToCSV}
                  className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-wider hover:bg-indigo-100 transition-colors"
                >
                  <Download size={12} />
                  Export
                </button>
              </div>
              {transactions.map(t => (
                <div key={t.id} className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between group relative">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                      {t.type === 'income' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{t.item_name}</p>
                      <p className="text-[9px] text-slate-500">{t.category_name} • {new Date(t.date).toLocaleDateString()}</p>
                      {t.purchased_by && <p className="text-[8px] text-indigo-600 font-medium">By: {t.purchased_by}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-bold text-sm ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'}₹{t.amount.toLocaleString('en-IN')}
                      </p>
                      {t.description && <p className="text-[8px] text-slate-400 italic max-w-[80px] truncate">{t.description}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(t); }} 
                        className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-lg"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(t.id, e)} 
                        className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-lg"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {(!isFirebaseMode || user) && view === 'manage' && (
            <motion.div
              key="manage"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* User Account Section - Ultra compact at top */}
              <section className="bg-white px-2 py-1 rounded-lg shadow-sm border border-slate-100">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <div className="p-1 bg-indigo-50 text-indigo-600 rounded-md shrink-0">
                      <User size={12} />
                    </div>
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="text-[9px] font-black text-slate-800 uppercase tracking-wider shrink-0">User Account</span>
                      {user && <span className="text-[8px] text-slate-400 truncate opacity-70">{user.email}</span>}
                    </div>
                    {isSyncing && (
                      <div className="animate-spin rounded-full h-2 w-2 border-b border-indigo-600 shrink-0"></div>
                    )}
                  </div>
                  
                  {isFirebaseMode ? (
                    user ? (
                      <button 
                        onClick={handleLogout}
                        className="px-2 py-0.5 bg-rose-50 text-rose-600 text-[8px] font-black uppercase tracking-widest rounded-md border border-rose-100 hover:bg-rose-100 transition-colors shrink-0"
                      >
                        Logout
                      </button>
                    ) : (
                      <button 
                        onClick={handleGoogleLogin}
                        className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-md shadow-sm hover:bg-indigo-700 active:scale-95 transition-all shrink-0"
                      >
                        Login
                      </button>
                    )
                  ) : (
                    <span className="text-[7px] font-black text-amber-500 uppercase tracking-widest bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">Config Required</span>
                  )}
                </div>
              </section>

              <div className="flex items-center justify-between pt-2">
                <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">Manage Data</h2>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setIsViewAllModalOpen(true)}
                    className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
                    title="View All Categories & Items"
                  >
                    <Database size={20} />
                  </button>
                  <button 
                    onClick={() => setView('add')}
                    className="p-2 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-colors"
                    title="Back to Add Transaction"
                  >
                    <PlusCircle size={20} />
                  </button>
                </div>
              </div>

              {/* Add Category Form */}
              <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Tag size={16} className="text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Add New Category</span>
                </div>
                <form onSubmit={handleAddCategory} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Category Name</label>
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="e.g. Health, Entertainment"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Type</label>
                    <div className="flex p-1 bg-slate-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setNewCatType('expense')}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${newCatType === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500'}`}
                      >
                        Expense
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewCatType('income')}
                        className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${newCatType === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500'}`}
                      >
                        Income
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 active:scale-95 transition-transform"
                  >
                    Add Category
                  </button>
                </form>
              </section>

              {/* Add Item Form */}
              <section className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <ShoppingBag size={16} className="text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider">Register New Item</span>
                </div>
                <form onSubmit={handleAddItem} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Select Category</label>
                    <select
                      value={newItemCatId}
                      onChange={(e) => setNewItemCatId(Number(e.target.value))}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none appearance-none"
                      required
                    >
                      <option value="">Select Category</option>
                      {sortedCategories.map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase">Item Name</label>
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="e.g. Gym Membership, Netflix"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 active:scale-95 transition-transform"
                  >
                    Register Item
                  </button>
                </form>
              </section>

              {/* Delete Actions */}
              <section className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setIsDeleteCatModalOpen(true)}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-rose-50 hover:border-rose-100 transition-all group"
                >
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                    <Trash2 size={18} />
                  </div>
                  <span className="text-[9px] font-bold uppercase text-slate-600">Delete Category</span>
                </button>

                <button
                  onClick={() => setIsDeleteItemModalOpen(true)}
                  className="flex flex-col items-center justify-center gap-1.5 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-rose-50 hover:border-rose-100 transition-all group"
                >
                  <div className="p-2 bg-rose-100 text-rose-600 rounded-xl group-hover:scale-110 transition-transform">
                    <X size={18} />
                  </div>
                  <span className="text-[9px] font-bold uppercase text-slate-600">Delete Item</span>
                </button>

                {isStaticMode && !isFirebaseMode && (
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure you want to reset all data? This will clear all transactions and reset categories.')) {
                        localStorage.clear();
                        window.location.reload();
                      }
                    }}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 bg-amber-50 rounded-2xl border border-amber-100 shadow-sm hover:bg-amber-100 transition-all group col-span-2"
                  >
                    <div className="p-2 bg-amber-200 text-amber-700 rounded-xl group-hover:scale-110 transition-transform">
                      <Database size={18} />
                    </div>
                    <span className="text-[9px] font-bold uppercase text-amber-700">Reset All Data (Static Mode)</span>
                  </button>
                )}
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Delete Category Modal */}
      <AnimatePresence>
        {isDeleteCatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900">Delete Category</h3>
                <button onClick={() => setIsDeleteCatModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Select Category to Delete</label>
                  <select
                    value={deleteCatId === '' ? '' : deleteCatId}
                    onChange={(e) => setDeleteCatId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none appearance-none"
                  >
                    <option value="">Select Category</option>
                    {sortedCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                    ))}
                  </select>
                </div>

                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <p className="text-xs text-rose-600 font-medium leading-relaxed">
                    Caution: Deleting a category will also delete all items registered under it. This will only work if no transactions are linked to this category or its items.
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (deleteCatId) {
                      handleDeleteCategory(Number(deleteCatId));
                      setIsDeleteCatModalOpen(false);
                      setDeleteCatId('');
                    }
                  }}
                  disabled={!deleteCatId}
                  className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-rose-100 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Item Modal */}
      <AnimatePresence>
        {isDeleteItemModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-slate-900">Delete Item</h3>
                <button onClick={() => setIsDeleteItemModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">1. Select Category</label>
                  <select
                    value={deleteItemCatId === '' ? '' : deleteItemCatId}
                    onChange={(e) => {
                      setDeleteItemCatId(e.target.value === '' ? '' : Number(e.target.value));
                      setDeleteItemId('');
                    }}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none appearance-none"
                  >
                    <option value="">Select Category</option>
                    {sortedCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">2. Select Item to Delete</label>
                  <select
                    value={deleteItemId === '' ? '' : deleteItemId}
                    onChange={(e) => setDeleteItemId(e.target.value === '' ? '' : Number(e.target.value))}
                    disabled={!deleteItemCatId}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none appearance-none disabled:opacity-50"
                  >
                    <option value="">Select Item</option>
                    {items
                      .filter(i => i.category_id === deleteItemCatId)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(i => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                  </select>
                </div>

                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <p className="text-xs text-rose-600 font-medium leading-relaxed">
                    Caution: Deleting an item will only work if it has no transactions linked to it.
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (deleteItemId) {
                      handleDeleteItem(Number(deleteItemId));
                      setIsDeleteItemModalOpen(false);
                      setDeleteItemId('');
                    }
                  }}
                  disabled={!deleteItemId}
                  className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold shadow-lg shadow-rose-100 active:scale-95 transition-transform disabled:opacity-50 disabled:active:scale-100"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* View All Categories & Items Modal */}
      <AnimatePresence>
        {isViewAllModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 shadow-2xl space-y-6 max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                    <History size={24} />
                  </div>
                  <h3 className="text-xl font-black text-slate-900">Database Explorer</h3>
                </div>
                <button onClick={() => setIsViewAllModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                {sortedCategories.map(cat => (
                  <div key={cat.id} className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden">
                    <div className="px-5 py-4 flex justify-between items-center bg-white border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${cat.type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                        <span className="font-black text-slate-900 uppercase text-xs tracking-widest">{cat.name}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${cat.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {cat.type}
                      </span>
                    </div>
                    <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {items
                        .filter(i => i.category_id === cat.id)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(item => (
                          <div key={item.id} className="bg-white px-3 py-2 rounded-xl border border-slate-200/50 shadow-sm flex items-center gap-2">
                            <div className="w-1 h-1 bg-slate-300 rounded-full" />
                            <span className="text-xs text-slate-600 font-medium truncate">{item.name}</span>
                          </div>
                        ))}
                      {items.filter(i => i.category_id === cat.id).length === 0 && (
                        <p className="col-span-full text-[10px] text-slate-400 italic text-center py-2">No items registered in this category</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  Total Categories: {categories.length} • Total Items: {items.length}
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Navigation Bar */}
      <nav className="sticky bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-slate-100 p-4 pb-6 flex justify-around items-center rounded-t-[2.5rem] shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.05)] z-50">
        <button 
          onClick={() => setView('dashboard')}
          className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${view === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-xl ${view === 'dashboard' ? 'bg-indigo-50' : ''}`}>
            <LayoutDashboard size={22} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Home</span>
        </button>

        <button 
          onClick={() => setView('add')}
          className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${view === 'add' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-xl ${view === 'add' ? 'bg-indigo-50' : ''}`}>
            <Plus size={22} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Add</span>
        </button>

        <button 
          onClick={() => setView('insights')}
          className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${view === 'insights' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-xl ${view === 'insights' ? 'bg-indigo-50' : ''}`}>
            <BarChart3 size={22} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Insights</span>
        </button>

        <button 
          onClick={() => setView('history')}
          className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${view === 'history' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-xl ${view === 'history' ? 'bg-indigo-50' : ''}`}>
            <History size={22} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">History</span>
        </button>

        <button 
          onClick={() => setView('manage')}
          className={`flex flex-col items-center gap-1.5 transition-all active:scale-90 ${view === 'manage' ? 'text-indigo-600' : 'text-slate-400'}`}
        >
          <div className={`p-2 rounded-xl ${view === 'manage' ? 'bg-indigo-50' : ''}`}>
            <Settings size={22} />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Manage</span>
        </button>
      </nav>

      {/* Custom Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl"
            >
              <div className="text-center space-y-4">
                <div className="bg-rose-100 text-rose-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Delete Entry?</h3>
                <p className="text-slate-500 text-sm">This action cannot be undone. Are you sure you want to delete this transaction?</p>
                <div className="flex flex-col gap-3 pt-2">
                  <button
                    onClick={confirmDelete}
                    className="w-full py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg shadow-rose-200 active:scale-95 transition-transform"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="w-full py-3 bg-slate-100 text-slate-600 rounded-xl font-bold active:scale-95 transition-transform"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Calendar Picker Modal */}
      <AnimatePresence>
        {isCalendarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-3xl overflow-hidden w-full max-w-xs shadow-2xl"
            >
              <div className="bg-indigo-600 p-4 text-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold uppercase tracking-widest opacity-80">Select Date</span>
                  <button onClick={() => setIsCalendarOpen(false)} className="hover:bg-white/20 p-1 rounded-full">
                    <X size={20} />
                  </button>
                </div>
                <h3 className="text-2xl font-bold">
                  {calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </h3>
              </div>
              
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    onClick={setToday}
                    className="px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-wider hover:bg-indigo-100 transition-colors"
                  >
                    Today
                  </button>
                  <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
                    <ChevronRight size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <div key={`${day}-${idx}`} className="text-center text-[10px] font-bold text-slate-400 py-1">
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => {
                    if (!day) return <div key={`empty-${idx}`} className="h-8" />;
                    
                    const isSelected = day.toISOString().split('T')[0] === date;
                    const isToday = day.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
                    
                    return (
                      <button
                        key={day.toISOString()}
                        onClick={() => handleDateSelect(day)}
                        className={`h-8 w-8 rounded-full text-xs font-medium flex items-center justify-center transition-all
                          ${isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 
                            isToday ? 'text-indigo-600 font-bold border border-indigo-200' : 'text-slate-700 hover:bg-slate-100'}`}
                      >
                        {day.getDate()}
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="p-4 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setIsCalendarOpen(false)}
                  className="text-sm font-bold text-indigo-600 uppercase tracking-wider px-4 py-2 hover:bg-indigo-50 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
