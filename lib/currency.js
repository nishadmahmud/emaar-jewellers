export const extractAedRate = (inv, user = null) => {
  // Exception for user 411: strictly use 34
  if (user && String(user.id) === '411') {
    return 34;
  }

  // 1. Check if the invoice directly has a 'rate' key
  if (inv.rate && parseFloat(inv.rate) > 0) {
    return parseFloat(inv.rate);
  }

  // 2. Check if the details array has the 'rate' key (in case it's stored on the line item)
  const details = inv.sales_details || inv.purchase_details || [];
  for (const item of details) {
    if (item.aed_rate || item.rate) {
      // NOTE: We check item.aed_rate first in case 'rate' is used for the item's price
      const r = parseFloat(item.aed_rate || item.rate);
      // rough sanity check to ensure it's an exchange rate, not a massive item price
      if (r > 0 && r < 1000) return r; 
    }
  }
  
  // 3. Try to extract from pay_mode (e.g. "Cash (AED @ 34.5)") for older invoices
  if (inv.pay_mode && inv.pay_mode.includes('(AED @')) {
    const match = inv.pay_mode.match(/\(AED @ ([\d.]+)\)/);
    if (match && match[1]) {
      const parsed = parseFloat(match[1]);
      if (parsed > 0) return parsed;
    }
  }

  // 4. Fallback for old invoices missing the key completely
  return 34; 
};
