import { useQuery } from "@tanstack/react-query";
import { getAnalytics, getPlans, getPayments } from "@/lib/commands";
import { useAppContext } from "@/context/AppContext";
import { periodToDateRange } from "@/lib/utils";
import { useProjects } from "./useProjects";

/** Get provider IDs that belong to the selected project */
function useActiveProviderIds(): string[] | null {
  const { projectId } = useAppContext();
  const { data: projects } = useProjects();

  if (!projectId || !projects) return null; // null = all
  const project = projects.find((p) => p.id === projectId);
  return project?.providerIds ?? [];
}

function filterByProject<T extends { id: string }>(
  items: T[],
  providerIds: string[] | null,
): T[] {
  if (!providerIds) return items;
  return items.filter((item) =>
    providerIds.some((pid) => item.id.startsWith(pid + ":")),
  );
}

export function useAnalytics() {
  const { period, providerFilter } = useAppContext();
  const { since, until } = periodToDateRange(period);

  return useQuery({
    queryKey: ["analytics", period, providerFilter],
    queryFn: () => getAnalytics(since, until, providerFilter ?? undefined),
    refetchInterval: 5 * 60 * 1000,
  });
}

export function usePlans() {
  const { providerFilter } = useAppContext();
  const activeIds = useActiveProviderIds();

  return useQuery({
    queryKey: ["plans", providerFilter, activeIds],
    queryFn: async () => {
      const plans = await getPlans(providerFilter ?? undefined);
      return filterByProject(plans, activeIds);
    },
    refetchInterval: 5 * 60 * 1000,
  });
}

export function usePayments(customSince?: number, customUntil?: number) {
  const { period, providerFilter } = useAppContext();
  const { since: defaultSince, until: defaultUntil } = periodToDateRange(period);
  const activeIds = useActiveProviderIds();

  const since = customSince ?? defaultSince;
  const until = customUntil ?? defaultUntil;

  return useQuery({
    queryKey: ["payments", since, until, providerFilter, activeIds],
    queryFn: async () => {
      const payments = await getPayments(since, until, providerFilter ?? undefined);
      if (!activeIds) return payments;
      // Filter payments: id format is "configId:paymentId"
      return payments.filter((p) =>
        activeIds.some((pid) => p.id.startsWith(pid + ":")),
      );
    },
    refetchInterval: 5 * 60 * 1000,
  });
}
