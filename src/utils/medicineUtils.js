export function getMedicineStatus(medicine) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let expiry;
  if (typeof medicine.expiry_date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(medicine.expiry_date)) {
    const [y, m, d] = medicine.expiry_date.split('-').map(Number);
    expiry = new Date(y, m - 1, d);
  } else {
    expiry = new Date(medicine.expiry_date);
  }
  expiry.setHours(0, 0, 0, 0);

  if (expiry < today) return 'Expired';
  if (medicine.quantity === 0) return 'Out of Stock';
  if (medicine.quantity <= 5) return 'Low Stock';
  return 'In Stock';
}

/**
 * Returns a CSS class name for badge styling based on status.
 */
export function getStatusClass(status) {
  switch (status) {
    case 'Expired': return 'badge badge-expired';
    case 'Out of Stock': return 'badge badge-out';
    case 'Low Stock': return 'badge badge-low';
    case 'In Stock': return 'badge badge-in';
    default: return 'badge';
  }
}

/**
 * Returns true if a medicine is available for billing.
 */
export function isBillable(medicine) {
  const status = getMedicineStatus(medicine);
  return status === 'In Stock' || status === 'Low Stock';
}

/**
 * Formats a number as Bangladeshi Taka.
 */
export function formatTaka(amount) {
  return `৳${Number(amount).toFixed(2)}`;
}

/**
 * Formats a date string as "17 August 2026".
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
