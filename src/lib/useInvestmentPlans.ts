import { useEffect, useState } from 'react';
import type { InvestmentPlan } from './plans';
import { fetchPlansFromApi, loadPlans, PLANS_UPDATED_EVENT } from './planStore';

export function useInvestmentPlans(): InvestmentPlan[] {
  const [plans, setPlans] = useState<InvestmentPlan[]>(() => loadPlans());

  useEffect(() => {
    fetchPlansFromApi().then(setPlans);
    const refresh = () => setPlans(loadPlans());
    window.addEventListener(PLANS_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(PLANS_UPDATED_EVENT, refresh);
  }, []);

  return plans;
}
