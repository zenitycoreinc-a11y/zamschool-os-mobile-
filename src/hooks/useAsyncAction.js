import React from 'react';

export function useAsyncAction(action) {
  const [isRunning, setIsRunning] = React.useState(false);
  const [error, setError] = React.useState('');

  const run = React.useCallback(
    async (...args) => {
      setIsRunning(true);
      setError('');
      try {
        return await action(...args);
      } catch (e) {
        setError(e?.message || 'Action failed.');
        throw e;
      } finally {
        setIsRunning(false);
      }
    },
    [action]
  );

  return {
    run,
    isRunning,
    error,
    setError,
  };
}
