function getPersistentTabs(tabs, persistentTabs) {
  const filteredTabs = tabs.filter((tab) => persistentTabs.includes(tab));
  return filteredTabs.length === tabs.length ? tabs : filteredTabs;
}

export function rememberRoleTab(visitedTabs, activeTab, persistentTabs) {
  if (!persistentTabs.includes(activeTab)) {
    return getPersistentTabs(visitedTabs, persistentTabs);
  }

  if (visitedTabs.includes(activeTab)) {
    return getPersistentTabs(visitedTabs, persistentTabs);
  }

  return [...getPersistentTabs(visitedTabs, persistentTabs), activeTab];
}

export function getMountedRoleTabs(activeTab, visitedTabs, persistentTabs) {
  const warmTabs = getPersistentTabs(visitedTabs, persistentTabs);

  if (warmTabs.includes(activeTab)) {
    return warmTabs;
  }

  return [...warmTabs, activeTab];
}
