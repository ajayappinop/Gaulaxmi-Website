import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { motion } from 'motion/react';
import { Wallet, LogOut, ArrowUpRight, ArrowDownRight, ShieldCheck, ShieldAlert, CheckCircle, Clock, X, Users, Copy, MessageCircle, Send, Mail, Network, Search, Settings, Lock, UserRound, Trash2, AlertTriangle, ChevronLeft, ChevronRight, Upload, Check, FileText, Info, Sliders, UserCheck, UserX, TrendingUp, LifeBuoy } from 'lucide-react';
import { HierarchyTab } from './HierarchyTab';
import logo from "../assets/Images/gaulaxmi-logo.png";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import { formatINR, getPlanById, type InvestmentPlan } from '../lib/plans';
import { useInvestmentPlans } from '../lib/useInvestmentPlans';
import {
  isValidEmail,
  isValidIndianPhone,
  isValidMoneyAmount,
  parsePositiveAmount,
  normalizeIndianPhone,
  validateDocNumber,
  isAdult,
  isValidName,
} from '../lib/validation';
import { DASHBOARD_NAV_ITEMS, type DashboardTabId } from '../lib/dashboardNav';
import type { PendingPlanPurchase } from '../lib/planPurchaseFlow';
import { KycInvestorCertificate, buildKycCertificateId } from './KycInvestorCertificate';
import { KycSubmissionHistory } from './KycSubmissionHistory';
import { DepositSection } from './DepositSection';
import { WithdrawSection } from './WithdrawSection';
import { WalletTransactionDetailModal } from './WalletTransactionDetailModal';
import { WalletTransactionHistory } from './WalletTransactionHistory';
import { HelpSupportSection } from './HelpSupportSection';
import { InvestmentDetailModal } from './InvestmentDetailModal';
import { InvestmentProgressTab } from './InvestmentProgressTab';
import { DetailsActionButton } from './DetailsActionButton';
import { TablePagination } from './TablePagination';
import { TableListToolbar } from './TableListToolbar';
import { useTableList } from '../hooks/useTableList';
import type { Transaction, Investment, Referral } from '../lib/auth';

type TabView = DashboardTabId;

const SIDEBAR_TAB_ICONS: Record<DashboardTabId, React.ReactNode> = {
  overview: <Wallet className="w-4 h-4" />,
  wallet: <ArrowUpRight className="w-4 h-4" />,
  investments: <CheckCircle className="w-4 h-4" />,
  progress: <TrendingUp className="w-4 h-4" />,
  transactions: <Clock className="w-4 h-4" />,
  referrals: <Users className="w-4 h-4" />,
  hierarchy: <Network className="w-4 h-4" />,
  kyc: <ShieldCheck className="w-4 h-4" />,
  support: <LifeBuoy className="w-4 h-4" />,
  profile: <UserRound className="w-4 h-4" />,
  settings: <Settings className="w-4 h-4" />,
};

