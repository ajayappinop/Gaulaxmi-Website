import React, { useState, useMemo } from 'react';
import { useAuth } from '../lib/auth';
import { motion } from 'motion/react';
import { Wallet, LogOut, ArrowUpRight, ArrowDownRight, ShieldCheck, ShieldAlert, CheckCircle, Clock, X, Users, Copy, MessageCircle, Send, Mail } from 'lucide-react';
import logo from "../assets/Images/gaulaxmi-logo.png";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';

type TabView = 'overview' | 'investments' | 'wallet' | 'kyc' | 'transactions' | 'referrals';

export function Dashboard({ activeTab: externalTab, onTabChange, onClose }: { activeTab?: string, onTabChange?: (tab: string) => void, onClose?: () => void }) {
  const { user, logout, deposit, withdraw, verifyKyc, invest } = useAuth();
  const [internalTab, setInternalTab] = useState<TabView>('overview');
  const activeTab = (externalTab as TabView) || internalTab;
  
  const setActiveTab = (tab: TabView) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [referralFilter, setReferralFilter] = useState<'all' | 'active' | 'pending'>('all');

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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Top Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-stone-200 fixed top-0 inset-x-0 z-50 shadow-sm">
        <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Gaulaxmi" className="h-8 w-8 object-contain shrink-0"  />
            <div className="font-display text-lg text-primary font-bold">Gaulaxmi <span className="font-sans text-xs tracking-widest text-stone-500 uppercase font-medium">Dashboard</span></div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${user.isKycVerified ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
               {user.isKycVerified ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
               {user.isKycVerified ? 'KYC Verified' : 'KYC Pending'}
            </div>
            {onClose ? (
               <button 
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary hover:bg-border transition-colors text-bark"
                aria-label="Close dashboard"
              >
                <X className="w-5 h-5" />
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="min-h-screen flex">
        
        {/* Sidebar */}
        <aside className="fixed top-16 bottom-0 left-0 w-64 border-r border-stone-200 bg-white z-50 p-6 flex flex-col">
           
             <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground font-display font-bold text-2xl mb-4">
               {user.name.charAt(0).toUpperCase()}
             </div>
             <h3 className="font-bold text-lg text-stone-900">{user.name}</h3>
             <p className="text-sm text-stone-500 truncate mb-6">{user.email}</p>
             
             <nav className="flex flex-col gap-2">
               <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} label="Overview" icon={<Wallet className="w-4 h-4" />} />
               <TabButton active={activeTab === 'investments'} onClick={() => setActiveTab('investments')} label="My Investments" icon={<CheckCircle className="w-4 h-4" />} />
               <TabButton active={activeTab === 'wallet'} onClick={() => setActiveTab('wallet')} label="Wallet & Transfers" icon={<ArrowUpRight className="w-4 h-4" />} />
               <TabButton active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} label="Transaction History" icon={<Clock className="w-4 h-4" />} />
               <TabButton active={activeTab === 'referrals'} onClick={() => setActiveTab('referrals')} label="Refer & Earn" icon={<Users className="w-4 h-4" />} />
               <TabButton active={activeTab === 'kyc'} onClick={() => setActiveTab('kyc')} label="KYC Settings" icon={<ShieldCheck className="w-4 h-4" />} />
             </nav>
             
             <button 
               onClick={logout}
               className="mt-auto flex items-center gap-2 text-sm font-semibold text-stone-500 hover:text-red-600 transition-colors pt-6 border-t border-stone-100"
             >
               <LogOut className="w-4 h-4" />
               Sign Out
             </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 ml-64 p-8 space-y-6">
           
           {activeTab === 'overview' && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="font-display font-bold text-2xl">Account Overview</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Balance Card */}
                  <div className="bg-gradient-to-br from-[#7b3f08] to-[#b86a1f] text-white rounded-3xl p-6 shadow-md">
                     <div className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-2">Available Wallet Balance</div>
                     <div className="text-4xl font-display font-bold">₹{user.balance.toLocaleString('en-IN')}</div>
                     <div className="mt-6 flex justify-between gap-3">
                        <button onClick={() => setActiveTab('wallet')} className="flex-1 bg-white/20 hover:bg-white/30 transition shadow-sm rounded-xl py-2 flex items-center justify-center gap-1.5 text-xs font-semibold">
                          <ArrowDownRight className="w-4 h-4" /> Deposit
                        </button>
                        <button onClick={() => setActiveTab('wallet')} className="flex-1 bg-black/20 hover:bg-black/30 transition shadow-sm rounded-xl py-2 flex items-center justify-center gap-1.5 text-xs font-semibold">
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
                     <button onClick={() => setActiveTab('investments')} className="mt-4 text-primary text-sm font-semibold flex items-center gap-1 underline underline-offset-4">
                        View active plans
                     </button>
                  </div>
                  
                  {/* Total Returns */}
                  <div className="bg-white border border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                     <div>
                       <div className="text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-2">Total Earnings</div>
                       <div className="text-3xl font-display font-bold text-green-600">₹{((user.investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0) * 0.05).toLocaleString('en-IN')}</div>
                     </div>
                     <div className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <Clock className="w-4 h-4" /> Next payout in 30 days
                     </div>
                  </div>
                </div>

                {/* Earnings Projections Chart */}
                <div className="bg-white border border-border rounded-3xl p-6 shadow-sm mt-6 hidden sm:block">
                  <h3 className="font-bold text-lg mb-6">Cumulative Earnings Projections (60 Months)</h3>
                  <div className="h-[300px] w-full">
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
                <div className="bg-gradient-warm border border-border rounded-3xl p-6 shadow-sm mt-8">
                  <h3 className="font-bold text-xl mb-4 text-[#8b4513]">Available Investment Plans</h3>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { name: 'Starter Plan', amount: 100000 },
                        { name: 'Basic Plan', amount: 200000 },
                        { name: 'Bronze Plan', amount: 300000 },
                    ].map(plan => (
                        <div key={plan.name} className="bg-white rounded-xl p-4 border border-[#d8cec1] shadow-sm flex flex-col justify-between">
                          <div>
                            <div className="font-semibold text-bark">{plan.name}</div>
                            <div className="font-display font-bold text-lg text-[#7f4e1c]">₹{plan.amount.toLocaleString('en-IN')}</div>
                          </div>
                          <button
                            onClick={() => {
                              if (user.balance < plan.amount) {
                                toast.error('Insufficient wallet balance. Please deposit funds first.');
                                setActiveTab('wallet');
                              } else {
                                invest(plan.name, plan.amount);
                                toast.success(`Successfully invested in ${plan.name} for ₹${plan.amount.toLocaleString('en-IN')}!`);
                              }
                            }}
                            className="mt-4 w-full bg-[#f8f1e8] text-[#7b4b1d] hover:bg-[#b07843] hover:text-white transition py-2 rounded-lg text-sm font-semibold border border-[#d8cec1]"
                          >
                            Invest Now
                          </button>
                        </div>
                    ))}
                  </div>
                </div>

                {/* Notifications */}
                {!user.isKycVerified && (
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-orange-800">Complete your KYC</h4>
                      <p className="text-sm text-orange-700 mt-1">To start investing and withdrawing your earnings, you must complete the identity verification process.</p>
                      <button onClick={() => setActiveTab('kyc')} className="mt-3 text-sm font-semibold text-orange-800 bg-orange-200/50 hover:bg-orange-200 px-4 py-1.5 rounded-lg transition-colors">Verify Now</button>
                    </div>
                  </div>
                )}
             </motion.div>
           )}

           {activeTab === 'wallet' && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="font-display font-bold text-2xl">Wallet & Transfers</h2>
                <div className="bg-white border border-border rounded-3xl p-6 shadow-sm">
                   <p className="text-sm text-muted-foreground mb-1">Current Balance</p>
                   <p className="text-3xl font-display font-bold text-bark">₹{user.balance.toLocaleString('en-IN')}</p>
                   <div className="mt-4 p-3 bg-secondary/50 rounded-xl flex items-center gap-3">
                      <Wallet className="text-primary w-5 h-5 shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Your Gaulaxmi ID (Wallet Address)</p>
                        <p className="text-xs font-mono truncate">{user.walletAddress}</p>
                      </div>
                   </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                   <div className="bg-white border border-border rounded-3xl p-6 shadow-sm space-y-4">
                     <h3 className="font-bold text-lg flex items-center gap-2"><ArrowDownRight className="w-5 h-5 text-primary" /> Deposit Funds</h3>
                     <div className="space-y-2">
                       <label className="text-xs font-semibold uppercase text-muted-foreground">Amount (INR)</label>
                       <input 
                         type="number" 
                         value={depositAmount} 
                         onChange={e => setDepositAmount(e.target.value)} 
                         className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary/50" 
                         placeholder="e.g. 100000"
                       />
                     </div>
                     <button
                       onClick={() => {
                         if(depositAmount && !isNaN(Number(depositAmount))) {
                           deposit(Number(depositAmount));
                           setDepositAmount('');
                           toast.success('Deposit successful!');
                         }
                       }}
                       className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl transition hover:opacity-90"
                     >
                       Confirm Deposit
                     </button>
                   </div>
                   
                   <div className="bg-white border border-border rounded-3xl p-6 shadow-sm space-y-4">
                     <h3 className="font-bold text-lg flex items-center gap-2"><ArrowUpRight className="w-5 h-5 text-bark" /> Withdraw Funds</h3>
                     {user.isKycVerified ? (
                       <>
                         <div className="space-y-2">
                           <label className="text-xs font-semibold uppercase text-muted-foreground">Amount (INR)</label>
                           <input 
                             type="number" 
                             value={withdrawAmount} 
                             onChange={e => setWithdrawAmount(e.target.value)} 
                             className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 outline-none focus:border-primary/50" 
                             placeholder="e.g. 5000"
                           />
                         </div>
                         <button
                           onClick={() => {
                             if(withdrawAmount && !isNaN(Number(withdrawAmount))) {
                               if (Number(withdrawAmount) > user.balance) {
                                  toast.error('Insufficient balance');
                               } else {
                                  withdraw(Number(withdrawAmount));
                                  setWithdrawAmount('');
                                  toast.success('Withdrawal request submitted!');
                               }
                             }
                           }}
                           className="w-full bg-bark text-white font-semibold py-3 rounded-xl transition hover:opacity-90"
                         >
                           Request Withdrawal
                         </button>
                       </>
                     ) : (
                       <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm mt-4">
                         Withdrawals are disabled because KYC verification is pending. Please verify your identity first.
                       </div>
                     )}
                   </div>
                 </div>
             </motion.div>
           )}

           {activeTab === 'investments' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="font-display font-bold text-2xl">My Investments</h2>
                {user.isKycVerified ? (
                  <div className="space-y-6">
                     {(!user.investments || user.investments.length === 0) ? (
                        <div className="bg-white border border-border border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-sm">
                          <CheckCircle className="w-12 h-12 text-border mb-4" />
                          <h3 className="font-bold text-lg mb-2">No Active Plans Yet</h3>
                          <p className="text-sm text-muted-foreground max-w-sm mb-6">You currently have no active investments. Start investing from your wallet balance to earn 5% monthly ROI.</p>
                        </div>
                     ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                           {user.investments.map((inv, idx) => (
                             <div key={idx} className="bg-white border border-border rounded-2xl p-5 shadow-sm">
                                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Investment ID: {inv.id}</div>
                                <div className="font-display font-bold text-xl text-bark">{inv.planName}</div>
                                <div className="flex justify-between items-center mt-4">
                                   <div className="text-green-600 font-bold">₹{inv.amount.toLocaleString('en-IN')}</div>
                                   <div className="text-xs text-muted-foreground">{new Date(inv.date).toLocaleDateString()}</div>
                                </div>
                             </div>
                           ))}
                        </div>
                     )}

                     <div className="bg-gradient-warm border border-border rounded-3xl p-6 shadow-sm mt-8">
                       <h3 className="font-bold text-xl mb-4 text-[#8b4513]">Available Investment Plans</h3>
                       <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[
                             { name: 'Starter Plan', amount: 100000 },
                             { name: 'Basic Plan', amount: 200000 },
                             { name: 'Bronze Plan', amount: 300000 },
                          ].map(plan => (
                             <div key={plan.name} className="bg-white rounded-xl p-4 border border-[#d8cec1] shadow-sm flex flex-col justify-between">
                                <div>
                                  <div className="font-semibold text-bark">{plan.name}</div>
                                  <div className="font-display font-bold text-lg text-[#7f4e1c]">₹{plan.amount.toLocaleString('en-IN')}</div>
                                </div>
                                <button
                                  onClick={() => {
                                    if (user.balance < plan.amount) {
                                      toast.error('Insufficient wallet balance. Please deposit funds first.');
                                      setActiveTab('wallet');
                                    } else {
                                      invest(plan.name, plan.amount);
                                      toast.success(`Successfully invested in ${plan.name} for ₹${plan.amount.toLocaleString('en-IN')}!`);
                                    }
                                  }}
                                  className="mt-4 w-full bg-[#f8f1e8] text-[#7b4b1d] hover:bg-[#b07843] hover:text-white transition py-2 rounded-lg text-sm font-semibold border border-[#d8cec1]"
                                >
                                  Invest Now
                                </button>
                             </div>
                          ))}
                       </div>
                     </div>
                  </div>
                ) : (
                  <div className="p-5 bg-orange-50 border border-orange-200 text-orange-800 rounded-xl">
                    You need to complete KYC verification before making any investments.
                  </div>
                )}
              </motion.div>
           )}

           {activeTab === 'transactions' && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="font-display font-bold text-2xl">Transaction History</h2>
                <div className="bg-white border border-border rounded-3xl p-6 shadow-sm overflow-hidden">
                   {(!user.transactions || user.transactions.length === 0) ? (
                      <div className="text-center py-8 text-muted-foreground">
                         No transactions found.
                      </div>
                   ) : (
                      <div className="overflow-x-auto">
                         <table className="w-full text-left text-sm">
                            <thead>
                               <tr className="border-b border-border">
                                  <th className="pb-3 font-semibold text-muted-foreground uppercase tracking-wider text-xs">Date</th>
                                  <th className="pb-3 font-semibold text-muted-foreground uppercase tracking-wider text-xs">Type</th>
                                  <th className="pb-3 font-semibold text-muted-foreground uppercase tracking-wider text-xs">Details</th>
                                  <th className="pb-3 font-semibold text-muted-foreground uppercase tracking-wider text-xs">Amount</th>
                                  <th className="pb-3 font-semibold text-muted-foreground uppercase tracking-wider text-xs">Status</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                               {user.transactions.map((tx) => (
                                  <tr key={tx.id} className="group hover:bg-secondary/20 transition-colors">
                                     <td className="py-4 text-muted-foreground">{new Date(tx.date).toLocaleDateString()} <span className="text-xs opacity-70">{new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></td>
                                     <td className="py-4 capitalize font-medium">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs
                                          ${tx.type === 'deposit' ? 'bg-green-50 text-green-700' : 
                                            tx.type === 'withdrawal' ? 'bg-orange-50 text-orange-700' : 
                                            'bg-blue-50 text-blue-700'}`}
                                        >
                                           {tx.type === 'deposit' && <ArrowDownRight className="w-3.5 h-3.5" />}
                                           {tx.type === 'withdrawal' && <ArrowUpRight className="w-3.5 h-3.5" />}
                                           {tx.type === 'investment' && <CheckCircle className="w-3.5 h-3.5" />}
                                           {tx.type}
                                        </span>
                                     </td>
                                     <td className="py-4 text-bark">{tx.details || '-'}</td>
                                     <td className={`py-4 font-bold ${tx.type === 'deposit' ? 'text-green-600' : tx.type === 'withdrawal' ? 'text-bark' : 'text-primary'}`}>
                                        {tx.type === 'deposit' ? '+' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                                     </td>
                                     <td className="py-4">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                                          ${tx.status === 'completed' ? 'text-green-700' : 'text-orange-700'}`}
                                        >
                                           {tx.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                           <span className="capitalize">{tx.status}</span>
                                        </span>
                                     </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   )}
                </div>
             </motion.div>
           )}

           {activeTab === 'kyc' && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="font-display font-bold text-2xl">Identity Verification</h2>
                <div className="bg-white border border-border rounded-3xl p-6 sm:p-8 shadow-sm max-w-2xl">
                   {user.isKycVerified ? (
                      <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                         <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                           <ShieldCheck className="w-8 h-8" />
                         </div>
                         <div>
                            <h3 className="font-bold text-xl text-green-800">Verification Complete</h3>
                            <p className="text-sm text-muted-foreground mt-2">Your identity has been successfully verified. You now have full access to investing, deposits, and multi-stream withdrawals.</p>
                         </div>
                      </div>
                   ) : (
                      <div className="space-y-6">
                         <div>
                            <h3 className="font-bold text-lg mb-1">Verify Your Identity (KYC)</h3>
                            <p className="text-sm text-muted-foreground">Complete this process to unlock investments and withdrawals.</p>
                         </div>
                         
                         <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold uppercase text-muted-foreground">PAN Number</label>
                              <input type="text" className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3" placeholder="ABCDE1234F" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs font-semibold uppercase text-muted-foreground">Aadhaar Number</label>
                              <input type="text" className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3" placeholder="1234 5678 9012" />
                            </div>
                            
                            <button 
                               onClick={() => {
                                 verifyKyc();
                                 toast.success('KYC Request Approved for prototype!');
                               }}
                               className="bg-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl w-full hover:opacity-90 transition mt-4"
                            >
                               Submit for Verification
                            </button>
                            <p className="text-[10px] text-center text-muted-foreground mt-3">In this prototype, submission will be auto-approved instantly.</p>
                         </div>
                      </div>
                   )}
                </div>
             </motion.div>
           )}

           {activeTab === 'referrals' && (
             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <h2 className="font-display font-bold text-2xl">Refer & Earn</h2>
                
                <div className="bg-white border border-border rounded-3xl p-6 sm:p-8 shadow-sm text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
                   <div>
                      <h3 className="font-bold text-xl mb-2 text-bark">Your Unique Referral Link</h3>
                      <p className="text-sm text-muted-foreground mb-4">Share this link with your friends. Earn bonuses when they invest.</p>
                      
                      <div className="flex flex-col gap-3 max-w-md">
                         <div className="flex items-center gap-2">
                            <div className="bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm font-mono flex-1 overflow-x-auto whitespace-nowrap">
                               {user.referralLink || `https://gaulaxmi.com/ref/${user.id}`}
                            </div>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(user.referralLink || `https://gaulaxmi.com/ref/${user.id}`);
                                toast.success('Referral link copied to clipboard!');
                              }}
                              className="bg-primary hover:opacity-90 text-primary-foreground p-3 rounded-xl transition flex-shrink-0"
                              title="Copy Link"
                            >
                              <Copy className="w-5 h-5" />
                            </button>
                         </div>
                         <div className="flex items-center gap-2 mt-1">
                           <a 
                             href={`https://wa.me/?text=Join%20Gaulaxmi%20and%20multiply%20your%20wealth!%20Use%20my%20link:%20${encodeURIComponent(user.referralLink || `https://gaulaxmi.com/ref/${user.id}`)}`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="flex-1 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/20 rounded-xl py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold transition"
                           >
                             <MessageCircle className="w-4 h-4" /> WhatsApp
                           </a>
                           <a 
                             href={`https://t.me/share/url?url=${encodeURIComponent(user.referralLink || `https://gaulaxmi.com/ref/${user.id}`)}&text=Join%20Gaulaxmi%20and%20multiply%20your%20wealth!`}
                             target="_blank"
                             rel="noopener noreferrer"
                             className="flex-1 bg-[#0088cc]/10 hover:bg-[#0088cc]/20 text-[#0088cc] border border-[#0088cc]/20 rounded-xl py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold transition"
                           >
                             <Send className="w-4 h-4" /> Telegram
                           </a>
                           <a 
                             href={`mailto:?subject=Join%20Gaulaxmi&body=Join%20Gaulaxmi%20and%20multiply%20your%20wealth!%20Use%20my%20link:%20${encodeURIComponent(user.referralLink || `https://gaulaxmi.com/ref/${user.id}`)}`}
                             className="flex-1 bg-gray-500/10 hover:bg-gray-500/20 text-gray-700 border border-gray-500/20 rounded-xl py-2 px-3 flex items-center justify-center gap-2 text-xs font-semibold transition"
                           >
                             <Mail className="w-4 h-4" /> Email
                           </a>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full sm:w-auto sm:flex-shrink-0 mt-4 sm:mt-0 xl:flex-shrink-0">
                      <div className="w-full sm:w-auto bg-white border border-border p-4 rounded-2xl flex flex-col items-center justify-center shadow-sm">
                         <QRCodeSVG value={user.referralLink || `https://gaulaxmi.com/ref/${user.id}`} size={80} />
                         <div className="text-[10px] uppercase font-bold text-muted-foreground mt-3 tracking-wider">Scan to Share</div>
                      </div>
                      
                      <div className="w-full sm:w-auto bg-[#f8f1e8] border border-[#d8cec1] p-5 rounded-2xl flex flex-col items-center justify-center text-center">
                         <div className="text-xs uppercase font-bold text-muted-foreground tracking-wider mb-2">Total Bonus Earned</div>
                         <div className="text-3xl font-display font-bold text-[#7f4e1c]">
                            ₹{(user.referrals || []).reduce((sum, r) => sum + r.bonusEarned, 0).toLocaleString('en-IN')}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="bg-white border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                     <h3 className="font-bold text-xl m-0">Referred Friends</h3>
                     <select
                       value={referralFilter}
                       onChange={(e) => setReferralFilter(e.target.value as 'all' | 'active' | 'pending')}
                       className="bg-secondary/30 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px] font-medium"
                     >
                       <option value="all">All Referrals</option>
                       <option value="active">Active Only</option>
                       <option value="pending">Pending Only</option>
                     </select>
                   </div>
                   
                   {(!user.referrals || user.referrals.length === 0) ? (
                      <div className="text-center py-10 bg-secondary/30 rounded-2xl border border-dashed border-border/60">
                         <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                         <p className="text-muted-foreground text-sm">No referrals yet. Share your link to start earning!</p>
                      </div>
                   ) : (
                      <div className="space-y-4">
                         {user.referrals.filter(r => referralFilter === 'all' || r.status === referralFilter).length === 0 ? (
                           <div className="text-center py-10 text-muted-foreground text-sm">
                             No {referralFilter} referrals found.
                           </div>
                         ) : (
                           user.referrals
                             .filter(r => referralFilter === 'all' || r.status === referralFilter)
                             .map((referral) => (
                             <div key={referral.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-secondary bg-secondary/10 gap-4">
                                <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-cream rounded-full flex items-center justify-center text-bark font-bold border border-[#d8cec1]">
                                      {referral.friendName.charAt(0).toUpperCase()}
                                   </div>
                                   <div>
                                      <div className="font-semibold text-bark">{referral.friendName}</div>
                                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                         Status: 
                                         <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${referral.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                            {referral.status}
                                         </span>
                                      </div>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-0.5">Bonus Earned</div>
                                   <div className="font-bold text-bark">₹{referral.bonusEarned.toLocaleString('en-IN')}</div>
                                </div>
                             </div>
                           ))
                         )}
                      </div>
                   )}
                </div>
             </motion.div>
           )}

        </main>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick} 
      className={`flex items-center gap-2.5 px-4 py-3 text-sm font-semibold rounded-xl transition-colors shrink-0 ${active ? 'bg-primary text-primary-foreground' : 'text-bark/70 hover:bg-secondary/60'}`}
    >
      {icon} {label}
    </button>
  );
}
