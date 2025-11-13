// Price formatting utilities for Nigerian Naira

export const formatPrice = (price) => {
  if (price === null || price === undefined || isNaN(price)) {
    return '₦0.00';
  }
  
  const numPrice = parseFloat(price);
  
  // Format with comma separators and 2 decimal places
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numPrice);
};

export const formatPriceSimple = (price) => {
  if (price === null || price === undefined || isNaN(price)) {
    return '₦0.00';
  }
  
  const numPrice = parseFloat(price);
  
  // Simple format with ₦ symbol and commas
  return '₦' + numPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const parsePrice = (priceString) => {
  if (!priceString) return 0;
  
  // Remove ₦ symbol and commas, then parse
  const cleaned = priceString.toString().replace(/[₦,]/g, '');
  return parseFloat(cleaned) || 0;
};