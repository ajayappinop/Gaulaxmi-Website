import { api, ApiError } from './apiClient';
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
  const [plans, milestones] = await Promise.all([api.getPlans(), api.getMilestones()]);
  let inquiries: ContactInquiry[] = [];
  try {
    inquiries = await api.getAdminInquiries();
  } catch (e) {
    if (!(e instanceof ApiError && e.status === 403)) throw e;
  }
  setPlansCache(plans);
  setMilestonesCache(milestones);
  return { plans, milestones, inquiries };
}
