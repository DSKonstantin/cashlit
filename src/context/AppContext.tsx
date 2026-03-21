import { createContext, useContext, useState, type ReactNode } from "react";
import type { PeriodFilter, Provider } from "@/lib/types";

interface AppContextValue {
  period: PeriodFilter;
  setPeriod: (p: PeriodFilter) => void;
  providerFilter: Provider | null;
  setProviderFilter: (p: Provider | null) => void;
  // Project filter: null = all providers, string = project ID
  projectId: string | null;
  setProjectId: (id: string | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [providerFilter, setProviderFilter] = useState<Provider | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  return (
    <AppContext.Provider
      value={{
        period,
        setPeriod,
        providerFilter,
        setProviderFilter,
        projectId,
        setProjectId,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}
