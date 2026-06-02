import { useQuery } from "@tanstack/react-query";

import { useSocietySession } from "@/providers/SocietyProvider";
import {
  defaultTerminologyLabels,
  getTerminologyConfig,
  resolveTerminologyLabel,
} from "@/services/terminology.service";
import type { TerminologyLabels } from "@/types/community";

export function useTerminology() {
  const { activeSocietyId } = useSocietySession();
  const terminologyQuery = useQuery({
    queryKey: ["terminology", activeSocietyId],
    queryFn: () => getTerminologyConfig(activeSocietyId ?? ""),
    enabled: Boolean(activeSocietyId),
  });

  const labels = terminologyQuery.data?.labels ?? defaultTerminologyLabels;

  return {
    ...terminologyQuery,
    labels,
    label: (key: keyof TerminologyLabels) => resolveTerminologyLabel(labels, key),
  };
}
