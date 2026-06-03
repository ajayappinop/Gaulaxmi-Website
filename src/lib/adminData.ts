import { api } from './apiClient';
import { setPlansCache } from './planStore';
import { setMilestonesCache } from './milestones';
import type { ContactInquiry } from '../../shared/types';
import type { InvestmentPlan, MilestoneTier } from '../../shared/types';

export interface AdminCatalog {
  plans: InvestmentPlan[];
  milestones: MilestoneTier[];
  inquiries: ContactInquiry[];
}

/** Load all admin-facing data from the API (requires admin JWT). */
export async function fetchAdminCatalog(): Promise<AdminCatalog> {
  const [plans, milestones, inquiries] = await Promise.all([
    api.getPlans(),
    api.getMilestones(),
    api.getAdminInquiries(),
  ]);
  setPlansCache(plans);
  setMilestonesCache(milestones);
  return { plans, milestones, inquiries };
}
