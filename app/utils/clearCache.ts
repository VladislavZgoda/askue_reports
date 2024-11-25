import cache from '~/utils/cache';

export default function clearCache(transSubId: string) {
  const cacheKeys = cache.keys();

  if (cacheKeys.length > 0) {
    cacheKeys.forEach((cacheKey) => {
      if (cacheKey.startsWith('view-data')) cache.removeKey(cacheKey);
      if (cacheKey.startsWith(`transformer-substations${transSubId}`)) cache.removeKey(cacheKey);
    })
  }
}
