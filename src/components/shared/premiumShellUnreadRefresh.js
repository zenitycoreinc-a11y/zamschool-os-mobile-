export function scheduleUnreadRefresh({
  defer,
  subscribe,
  subscribeToAppState,
  onAppStateActive,
  onRefresh,
}) {
  let active = true;

  function refresh() {
    if (active) {
      onRefresh();
    }
  }

  const deferredTask = defer(refresh);
  const unsubscribe = subscribe(refresh);
  const unsubscribeAppState = subscribeToAppState((nextState) => {
    if (!active || nextState !== 'active') {
      return;
    }

    onAppStateActive?.();
    refresh();
  });

  return () => {
    active = false;
    deferredTask?.cancel?.();
    unsubscribe?.();
    unsubscribeAppState?.();
  };
}
