import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { toast } from 'react-hot-toast';
import { validateAuthLogin, validateAuthRegister, type FieldErrors } from '../lib/validation';

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const { login, register } = useAuth();

  const clearFieldError = (key: string) => {
    setFieldErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLogin) {
      const errors = validateAuthLogin(email, password);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        toast.error(Object.values(errors)[0]);
        return;
      }
      setFieldErrors({});
      const result = await login(email, password);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success('Successfully logged in!');
      return;
    }

    const errors = validateAuthRegister(name, email, password, confirmPassword, isConfirmed);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      toast.error(Object.values(errors)[0]);
      return;
    }
    setFieldErrors({});
    const result = await register(name, email, password);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    if (referralCode.trim()) {
      toast.success('Account created! Referral code noted for onboarding.');
    } else {
      toast.success('Account created successfully!');
    }
  };

  const switchMode = (loginMode: boolean) => {
    setIsLogin(loginMode);
    setFieldErrors({});
  };

  const inputErrorClass = (key: string) =>
    fieldErrors[key] ? 'border-red-400/80 focus:border-red-400' : 'border-white/10 focus:border-gold/50';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
      className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md mx-auto"
    >
      <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
        <button
          type="button"
          onClick={() => switchMode(true)}
          className={`flex-1 text-center font-semibold text-sm transition-colors ${isLogin ? 'text-gold' : 'text-cream/50 hover:text-cream'}`}
        >
          Sign In
        </button>
        <div className="w-px h-6 bg-white/20" />
        <button
          type="button"
          onClick={() => switchMode(false)}
          className={`flex-1 text-center font-semibold text-sm transition-colors ${!isLogin ? 'text-gold' : 'text-cream/50 hover:text-cream'}`}
        >
          Create Account
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-cream" noValidate>
        <AnimatePresence mode="wait">
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1.5 overflow-hidden"
            >
              <label className="text-xs uppercase tracking-wider font-semibold text-cream/70 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/50" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    clearFieldError('name');
                  }}
                  className={`w-full bg-black/20 border rounded-xl py-3 pl-10 pr-4 outline-none focus:bg-black/40 transition-all ${inputErrorClass('name')}`}
                  placeholder="Enter your name"
                  autoComplete="name"
                />
              </div>
              {fieldErrors.name && <p className="text-[11px] text-red-300 ml-1">{fieldErrors.name}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-wider font-semibold text-cream/70 ml-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/50" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearFieldError('email');
              }}
              className={`w-full bg-black/20 border rounded-xl py-3 pl-10 pr-4 outline-none focus:bg-black/40 transition-all ${inputErrorClass('email')}`}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </div>
          {fieldErrors.email && <p className="text-[11px] text-red-300 ml-1">{fieldErrors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs uppercase tracking-wider font-semibold text-cream/70 ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/50" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearFieldError('password');
              }}
              className={`w-full bg-black/20 border rounded-xl py-3 pl-10 pr-10 outline-none focus:bg-black/40 transition-all ${inputErrorClass('password')}`}
              placeholder="Enter your password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cream/50 hover:text-cream transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {fieldErrors.password && <p className="text-[11px] text-red-300 ml-1">{fieldErrors.password}</p>}
        </div>

        <AnimatePresence mode="wait">
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-cream/70 ml-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/50" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearFieldError('confirmPassword');
                    }}
                    className={`w-full bg-black/20 border rounded-xl py-3 pl-10 pr-10 outline-none focus:bg-black/40 transition-all ${inputErrorClass('confirmPassword')}`}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cream/50 hover:text-cream transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-[11px] text-red-300 ml-1">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs uppercase tracking-wider font-semibold text-cream/70 ml-1">Referral Code (Optional)</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cream/50" />
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-gold/50 focus:bg-black/40 transition-all"
                    placeholder="Enter referral code"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2 cursor-pointer mt-2 group">
                <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={isConfirmed}
                    onChange={(e) => {
                      setIsConfirmed(e.target.checked);
                      clearFieldError('terms');
                    }}
                    className="peer appearance-none w-4 h-4 border border-white/20 rounded bg-black/20 checked:bg-gold checked:border-gold transition-colors focus:ring-1 focus:ring-gold/50 focus:outline-none"
                  />
                  <svg
                    className="absolute w-3 h-3 text-bark top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-xs text-cream/70 leading-relaxed group-hover:text-cream transition-colors">
                  I confirm that I have read and agree to the Terms of Service and Privacy Policy.
                </span>
              </label>
              {fieldErrors.terms && <p className="text-[11px] text-red-300 ml-1">{fieldErrors.terms}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="submit"
          className="w-full bg-gradient-gold text-bark font-semibold py-3.5 rounded-xl shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] hover:scale-[1.02] flex items-center justify-center gap-2 transition-all mt-6"
        >
          {isLogin ? 'Sign In to Dashboard' : 'Open Wellness Account'}
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-center gap-1.5 opacity-60 mt-4 text-[11px] text-cream">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Secured by Gaulaxmi Identity</span>
        </div>
      </form>
    </motion.div>
  );
}
