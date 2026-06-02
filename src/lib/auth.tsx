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

export interface KycDetails {
  fullName: string;
  dob: string;
  gender: string;
  phone: string;
  docType: string;
  docNumber: string;
  docFileName: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  submittedAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  walletAddress: string;
  isKycVerified: boolean;
  kycStatus?: 'not_started' | 'submitted' | 'verified' | 'rejected';
  kycVerificationNumber?: string;
  kycDetails?: KycDetails;
  investments: Investment[];
  transactions: Transaction[];
  referrals: Referral[];
  referralLink: string;
  phone?: string;
  password?: string;
  isDeactivated?: boolean;
  profileImage?: string;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  allUsers: User[];
  login: (email: string, pass: string) => void;
  register: (name: string, email: string, pass: string) => void;
  logout: () => void;
  deposit: (amount: number) => void;
  withdraw: (amount: number) => void;
  verifyKyc: () => void;
  submitKyc: (details: KycDetails) => void;
  adminApproveKyc: (userId: string) => void;
  adminRejectKyc: (userId: string) => void;
  invest: (planName: string, amount: number) => void;
  updateProfile: (name: string, email: string, phone: string, profileImage?: string) => void;
  changePassword: (newPass: string) => void;
  deleteAccount: () => void;
  deactivateAccount: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  useEffect(() => {
    const savedUserStr = localStorage.getItem('gaulaxmi_user');
    const savedAccountsStr = localStorage.getItem('gaulaxmi_accounts');
    
    let loadedAccounts: User[] = [];
    if (savedAccountsStr) {
      try {
        loadedAccounts = JSON.parse(savedAccountsStr);
      } catch (e) {
        loadedAccounts = [];
      }
    }
    
    let activeUser: User | null = null;
    if (savedUserStr) {
      try {
        activeUser = JSON.parse(savedUserStr);
      } catch (e) {
        activeUser = null;
      }
    }
    
    if (loadedAccounts.length === 0) {
      loadedAccounts = [
        {
          id: 'admin_test_1',
          name: 'Ajay Appinop',
          email: 'ajay@appinop.com',
          balance: 247000,
          walletAddress: '0x3c5b98df78faef67b7890ef9a3f9eef68f0003ca',
          isKycVerified: false,
          kycStatus: 'submitted',
          kycVerificationNumber: 'KYC-591840-GLX',
          kycDetails: {
            fullName: 'Ajay Appinop',
            dob: '1995-04-12',
            gender: 'Male',
            phone: '9876543210',
            docType: 'PAN',
            docNumber: 'ABCDE1234F',
            docFileName: 'pan_national_document.jpg',
            address: 'Malviya Nagar, 12 SFS Flat',
            city: 'Jaipur',
            state: 'Rajasthan',
            pincode: '302017',
            submittedAt: new Date(Date.now() - 3600000 * 4).toISOString()
          },
          investments: [],
          transactions: [],
          referrals: [],
          referralLink: 'https://gaulaxmi.com/ref/ajayapp'
        },
        {
          id: 'demo_user_2',
          name: 'Vikram Singh',
          email: 'vikram@gaulaxmi.io',
          balance: 15400,
          walletAddress: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
          isKycVerified: true,
          kycStatus: 'verified',
          kycVerificationNumber: 'KYC-204193-GLX',
          kycDetails: {
            fullName: 'Vikram Singh',
            dob: '1988-11-22',
            gender: 'Male',
            phone: '9922881100',
            docType: 'Aadhaar',
            docNumber: '4820 1938 5819',
            docFileName: 'aadhaar_scan.pdf',
            address: 'Sector 5, Mansarovar',
            city: 'Jaipur',
            state: 'Rajasthan',
            pincode: '302020',
            submittedAt: new Date(Date.now() - 3600000 * 48).toISOString()
          },
          investments: [],
          transactions: [],
          referrals: [],
          referralLink: 'https://gaulaxmi.com/ref/vikram'
        },
        {
          id: 'demo_user_3',
          name: 'Preeti Sharma',
          email: 'preeti@gaulaxmi.io',
          balance: 8500,
          walletAddress: '0x5b3f81e39a3f2d019ab7c3f9eef68f44d9302ca1',
          isKycVerified: false,
          kycStatus: 'submitted',
          kycVerificationNumber: 'KYC-881024-GLX',
          kycDetails: {
            fullName: 'Preeti Sharma',
            dob: '1997-08-15',
            gender: 'Female',
            phone: '9001122334',
            docType: 'Passport',
            docNumber: 'Z8941029',
            docFileName: 'passport_biodata.png',
            address: 'Malviya Nagar, Sector 4',
            city: 'Jaipur',
            state: 'Rajasthan',
            pincode: '302017',
            submittedAt: new Date(Date.now() - 3600000 * 1).toISOString()
          },
          investments: [],
          transactions: [],
          referrals: [],
          referralLink: 'https://gaulaxmi.com/ref/preeti'
        }
      ];
    }
    
    // Ensure active user is present in stored accounts
    if (activeUser && !loadedAccounts.some(u => u.id === activeUser!.id)) {
      loadedAccounts.push(activeUser);
    }
    
    setAllUsers(loadedAccounts);
    localStorage.setItem('gaulaxmi_accounts', JSON.stringify(loadedAccounts));
    
    if (activeUser) {
      const refreshedActive = loadedAccounts.find(u => u.id === activeUser!.id);
      if (refreshedActive) {
        setUser(refreshedActive);
        localStorage.setItem('gaulaxmi_user', JSON.stringify(refreshedActive));
      } else {
        setUser(activeUser);
      }
    }
  }, []);

