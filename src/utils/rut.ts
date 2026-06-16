export function cleanRut(value: string | null | undefined) {
  return String(value ?? '')
    .replace(/[^0-9kK]/g, '')
    .toUpperCase();
}

export function formatRut(value: string | null | undefined) {
  const cleanValue = cleanRut(value);

  if (!cleanValue) {
    return '';
  }

  if (cleanValue.length === 1) {
    return cleanValue;
  }

  const body = cleanValue.slice(0, -1);
  const verifier = cleanValue.slice(-1);
  const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formattedBody}-${verifier}`;
}

export function normalizeRutForSubmit(value: string | null | undefined) {
  const formattedRut = formatRut(value).trim();

  return formattedRut || null;
}

export function formatRutIfPossible(value: string | null | undefined) {
  const rawValue = String(value ?? '').trim();

  if (!rawValue) {
    return null;
  }

  const cleanValue = cleanRut(rawValue);

  if (!cleanValue) {
    return rawValue;
  }

  if (cleanValue.length < 7 || cleanValue.length > 10) {
    return rawValue;
  }

  const hasOnlyRutCharacters = /^[0-9kK.\-\s]+$/.test(rawValue);

  if (!hasOnlyRutCharacters) {
    return rawValue;
  }

  return formatRut(cleanValue);
}
