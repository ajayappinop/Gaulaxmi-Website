import { useEffect, useState } from 'react';
import { fetchMilestonesFromApi, loadMilestones, MILESTONES_UPDATED_EVENT, type MilestoneTier } from './milestones';

export function useMilestones(): MilestoneTier[] {
  const [milestones, setMilestones] = useState<MilestoneTier[]>(() => loadMilestones());

  useEffect(() => {
    fetchMilestonesFromApi().then(setMilestones);
    const refresh = () => setMilestones(loadMilestones());
    window.addEventListener(MILESTONES_UPDATED_EVENT, refresh);
    return () => window.removeEventListener(MILESTONES_UPDATED_EVENT, refresh);
  }, []);

  return milestones;
}

export type { MilestoneTier };
