import type { BookshelfSubgroup } from '@/types/config';

/** Keep nested navigation groups in the same catalogue and character order. */
export function getSubgroupEntries(subgroup: BookshelfSubgroup) {
  return [...subgroup.entries, ...(subgroup.entryGroups ?? []).flatMap(group => group.entries)];
}
