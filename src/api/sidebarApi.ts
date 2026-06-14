const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type SidebarSummary = {
  totalMovements: number;
  activeAlerts: number;
  negativeStockAlerts: number;
  noStockAlerts: number;
  minStockAlert: number;
};

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function fetchSidebarSummary(): Promise<SidebarSummary> {
  const response = await fetch(`${apiBaseUrl}/sidebar/summary`);

  if (!response.ok) {
    throw new Error('No se pudo cargar el resumen del menú lateral.');
  }

  const data = await response.json();

  return {
    totalMovements: toNumber(data.totalMovements),
    activeAlerts: toNumber(data.activeAlerts),
    negativeStockAlerts: toNumber(data.negativeStockAlerts),
    noStockAlerts: toNumber(data.noStockAlerts),
    minStockAlert: toNumber(data.minStockAlert),
  };
}