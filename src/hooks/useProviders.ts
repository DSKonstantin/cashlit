import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProviders,
  addProvider,
  testProvider,
  removeProvider,
} from "@/lib/commands";
import type { NewProviderConfig } from "@/lib/types";

export function useProviders() {
  return useQuery({
    queryKey: ["providers"],
    queryFn: getProviders,
    refetchInterval: false,
  });
}

export function useAddProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (config: NewProviderConfig) => addProvider(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export function useTestProvider() {
  return useMutation({
    mutationFn: (config: NewProviderConfig) => testProvider(config),
  });
}

export function useRemoveProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => removeProvider(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providers"] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["subscribers"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}