export function Dashboard({
  activeTab: externalTab,
  onTabChange,
  onClose,
  pendingPlanPurchase,
  onDismissPendingPurchase,
  onResumePurchase,
  onStartPlanPurchase,
}: {
  activeTab?: DashboardTabId;
  onTabChange?: (tab: DashboardTabId) => void;
  onClose?: () => void;
  pendingPlanPurchase?: PendingPlanPurchase | null;
  onDismissPendingPurchase?: () => void;
  onResumePurchase?: () => void;
  /** Opens the full purchase journey (plan → account → KYC → wallet → confirm) */
  onStartPlanPurchase?: (planId: string) => void;
}) {
  const { 
    user, 
    logout, 
    verifyKyc, 
    submitKyc,
    allUsers,
    adminApproveKyc,
    adminRejectKyc,
    updateProfile, 
    changePassword, 
    deleteAccount, 
    deactivateAccount 
  } = useAuth();
  const investmentPlans = useInvestmentPlans();
  const [internalTab, setInternalTab] = useState<TabView>('overview');
  const activeTab = (externalTab as TabView) || internalTab;
  
  const setActiveTab = (tab: TabView) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  // Profile Form States
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || '');

  // Password Form States
  const [passCurrent, setPassCurrent] = useState('');
  const [passNew, setPassNew] = useState('');
  const [passConfirm, setPassConfirm] = useState('');

  // Delete & Deactivate confirmations
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  // KYC Multi-Step Form States
  const [kycStep, setKycStep] = useState(1);
  const [kycForm, setKycForm] = useState({
    fullName: user?.name || '',
    dob: '',
    gender: '',
    phone: user?.phone || '',
    docType: 'PAN',
    docNumber: '',
    docFileName: '',
    docFileUrl: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    declared: false,
    signatureName: ''
  });

  const chartData = useMemo(() => {
    if (!user) return [];
    
    let totalInvested = user.investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
    // Default mock data if practically no investments, or scale up actual investments
    const baseInvestment = totalInvested > 0 ? totalInvested : 100000;
    const monthlyROI = 0.05; // 5% monthly ROI

    const data = [];
    let cumulativeEarnings = 0;
    for (let i = 0; i <= 60; i += 6) {
      data.push({
        month: `Month ${i}`,
        earnings: cumulativeEarnings,
      });
      cumulativeEarnings += baseInvestment * monthlyROI * 6; // Adding 6 months worth of earnings
    }
    return data;
  }, [user]);

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);

  const walletTransactions = useMemo(() => {
    if (!user?.transactions) return [];
    return user.transactions.filter(
      (tx) => tx.type === 'deposit' || tx.type === 'withdrawal'
    );
  }, [user?.transactions]);

  const investmentsList = useTableList<Investment>({
    items: user?.investments ?? [],
    pageSize: 4,
    getItemDate: (inv) => inv.date,
  });

  const referralsList = useTableList<Referral>({
    items: user?.referrals ?? [],
    pageSize: 5,
    debounceSearch: true,
    searchFn: (ref, q) =>
      ref.friendName.toLowerCase().includes(q) || ref.id.toLowerCase().includes(q),
    filterFn: (ref, f) => f === 'all' || ref.status === f,
    getSortValue: (ref) => ref.friendName.toLowerCase(),
  });

  if (!user) return null;

  const kycVerified = user.kycStatus === 'verified' || user.isKycVerified;

  const handleInvestInPlan = (plan: InvestmentPlan) => {
    if (!onStartPlanPurchase) {
      toast.error('Purchase flow is unavailable. Please use the Plans section on the home page.');
      return;
    }
    onStartPlanPurchase(plan.id);
  };

  const renderPlanCards = (gridClass = 'grid sm:grid-cols-2 lg:grid-cols-3 gap-4') => (
    <div className={gridClass}>
      {investmentPlans.map((plan) => (
        <div key={plan.id} className="bg-white rounded-xl p-4 border border-[#d8cec1] shadow-sm flex flex-col justify-between">
          <div>
            <div className="font-semibold text-bark">{plan.tier}</div>
            <div className="text-xs text-muted-foreground mt-0.5">5% monthly · 60 months</div>
            <div className="font-display font-bold text-lg text-[#7f4e1c] mt-1">{formatINR(plan.amount)}</div>
          </div>
          <button
            type="button"
            onClick={() => handleInvestInPlan(plan)}
            className="mt-4 w-full bg-[#f8f1e8] text-[#7b4b1d] hover:bg-[#b07843] hover:text-white transition py-2 rounded-lg text-sm font-semibold border border-[#d8cec1] cursor-pointer"
          >
            Start purchase journey
          </button>
        </div>
      ))}
    </div>
  );

  const pendingPlan = pendingPlanPurchase?.planId
    ? getPlanById(pendingPlanPurchase.planId)
    : undefined;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col">
      {/* Top bar */}
      <header className="bg-white/90 backdrop-blur-md border-b border-stone-200 fixed top-0 inset-x-0 z-50 shadow-sm">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <img src={logo} alt="Gaulaxmi" className="h-8 w-8 object-contain shrink-0" />
            <div className="font-display text-base sm:text-lg text-primary font-bold font-sans truncate">
              Gaulaxmi
              <span className="font-sans text-[10px] sm:text-xs tracking-widest text-[#7f4e1c] uppercase font-bold ml-1.5 sm:ml-2">
                Dashboard
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full border text-[10px] sm:text-xs font-semibold max-w-[9rem] sm:max-w-none truncate ${
                kycVerified
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : user.kycStatus === 'submitted'
                  ? 'bg-amber-50 border-amber-200 text-amber-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {kycVerified ? (
                <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              ) : user.kycStatus === 'submitted' ? (
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              ) : (
                <ShieldAlert className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              )}
              <span className="truncate">
                {kycVerified
                  ? 'Verified'
                  : user.kycStatus === 'submitted'
                  ? 'KYC Pending'
                  : user.kycStatus === 'rejected'
                  ? 'Rejected'
                  : 'KYC Required'}
              </span>
            </div>

            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-stone-100 hover:bg-stone-200 transition-colors text-bark shrink-0"
                aria-label="Close dashboard"
              >
                <X className="w-5 h-5" />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {pendingPlan && (
        <div className="fixed top-16 left-0 right-0 z-[45] bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs sm:text-sm text-amber-950">
          <div className="max-w-[1600px] mx-auto flex items-center justify-center gap-2 sm:gap-3 flex-wrap text-center pr-8 relative">
            <span>
              <span className="font-semibold">Completing purchase:</span> {pendingPlan.tier} ({formatINR(pendingPlan.amount)}) — finish KYC or wallet steps, then{' '}
              {onResumePurchase ? (
                <button type="button" onClick={onResumePurchase} className="underline font-bold hover:text-amber-700">
                  return to checkout
                </button>
              ) : (
                <span className="font-bold">return to checkout</span>
              )}
            </span>
            {onDismissPendingPurchase && (
              <button
                type="button"
                onClick={onDismissPendingPurchase}
                className="absolute right-0 top-1/2 -translate-y-1/2 p-1 rounded-full text-amber-800/70 hover:bg-amber-100 hover:text-amber-950"
                aria-label="Cancel purchase"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mobile section tabs */}
      <nav
        className={`lg:hidden fixed left-0 right-0 z-40 h-14 bg-white/95 backdrop-blur-md border-b border-stone-200 ${pendingPlan ? 'top-[7.25rem]' : 'top-16'}`}
        aria-label="Dashboard sections"
      >
        <div className="h-full flex items-center gap-1.5 overflow-x-auto px-3 scrollbar-none">
          {DASHBOARD_NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#7f4e1c] text-white shadow-sm'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-[#7f4e1c]'}>{SIDEBAR_TAB_ICONS[item.id]}</span>
                {item.sidebarLabel}
              </button>
            );
          })}
        </div>
      </nav>

      <div className={`flex flex-1 w-full min-h-0 ${pendingPlan ? 'pt-24 lg:pt-16' : 'pt-16'}`}>
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col fixed top-16 left-0 bottom-0 w-72 border-r border-stone-200 bg-white z-40">
          <div className="flex flex-col h-full min-h-0 p-5">
            <div className="shrink-0 flex flex-col items-center text-center pb-4 mb-4 border-b border-stone-100">
              <div className="w-16 h-16 bg-gradient-to-br from-[#80501f] to-[#593610] text-white rounded-2xl flex items-center justify-center font-display font-bold text-2xl mb-2.5 shadow-[0_4px_10px_rgba(127,78,28,0.2)] overflow-hidden">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user?.name || 'User'} className="w-full h-full object-cover" />
                ) : (
                  (user?.name ? user.name.charAt(0).toUpperCase() : 'U')
                )}
              </div>
              <h3 className="font-bold text-stone-900 w-full truncate px-1 text-sm">{user?.name || 'User'}</h3>
              <p className="text-[11px] text-stone-500 truncate w-full px-1 mt-0.5">{user?.email || ''}</p>
              <p className="text-[11px] font-semibold text-[#7f4e1c] mt-2">{formatINR(user.balance)}</p>
            </div>

            <nav className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex flex-col gap-1 pr-0.5 scrollbar-none">
              {DASHBOARD_NAV_ITEMS.map((item) => (
                <React.Fragment key={item.id}>
                  <TabButton
                    active={activeTab === item.id}
                    onClick={() => setActiveTab(item.id)}
                    label={item.sidebarLabel}
                    icon={SIDEBAR_TAB_ICONS[item.id]}
                    compact
                  />
                </React.Fragment>
              ))}
            </nav>

            <button
              type="button"
              onClick={logout}
              className="shrink-0 mt-4 flex items-center justify-center gap-2 w-full text-sm font-semibold text-stone-500 hover:text-red-600 hover:bg-red-50/80 transition-colors pt-4 border-t border-stone-100 cursor-pointer rounded-xl py-2.5"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 w-full min-w-0 lg:ml-72 mt-14 lg:mt-0 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 space-y-5 sm:space-y-6 max-w-[1200px] xl:max-w-[1320px] lg:mx-auto">
            
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 sm:space-y-6">
                 <header className="space-y-1">
                   <h2 className="font-display font-bold text-xl sm:text-2xl text-stone-900">Account Overview</h2>
                   <p className="text-sm text-stone-500">Wallet balance, returns, and quick actions</p>
                 </header>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                   {/* Balance Card */}
                   <div className="bg-gradient-to-br from-[#7b3f08] to-[#b86a1f] text-white rounded-3xl p-6 shadow-md">
                      <div className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-2">Available Wallet Balance</div>
                      <div className="text-4xl font-display font-bold">₹{user.balance.toLocaleString('en-IN')}</div>
                      <div className="mt-6 flex justify-between gap-3">
                         <button onClick={() => setActiveTab('wallet')} className="flex-1 bg-white/20 hover:bg-white/30 transition shadow-sm rounded-xl py-2 flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer">
                           <ArrowDownRight className="w-4 h-4" /> Deposit
                         </button>
                         <button onClick={() => setActiveTab('wallet')} className="flex-1 bg-black/20 hover:bg-black/30 transition shadow-sm rounded-xl py-2 flex items-center justify-center gap-1.5 text-xs font-semibold cursor-pointer">
                           <ArrowUpRight className="w-4 h-4" /> Withdraw
                         </button>
                      </div>
                   </div>

                   {/* Active Investments */}
                   <div className="bg-white border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-2">Total Invested</div>
                        <div className="text-3xl font-display font-bold text-bark">₹{(user.investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0).toLocaleString('en-IN')}</div>
                      </div>
                      <button onClick={() => setActiveTab('investments')} className="mt-4 text-[#7b3f08] hover:text-[#502905] text-sm font-semibold flex items-center gap-1 underline underline-offset-4 cursor-pointer">
                         View active plans
                      </button>
                   </div>
                   
                   {/* Total Returns */}
                   <div className="bg-white border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-2">Total Earnings</div>
                        <div className="text-3xl font-display font-bold text-[#10b981]">₹{((user.investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0) * 0.05).toLocaleString('en-IN')}</div>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                         <Clock className="w-4 h-4" /> Next payout in 30 days
                      </div>
                   </div>
                 </div>

                 {/* Earnings Projections Chart */}
                 <div className="bg-white border border-border rounded-3xl p-6 shadow-sm mt-6 hidden sm:block">
                   <h3 className="font-bold text-lg mb-6">Cumulative Earnings Projections (60 Months)</h3>
                   <div className="h-[300px] w-full font-sans">
                     <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                         <XAxis 
                           dataKey="month" 
                           axisLine={false} 
                           tickLine={false} 
                           tick={{ fill: '#6b7280', fontSize: 12 }} 
                           dy={10}
                         />
                         <YAxis 
                           axisLine={false} 
                           tickLine={false} 
                           tick={{ fill: '#6b7280', fontSize: 12 }}
                           tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                           dx={-10}
                         />
                         <Tooltip 
                           formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Earnings']}
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                         />
                         <Line 
                           type="monotone" 
                           dataKey="earnings" 
                           stroke="#d4af37" 
                           strokeWidth={3}
                           dot={{ fill: '#d4af37', strokeWidth: 2, r: 4 }}
                           activeDot={{ r: 6, fill: '#7b3f08' }}
                         />
                       </LineChart>
                     </ResponsiveContainer>
                   </div>
                 </div>

                 {/* Available Plans on Overview */}
                 {kycVerified && (
                 <div className="bg-gradient-warm border border-[#f0e6da] rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm">
                   <h3 className="font-bold text-lg sm:text-xl mb-4 text-[#8b4513]">Available Investment Plans</h3>
                   {renderPlanCards('grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4')}
                 </div>
                 )}

                 {/* Notifications */}
                 {!(user.kycStatus === 'verified' || user.isKycVerified) && (
                   <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
                     <ShieldAlert className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                     <div>
                       <h4 className="font-semibold text-orange-800">{user.kycStatus === 'submitted' ? 'KYC Under Review' : 'Complete your KYC'}</h4>
                       <p className="text-sm text-orange-700 mt-1">{user.kycStatus === 'submitted' ? 'Your identity document assets have been submitted and are pending physical verification and administrative approval.' : 'To start investing and withdrawing your earnings, you must complete the identity verification process.'}</p>
                       <button onClick={() => setActiveTab('kyc')} className="mt-3 text-sm font-semibold text-orange-800 bg-orange-200/50 hover:bg-orange-200 px-4 py-1.5 rounded-lg transition-colors cursor-pointer font-sans">{user.kycStatus === 'submitted' ? 'Track Status' : 'Verify Now'}</button>
                     </div>
                   </div>
                 )}
              </motion.div>
            )}

            {activeTab === 'wallet' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 sm:space-y-6">
                 <header className="space-y-1">
                   <h2 className="font-display font-bold text-xl sm:text-2xl text-stone-900">Wallet & Transfers</h2>
                   <p className="text-sm text-stone-500">Deposit funds or request withdrawals</p>
                 </header>
                 <div className="bg-white border border-border rounded-3xl p-6 shadow-sm">
                    <p className="text-sm text-muted-foreground mb-1 font-sans">Current Balance</p>
                    <p className="text-3xl font-display font-bold text-bark">₹{user.balance.toLocaleString('en-IN')}</p>
                    <div className="mt-4 p-3 bg-secondary/50 rounded-xl flex items-center gap-3 font-sans">
                       <Wallet className="text-[#a16224] w-5 h-5 shrink-0" />
                       <div className="overflow-hidden">
                         <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Your Gaulaxmi ID (Wallet Address)</p>
                         <p className="text-xs font-mono truncate">{user.walletAddress}</p>
                       </div>
                    </div>
                 </div>

                 <DepositSection
                   kycVerified={kycVerified}
                   onViewTransactionHistory={() => setActiveTab('transactions')}
                 />

                 <WithdrawSection
                   kycVerified={kycVerified}
                   kycStatus={user.kycStatus}
                   balance={user.balance}
                   onViewTransactionHistory={() => setActiveTab('transactions')}
                 />
              </motion.div>
            )}

            {activeTab === 'investments' && (
               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 sm:space-y-6">
                 <header className="space-y-1">
                   <h2 className="font-display font-bold text-xl sm:text-2xl text-stone-900">My Investments</h2>
                   <p className="text-sm text-stone-500">Active plans and new tier options</p>
                 </header>
                   <div className="space-y-6 font-sans">
                      {(!user.investments || user.investments.length === 0) ? (
                         <div className="bg-white border border-border border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-sm">
                           <CheckCircle className="w-12 h-12 text-border mb-4 animate-bounce" />
                           <h3 className="font-bold text-lg mb-2">No Active Plans Yet</h3>
                           <p className="text-sm text-muted-foreground max-w-sm mb-6 font-sans">You currently have no active investments. Start investing from your wallet balance to earn 5% monthly ROI.</p>
                         </div>
                      ) : (
                         <div className="space-y-4">
                            <TableListToolbar
                              dateFilter={investmentsList.dateFilter}
                              onDateFilterChange={investmentsList.setDateFilter}
                              sortOrder={investmentsList.sortOrder}
                              onSortOrderChange={investmentsList.setSortOrder}
                            />
                            <div className="grid sm:grid-cols-2 gap-4">
                            {investmentsList.paginated.map((inv, idx) => (
                              <div key={idx} className="bg-white border border-[#eae0d5]/85 rounded-2xl p-5 shadow-sm">
                                 <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 font-mono">Investment ID: {inv.id}</div>
                                 <div className="font-display font-bold text-xl text-bark">{inv.planName}</div>
                                 <div className="flex justify-between items-center mt-4 gap-2">
                                    <div className="text-emerald-600 font-extrabold text-[#7f4e1c]">₹{inv.amount.toLocaleString('en-IN')}</div>
                                    <div className="text-xs text-muted-foreground">{new Date(inv.date).toLocaleDateString()}</div>
                                 </div>
                                 <div className="mt-4 pt-3 border-t border-stone-100">
                                   <DetailsActionButton onClick={() => setSelectedInvestment(inv)} />
                                 </div>
                              </div>
                            ))}
                         </div>
                         <TablePagination
                           currentPage={investmentsList.page}
                           totalPages={investmentsList.totalPages}
                           onPageChange={investmentsList.setPage}
                           totalItems={investmentsList.total}
                           itemsPerPage={investmentsList.pageSize}
                           label="investments"
                         />
                      </div>
                      )}

                      <div className="bg-gradient-warm border border-[#eae0d5]/85 rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm">
                        <h3 className="font-bold text-lg sm:text-xl mb-4 text-[#8b4513]">Available Investment Plans</h3>
                        {!kycVerified && (
                          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
                            {user.kycStatus === 'submitted'
                              ? 'KYC is under review. You can still start the purchase journey; investment completes after approval and wallet funding.'
                              : 'Complete each step in the purchase journey (including KYC) before your investment is confirmed.'}
                          </p>
                        )}
                        {renderPlanCards('grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4')}
                      </div>
                   </div>
               </motion.div>
            )}

            {activeTab === 'progress' && user && (
              <InvestmentProgressTab
                investments={user.investments || []}
                onViewDetails={setSelectedInvestment}
                onBrowsePlans={() => setActiveTab('investments')}
              />
            )}

            {activeTab === 'transactions' && (
              <>
                <WalletTransactionHistory
                  transactions={walletTransactions}
                  onViewDetails={setSelectedTransaction}
                />
                {selectedTransaction && (
                  <WalletTransactionDetailModal
                    transaction={selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                  />
                )}
              </>
            )}

            {activeTab === 'referrals' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 sm:space-y-6">
                <header className="space-y-1">
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-stone-900">Refer & Earn Rewards</h2>
                  <p className="text-sm text-balance text-muted-foreground font-sans">
                    Invite friends to join Gaulaxmi and earn high yielding referral bonuses upon their successful subscription activation.
                  </p>
                </header>

                {/* Referral Link & Social Sharing Block */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
                  <div className="lg:col-span-2 bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
                    <div className="space-y-4">
                      <h3 className="font-display font-bold text-lg text-stone-900 font-sans">Your Referral Invite Link</h3>
                      <p className="text-sm text-muted-foreground font-sans">
                        Copy and share this unique URL with your contacts. Your bonuses accumulate directly inside your wallet.
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-mono text-stone-700 select-all overflow-hidden truncate">
                          {user.referralLink || `https://gaulaxmi.com/ref/${user.id}`}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(user.referralLink || `https://gaulaxmi.com/ref/${user.id}`);
                            toast.success('Referral URL copied to clipboard!', {
                              style: {
                                background: '#333',
                                color: '#fff',
                                borderRadius: '12px',
                              }
                            });
                          }}
                          className="px-5 py-3 bg-[#7f4e1c] text-white hover:bg-[#6c4116] rounded-xl font-semibold flex items-center justify-center gap-2 transition shrink-0 active:scale-95 text-xs font-sans cursor-pointer"
                        >
                          <Copy className="w-4 h-4" /> Copy Link
                        </button>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-stone-100 font-sans">
                      <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-3">Quick Social Sharing</span>
                      <div className="flex flex-wrap gap-3">
                        {/* WhatsApp */}
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                            `Hey! Join Gaulaxmi and start earning 5% monthly ROI on secure dairy investment programs. Here is my exclusive referral link: ${user.referralLink || "https://gaulaxmi.com/ref/" + user.id}`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-semibold border border-emerald-100 transition duration-200"
                        >
                          <MessageCircle className="w-4 h-4 shrink-0 fill-emerald-700 text-emerald-50" /> WhatsApp
                        </a>

                        {/* Telegram */}
                        <a
                          href={`https://t.me/share/url?url=${encodeURIComponent(
                            user.referralLink || `https://gaulaxmi.com/ref/${user.id}`
                          )}&text=${encodeURIComponent(
                            "Join Gaulaxmi and activate secure dairy investment programs to earn 5% monthly!"
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 px-4 py-2.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-xl text-xs font-semibold border border-sky-100 transition duration-200"
                        >
                          <Send className="w-4 h-4 shrink-0 fill-sky-700 text-sky-50" /> Telegram
                        </a>

                        {/* Email */}
                        <a
                          href={`mailto:?subject=${encodeURIComponent(
                            "Exclusive Invite: Gaulaxmi Program Support"
                          )}&body=${encodeURIComponent(
                            `Hi, check out Gaulaxmi, a dairy investment program earning 5% monthly return on cow assets.\n\nSign up using my invite link:\n${user.referralLink || "https://gaulaxmi.com/ref/" + user.id}`
                          )}`}
                          className="flex items-center gap-2.5 px-4 py-2.5 bg-stone-50 text-stone-700 hover:bg-stone-100 rounded-xl text-xs font-semibold border border-stone-200 transition duration-200"
                        >
                          <Mail className="w-4 h-4 shrink-0 text-stone-700" /> Share via Email
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* QR Core Code Card */}
                  <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center font-sans">
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-4">Fast Mobile Sign up</span>
                    <div className="p-3 bg-stone-50 border border-stone-200/80 rounded-2xl">
                      <QRCodeSVG value={user.referralLink || `https://gaulaxmi.com/ref/${user.id}`} size={140} fgColor="#7f4e1c" level="M" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 font-medium px-4">
                      Let your friends scan this code on their mobile device to sign up.
                    </p>
                  </div>
                </div>

                {/* Referral Stats Cards Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans">
                  <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
                    <span className="text-muted-foreground text-xs block font-bold uppercase tracking-wide font-sans">Total Referred</span>
                    <span className="text-3xl font-display font-bold text-stone-800 mt-1 block">{user.referrals?.length || 0}</span>
                  </div>
                  
                  <div className="bg-white border border-[#10b981]/20 rounded-2xl p-5 shadow-sm">
                    <span className="text-emerald-700 text-xs block font-bold uppercase tracking-wide font-sans">Active Members</span>
                    <span className="text-3xl font-display font-bold text-emerald-600 mt-1 block">
                      {user.referrals?.filter(r => r.status === 'active').length || 0}
                    </span>
                  </div>

                  <div className="bg-white border border-orange-200 rounded-2xl p-5 shadow-sm">
                    <span className="text-amber-700 text-xs block font-bold uppercase tracking-wide font-sans">Pending Signups</span>
                    <span className="text-3xl font-display font-bold text-amber-600 mt-1 block">
                      {user.referrals?.filter(r => r.status === 'pending').length || 0}
                    </span>
                  </div>

                  <div className="bg-[#fcfaf7] border border-[#f0e6da] rounded-2xl p-5 shadow-sm">
                    <span className="text-[#7f4e1c] text-xs block font-bold uppercase tracking-wide font-sans">Total Earnings</span>
                    <span className="text-3xl font-display font-bold text-[#7f4e1c] mt-1 block">
                      ₹{(user.referrals?.reduce((sum, r) => sum + (r.bonusEarned || 0), 0) || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Detailed Referrals List Block */}
                <div className="bg-white border border-stone-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 font-sans">
                    <div>
                      <h3 className="font-display font-bold text-lg text-stone-900 font-sans">Referred Members Directory</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 font-sans">Track signups and payout status of direct node connections.</p>
                    </div>

                  </div>

                  <TableListToolbar
                    searchInput={referralsList.searchInput}
                    onSearchChange={referralsList.setSearchInput}
                    searchPlaceholder="Search connections…"
                    filters={[
                      { id: 'all', label: 'All' },
                      { id: 'active', label: 'Active' },
                      { id: 'pending', label: 'Pending' },
                    ]}
                    filter={referralsList.filter}
                    onFilterChange={referralsList.setFilter}
                    dateFilter={referralsList.dateFilter}
                    onDateFilterChange={referralsList.setDateFilter}
                    sortOrder={referralsList.sortOrder}
                    onSortOrderChange={referralsList.setSortOrder}
                    showDateRange={referralsList.showDateRange}
                    showSort={referralsList.showSort}
                  />

                  {referralsList.total === 0 ? (
                    <div className="text-center py-12 text-stone-500 border border-stone-150 border-dashed rounded-2xl bg-stone-50/50 font-sans">
                      <Users className="w-8 h-8 text-stone-300 mx-auto mb-2 animate-pulse" />
                      <p className="text-sm font-medium animate-pulse">No referral connections matches active criteria</p>
                      <p className="text-xs text-muted-foreground mt-0.5 bg-stone-50 font-sans">Share your links to start onboarding users now.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 font-sans max-w-full">
                      <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm font-sans">
                        <thead>
                          <tr className="border-b border-stone-200 pb-3 text-stone-400 text-[11px] uppercase tracking-wider font-semibold font-sans">
                            <th className="pb-3 pl-2">Member</th>
                            <th className="pb-3 text-center">Referral ID</th>
                            <th className="pb-3 text-center">Status</th>
                            <th className="pb-3 text-right pr-2">Cash Bonus</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100">
                          {referralsList.paginated.map((ref) => (
                            <tr key={ref.id} className="group hover:bg-stone-50/60 transition-colors">
                              <td className="py-3.5 pl-2 flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                                  ref.status === 'active' 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                                }`}>
                                  {ref.friendName.charAt(0)}
                                </div>
                                <span className="font-semibold text-stone-800">{ref.friendName}</span>
                              </td>
                              <td className="py-3.5 text-center text-xs font-mono text-stone-500">
                                #REF-{ref.id.padStart(4, '0')}
                              </td>
                              <td className="py-3.5 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${
                                  ref.status === 'active'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-150 font-semibold'
                                  : 'bg-amber-50 text-amber-700 border-amber-150 font-semibold'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${ref.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                  {ref.status}
                                </span>
                              </td>
                              <td className={`py-3.5 text-right pr-2 font-display font-extrabold ${ref.status === 'active' ? 'text-emerald-700' : 'text-stone-400'}`}>
                                {ref.status === 'active' ? `+ ₹${ref.bonusEarned.toLocaleString('en-IN')}` : '₹0'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <TablePagination
                      currentPage={referralsList.page}
                      totalPages={referralsList.totalPages}
                      onPageChange={referralsList.setPage}
                      totalItems={referralsList.total}
                      itemsPerPage={referralsList.pageSize}
                      label="connections"
                    />
                  </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'support' && <HelpSupportSection />}

            {activeTab === 'kyc' && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 sm:space-y-6 w-full max-w-4xl">
                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                   <div>
                     <h2 className="font-display font-bold text-xl sm:text-2xl text-stone-900 tracking-tight flex items-center gap-2 flex-wrap">
                       <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-[#7f4e1c] shrink-0" /> Secure Identity Verification (KYC)
                     </h2>
                     <p className="text-sm text-stone-500 font-sans mt-0.5">Official regulatory identification verify engine for GauLaxmi cattle pools</p>
                   </div>
                   <div className="flex items-center gap-1.5 text-xs text-stone-500 font-mono bg-stone-100 px-3 py-1.5 rounded-full border border-stone-200 self-start sm:self-center">
                     <Lock className="w-3.5 h-3.5 text-stone-400" /> AES-256 Secured Transmission
                   </div>
                 </div>

                 <div className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm max-w-3xl overflow-hidden relative">
                    {/* Top Accent Strip */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-700 to-[#7f4e1c]"></div>

                    {user.kycStatus === 'verified' ||
                    user.isKycVerified ||
                    user.kycStatus === 'submitted' ? (
                      <KycInvestorCertificate
                        accountName={user.kycDetails?.fullName || user.name}
                        certificateId={
                          user.kycVerificationNumber ||
                          buildKycCertificateId(user.id, user.kycDetails?.phone || user.phone)
                        }
                        status={
                          user.kycStatus === 'verified' || user.isKycVerified
                            ? 'approved'
                            : 'pending'
                        }
                        issuedAt={user.kycDetails?.submittedAt || new Date().toISOString()}
                      />
                    ) : user.kycStatus === 'rejected' ? (
                      <div className="space-y-4">
                        <KycInvestorCertificate
                          accountName={user.kycDetails?.fullName || user.name}
                          certificateId={
                            user.kycVerificationNumber ||
                            buildKycCertificateId(user.id, user.kycDetails?.phone || user.phone)
                          }
                          status="rejected"
                          issuedAt={user.kycDetails?.submittedAt || new Date().toISOString()}
                          rejectionReason={user.kycRejectionReason}
                        />
                        <p className="text-sm text-center text-stone-600">
                          Update your details below and submit again.
                        </p>
                      </div>
                    ) : null}

                    {user.kycStatus !== 'verified' &&
                    !user.isKycVerified &&
                    user.kycStatus !== 'submitted' && (
                       <div className="space-y-6 font-sans">
                          {/* Step Progress Bar */}
                          <div className="relative pb-6 border-b border-stone-150">
                            <div className="flex justify-between items-center relative z-10">
                              {[1, 2, 3, 4].map((step) => (
                                <div key={step} className="flex flex-col items-center">
                                  <button
                                    onClick={() => {
                                      if (step < kycStep) setKycStep(step);
                                    }}
                                    disabled={step >= kycStep}
                                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs font-mono transition-all duration-300 relative z-30 ${
                                      step === kycStep
                                        ? 'bg-[#7f4e1c] text-white ring-4 ring-[#7f4e1c]/15 shadow-sm scale-105'
                                        : step < kycStep
                                        ? 'bg-emerald-500 text-white shadow-sm hover:opacity-90'
                                        : 'bg-stone-100 text-stone-400 border border-stone-250'
                                    }`}
                                  >
                                    {step < kycStep ? <Check className="w-4 h-4 text-white font-extrabold" /> : step}
                                  </button>
                                  <span className={`text-[10px] mt-2 font-semibold uppercase tracking-wider ${
                                    step === kycStep ? 'text-[#7f4e1c]' : step < kycStep ? 'text-emerald-500' : 'text-stone-400'
                                  }`}>
                                    {step === 1 && "Personal"}
                                    {step === 2 && "Document"}
                                    {step === 3 && "Address"}
                                    {step === 4 && "Review"}
                                  </span>
                                </div>
                              ))}
                            </div>
                            {/* Connector Line behind */}
                            <div className="absolute top-[18px] left-6 right-6 h-[2px] bg-stone-100 -z-0">
                              <div 
                                className="h-full bg-gradient-to-r from-emerald-500 to-[#7f4e1c] transition-all duration-500"
                                style={{ width: `${((Math.min(kycStep, 4) - 1) / 3) * 100}%` }}
                              />
                            </div>
                          </div>

                          {/* Step 1: Personal Info */}
                          {kycStep === 1 && (
                            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                              <div>
                                <h4 className="font-bold text-base text-stone-850">Personal Details</h4>
                                <p className="text-xs text-stone-500">Provide your basic profile details below. Ensure they match your legal identity document card.</p>
                              </div>

                              <div className="space-y-3.5 bg-stone-50/50 border border-stone-150 rounded-2xl p-4.5 sm:p-5">
                                <div className="space-y-1">
                                  <label className="text-xs font-bold uppercase text-stone-550 block tracking-wide">Full Legal Name</label>
                                  <input 
                                    type="text" 
                                    value={kycForm.fullName} 
                                    onChange={(e) => setKycForm({...kycForm, fullName: e.target.value})}
                                    className="w-full bg-white border border-stone-250 focus:border-[#7f4e1c] focus:ring-4 focus:ring-[#7f4e1c]/5 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none"
                                    placeholder="e.g. Rahul Sharma"
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                  <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-stone-550 block tracking-wide">Date of Birth</label>
                                    <input 
                                      type="date" 
                                      value={kycForm.dob} 
                                      onChange={(e) => setKycForm({...kycForm, dob: e.target.value})}
                                      className="w-full bg-white border border-stone-250 focus:border-[#7f4e1c] focus:ring-4 focus:ring-[#7f4e1c]/5 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-stone-550 block tracking-wide">Gender</label>
                                    <select 
                                      value={kycForm.gender} 
                                      onChange={(e) => setKycForm({...kycForm, gender: e.target.value})}
                                      className="w-full bg-white border border-stone-250 focus:border-[#7f4e1c] focus:ring-4 focus:ring-[#7f4e1c]/5 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none cursor-pointer"
                                    >
                                      <option value="">Select Gender</option>
                                      <option value="Male">Male</option>
                                      <option value="Female">Female</option>
                                      <option value="Other">Other</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-xs font-bold uppercase text-stone-550 block tracking-wide">Active Mobile Number</label>
                                  <input 
                                    type="tel" 
                                    value={kycForm.phone} 
                                    onChange={(e) => setKycForm({...kycForm, phone: e.target.value})}
                                    className="w-full bg-white border border-stone-250 focus:border-[#7f4e1c] focus:ring-4 focus:ring-[#7f4e1c]/5 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none"
                                    placeholder="Enter your active mobile phone number"
                                  />
                                </div>
                              </div>

                              <div className="pt-4 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!isValidName(kycForm.fullName)) {
                                      toast.error('Enter your full legal name (at least 2 letters).');
                                      return;
                                    }
                                    if (!kycForm.dob || !isAdult(kycForm.dob)) {
                                      toast.error('Enter a valid date of birth (you must be 18 or older).');
                                      return;
                                    }
                                    if (!kycForm.gender) {
                                      toast.error('Please select your gender.');
                                      return;
                                    }
                                    if (!isValidIndianPhone(kycForm.phone)) {
                                      toast.error('Enter a valid 10-digit Indian mobile number.');
                                      return;
                                    }
                                    setKycForm({ ...kycForm, phone: normalizeIndianPhone(kycForm.phone) });
                                    setKycStep(2);
                                  }}
                                  className="bg-[#7f4e1c] text-white hover:bg-[#633a13] font-semibold px-6 py-2.5 rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer text-sm shadow-sm"
                                >
                                  Next Step <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>
                          )}

                          {/* Step 2: Document Upload */}
                          {kycStep === 2 && (
                            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                              <div>
                                <h4 className="font-bold text-base text-stone-850">Document Details & Proof</h4>
                                <p className="text-xs text-stone-500">Provide official identification proofs to complete regulatory status checks.</p>
                              </div>

                              <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50/50 border border-stone-150 rounded-2xl p-4.5">
                                  <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-stone-550 block tracking-wide">Identity Document Type</label>
                                    <select 
                                      value={kycForm.docType} 
                                      onChange={(e) => setKycForm({...kycForm, docType: e.target.value, docNumber: ''})}
                                      className="w-full bg-white border border-stone-250 focus:border-[#7f4e1c] focus:ring-4 focus:ring-[#7f4e1c]/5 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none cursor-pointer"
                                    >
                                      <option value="PAN">PAN Card (Permanent Account Number)</option>
                                      <option value="Aadhaar">Aadhaar Card (UIDAI)</option>
                                      <option value="Passport">Passport Identity Book</option>
                                    </select>
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-stone-550 block tracking-wide">
                                      {kycForm.docType} ID Number
                                    </label>
                                    <input 
                                      type="text" 
                                      value={kycForm.docNumber} 
                                      onChange={(e) => setKycForm({...kycForm, docNumber: e.target.value.toUpperCase()})}
                                      className="w-full bg-white border border-stone-250 focus:border-[#7f4e1c] focus:ring-4 focus:ring-[#7f4e1c]/5 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none font-mono tracking-wider placeholder-stone-400"
                                      placeholder={
                                        kycForm.docType === 'PAN' ? 'ABCDE1234F' : 
                                        kycForm.docType === 'Aadhaar' ? '1234 5678 9012' : 'A1234567'
                                      }
                                    />
                                  </div>
                                </div>

                                {/* Drag and Drop File Upload Mock Box */}
                                <div className="space-y-1">
                                  <label className="text-xs font-bold uppercase text-stone-550 block tracking-wide">Upload Identity Copy</label>
                                  <div 
                                    onClick={() => {
                                      const mockFileNames: Record<'PAN' | 'Aadhaar' | 'Passport', string> = {
                                        'PAN': 'pan_card_national_id.jpg',
                                        'Aadhaar': 'aadhaar_both_sides_copy.pdf',
                                        'Passport': 'passport_travel_biodata.png'
                                      };
                                      setKycForm({
                                        ...kycForm, 
                                        docFileName: mockFileNames[kycForm.docType as 'PAN' | 'Aadhaar' | 'Passport'],
                                        docFileUrl: 'https://images.unsplash.com/photo-1554774853-aae0a22c8aa4'
                                      });
                                      toast.success(`${kycForm.docType} copy uploaded successfully (Simulation Mode)`);
                                    }}
                                    className="border-2 border-dashed border-stone-250 hover:border-[#7f4e1c] bg-stone-50/50 hover:bg-[#7f4e1c]/5 rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 group relative overflow-hidden"
                                  >
                                    {kycForm.docFileName ? (
                                      <div className="flex flex-col items-center gap-1.5 font-sans py-2">
                                        <div className="w-12 h-12 bg-amber-50 text-[#7f4e1c] rounded-full flex items-center justify-center border border-amber-200 shadow-inner">
                                           <FileText className="w-6 h-6" />
                                        </div>
                                        <span className="text-xs font-bold text-stone-850 mt-1">{kycForm.docFileName}</span>
                                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full mt-1">
                                          <Check className="w-3.5 h-3.5 font-black" /> Securely Attached
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="flex flex-col items-center gap-1.5 font-sans py-2">
                                        <Upload className="w-10 h-10 text-stone-400 group-hover:text-[#7f4e1c] group-hover:scale-110 transition duration-200 mb-1" />
                                        <span className="text-xs font-bold text-stone-750 font-sans">Click to scan / drag & drop security photo</span>
                                        <span className="text-[10px] text-stone-450 font-sans">Supports PDF, PNG, JPG, or PDF copies up to 10MB</span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Dynamic ID mock graphics widget */}
                                {kycForm.docNumber && (
                                  <div className={`rounded-2xl p-5 border text-white font-sans overflow-hidden shadow-md relative mt-4 ${
                                    kycForm.docType === 'PAN' 
                                      ? 'bg-gradient-to-tr from-stone-900 to-cyan-900 border-cyan-800'
                                      : kycForm.docType === 'Aadhaar'
                                      ? 'bg-gradient-to-tr from-stone-900 to-amber-900 border-amber-800'
                                      : 'bg-gradient-to-tr from-stone-900 to-stone-800 border-stone-705'
                                  }`}>
                                    <div className="absolute right-3 top-3 opacity-10">
                                      <ShieldCheck className="w-28 h-28" />
                                    </div>
                                    
                                    <div className="flex justify-between items-start mb-5">
                                      <div className="space-y-0.5">
                                        <span className="text-[8px] tracking-widest font-mono text-stone-300 font-semibold uppercase">SECURE NATIONAL IDENTITY CARD PREVIEW</span>
                                        <h5 className="font-bold text-xs tracking-wide text-white uppercase">
                                          {kycForm.docType === 'PAN' ? 'TAX INLAND REVENUE AUTHORITY' : kycForm.docType === 'Aadhaar' ? 'UNIQUE IDENTIFICATION PLATFORM' : 'PASSPORT REGULATORY BOOK'}
                                        </h5>
                                      </div>
                                      <div className="text-[8px] bg-white/10 text-white border border-white/20 px-2 py-0.5 rounded uppercase font-mono font-bold tracking-wider">
                                        STANDBY ENVELOPE
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 mt-4">
                                      <div className="col-span-2 space-y-3">
                                        <div>
                                          <div className="text-[8px] uppercase tracking-wider text-stone-350">CARDHOLDER NAME</div>
                                          <div className="font-display font-black text-sm uppercase text-amber-200 tracking-wide mt-0.5">{kycForm.fullName || 'FULL NAME'}</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                             <div className="text-[8px] uppercase tracking-wider text-stone-350">STATUS CHECK</div>
                                             <div className="font-bold text-[10px] text-amber-300 flex items-center gap-1 mt-0.5">
                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> PENDING_APPROVAL
                                             </div>
                                          </div>
                                          <div>
                                             <div className="text-[8px] uppercase tracking-wider text-[#bbb]">ORIGIN ATTACHMENT</div>
                                             <div className="font-bold text-[10px] text-stone-105 truncate mt-0.5">{kycForm.docFileName || 'NO FILE'}</div>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex flex-col items-center justify-center bg-stone-950/40 p-2.5 rounded-xl border border-white/5 space-y-1">
                                         <div className="w-8 h-8 rounded-full border border-white/15 bg-white/5 flex items-center justify-center text-xs font-bold text-amber-200">
                                            {kycForm.fullName ? kycForm.fullName.charAt(0).toUpperCase() : 'U'}
                                         </div>
                                         <span className="text-[7px] text-center text-stone-400 font-mono tracking-widest leading-none">BIOMETRIC SYNCED</span>
                                      </div>
                                    </div>

                                    <div className="border-t border-white/10 mt-4 pt-3.5 flex justify-between items-center text-[9px] font-mono text-stone-350">
                                       <span>ID: {kycForm.docNumber}</span>
                                       <span className="text-[#eee]">SYSTEM SECURED REGISTRATION DOCUMENT</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="pt-4 flex justify-between items-center">
                                <button
                                  type="button"
                                  onClick={() => setKycStep(1)}
                                  className="border border-stone-300 text-stone-600 hover:bg-stone-50 font-semibold px-5 py-2 rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer text-sm"
                                >
                                  <ChevronLeft className="w-4 h-4" /> Back
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!validateDocNumber(kycForm.docType, kycForm.docNumber)) {
                                      const hint =
                                        kycForm.docType === 'PAN'
                                          ? 'PAN format: ABCDE1234F'
                                          : kycForm.docType === 'Aadhaar'
                                          ? 'Aadhaar: 12 digits'
                                          : 'Passport: A1234567';
                                      toast.error(`Invalid ${kycForm.docType} number. ${hint}`);
                                      return;
                                    }
                                    if (!kycForm.docFileName) {
                                      toast.error('Please upload a copy of your identity document.');
                                      return;
                                    }
                                    setKycStep(3);
                                  }}
                                  className="bg-[#7f4e1c] text-white hover:bg-[#633a13] font-semibold px-6 py-2.5 rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer text-sm"
                                >
                                  Next Step <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>
                          )}

                          {/* Step 3: Address Details */}
                          {kycStep === 3 && (
                            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                              <div>
                                <h4 className="font-bold text-base text-stone-850">Residential Address</h4>
                                <p className="text-xs text-stone-500">Provide legal standard billing or residential address for local security checks.</p>
                              </div>

                              <div className="space-y-3.5 bg-stone-50/50 border border-stone-150 rounded-2xl p-4.5">
                                <div className="space-y-1">
                                  <label className="text-xs font-bold uppercase text-stone-550 block tracking-wide">Permanent Street Address</label>
                                  <textarea 
                                    rows={2}
                                    value={kycForm.address} 
                                    onChange={(e) => setKycForm({...kycForm, address: e.target.value})}
                                    className="w-full bg-white border border-stone-250 focus:border-[#7f4e1c] focus:ring-4 focus:ring-[#7f4e1c]/5 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none resize-none font-sans"
                                    placeholder="Enter full address details (House No, Street, Locality etc)"
                                  />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                  <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-stone-550 block tracking-wide">City</label>
                                    <input 
                                      type="text" 
                                      value={kycForm.city} 
                                      onChange={(e) => setKycForm({...kycForm, city: e.target.value})}
                                      className="w-full bg-white border border-stone-250 focus:border-[#7f4e1c] focus:ring-4 focus:ring-[#7f4e1c]/5 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none"
                                      placeholder="City name"
                                    />
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-xs font-bold uppercase text-stone-550 block tracking-wide">State</label>
                                    <input 
                                      type="text" 
                                      value={kycForm.state} 
                                      onChange={(e) => setKycForm({...kycForm, state: e.target.value})}
                                      className="w-full bg-white border border-stone-250 focus:border-[#7f4e1c] focus:ring-4 focus:ring-[#7f4e1c]/5 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none"
                                      placeholder="State name"
                                    />
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-xs font-bold uppercase text-stone-550 block tracking-wide">Pincode (ZIP Code)</label>
                                  <input 
                                    type="text" 
                                    maxLength={6}
                                    value={kycForm.pincode} 
                                    onChange={(e) => setKycForm({...kycForm, pincode: e.target.value.replace(/\D/g, '')})}
                                    className="w-full bg-white border border-stone-250 focus:border-[#7f4e1c] focus:ring-4 focus:ring-[#7f4e1c]/5 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none font-mono"
                                    placeholder="6-digit postal code"
                                  />
                                </div>
                              </div>

                              <div className="pt-4 flex justify-between items-center">
                                <button
                                  type="button"
                                  onClick={() => setKycStep(2)}
                                  className="border border-stone-300 text-stone-600 hover:bg-stone-50 font-semibold px-5 py-2 rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer text-sm"
                                >
                                  <ChevronLeft className="w-4 h-4" /> Back
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!kycForm.address.trim() || !kycForm.city.trim() || !kycForm.state.trim() || kycForm.pincode.length < 6) {
                                      toast.error("Please fill in standard address with correct 6-digit Pincode");
                                      return;
                                    }
                                    setKycStep(4);
                                  }}
                                  className="bg-[#7f4e1c] text-white hover:bg-[#633a13] font-semibold px-6 py-2.5 rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer text-sm"
                                >
                                  Next Step <ChevronRight className="w-4 h-4" />
                                </button>
                              </div>
                            </motion.div>
                          )}

                          {/* Step 4: Review Details & Submission */}
                          {kycStep === 4 && (
                            <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                              <div>
                                <h4 className="font-bold text-base text-stone-850">Review Submitted Data</h4>
                                <p className="text-xs text-stone-500">Verify your details before final cow slot registry submission.</p>
                              </div>

                              {/* Summary layout */}
                              <div className="bg-stone-50/70 border border-stone-200 rounded-2xl p-4.5 space-y-4 text-xs font-sans">
                                <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-b border-stone-200 pb-3">
                                  <div>
                                    <span className="text-[10px] uppercase text-stone-400 font-bold tracking-wider block">Full Name</span>
                                    <div className="font-bold text-[#7f4e1c] uppercase mt-0.5 text-sm">{kycForm.fullName}</div>
                                  </div>
                                  <div>
                                    <span className="text-[10px] uppercase text-stone-400 font-bold tracking-wider block">Date of Birth</span>
                                    <div className="font-bold text-stone-850 font-mono mt-0.5 text-sm">{kycForm.dob}</div>
                                  </div>
                                  <div>
                                    <span className="text-[10px] uppercase text-stone-400 font-bold tracking-wider block">Gender & Contact</span>
                                    <div className="font-bold text-stone-800 mt-0.5">{kycForm.gender} · {kycForm.phone}</div>
                                  </div>
                                  <div>
                                    <span className="text-[10px] uppercase text-stone-400 font-bold tracking-wider block">Document Provided</span>
                                    <div className="font-mono font-bold text-stone-850 mt-0.5 bg-amber-50 border border-amber-200/55 px-2 py-0.5 rounded inline-block text-[11px]">
                                       {kycForm.docType}: {kycForm.docNumber}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <span className="text-[10px] uppercase text-stone-400 font-bold tracking-wider block">Full Verification Address</span>
                                  <div className="font-bold text-stone-800 mt-1">
                                    {kycForm.address}, {kycForm.city}, {kycForm.state} - {kycForm.pincode}
                                  </div>
                                </div>
                              </div>

                              {/* Signature Typing */}
                              <div className="space-y-4 border-t border-stone-200 pt-4">
                                <div className="space-y-1">
                                  <label className="text-xs font-bold uppercase text-stone-550 block tracking-wide">Digital Signature (Type your full name)</label>
                                  <input 
                                    type="text" 
                                    value={kycForm.signatureName} 
                                    onChange={(e) => setKycForm({...kycForm, signatureName: e.target.value})}
                                    className="w-full bg-white border border-stone-250 focus:border-[#7f4e1c] focus:ring-4 focus:ring-[#7f4e1c]/5 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none"
                                    placeholder="Type your authentic name to digitally sign"
                                  />
                                </div>

                                {kycForm.signatureName && (
                                  <div className="border border-dashed border-[#7f4e1c]/30 rounded-2xl p-4 text-center bg-amber-50/10 shadow-inner relative overflow-hidden">
                                    <div className="absolute top-2 left-2 text-[8px] tracking-wider uppercase font-mono text-stone-400">Authenticated Signature Box</div>
                                    <div className="text-3xl font-serif text-[#7f4e1c] italic my-2 font-sans tracking-widest selective-sig-text">
                                      {kycForm.signatureName}
                                    </div>
                                    <div className="text-[9px] font-mono text-stone-400 mt-1">
                                       Digitally stamped & verified for bovine compliance pools
                                    </div>
                                  </div>
                                )}

                                {/* Declaration Agreement Checkbox */}
                                <label className="flex items-start gap-2.5 cursor-pointer select-none py-1.5 px-1 bg-stone-50 rounded-xl border border-stone-150">
                                  <input 
                                    type="checkbox" 
                                    checked={kycForm.declared} 
                                    onChange={(e) => setKycForm({...kycForm, declared: e.target.checked})}
                                    className="mt-1 border-stone-300 text-[#7f4e1c] focus:ring-[#7f4e1c] rounded w-4 h-4 cursor-pointer"
                                  />
                                  <span className="text-[11px] leading-relaxed text-stone-550 font-sans">
                                    I certify under legal penalty of Bovine Fund rules that all details and identity document copies provided are structurally genuine and belong directly to me. Unverified accounts will be restricted.
                                  </span>
                                </label>
                              </div>

                              <div className="pt-4 flex justify-between items-center">
                                <button
                                  type="button"
                                  onClick={() => setKycStep(3)}
                                  className="border border-stone-300 text-stone-600 hover:bg-stone-50 font-semibold px-5 py-2 rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer text-sm"
                                >
                                  <ChevronLeft className="w-4 h-4" /> Back
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!kycForm.signatureName.trim()) {
                                      toast.error('Please sign the declaration by typing your name.');
                                      return;
                                    }
                                    if (
                                      kycForm.signatureName.trim().toLowerCase() !==
                                      kycForm.fullName.trim().toLowerCase()
                                    ) {
                                      toast.error('Signature must match your full legal name exactly.');
                                      return;
                                    }
                                    if (!kycForm.declared) {
                                      toast.error('Please accept the declaration checkbox to submit.');
                                      return;
                                    }
                                    void (async () => {
                                      try {
                                        await submitKyc({
                                          fullName: kycForm.fullName,
                                          dob: kycForm.dob,
                                          gender: kycForm.gender,
                                          phone: kycForm.phone,
                                          docType: kycForm.docType,
                                          docNumber: kycForm.docNumber,
                                          docFileName: kycForm.docFileName || `${kycForm.docType.toLowerCase()}_file.jpg`,
                                          address: kycForm.address,
                                          city: kycForm.city,
                                          state: kycForm.state,
                                          pincode: kycForm.pincode,
                                          submittedAt: new Date().toISOString(),
                                        });
                                        setKycStep(1);
                                        toast.success('KYC submitted! An admin will review and approve your application.');
                                      } catch {
                                        toast.error('KYC submission failed.');
                                      }
                                    })();
                                  }}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 rounded-xl transition duration-150 flex items-center gap-1.5 cursor-pointer text-sm shadow-md hover:scale-[1.02]"
                                >
                                  Submit Details <Check className="w-4 h-4 text-white font-extrabold" />
                                </button>
                              </div>
                            </motion.div>
                          )}

                          <div className="border border-stone-150 bg-stone-50/50 rounded-2xl p-4 flex items-start gap-3 mt-4">
                            <Info className="w-4.5 h-4.5 bg-stone-200 text-stone-600 p-0.5 rounded-full shrink-0 mt-0.5" />
                            <p className="text-[11px] leading-relaxed text-stone-500 font-sans">
                              Cow registry systems require strict identity verification. After you submit, an admin must approve your KYC before you can deposit, withdraw, or invest.
                            </p>
                          </div>
                       </div>
                    )}
                 </div>
                 <KycSubmissionHistory />
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 sm:space-y-6 w-full max-w-5xl font-sans">
                <header className="space-y-1">
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-stone-900">My Profile</h2>
                  <p className="text-sm text-muted-foreground font-sans">View and manage your identity and account details.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {/* Left Column - Navigation Anchors */}
                  <div className="md:col-span-1 space-y-3 bg-white border border-stone-200 rounded-3xl p-5 shadow-sm h-fit md:sticky md:top-24">
                    <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-2">Profile Sections</div>
                    <a href="#personal-details" className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 rounded-xl transition duration-150">
                      <UserRound className="w-4 h-4 text-[#7f4e1c]" /> Personal Details
                    </a>
                    <a href="#network-details" className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 rounded-xl transition duration-150">
                      <Network className="w-4 h-4 text-[#7f4e1c]" /> Network Lineage
                    </a>
                  </div>

                  {/* Right Column - Profile Details */}
                  <div className="md:col-span-2 space-y-6">
                    {/* Personal Information Card */}
                    <div id="personal-details" className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-stone-100 pb-6">
                        <div className="relative group cursor-pointer shrink-0">
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setProfileImage(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            title="Upload Profile Avatar"
                          />
                          <div className="w-20 h-20 rounded-full border-2 border-stone-200 bg-[#f8f1e8] overflow-hidden flex items-center justify-center relative shadow-sm">
                            {profileImage ? (
                              <img src={profileImage} alt="Profile Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <UserRound className="w-8 h-8 text-[#7f4e1c]" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Upload className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        </div>
                        <div className="text-center sm:text-left">
                          <h3 className="font-display font-bold text-base text-stone-900">Personal Information</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Adjust display name, active email, and notification phone details.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-xs font-semibold uppercase text-stone-400">Full Name</label>
                          <input
                            type="text"
                            value={profileName}
                            onChange={(e) => setProfileName(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#7f4e1c]/50 focus:ring-1 focus:ring-[#7f4e1c]/10 transition-colors"
                            placeholder="John Doe"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase text-stone-400">Email Address</label>
                          <input
                            type="email"
                            value={profileEmail}
                            onChange={(e) => setProfileEmail(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#7f4e1c]/50 focus:ring-1 focus:ring-[#7f4e1c]/10 transition-colors"
                            placeholder="john@example.com"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase text-stone-400">Phone Number (Optional)</label>
                          <input
                            type="text"
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#7f4e1c]/50 focus:ring-1 focus:ring-[#7f4e1c]/10 transition-colors"
                            placeholder="+91 98765 43210"
                          />
                        </div>
                      </div>

                      <div className="pt-3">
                        <button
                          onClick={() => {
                            if (!isValidName(profileName)) {
                              toast.error('Enter a valid full name (at least 2 letters).');
                              return;
                            }
                            if (!isValidEmail(profileEmail)) {
                              toast.error('Enter a valid email address.');
                              return;
                            }
                            if (profilePhone.trim() && !isValidIndianPhone(profilePhone)) {
                              toast.error('Enter a valid 10-digit Indian mobile number or leave phone empty.');
                              return;
                            }
                            updateProfile(
                              profileName.trim(),
                              profileEmail.trim().toLowerCase(),
                              profilePhone.trim() ? normalizeIndianPhone(profilePhone) : '',
                              profileImage
                            );
                            toast.success('Profile details saved successfully!');
                          }}
                          className="px-5 py-2.5 bg-[#7f4e1c] text-white hover:bg-[#6c4116] rounded-xl font-semibold text-xs transition-colors shadow-sm"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>

                    <div id="network-details" className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                      <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                        <div className="w-9 h-9 rounded-full bg-[#f8f1e8] text-[#7f4e1c] flex items-center justify-center">
                          <Network className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-base text-stone-900">Network & Lineage</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Details regarding your position within the Gaulaxmi network.</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                         <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 relative overflow-hidden">
                           <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Referred By (Sponsor)</span>
                           <span className="font-bold text-stone-800 text-sm whitespace-nowrap text-ellipsis overflow-hidden">Priya Sharma (GLX-5489)</span>
                           <Users className="absolute -bottom-2 -right-2 w-16 h-16 text-stone-200/50 -rotate-12 pointer-events-none" />
                         </div>
                         <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 relative overflow-hidden">
                           <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Network Level</span>
                           <span className="font-bold text-stone-800 text-sm">Level {user?.id === 'ID-GLX-001' ? '0 (Root Node)' : '3'}</span>
                           <Network className="absolute -bottom-2 -right-2 w-16 h-16 text-stone-200/50 -rotate-12 pointer-events-none" />
                         </div>
                         <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 relative overflow-hidden">
                           <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Join Date</span>
                           <span className="font-bold text-stone-800 text-sm">October 14, 2025</span>
                           <Clock className="absolute -bottom-2 -right-2 w-16 h-16 text-stone-200/50 -rotate-12 pointer-events-none" />
                         </div>
                         <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 relative overflow-hidden">
                           <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Account Status</span>
                           <div className="flex items-center gap-1.5 font-bold text-emerald-700 text-sm">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                             Active & Yielding
                           </div>
                           <ShieldCheck className="absolute -bottom-2 -right-2 w-16 h-16 text-emerald-100/50 -rotate-12 pointer-events-none" />
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 sm:space-y-6 w-full max-w-5xl font-sans">
                <header className="space-y-1">
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-stone-900">Account Settings</h2>
                  <p className="text-sm text-muted-foreground font-sans">Update password and account preferences.</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  {/* Left Column - Navigation Anchors */}
                  <div className="md:col-span-1 space-y-3 bg-white border border-stone-200 rounded-3xl p-5 shadow-sm h-fit">
                    <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block mb-2">Settings Sections</div>
                    <a href="#security-settings" className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 rounded-xl transition duration-150">
                      <Lock className="w-4 h-4 text-[#7f4e1c]" /> Password & Security
                    </a>
                    <a href="#danger-zone" className="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition duration-150">
                      <AlertTriangle className="w-4 h-4" /> Danger Zone
                    </a>
                  </div>

                  {/* Right Column - Setup Fields */}
                  <div className="md:col-span-2 space-y-6">
                    {/* Change Password Card */}
                    <div id="security-settings" className="bg-white border border-stone-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                      <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
                        <div className="w-9 h-9 rounded-full bg-[#f8f1e8] text-[#7f4e1c] flex items-center justify-center">
                          <Lock className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-base text-stone-900">Security Credentials</h3>
                          <p className="text-xs text-muted-foreground">Modify your account login credentials securely.</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold uppercase text-stone-400">Current Password</label>
                          <input
                            type="password"
                            value={passCurrent}
                            onChange={(e) => setPassCurrent(e.target.value)}
                            className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#7f4e1c]/50 focus:ring-1 focus:ring-[#7f4e1c]/10"
                            placeholder="Enter current password"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase text-stone-400">New Password</label>
                            <input
                              type="password"
                              value={passNew}
                              onChange={(e) => setPassNew(e.target.value)}
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#7f4e1c]/50 focus:ring-1 focus:ring-[#7f4e1c]/10"
                              placeholder="Min 6 characters"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold uppercase text-stone-400">Confirm New Password</label>
                            <input
                              type="password"
                              value={passConfirm}
                              onChange={(e) => setPassConfirm(e.target.value)}
                              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#7f4e1c]/50 focus:ring-1 focus:ring-[#7f4e1c]/10"
                              placeholder="Repeat new password"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-3">
                        <button
                          onClick={() => {
                            if (!passCurrent || !passNew || !passConfirm) {
                              toast.error("Please fill all password fields");
                              return;
                            }
                            if (user?.password && passCurrent !== user.password) {
                              toast.error("Current password does not match");
                              return;
                            }
                            if (passNew.length < 6) {
                              toast.error("New password must be at least 6 characters long");
                              return;
                            }
                            if (passNew !== passConfirm) {
                              toast.error("New password and confirm password do not match");
                              return;
                            }
                            changePassword(passNew);
                            setPassCurrent('');
                            setPassNew('');
                            setPassConfirm('');
                            toast.success("Password updated successfully!");
                          }}
                          className="px-5 py-2.5 bg-[#7f4e1c] text-white hover:bg-[#6c4116] rounded-xl font-semibold text-xs transition duration-150 cursor-pointer"
                        >
                          Update Password
                        </button>
                      </div>
                    </div>

                    {/* Danger Zone Card */}
                    <div id="danger-zone" className="bg-[#fff5f5] border border-red-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                      <div className="flex items-center gap-3 border-b border-red-100 pb-4">
                        <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="font-display font-bold text-base text-red-900">Danger Zone</h3>
                          <p className="text-xs text-red-700/80">These actions have structural consequences for your local account status.</p>
                        </div>
                      </div>

                      <div className="space-y-4 text-stone-800">
                        {/* Deactivate Option */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white/80 border border-red-100 rounded-2xl">
                          <div>
                            <h4 className="font-bold text-sm text-stone-900">Temporarily Deactivate</h4>
                            <p className="text-xs text-stone-500 max-w-md mt-0.5">Temporarily lock your account. You will be logged out but your history stays preserved on login.</p>
                          </div>
                          <button
                            onClick={() => {
                              setShowDeactivateConfirm(true);
                            }}
                            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl font-semibold text-xs transition cursor-pointer shrink-0"
                          >
                            Deactivate Account...
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'hierarchy' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="w-full min-w-0">
                <HierarchyTab />
              </motion.div>
            )}
         </main>
      </div>

      {selectedInvestment && (
        <InvestmentDetailModal
          investment={selectedInvestment}
          onClose={() => setSelectedInvestment(null)}
        />
      )}

      {/* Deactivate Confirmation Popup Modal */}
      {showDeactivateConfirm && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-stone-200 p-6 rounded-3xl shadow-xl max-w-md w-full relative space-y-4 font-sans"
          >
            <button 
              onClick={() => setShowDeactivateConfirm(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-600 rounded-full p-1.5 hover:bg-stone-100 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-stone-900">Deactivate Your Account?</h3>
                <p className="text-xs text-stone-500">Temporarily lock your account status</p>
              </div>
            </div>

            <div className="text-xs text-stone-600 space-y-2 bg-stone-50 p-4 rounded-2xl border border-stone-150">
              <p className="font-bold text-stone-850">When you deactivate:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>You will be logged out of your active session safely.</li>
                <li>Your investment statistics and referral records will be preserved.</li>
                <li>You can log back in at any time to reactivate your dashboard.</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => {
                  deactivateAccount();
                  setShowDeactivateConfirm(false);
                  toast.success("Account temporarily deactivated.");
                }}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Yes, Deactivate
              </button>
              <button
                onClick={() => setShowDeactivateConfirm(false)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                No, Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}

function TabButton({
  active,
  onClick,
  label,
  icon,
  extraBadge,
  compact = false,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
  extraBadge?: string;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-between rounded-xl transition-colors shrink-0 cursor-pointer text-left w-full ${
        compact ? 'px-3 py-2.5 text-[13px]' : 'px-4 py-3 text-sm'
      } font-semibold ${active ? 'bg-[#7f4e1c] text-white' : 'text-bark/70 hover:bg-stone-100'}`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="shrink-0">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
      {extraBadge && (
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${active ? "bg-[#543310] text-[#f2e2c9]" : "bg-emerald-50 text-emerald-800 border border-emerald-250 animate-pulse"}`}>
          {extraBadge}
        </span>
      )}
    </button>
  );
}


