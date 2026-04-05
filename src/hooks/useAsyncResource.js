import React from 'react';

export function useAsyncResource(loader, { initialData = null } = {}) {
  const [data, setData] = React.useState(initialData);
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(initialData == null);
  const [refreshing, setRefreshing] = React.useState(false);

  const runLoader = React.useCallback(async ({ throwOnError = false } = {}) => {
    try {
      setError('');
      const result = await loader();
      setData(result ?? initialData);
      return result;
    } catch (e) {
      setError(e?.message || 'Failed to load data.');
      if (throwOnError) {
        throw e;
      }

      return initialData;
    }
  }, [initialData, loader]);

  const load = React.useCallback(async () => runLoader(), [runLoader]);
  const loadOrThrow = React.useCallback(
    async () => runLoader({ throwOnError: true }),
    [runLoader]
  );

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await loader();
        if (mounted) {
          setError('');
          setData(result ?? initialData);
        }
      } catch (e) {
        if (mounted) setError(e?.message || 'Failed to load data.');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [initialData, loader]);

  const refresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  return {
    data,
    setData,
    error,
    isLoading,
    refreshing,
    load,
    loadOrThrow,
    refresh,
  };
}
