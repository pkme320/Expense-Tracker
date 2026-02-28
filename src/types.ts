export interface Category {
  id: number;
  name: string;
  type: 'expense' | 'income';
}

export interface Item {
  id: number;
  category_id: number;
  name: string;
}

export interface Transaction {
  id: number;
  type: 'expense' | 'income';
  amount: number;
  date: string;
  purchased_by: string;
  category_id: number;
  category_name: string;
  item_name: string;
  description: string;
  created_at: string;
}

export interface Summary {
  total_income: number;
  total_expense: number;
  balance: number;
  categoryBreakdown: {
    name: string;
    total: number;
    type: 'expense' | 'income';
  }[];
}
