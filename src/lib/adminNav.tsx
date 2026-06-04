import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Settings,
  ArrowDownRight,
  ArrowUpRight,
  Receipt,
  TrendingUp,
  Award,
  Mail,
  CreditCard,
  LifeBuoy,
  Shield,
} from 'lucide-react';
import type { AdminTabId } from './admin';

export const ADMIN_NAV_ICONS: Record<AdminTabId, LucideIcon> = {
  overview: LayoutDashboard,
  users: Users,
  kyc: ShieldCheck,
  payment_settings: Settings,
  deposit_requests: ArrowDownRight,
  withdrawals: ArrowUpRight,
  transactions: Receipt,
  plans: CreditCard,
  investments: TrendingUp,
  milestones: Award,
  inquiries: Mail,
  support_tickets: LifeBuoy,
  admins: Shield,
};
