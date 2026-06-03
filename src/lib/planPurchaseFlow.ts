export type PlanPurchaseStep = 'plan' | 'account' | 'kyc' | 'wallet' | 'confirm' | 'success';

export const PLAN_PURCHASE_STEPS: { id: PlanPurchaseStep; label: string }[] = [
  { id: 'plan', label: 'Plan' },
  { id: 'account', label: 'Account' },
  { id: 'kyc', label: 'KYC' },
  { id: 'wallet', label: 'Wallet' },
  { id: 'confirm', label: 'Confirm' },
];

export const PENDING_PLAN_PURCHASE_KEY = 'gaulaxmi_pending_plan_purchase';

export interface PendingPlanPurchase {
  planId: string;
  step: PlanPurchaseStep;
}

export function savePendingPlanPurchase(data: PendingPlanPurchase): void {
  sessionStorage.setItem(PENDING_PLAN_PURCHASE_KEY, JSON.stringify(data));
}

export function loadPendingPlanPurchase(): PendingPlanPurchase | null {
  try {
    const raw = sessionStorage.getItem(PENDING_PLAN_PURCHASE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingPlanPurchase;
    if (!parsed?.planId || !parsed?.step) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingPlanPurchase(): void {
  sessionStorage.removeItem(PENDING_PLAN_PURCHASE_KEY);
}

export function stepIndex(step: PlanPurchaseStep): number {
  if (step === 'success') return PLAN_PURCHASE_STEPS.length;
  return PLAN_PURCHASE_STEPS.findIndex((s) => s.id === step);
}

export function nextStep(current: PlanPurchaseStep): PlanPurchaseStep | null {
  const idx = stepIndex(current);
  if (idx < 0 || idx >= PLAN_PURCHASE_STEPS.length - 1) return null;
  return PLAN_PURCHASE_STEPS[idx + 1].id;
}

export function prevStep(current: PlanPurchaseStep): PlanPurchaseStep | null {
  const idx = stepIndex(current);
  if (idx <= 0) return null;
  return PLAN_PURCHASE_STEPS[idx - 1].id;
}
