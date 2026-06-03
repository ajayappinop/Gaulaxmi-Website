import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  Wallet,
  User,
  FileCheck,
  PartyPopper,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { formatINR, getPlanById } from '../lib/plans';
import { useInvestmentPlans } from '../lib/useInvestmentPlans';
import { toast } from 'react-hot-toast';
import {
  validateAuthLogin,
  validateAuthRegister,
  type FieldErrors,
} from '../lib/validation';
import type { DashboardTabId } from '../lib/dashboardNav';
import {
  type PlanPurchaseStep,
  PLAN_PURCHASE_STEPS,
  savePendingPlanPurchase,
  clearPendingPlanPurchase,
  nextStep,
  prevStep,
  stepIndex,
} from '../lib/planPurchaseFlow';

const MIN_DEPOSIT = 1_000;

export function PlanPurchaseFlow({
  planId,
  initialStep = 'plan',
  onClose,
  onOpenDashboard,
}: {
  planId: string;
  initialStep?: PlanPurchaseStep;
  onClose: () => void;
  onOpenDashboard: (tab: DashboardTabId) => void;
}) {
  const { user, isLoggedIn, login, register, invest } = useAuth();
  const plans = useInvestmentPlans();
  const plan = useMemo(
    () => plans.find((p) => p.id === planId) ?? getPlanById(planId),
    [plans, planId]
  );

  const [step, setStep] = useState<PlanPurchaseStep>(initialStep);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [confirming, setConfirming] = useState(false);

  const kycVerified = user?.kycStatus === 'verified' || user?.isKycVerified;
  const balance = user?.balance ?? 0;
  const canAfford = plan ? balance >= plan.amount : false;

  useEffect(() => {
    setStep('plan');
  }, [planId]);

  useEffect(() => {
    savePendingPlanPurchase({ planId, step });
  }, [planId, step]);

  if (!plan) {
    return (
      <FlowShell onClose={onClose}>
        <p className="text-center text-stone-600 py-8">This plan is no longer available. Please choose another tier.</p>
        <button type="button" onClick={onClose} className="w-full py-3 rounded-xl bg-[#7b4b1d] text-white font-semibold">
          Close
        </button>
      </FlowShell>
    );
  }

  const goDashboard = (tab: DashboardTabId) => {
    savePendingPlanPurchase({ planId, step });
    onOpenDashboard(tab);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      const errors = validateAuthLogin(email, password);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        toast.error(Object.values(errors)[0]);
        return;
      }
      const result = await login(email, password);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Signed in — continue to the next step');
      return;
    }
    const errors = validateAuthRegister(name, email, password, confirmPassword, isConfirmed);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error(Object.values(errors)[0]);
      return;
    }
    const result = await register(name, email, password);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    toast.success('Account created — continue to KYC in the next step');
  };

  const handleConfirmPurchase = async () => {
    if (!user || !plan) return;
    if (!kycVerified) {
      toast.error('Complete KYC before investing.');
      setStep('kyc');
      return;
    }
    if (user.balance < plan.amount) {
      toast.error('Add funds to your wallet first.');
      setStep('wallet');
      return;
    }
    setConfirming(true);
    try {
      await invest(plan.tier, plan.amount, plan.id);
      clearPendingPlanPurchase();
      setStep('success');
      toast.success(`You are now enrolled in ${plan.tier}!`);
    } catch {
      toast.error('Could not complete investment. Check wallet balance and KYC.');
    } finally {
      setConfirming(false);
    }
  };

  const goToNextStep = () => {
    const n = nextStep(step);
    if (n) setStep(n);
  };

  const handleNext = () => {
    if (step === 'plan') {
      goToNextStep();
      return;
    }
    if (step === 'account') {
      if (!isLoggedIn) {
        toast.error('Sign in or create an account to continue.');
        return;
      }
      goToNextStep();
      return;
    }
    if (step === 'kyc') {
      if (!isLoggedIn) {
        setStep('account');
        return;
      }
      if (!kycVerified) {
        toast.error('Complete KYC verification first.');
        return;
      }
      goToNextStep();
      return;
    }
    if (step === 'wallet') {
      if (!isLoggedIn) {
        setStep('account');
        return;
      }
      if (!kycVerified) {
        setStep('kyc');
        return;
      }
      if (!canAfford) {
        toast.error(`You need at least ${formatINR(plan.amount)} in your wallet.`);
        return;
      }
      goToNextStep();
      return;
    }
    if (step === 'confirm') {
      handleConfirmPurchase();
    }
  };

  const handleBack = () => {
    const prev = prevStep(step);
    if (prev) setStep(prev);
  };

  const handleClose = () => {
    clearPendingPlanPurchase();
    onClose();
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearPendingPlanPurchase();
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const currentIdx = step === 'success' ? PLAN_PURCHASE_STEPS.length : stepIndex(step);

  return (
    <FlowShell onClose={handleClose}>
      <div className="mb-6">
        <p className="text-[10px] uppercase tracking-widest text-[#9a5f23] font-bold">Purchase journey</p>
        <h2 className="font-display text-xl font-bold text-[#2e241b] mt-1">
          {step === 'success' ? 'Welcome to Gaulaxmi' : `${plan.tier} Plan`}
        </h2>
      </div>

      {step !== 'success' && (
        <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
          {PLAN_PURCHASE_STEPS.map((s, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center min-w-[52px]">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border-2 ${
                      done
                        ? 'bg-[#7b4b1d] border-[#7b4b1d] text-white'
                        : active
                        ? 'border-[#9a5f23] text-[#9a5f23] bg-[#f8f1e8]'
                        : 'border-[#d8cec1] text-[#ab927f] bg-white'
                    }`}
                  >
                    {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
                  </div>
                  <span className={`text-[9px] mt-1 font-semibold ${active ? 'text-[#7b4b1d]' : 'text-[#ab927f]'}`}>
                    {s.label}
                  </span>
                </div>
                {i < PLAN_PURCHASE_STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 min-w-[12px] mb-4 ${done ? 'bg-[#7b4b1d]' : 'bg-[#ece3d8]'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.2 }}
        >
          {step === 'plan' && <PlanReviewStep plan={plan} />}
          {step === 'account' &&
            (isLoggedIn ? (
              <AccountSignedInStep userName={user?.name} userEmail={user?.email} />
            ) : (
              <AccountStep
                isLogin={isLogin}
                setIsLogin={setIsLogin}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                confirmPassword={confirmPassword}
                setConfirmPassword={setConfirmPassword}
                name={name}
                setName={setName}
                isConfirmed={isConfirmed}
                setIsConfirmed={setIsConfirmed}
                fieldErrors={fieldErrors}
                setFieldErrors={setFieldErrors}
                onSubmit={handleAuth}
              />
            ))}
          {step === 'kyc' && (
            <KycStep
              kycVerified={!!kycVerified}
              kycStatus={user?.kycStatus}
              onOpenDashboard={() => goDashboard('kyc')}
            />
          )}
          {step === 'wallet' && (
            <WalletStep
              planAmount={plan.amount}
              balance={balance}
              shortfall={Math.max(0, plan.amount - balance)}
              onOpenDashboard={() => goDashboard('wallet')}
            />
          )}
          {step === 'confirm' && <ConfirmStep plan={plan} balance={balance} userName={user?.name} />}
          {step === 'success' && (
            <SuccessStep
              plan={plan}
              onViewDashboard={() => {
                clearPendingPlanPurchase();
                onOpenDashboard('investments');
              }}
              onClose={handleClose}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {step !== 'success' && (
        <div className="flex gap-3 mt-8 pt-4 border-t border-[#ece3d8]">
          {step !== 'plan' && (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center justify-center gap-1 px-4 py-3 rounded-xl border border-[#d8cec1] text-[#7b4b1d] font-semibold text-sm hover:bg-[#f8f1e8]"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={confirming}
            className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl bg-gradient-to-r from-[#9a4f12] to-[#6a3208] text-white font-semibold text-sm hover:opacity-95 disabled:opacity-60"
          >
            {step === 'confirm' ? (confirming ? 'Processing…' : 'Confirm & invest') : 'Continue'}
            {step !== 'confirm' && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      )}
    </FlowShell>
  );
}

function FlowShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm"
      role="presentation"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#fffdf9] rounded-2xl shadow-2xl border border-[#d8cec1] p-6 sm:p-8"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#8a7a68] hover:bg-[#f2e2c9] hover:text-[#5c2d11]"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        {children}
      </motion.div>
    </div>
  );
}

function PlanReviewStep({ plan }: { plan: NonNullable<ReturnType<typeof getPlanById>> }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#6d5138]">You selected the following 5-year wealth plan. Returns are 5% monthly for 60 months, with principal returned at maturity.</p>
      <div className="rounded-xl border border-[#edd8c4] bg-[#faf6f0] p-5 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs uppercase tracking-wider text-[#9a5f23] font-bold">{plan.tier}</span>
          {plan.featured && <span className="text-[10px] bg-[#f2e2c9] text-[#9a5f23] px-2 py-0.5 rounded-full font-semibold">Popular</span>}
        </div>
        <div className="font-display text-2xl font-bold text-[#7f4e1c]">{formatINR(plan.amount)}</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white rounded-lg p-2 border border-[#eee5db]">
            <span className="text-[#8a7a68] block">Monthly return</span>
            <span className="font-semibold text-[#473527]">{formatINR(plan.monthlyReturn)}</span>
          </div>
          <div className="bg-white rounded-lg p-2 border border-[#eee5db]">
            <span className="text-[#8a7a68] block">60-month payout</span>
            <span className="font-semibold text-[#473527]">{formatINR(plan.totalPayout)}</span>
          </div>
          <div className="bg-white rounded-lg p-2 border border-[#eee5db] col-span-2">
            <span className="text-[#8a7a68] block">Total prosperity (incl. principal)</span>
            <span className="font-semibold text-[#b07a2c]">{formatINR(plan.totalEarnings)}</span>
          </div>
        </div>
      </div>
      <p className="text-[11px] text-[#8a7a68]">Next: sign in (or register), verify KYC, fund your wallet, then confirm payment from your balance.</p>
    </div>
  );
}

function AccountSignedInStep({
  userName,
  userEmail,
}: {
  userName?: string;
  userEmail?: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[#7b4b1d]">
        <User className="w-5 h-5" />
        <p className="text-sm font-semibold">You are signed in</p>
      </div>
      <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
        <p className="font-semibold">{userName || 'Member'}</p>
        <p className="text-green-800/90 text-xs mt-0.5">{userEmail}</p>
        <p className="text-xs mt-3 text-green-800">Press Continue below to move to identity verification (KYC).</p>
      </div>
    </div>
  );
}

function AccountStep({
  isLogin,
  setIsLogin,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  name,
  setName,
  isConfirmed,
  setIsConfirmed,
  fieldErrors,
  setFieldErrors,
  onSubmit,
}: {
  isLogin: boolean;
  setIsLogin: (v: boolean) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  name: string;
  setName: (v: string) => void;
  isConfirmed: boolean;
  setIsConfirmed: (v: boolean) => void;
  fieldErrors: FieldErrors;
  setFieldErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const clear = (key: string) => setFieldErrors((p) => { const n = { ...p }; delete n[key]; return n; });
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[#7b4b1d]">
        <User className="w-5 h-5" />
        <p className="text-sm font-semibold">Sign in or create your member account</p>
      </div>
      <div className="flex rounded-full bg-[#f2e2c9]/50 p-1">
        <button type="button" onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-full text-xs font-bold ${isLogin ? 'bg-white shadow text-[#7b4b1d]' : 'text-[#8a7a68]'}`}>
          Sign in
        </button>
        <button type="button" onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-full text-xs font-bold ${!isLogin ? 'bg-white shadow text-[#7b4b1d]' : 'text-[#8a7a68]'}`}>
          Register
        </button>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        {!isLogin && (
          <div>
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); clear('name'); }}
              placeholder="Full name"
              className={`w-full px-4 py-3 rounded-xl border bg-white text-sm ${fieldErrors.name ? 'border-red-400' : 'border-[#d8cec1]'}`}
            />
            {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
          </div>
        )}
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clear('email'); }}
            placeholder="Email"
            className={`w-full px-4 py-3 rounded-xl border bg-white text-sm ${fieldErrors.email ? 'border-red-400' : 'border-[#d8cec1]'}`}
          />
          {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
        </div>
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clear('password'); }}
            placeholder="Password"
            className={`w-full px-4 py-3 rounded-xl border bg-white text-sm ${fieldErrors.password ? 'border-red-400' : 'border-[#d8cec1]'}`}
          />
          {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
        </div>
        {!isLogin && (
          <>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); clear('confirmPassword'); }}
              placeholder="Confirm password"
              className={`w-full px-4 py-3 rounded-xl border bg-white text-sm ${fieldErrors.confirmPassword ? 'border-red-400' : 'border-[#d8cec1]'}`}
            />
            <label className="flex items-start gap-2 text-xs text-[#6d5138] cursor-pointer">
              <input type="checkbox" checked={isConfirmed} onChange={(e) => setIsConfirmed(e.target.checked)} className="mt-0.5" />
              I agree to the membership terms and investment policies.
            </label>
          </>
        )}
        <button type="submit" className="w-full py-3 rounded-xl bg-[#7b4b1d] text-white font-semibold text-sm">
          {isLogin ? 'Sign in' : 'Create account'}
        </button>
        <p className="text-[11px] text-center text-[#8a7a68]">Then press Continue below to proceed to KYC.</p>
      </form>
    </div>
  );
}

function KycStep({
  kycVerified,
  kycStatus,
  onOpenDashboard,
}: {
  kycVerified: boolean;
  kycStatus?: string;
  onOpenDashboard: () => void;
}) {
  if (kycVerified) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 text-sm">
        <ShieldCheck className="w-6 h-6 shrink-0" />
        <span>KYC verified — you can fund your wallet in the next step.</span>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[#7b4b1d]">
        <FileCheck className="w-5 h-5" />
        <p className="text-sm font-semibold">Identity verification required</p>
      </div>
      <p className="text-sm text-[#6d5138]">
        {kycStatus === 'submitted'
          ? 'Your documents are under review. You can invest once an admin approves your KYC.'
          : 'Regulations require verified KYC before any investment. Submit your ID and address in the dashboard (takes a few minutes).'}
      </p>
      <button
        type="button"
        onClick={onOpenDashboard}
        className="w-full py-3 rounded-xl border-2 border-[#9a5f23] text-[#7b4b1d] font-semibold text-sm hover:bg-[#f8f1e8]"
      >
        {kycStatus === 'submitted' ? 'View KYC status in dashboard' : 'Complete KYC in dashboard'}
      </button>
    </div>
  );
}

function WalletStep({
  planAmount,
  balance,
  shortfall,
  onOpenDashboard,
}: {
  planAmount: number;
  balance: number;
  shortfall: number;
  onOpenDashboard: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-[#7b4b1d]">
        <Wallet className="w-5 h-5" />
        <p className="text-sm font-semibold">Fund your wallet</p>
      </div>
      <div className="rounded-xl border border-[#edd8c4] p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-[#8a7a68]">Plan amount</span>
          <span className="font-semibold">{formatINR(planAmount)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#8a7a68]">Your balance</span>
          <span className={`font-semibold ${shortfall > 0 ? 'text-red-600' : 'text-green-700'}`}>{formatINR(balance)}</span>
        </div>
        {shortfall > 0 && (
          <div className="flex justify-between pt-2 border-t border-[#eee5db]">
            <span className="text-[#8a7a68]">Amount needed</span>
            <span className="font-bold text-[#9a5f23]">{formatINR(shortfall)}</span>
          </div>
        )}
      </div>
      {shortfall > 0 ? (
        <>
          <p className="text-xs text-[#6d5138]">
            Deposit at least {formatINR(Math.max(shortfall, MIN_DEPOSIT))} via UPI/QR in the wallet section, then return here to confirm your purchase.
          </p>
          <button
            type="button"
            onClick={onOpenDashboard}
            className="w-full py-3 rounded-xl bg-[#7b4b1d] text-white font-semibold text-sm"
          >
            Add funds in dashboard
          </button>
        </>
      ) : (
        <p className="text-sm text-green-700 font-medium">Balance sufficient — continue to review and confirm.</p>
      )}
    </div>
  );
}

function ConfirmStep({
  plan,
  balance,
  userName,
}: {
  plan: NonNullable<ReturnType<typeof getPlanById>>;
  balance: number;
  userName?: string;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#6d5138]">
        {userName ? `${userName}, ` : ''}review your order. The plan amount will be deducted from your wallet immediately.
      </p>
      <div className="rounded-xl bg-[#faf6f0] border border-[#edd8c4] p-5 space-y-2 text-sm">
        <div className="flex justify-between font-semibold text-[#2e241b]">
          <span>{plan.tier} plan</span>
          <span>{formatINR(plan.amount)}</span>
        </div>
        <div className="flex justify-between text-[#8a7a68]">
          <span>Wallet after payment</span>
          <span>{formatINR(balance - plan.amount)}</span>
        </div>
      </div>
      <p className="text-[11px] text-[#8a7a68]">
        By confirming, you agree to the 60-month tenure and monthly return schedule for this tier.
      </p>
    </div>
  );
}

function SuccessStep({
  plan,
  onViewDashboard,
  onClose,
}: {
  plan: NonNullable<ReturnType<typeof getPlanById>>;
  onViewDashboard: () => void;
  onClose: () => void;
}) {
  return (
    <div className="text-center space-y-4 py-2">
      <PartyPopper className="w-12 h-12 text-[#9a5f23] mx-auto" />
      <h3 className="font-display text-xl font-bold text-[#2e241b]">Investment confirmed!</h3>
      <p className="text-sm text-[#6d5138]">
        You are enrolled in the <strong>{plan.tier}</strong> plan ({formatINR(plan.amount)}). Track returns and milestones in your dashboard.
      </p>
      <button type="button" onClick={onViewDashboard} className="w-full py-3 rounded-xl bg-[#7b4b1d] text-white font-semibold text-sm">
        View my investments
      </button>
      <button type="button" onClick={onClose} className="w-full py-2 text-sm text-[#8a7a68] hover:text-[#7b4b1d]">
        Back to website
      </button>
    </div>
  );
}
