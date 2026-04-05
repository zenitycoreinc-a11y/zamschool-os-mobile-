export const CACHED_STUDENT_TABS = ['home', 'attendance', 'results', 'messages'];

function getCachedTabs(tabs, cachedTabs) {
  const filteredTabs = tabs.filter((tab) => cachedTabs.includes(tab));
  return filteredTabs.length === tabs.length ? tabs : filteredTabs;
}

export function rememberStudentTab(visitedTabs, activeTab, cachedTabs = CACHED_STUDENT_TABS) {
  if (!cachedTabs.includes(activeTab)) {
    return getCachedTabs(visitedTabs, cachedTabs);
  }

  if (visitedTabs.includes(activeTab)) {
    return getCachedTabs(visitedTabs, cachedTabs);
  }

  return [...getCachedTabs(visitedTabs, cachedTabs), activeTab];
}

export function getMountedStudentTabs(activeTab, visitedTabs, cachedTabs = CACHED_STUDENT_TABS) {
  const warmTabs = getCachedTabs(visitedTabs, cachedTabs);

  if (warmTabs.includes(activeTab)) {
    return warmTabs;
  }

  return [...warmTabs, activeTab];
}