  const saveUserStates = (updatedUser: User | null, updatedAllUsers?: User[]) => {
    if (updatedUser) {
      setUser(updatedUser);
      localStorage.setItem('gaulaxmi_user', JSON.stringify(updatedUser));
      
      const list = updatedAllUsers || [...allUsers];
      const idx = list.findIndex(u => u.id === updatedUser.id);
      if (idx > -1) {
        list[idx] = updatedUser;
      } else {
        list.push(updatedUser);
      }
      setAllUsers(list);
      localStorage.setItem('gaulaxmi_accounts', JSON.stringify(list));
    } else {
      setUser(null);
      localStorage.removeItem('gaulaxmi_user');
      if (updatedAllUsers) {
        setAllUsers(updatedAllUsers);
        localStorage.setItem('gaulaxmi_accounts', JSON.stringify(updatedAllUsers));
      }
    }
  };

  const login = (email: string, pass: string) => {
    const savedAccountsStr = localStorage.getItem('gaulaxmi_accounts');
    let list: User[] = savedAccountsStr ? JSON.parse(savedAccountsStr) : [...allUsers];
    
    // Check if user has referrals
    const existing = list.find(u => u.email === email);
    if (existing) {
      if (!existing.referrals) {
        existing.referrals = [
          { id: '1', friendName: 'Rahul Kumar', status: 'active', bonusEarned: 5000 },
          { id: '2', friendName: 'Priya Singh', status: 'pending', bonusEarned: 0 }
        ];
        existing.referralLink = `https://gaulaxmi.com/ref/${existing.id}`;
      }
      if (!existing.password) {
        existing.password = pass || '123456';
      }
      setUser(existing);
      localStorage.setItem('gaulaxmi_user', JSON.stringify(existing));
      return;
    }
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0],
      email,
      balance: 0,
      walletAddress: '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join(''),
      isKycVerified: false,
      kycStatus: 'not_started',
      investments: [],
      transactions: [],
      referrals: [
        { id: '1', friendName: 'Rahul Kumar', status: 'active', bonusEarned: 5000 },
        { id: '2', friendName: 'Priya Singh', status: 'pending', bonusEarned: 0 }
      ],
      referralLink: `https://gaulaxmi.com/ref/${Math.random().toString(36).substr(2, 9)}`,
      password: pass || '123456',
      phone: ''
    };
    
    list.push(newUser);
    setAllUsers(list);
    localStorage.setItem('gaulaxmi_accounts', JSON.stringify(list));
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
      kycStatus: 'not_started',
      investments: [],
      transactions: [],
      referrals: [],
      referralLink: `https://gaulaxmi.com/ref/${Math.random().toString(36).substr(2, 9)}`,
      password: pass,
      phone: ''
    };
    
    const savedAccountsStr = localStorage.getItem('gaulaxmi_accounts');
    let list: User[] = savedAccountsStr ? JSON.parse(savedAccountsStr) : [...allUsers];
    list.push(newUser);
    
    setAllUsers(list);
    localStorage.setItem('gaulaxmi_accounts', JSON.stringify(list));
    setUser(newUser);
    localStorage.setItem('gaulaxmi_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gaulaxmi_user');
  };

  const deposit = (amount: number) => {
    if (!user) return;
    const newTx: Transaction = { id: Math.random().toString(36).substr(2, 9), type: 'deposit', amount, date: new Date().toISOString(), status: 'completed' };
    const updated = { ...user, balance: user.balance + amount, transactions: [newTx, ...(user.transactions || [])] };
    saveUserStates(updated);
  }

  const withdraw = (amount: number) => {
     if (!user || user.balance < amount) return;
     const newTx: Transaction = { id: Math.random().toString(36).substr(2, 9), type: 'withdrawal', amount, date: new Date().toISOString(), status: 'pending' };
     const updated = { ...user, balance: user.balance - amount, transactions: [newTx, ...(user.transactions || [])] };
     saveUserStates(updated);
  }

  const verifyKyc = () => {
     if (!user) return;
     const verificationNum = user.kycVerificationNumber || ('KYC-' + Math.floor(100000 + Math.random() * 900000) + '-GLX');
     const updated: User = { ...user, isKycVerified: true, kycStatus: 'verified', kycVerificationNumber: verificationNum };
     saveUserStates(updated);
  }

  const submitKyc = (details: KycDetails) => {
    if (!user) return;
    const verificationNum = 'KYC-' + Math.floor(100000 + Math.random() * 900000) + '-GLX';
    const updated: User = { 
      ...user, 
      kycStatus: 'submitted', 
      isKycVerified: false, 
      kycVerificationNumber: verificationNum,
      kycDetails: details
    };
    saveUserStates(updated);
  };

  const adminApproveKyc = (userId: string) => {
    const list = [...allUsers];
    const idx = list.findIndex(u => u.id === userId);
    if (idx > -1) {
      list[idx] = { 
        ...list[idx], 
        kycStatus: 'verified', 
        isKycVerified: true 
      };
      
      if (user && user.id === userId) {
        saveUserStates(list[idx], list);
      } else {
        setAllUsers(list);
        localStorage.setItem('gaulaxmi_accounts', JSON.stringify(list));
      }
    }
  };

  const adminRejectKyc = (userId: string) => {
    const list = [...allUsers];
    const idx = list.findIndex(u => u.id === userId);
    if (idx > -1) {
      list[idx] = { 
        ...list[idx], 
        kycStatus: 'rejected', 
        isKycVerified: false 
      };
      
      if (user && user.id === userId) {
        saveUserStates(list[idx], list);
      } else {
        setAllUsers(list);
        localStorage.setItem('gaulaxmi_accounts', JSON.stringify(list));
      }
    }
  };

  const invest = (planName: string, amount: number) => {
     if (!user || user.balance < amount) return;
     const newInvestment = { id: Math.random().toString(36).substr(2, 9), planName, amount, date: new Date().toISOString() };
     const newTx: Transaction = { id: Math.random().toString(36).substr(2, 9), type: 'investment', amount, date: new Date().toISOString(), status: 'completed', details: planName };
     const updated = { ...user, balance: user.balance - amount, investments: [...(user.investments || []), newInvestment], transactions: [newTx, ...(user.transactions || [])] };
     saveUserStates(updated);
  }

  const updateProfile = (name: string, email: string, phone: string, profileImage?: string) => {
    if (!user) return;
    const updated = { ...user, name, email, phone, ...(profileImage !== undefined ? { profileImage } : {}) };
    saveUserStates(updated);
  };

  const changePassword = (newPass: string) => {
    if (!user) return;
    const updated = { ...user, password: newPass };
    saveUserStates(updated);
  };

  const deleteAccount = () => {
    const list = allUsers.filter(u => u.id !== user?.id);
    localStorage.removeItem('gaulaxmi_user');
    setUser(null);
    setAllUsers(list);
    localStorage.setItem('gaulaxmi_accounts', JSON.stringify(list));
  };

  const deactivateAccount = () => {
    if (!user) return;
    const updated = { ...user, isDeactivated: true };
    saveUserStates(updated);
    logout();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoggedIn: !!user,
      allUsers,
      login,
      register,
      logout,
      deposit,
      withdraw,
      verifyKyc,
      submitKyc,
      adminApproveKyc,
      adminRejectKyc,
      invest,
      updateProfile,
      changePassword,
      deleteAccount,
      deactivateAccount
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
