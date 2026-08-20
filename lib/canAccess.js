export function canAccess(features, featureName, optionName) {
  if (!features) return false;
  const feature = features.find(
    (f) => f.name === featureName && f.status === 1
  );
  if (!feature) return false;
  if (!optionName) return true;
  return feature.feature_options?.some(
    (o) => o.name === optionName && o.status === 1
  );
}
