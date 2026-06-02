import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'investment';
  amount: number;
  date: string;
  status: 'completed' | 'pending';
  details?: string;
}

export interface Investment {
  id: string;
  planName: string;
  amount: number;
  date: string;
}

export interface Referral {
  id: string;
  friendName: string;
  status: 'active' | 'pending';
  bonusEarned: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  walletAddress: string;
  isKycVerified: boolean;
  investments: Investment[];
  transactions: Transaction[];
  referrals: Referral[];
  referralLink: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  login: (email: string, pass: string) => void;
  register: (name: string, email: string, pass: string) => void;
  logout: () => void;
  deposit: (amount: number) => void;
  withdraw: (amount: number) => void;
  verifyKyc: () => void;
  invest: (planName: string, amount: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('gaulaxmi_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (email: string, pass: string) => {
    // Mock login with a dummy password check for prototype
    const savedUser = localStorage.getItem('gaulaxmi_user');
    if (savedUser) {
       const u = JSON.parse(savedUser);
       // Ensure referrals exist for older sessions
       if (!u.referrals) {
           u.referrals = [
             { id: '1', friendName: 'Rahul Kumar', status: 'active', bonusEarned: 5000 },
             { id: '2', friendName: 'Priya Singh', status: 'pending', bonusEarned: 0 }
           ];
           u.referralLink = `https://gaulaxmi.com/ref/${u.id}`;
       }
       if (u.email === email) {
           setUser(u);
           return;
       }
    }
    // Default mock user if not registered
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0],
      email,
      balance: 0,
      walletAddress: '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      isKycVerified: false,
      investments: [],
      transactions: [],
      referrals: [
        { id: '1', friendName: 'Rahul Kumar', status: 'active', bonusEarned: 5000 },
        { id: '2', friendName: 'Priya Singh', status: 'pending', bonusEarned: 0 }
      ],
      referralLink: `https://gaulaxmi.com/ref/${Math.random().toString(36).substr(2, 9)}`
    };
    setUser(newUser);
    localStorage.setItem('gaulaxmi_user', JSON.stringify(newUser));
  };

  const register = (name: string, email: string, pass: string) => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      email,
      balance: 0,
      walletAddress: '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      isKycVerified: false,
      investments: [],
      transactions: [],
      referrals: [],
      referralLink: `https://gaulaxmi.com/ref/${Math.random().toString(36).substr(2, 9)}`
    };
    setUser(newUser);
    localStorage.setItem('gaulaxmi_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
  };

  const deposit = (amount: number) => {
    if (!user) return;
    const newTx: Transaction = { id: Math.random().toString(36).substr(2, 9), type: 'deposit', amount, date: new Date().toISOString(), status: 'completed' };
    const updated = { ...user, balance: user.balance + amount, transactions: [newTx, ...(user.transactions || [])] };
    setUser(updated);
    localStorage.setItem('gaulaxmi_user', JSON.stringify(updated));
  }

  const withdraw = (amount: number) => {
     if (!user || user.balance < amount) return;
     const newTx: Transaction = { id: Math.random().toString(36).substr(2, 9), type: 'withdrawal', amount, date: new Date().toISOString(), status: 'pending' };
     const updated = { ...user, balance: user.balance - amount, transactions: [newTx, ...(user.transactions || [])] };
     setUser(updated);
     localStorage.setItem('gaulaxmi_user', JSON.stringify(updated));
  }

  const verifyKyc = () => {
     if (!user) return;
     const updated = { ...user, isKycVerified: true };
     setUser(updated);
     localStorage.setItem('gaulaxmi_user', JSON.stringify(updated));
  }

  const invest = (planName: string, amount: number) => {
     if (!user || user.balance < amount) return;
     const newInvestment = { id: Math.random().toString(36).substr(2, 9), planName, amount, date: new Date().toISOString() };
     const newTx: Transaction = { id: Math.random().toString(36).substr(2, 9), type: 'investment', amount, date: new Date().toISOString(), status: 'completed', details: planName };
     const updated = { ...user, balance: user.balance - amount, investments: [...(user.investments || []), newInvestment], transactions: [newTx, ...(user.transactions || [])] };
     setUser(updated);
     localStorage.setItem('gaulaxmi_user', JSON.stringify(updated));
  }

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      login,
      register,
      logout,
      deposit,
      withdraw,
      verifyKyc,
      invest
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
