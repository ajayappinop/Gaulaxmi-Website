import type { User } from './auth';
import { api } from './apiClient';
import type { MilestoneTier } from '../../shared/types';

export type { MilestoneTier };

export type MilestoneFulfillmentStatus = 'not_eligible' | 'eligible' | 'fulfilled';

export const MILESTONES_STORAGE_KEY = 'gaulaxmi_milestones';
export const MILESTONES_UPDATED_EVENT = 'gaulaxmi-milestones-updated';

export const DEFAULT_MILESTONES: MilestoneTier[] = [
  {
    id: 'tier-10l',
    minInvest: 1_000_000,
    label: '₹10 Lakh',
    cows: '10 Gir Cows',
    bonus: 'Purity Certified Lineage',
    tenureYears: 3,
  },
  {
    id: 'tier-30l',
    minInvest: 3_000_000,
    label: '₹30 Lakh',
    cows: '30 Gir Cows',
    bonus: 'Premium Milking Lineage',
    tenureYears: 3,
  },
  {
    id: 'tier-50l',
    minInvest: 5_000_000,
    label: '₹50 Lakh',
    cows: '50 Gir Cows',
    bonus: 'Elite Breed Certification',
    tenureYears: 3,
  },
  {
    id: 'tier-1cr',
    minInvest: 10_000_000,
    label: '₹1 Crore +',
    cows: '100+ Gir Cows',
    bonus: 'VVIP Direct Farm Share',
    tenureYears: 3,
  },
];

let cachedMilestones: MilestoneTier[] | null = null;

export async function fetchMilestonesFromApi(): Promise<MilestoneTier[]> {
  try {
    const tiers = await api.getMilestones();
    cachedMilestones = tiers;
    return tiers;
  } catch {
    return cachedMilestones ?? [...DEFAULT_MILESTONES];
  }
}

export function loadMilestones(): MilestoneTier[] {
  if (cachedMilestones?.length) return [...cachedMilestones];
  return [...DEFAULT_MILESTONES];
}

export function setMilestonesCache(tiers: MilestoneTier[]): void {
  cachedMilestones = tiers.sort((a, b) => a.minInvest - b.minInvest);
  window.dispatchEvent(new CustomEvent(MILESTONES_UPDATED_EVENT));
}

export async function saveMilestones(tiers: MilestoneTier[]): Promise<MilestoneTier[]> {
  const saved = await api.saveMilestones(tiers);
  setMilestonesCache(saved);
  return saved;
}

export function getUserTotalInvested(user: User): number {
  return (user.investments || []).reduce((sum, inv) => sum + inv.amount, 0);
}

export function getHighestMilestoneForAmount(
  totalInvested: number,
  milestones: MilestoneTier[] = loadMilestones()
): MilestoneTier | null {
  const sorted = [...milestones].sort((a, b) => b.minInvest - a.minInvest);
  return sorted.find((m) => totalInvested >= m.minInvest) ?? null;
}

export interface UserMilestoneRow {
  user: User;
  totalInvested: number;
  highestTier: MilestoneTier | null;
  allQualified: MilestoneTier[];
}

export function buildUserMilestoneRows(users: User[]): UserMilestoneRow[] {
  const milestones = loadMilestones();
  return users
    .map((user) => {
      const totalInvested = getUserTotalInvested(user);
      const allQualified = milestones.filter((m) => totalInvested >= m.minInvest);
      return {
        user,
        totalInvested,
        highestTier: getHighestMilestoneForAmount(totalInvested, milestones),
        allQualified,
      };
    })
    .sort((a, b) => b.totalInvested - a.totalInvested);
}
