import { getAccessToken } from './authApi';

const apiBaseUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export type BulkUploadImportType = 'products' | 'customers' | 'suppliers';

export type BulkUploadError = {
  row: number;
  reason: string;
};

export type BulkUploadSummary = {
  type: BulkUploadImportType;
  fileName: string;
  totalRows: number;
  processedRows: number;
  created: number;
  updated: number;
  skipped: number;
  errors: BulkUploadError[];
};

const importEndpoints: Record<BulkUploadImportType, string> = {
  products: '/imports/products/excel',
  customers: '/imports/customers/excel',
  suppliers: '/imports/suppliers/excel',
};

function toNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeErrors(value: unknown): BulkUploadError[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((error) => {
    const candidate = error as Partial<BulkUploadError>;

    return {
      row: toNumber(candidate.row),
      reason: String(candidate.reason ?? 'Error sin detalle'),
    };
  });
}

function normalizeSummary(value: unknown, fallbackType: BulkUploadImportType): BulkUploadSummary {
  const summary = value as Partial<BulkUploadSummary>;

  return {
    type: summary.type ?? fallbackType,
    fileName: String(summary.fileName ?? ''),
    totalRows: toNumber(summary.totalRows),
    processedRows: toNumber(summary.processedRows),
    created: toNumber(summary.created),
    updated: toNumber(summary.updated),
    skipped: toNumber(summary.skipped),
    errors: normalizeErrors(summary.errors),
  };
}

async function readError(response: Response, fallback: string) {
  const body = await response.json().catch(() => null);
  const message = body?.message;

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  if (typeof message === 'string' && message.trim()) {
    return message;
  }

  return fallback;
}

export async function uploadBulkExcel(
  importType: BulkUploadImportType,
  file: File,
) {
  const accessToken = getAccessToken();

  if (!accessToken) {
    throw new Error('La sesión no está activa. Inicia sesión nuevamente.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${apiBaseUrl}${importEndpoints[importType]}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(
      await readError(response, 'No se pudo procesar la carga masiva.'),
    );
  }

  return normalizeSummary(await response.json(), importType);
}
