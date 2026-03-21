import type {
  AnalyticsSummary,
  NewProject,
  NewProviderConfig,
  Payment,
  Plan,
  Project,
  Provider,
  ProviderConfig,
  Subscriber,
} from "./types";

// In dev mode without Tauri, use mock data
const isTauri = "__TAURI_INTERNALS__" in window;

async function invoke<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  if (isTauri) {
    const { invoke: tauriInvoke } = await import("@tauri-apps/api/core");
    return tauriInvoke<T>(command, args);
  }
  throw new Error(`Tauri not available. Command: ${command}`);
}

// Analytics
export async function getAnalytics(
  since: number,
  until: number,
  provider?: Provider,
): Promise<AnalyticsSummary> {
  return invoke("get_analytics", { since, until, provider });
}

// Plans
export async function getPlans(provider?: Provider): Promise<Plan[]> {
  return invoke("get_plans", { provider });
}

// Subscribers
export async function getSubscribers(provider?: Provider): Promise<Subscriber[]> {
  return invoke("get_subscribers", { provider });
}

// Payments
export async function getPayments(
  since: number,
  until: number,
  provider?: Provider,
): Promise<Payment[]> {
  return invoke("get_payments", { since, until, provider });
}

// Provider management
export async function getProviders(): Promise<ProviderConfig[]> {
  return invoke("get_providers");
}

export async function addProvider(config: NewProviderConfig): Promise<void> {
  return invoke("add_provider", { config });
}

export async function testProvider(config: NewProviderConfig): Promise<boolean> {
  return invoke("test_provider", { config });
}

export async function removeProvider(id: string): Promise<void> {
  return invoke("remove_provider", { id });
}

// Projects
export async function getProjects(): Promise<Project[]> {
  return invoke("get_projects");
}

export async function createProject(project: NewProject): Promise<Project> {
  return invoke("create_project", { project });
}

export async function updateProject(project: Project): Promise<void> {
  return invoke("update_project", { project });
}

export async function deleteProject(id: string): Promise<void> {
  return invoke("delete_project", { id });
}

// Auth
export async function authenticate(): Promise<boolean> {
  return invoke("authenticate");
}
