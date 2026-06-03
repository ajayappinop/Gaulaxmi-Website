import type { MilestoneTier } from '../shared/types.js';

export const DEFAULT_MILESTONES: MilestoneTier[] = [
  { id: 'tier-10l', minInvest: 1_000_000, label: '₹10 Lakh', cows: '10 Gir Cows', bonus: 'Purity Certified Lineage', tenureYears: 3 },
  { id: 'tier-30l', minInvest: 3_000_000, label: '₹30 Lakh', cows: '30 Gir Cows', bonus: 'Premium Milking Lineage', tenureYears: 3 },
  { id: 'tier-50l', minInvest: 5_000_000, label: '₹50 Lakh', cows: '50 Gir Cows', bonus: 'Elite Breed Certification', tenureYears: 3 },
  { id: 'tier-1cr', minInvest: 10_000_000, label: '₹1 Crore +', cows: '100+ Gir Cows', bonus: 'VVIP Direct Farm Share', tenureYears: 3 },
];
