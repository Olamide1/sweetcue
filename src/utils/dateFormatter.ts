/**
 * Formats date input automatically as user types
 * "08201997" -> "08/20/1997"
 * "0820" -> "08/20"
 * Also preserves manual "/" input
 */
export const formatDateInput = (input: string): string => {
  // Remove all non-digits and non-slashes, then remove extra slashes
  let cleaned = input.replace(/[^\d/]/g, '');
  
  // If user is typing manually with slashes, just clean and return
  if (cleaned.includes('/')) {
    // Remove extra slashes and limit format
    const parts = cleaned.split('/');
    if (parts.length >= 3) {
      return `${parts[0].slice(0, 2)}/${parts[1].slice(0, 2)}/${parts[2].slice(0, 4)}`;
    } else if (parts.length === 2) {
      return `${parts[0].slice(0, 2)}/${parts[1].slice(0, 2)}`;
    }
    return cleaned;
  }
  
  // Auto-format for digits-only input
  const digits = cleaned.replace(/\D/g, '');
  
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  } else if (digits.length <= 8) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  } else {
    // Limit to 8 digits max
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }
};

/**
 * Validates if a date string is in MM/DD/YYYY format
 */
export const isValidDateFormat = (date: string): boolean => {
  const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
  return regex.test(date);
}; 