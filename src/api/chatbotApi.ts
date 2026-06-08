import { getAccessToken, logout } from './authApi';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type ChatbotProduct = {
  codigo: string;
  descrip: string;
  stock: number;
  minStock: number;
  status: 'DISPONIBLE' | 'BAJO_MINIMO' | 'SIN_STOCK' | 'REQUIERE_AJUSTE';
};

export type InventorySummary = {
  totalProducts: number;
  totalUnits: number;
  availableProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  adjustmentProducts: number;
};

export type ChatbotResponse = {
  type: 'PRODUCT' | 'PRODUCT_LIST' | 'INVENTORY_SUMMARY' | 'NOT_FOUND';
  answer: string;
  product?: ChatbotProduct | null;
  products?: ChatbotProduct[];
  totalResults?: number;
  summary?: InventorySummary;
};

export async function sendChatbotMessage(
  message: string,
): Promise<ChatbotResponse> {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Tu sesion no esta disponible. Inicia sesion nuevamente.');
  }

  const response = await fetch(`${apiBaseUrl}/chatbot/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ message }),
  });

  const data = (await response.json().catch(() => ({}))) as Partial<
    ChatbotResponse
  > & {
    message?: string;
  };

  if (!response.ok) {
    if (response.status === 401) {
      logout();
      throw new Error('Tu sesion expiro. Inicia sesion nuevamente.');
    }

    throw new Error(data.message || 'No se pudo consultar el chatbot.');
  }

  return {
    type: data.type ?? 'NOT_FOUND',
    answer: data.answer || 'No fue posible generar una respuesta.',
    product: data.product ?? null,
    products: data.products ?? [],
    totalResults: data.totalResults ?? 0,
    summary: data.summary,
  };
}
