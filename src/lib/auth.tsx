import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { isAdminUser } from './admin';
import { isValidPassword, normalizeEmail } from './validation';
import type { UserRole } from './admin';
import { api, ApiError, getToken, setToken } from './apiClient';
import { consumeAuthHandoffFromUrl } from './appBridge';

export type AuthResult = { ok: true; user: User } | { ok: false; message: string };

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'investment';
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'rejected';
  details?: string;
}

export interface Investment {
  id: string;
  planId?: string;
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
  kycRejectionReason?: string;
  kycDetails?: KycDetails;
  kycHistory?: import('../../shared/types').KycHistoryEntry[];
  investments: Investment[];
  transactions: Transaction[];
  referrals: Referral[];
  referralLink: string;
  phone?: string;
  isDeactivated?: boolean;
  profileImage?: string;
  role?: UserRole;
  milestoneFulfillment?: Record<string, 'eligible' | 'fulfilled'>;
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  allUsers: User[];
  login: (email: string, pass: string) => Promise<AuthResult>;
  register: (name: string, email: string, pass: string) => Promise<AuthResult>;
  logout: () => void;
  deposit: (amount: number) => Promise<void>;
  withdraw: (amount: number) => Promise<void>;
  verifyKyc: () => void;
  submitKyc: (details: KycDetails) => Promise<void>;
  isAdmin: boolean;
  adminApproveKyc: (userId: string) => Promise<void>;
  adminRejectKyc: (userId: string, reason: string) => Promise<void>;
  adminApproveKycSubmission: (submissionId: string) => Promise<void>;
  adminRejectKycSubmission: (submissionId: string, reason: string) => Promise<void>;
  adminAdjustBalance: (userId: string, amount: number, note: string) => Promise<void>;
  adminApproveWithdrawal: (userId: string, txId: string) => Promise<void>;
  adminRejectWithdrawal: (userId: string, txId: string) => Promise<void>;
  adminSetDeactivated: (userId: string, deactivated: boolean) => Promise<void>;
  adminRemoveUser: (userId: string) => Promise<void>;
  adminAssignInvestment: (userId: string, planId: string) => Promise<AuthResult>;
  adminSetMilestoneFulfillment: (
    userId: string,
    milestoneId: string,
    status: 'eligible' | 'fulfilled' | null
  ) => Promise<void>;
  refreshUsers: () => Promise<void>;
  invest: (planName: string, amount: number, planId?: string) => Promise<void>;
  updateProfile: (name: string, email: string, phone: string, profileImage?: string) => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  deactivateAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_SESSION_KEY = 'gaulaxmi_admin_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAdminUsers = useCallback(async () => {
    const users = await api.getAdminUsers();
    setAllUsers(users);
  }, []);

  const applySession = useCallback(
    async (nextUser: User) => {
      setUser(nextUser);
      if (isAdminUser(nextUser)) {
        localStorage.setItem(ADMIN_SESSION_KEY, '1');
        await loadAdminUsers();
      } else {
        localStorage.removeItem(ADMIN_SESSION_KEY);
        setAllUsers([]);
      }
    },
    [loadAdminUsers]
  );

  useEffect(() => {
    (async () => {
      consumeAuthHandoffFromUrl();
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await api.me();
        await applySession(me);
      } catch {
        setToken(null);
        setUser(null);
        setAllUsers([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [applySession]);

  const syncUserInList = (updated: User) => {
    setUser(updated);
    setAllUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === updated.id);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
  };

  const login = async (email: string, pass: string): Promise<AuthResult> => {
    if (!isValidPassword(pass)) {
      return { ok: false, message: 'Password must be at least 6 characters.' };
    }
    try {
      const { token, user: loggedIn } = await api.login(email, pass);
      setToken(token);
      await applySession(loggedIn);
      return { ok: true, user: loggedIn };
    } catch (e) {
      return { ok: false, message: e instanceof ApiError ? e.message : 'Login failed' };
    }
  };

  const register = async (name: string, email: string, pass: string): Promise<AuthResult> => {
    if (!isValidPassword(pass)) {
      return { ok: false, message: 'Password must be at least 6 characters.' };
    }
    try {
      const { token, user: created } = await api.register(name, email, pass);
      setToken(token);
      await applySession(created);
      return { ok: true, user: created };
    } catch (e) {
      return { ok: false, message: e instanceof ApiError ? e.message : 'Registration failed' };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setAllUsers([]);
    localStorage.removeItem(ADMIN_SESSION_KEY);
  };

  const refreshUsers = async () => {
    if (!user || !isAdminUser(user)) return;
    await loadAdminUsers();
    try {
      const me = await api.me();
      setUser(me);
    } catch {
      /* ignore */
    }
  };

  const deposit = async (amount: number) => {
    const updated = await api.deposit(amount);
    setUser(updated);
  };

  const withdraw = async (amount: number) => {
    const updated = await api.withdraw(amount);
    setUser(updated);
  };

  const verifyKyc = () => {
    /* KYC is approved by admin only — see submitKyc */
  };

  const submitKyc = async (details: KycDetails) => {
    const updated = await api.submitKyc(details);
    setUser(updated);
  };

  const invest = async (planName: string, amount: number, planId?: string) => {
    const updated = await api.invest(planId || '', planName, amount);
    setUser(updated);
  };

  const updateProfile = async (
    name: string,
    email: string,
    phone: string,
    profileImage?: string
  ) => {
    const updated = await api.updateProfile({ name, email, phone, profileImage });
    setUser(updated);
  };

  const changePassword = async (newPass: string) => {
    await api.changePassword(newPass);
  };

  const deleteAccount = async () => {
    await api.deleteAccount();
    logout();
  };

  const deactivateAccount = async () => {
    await api.deactivateAccount();
    logout();
  };

  const adminApproveKyc = async (userId: string) => {
    const updated = await api.adminApproveKyc(userId);
    syncUserInList(updated);
    await loadAdminUsers();
  };

  const adminRejectKyc = async (userId: string, reason: string) => {
    const updated = await api.adminRejectKyc(userId, reason);
    syncUserInList(updated);
    await loadAdminUsers();
  };

  const adminApproveKycSubmission = async (submissionId: string) => {
    const updated = await api.adminApproveKycSubmission(submissionId);
    syncUserInList(updated);
    await loadAdminUsers();
  };

  const adminRejectKycSubmission = async (submissionId: string, reason: string) => {
    const updated = await api.adminRejectKycSubmission(submissionId, reason);
    syncUserInList(updated);
    await loadAdminUsers();
  };

  const adminAdjustBalance = async (userId: string, amount: number, note: string) => {
    const updated = await api.adminAdjustBalance(userId, amount, note);
    syncUserInList(updated);
    await loadAdminUsers();
  };

  const adminApproveWithdrawal = async (userId: string, txId: string) => {
    const updated = await api.adminApproveWithdrawal(userId, txId);
    syncUserInList(updated);
    await loadAdminUsers();
  };

  const adminRejectWithdrawal = async (userId: string, txId: string) => {
    const updated = await api.adminRejectWithdrawal(userId, txId);
    syncUserInList(updated);
    await loadAdminUsers();
  };

  const adminSetDeactivated = async (userId: string, deactivated: boolean) => {
    const updated = await api.adminSetDeactivated(userId, deactivated);
    syncUserInList(updated);
    await loadAdminUsers();
  };

  const adminRemoveUser = async (userId: string) => {
    await api.adminRemoveUser(userId);
    if (user?.id === userId) logout();
    else await loadAdminUsers();
  };

  const adminAssignInvestment = async (userId: string, planId: string): Promise<AuthResult> => {
    try {
      const updated = await api.adminAssignInvestment(userId, planId);
      syncUserInList(updated);
      await loadAdminUsers();
      return { ok: true, user: updated };
    } catch (e) {
      return { ok: false, message: e instanceof ApiError ? e.message : 'Failed to assign plan' };
    }
  };

  const adminSetMilestoneFulfillment = async (
    userId: string,
    milestoneId: string,
    status: 'eligible' | 'fulfilled' | null
  ) => {
    const updated = await api.adminSetMilestoneFulfillment(userId, milestoneId, status);
    syncUserInList(updated);
    await loadAdminUsers();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        loading,
        isAdmin: isAdminUser(user),
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
        adminApproveKycSubmission,
        adminRejectKycSubmission,
        adminAdjustBalance,
        adminApproveWithdrawal,
        adminRejectWithdrawal,
        adminSetDeactivated,
        adminRemoveUser,
        adminAssignInvestment,
        adminSetMilestoneFulfillment,
        refreshUsers,
        invest,
        updateProfile,
        changePassword,
        deleteAccount,
        deactivateAccount,
      }}
    >
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
