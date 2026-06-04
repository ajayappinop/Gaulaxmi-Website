import type { SupportTicketCategory } from '../../shared/types';

export interface SupportFaqItem {
  id: string;
  question: string;
  answer: string;
}

export const SUPPORT_FAQ_ITEMS: SupportFaqItem[] = [
  {
    id: 'kyc-time',
    question: 'How long does KYC verification take?',
    answer:
      'After you submit documents, our team usually reviews KYC within 1–2 business days. You will see the status under KYC Verification in your dashboard. If rejected, you can resubmit with corrected details.',
  },
  {
    id: 'deposit-pending',
    question: 'Why is my deposit still pending?',
    answer:
      'Manual bank transfers are reviewed by admin before your wallet is credited. Gateway deposits are usually credited automatically. Track status in Transaction History. If pending for more than 48 hours, raise a ticket under Deposit category.',
  },
  {
    id: 'withdraw-time',
    question: 'When will my withdrawal be processed?',
    answer:
      'Withdrawal requests are reviewed for security and compliance. Approved withdrawals appear as completed in Transaction History. Processing typically takes 1–3 business days after approval.',
  },
  {
    id: 'invest-plan',
    question: 'How do I purchase an investment plan?',
    answer:
      'Complete KYC first, then add funds to your wallet via Deposit. Open My Investments, choose a tier, and confirm purchase. Your plan progress appears under Investment Progress.',
  },
  {
    id: 'wallet-balance',
    question: 'My wallet balance looks incorrect — what should I do?',
    answer:
      'Check Transaction History for deposits, withdrawals, and plan purchases. Pending items are not yet final. If something still looks wrong, raise a ticket with Wallet category and include approximate amount and date.',
  },
  {
    id: 'referral-bonus',
    question: 'When do I receive referral rewards?',
    answer:
      'Referral bonuses are credited when your invitee completes a qualifying subscription. See Refer & Earn for each connection’s status. Bonuses post to your wallet once marked active.',
  },
  {
    id: 'login-account',
    question: 'I cannot log in or need to update my account',
    answer:
      'Use Account Settings to change password or update profile. For locked or deactivated accounts, contact support with Technical or General category and your registered email.',
  },
  {
    id: 'contact',
    question: 'How do I reach Gaulaxmi support?',
    answer:
      'Use the form below to raise a support ticket. Our admin team will reply in your ticket thread. For urgent payment issues, choose the matching category so we can prioritize your request.',
  },
];

export const SUPPORT_CATEGORY_OPTIONS: { id: SupportTicketCategory; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'wallet', label: 'Wallet & balance' },
  { id: 'kyc', label: 'KYC verification' },
  { id: 'deposit', label: 'Deposit' },
  { id: 'withdrawal', label: 'Withdrawal' },
  { id: 'investment', label: 'Investment plans' },
  { id: 'technical', label: 'Technical / account' },
];
