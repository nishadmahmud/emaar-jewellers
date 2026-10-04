export function getDhakaDateString(dateObj = new Date()) {
  const options = { timeZone: 'Asia/Dhaka', year: 'numeric', month: '2-digit', day: '2-digit' };
  // 'en-CA' is widely supported and outputs YYYY-MM-DD
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  return formatter.format(dateObj);
}

export function getDhakaDateTimeStart(dateStr) {
  // If no date string provided, default to today
  const d = dateStr || getDhakaDateString();
  return `${d}T00:00:00.000+06:00`;
}

export function getDhakaDateTimeEnd(dateStr) {
  const d = dateStr || getDhakaDateString();
  return `${d}T23:59:59.999+06:00`;
}
