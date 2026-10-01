export function getGramPerVori(user) {
  // If user ID is 411, 1 vori = 11.664 grams
  // Otherwise, 1 vori = 116.64 grams
  if (user && String(user.id) === '411') {
    return 11.664;
  }
  return 116.64;
}
