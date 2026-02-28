import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("tracker.db");
db.pragma('foreign_keys = ON');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    type TEXT CHECK(type IN ('expense', 'income')) NOT NULL
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    UNIQUE(category_id, name),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('expense', 'income')) NOT NULL,
    amount REAL NOT NULL,
    date TEXT NOT NULL,
    purchased_by TEXT,
    category_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );
`);

// Seed data from user request
const seedData: Record<string, string[]> = {
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

// Perform seeding
try {
  const existingCategories = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
  
  if (existingCategories.count === 0) {
    console.log("Database is empty. Seeding initial data...");
    db.transaction(() => {
      const insertCat = db.prepare("INSERT INTO categories (name, type) VALUES (?, ?)");
      const insertItem = db.prepare("INSERT INTO items (category_id, name) VALUES (?, ?)");

      for (const [catName, items] of Object.entries(seedData)) {
        const result = insertCat.run(catName, 'expense');
        const catId = result.lastInsertRowid;
        for (const itemName of items) {
          insertItem.run(catId, itemName);
        }
      }
    })();
    console.log("Database seeded successfully with initial categories.");
  } else {
    console.log("Database already contains data. Skipping seeding.");
  }
} catch (error) {
  console.error("Database seeding failed:", error);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    const items = db.prepare("SELECT * FROM items").all();
    res.json({ categories, items });
  });

  app.post("/api/categories", (req, res) => {
    const { name, type } = req.body;
    try {
      const result = db.prepare("INSERT INTO categories (name, type) VALUES (?, ?)").run(name, type);
      res.json({ id: Number(result.lastInsertRowid), name, type });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to add category" });
    }
  });

  app.post("/api/items", (req, res) => {
    const { category_id, name } = req.body;
    try {
      const result = db.prepare("INSERT INTO items (category_id, name) VALUES (?, ?)").run(category_id, name);
      res.json({ id: Number(result.lastInsertRowid), category_id, name });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to add item" });
    }
  });

  app.delete("/api/categories/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    console.log(`DELETE /api/categories/${id}`);
    try {
      // Check if there are transactions linked to this category
      const transactionsCount = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE category_id = ?").get(id) as { count: number };
      
      console.log(`Category ${id} has ${transactionsCount.count} transactions`);

      if (transactionsCount.count > 0) {
        return res.status(400).json({ error: "Cannot delete category linked to transactions. Delete the transactions first." });
      }

      // If no transactions, we can delete the category and its items
      db.transaction(() => {
        // Delete items first
        db.prepare("DELETE FROM items WHERE category_id = ?").run(id);
        const result = db.prepare("DELETE FROM categories WHERE id = ?").run(id);
        console.log(`Delete result:`, result);
        if (result.changes === 0) throw new Error("Category not found");
      })();
      
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete category error:', error);
      res.status(error.message === "Category not found" ? 404 : 500).json({ error: error.message || "Failed to delete category" });
    }
  });

  app.delete("/api/items/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    console.log(`DELETE /api/items/${id}`);
    try {
      const item = db.prepare("SELECT name, category_id FROM items WHERE id = ?").get(id) as { name: string, category_id: number } | undefined;
      if (!item) {
        console.log(`Item ${id} not found`);
        return res.status(404).json({ error: "Item not found" });
      }

      const transactionsCount = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE item_name = ? AND category_id = ?").get(item.name, item.category_id) as { count: number };
      console.log(`Item ${item.name} in category ${item.category_id} has ${transactionsCount.count} transactions`);

      if (transactionsCount.count > 0) {
        return res.status(400).json({ error: "Cannot delete item linked to transactions." });
      }

      const result = db.prepare("DELETE FROM items WHERE id = ?").run(id);
      console.log(`Delete result:`, result);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete item error:', error);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  app.post("/api/transactions", (req, res) => {
    const { type, amount, date, purchased_by, category_name, item_name, description } = req.body;

    try {
      db.transaction(() => {
        // 1. Ensure category exists
        let category = db.prepare("SELECT id FROM categories WHERE name = ? AND type = ?").get(category_name, type) as { id: number } | undefined;
        if (!category) {
          const result = db.prepare("INSERT INTO categories (name, type) VALUES (?, ?)").run(category_name, type);
          category = { id: Number(result.lastInsertRowid) };
        }

        // 2. Ensure item exists under category
        let item = db.prepare("SELECT id FROM items WHERE category_id = ? AND name = ?").get(category.id, item_name) as { id: number } | undefined;
        if (!item) {
          db.prepare("INSERT INTO items (category_id, name) VALUES (?, ?)").run(category.id, item_name);
        }

        // 3. Insert transaction
        db.prepare(`
          INSERT INTO transactions (type, amount, date, purchased_by, category_id, item_name, description)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(type, amount, date, purchased_by, category.id, item_name, description);
      })();
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to save transaction" });
    }
  });

  app.get("/api/transactions", (req, res) => {
    const transactions = db.prepare(`
      SELECT t.*, c.name as category_name 
      FROM transactions t 
      JOIN categories c ON t.category_id = c.id
      ORDER BY date DESC, created_at DESC
    `).all();
    res.json(transactions);
  });

  app.get("/api/summary", (req, res) => {
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
    console.log(`Fetching summary for month: ${month}`);

    const summary = db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
      FROM transactions
      WHERE date LIKE ?
    `).get(`${month}%`) as { total_income: number, total_expense: number };

    const categoryBreakdown = db.prepare(`
      SELECT c.name, SUM(t.amount) as total, c.type
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE t.date LIKE ? AND c.type = 'expense'
      GROUP BY c.id
      ORDER BY total DESC
    `).all(`${month}%`);

    res.json({
      month,
      total_income: summary.total_income || 0,
      total_expense: summary.total_expense || 0,
      balance: (summary.total_income || 0) - (summary.total_expense || 0),
      categoryBreakdown
    });
  });

  app.put("/api/transactions/:id", (req, res) => {
    const { id } = req.params;
    const { type, amount, date, purchased_by, category_name, item_name, description } = req.body;

    try {
      db.transaction(() => {
        // 1. Ensure category exists
        let category = db.prepare("SELECT id FROM categories WHERE name = ? AND type = ?").get(category_name, type) as { id: number } | undefined;
        if (!category) {
          const result = db.prepare("INSERT INTO categories (name, type) VALUES (?, ?)").run(category_name, type);
          category = { id: Number(result.lastInsertRowid) };
        }

        // 2. Ensure item exists under category
        let item = db.prepare("SELECT id FROM items WHERE category_id = ? AND name = ?").get(category.id, item_name) as { id: number } | undefined;
        if (!item) {
          db.prepare("INSERT INTO items (category_id, name) VALUES (?, ?)").run(category.id, item_name);
        }

        // 3. Update transaction
        db.prepare(`
          UPDATE transactions 
          SET type = ?, amount = ?, date = ?, purchased_by = ?, category_id = ?, item_name = ?, description = ?
          WHERE id = ?
        `).run(type, amount, date, purchased_by, category.id, item_name, description, id);
      })();
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update transaction" });
    }
  });

  app.delete("/api/transactions/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    console.log(`DELETE request for transaction ID: ${id}`);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    try {
      const result = db.prepare("DELETE FROM transactions WHERE id = ?").run(id);
      console.log(`Delete result:`, result);
      if (result.changes === 0) {
        console.warn(`No transaction found with ID: ${id}`);
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ error: "Failed to delete transaction" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
