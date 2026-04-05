export const TEACHER_PREWARM_TABS = ['classroom', 'attendance', 'results', 'messages'];

export function mergeTeacherPrewarmTabs(visitedTabs = [], persistentTabs = []) {
  const allowedTabs = new Set(persistentTabs);
  const nextVisitedTabs = [...visitedTabs];

  for (const tab of TEACHER_PREWARM_TABS) {
    if (!allowedTabs.has(tab) || nextVisitedTabs.includes(tab)) {
      continue;
    }

    nextVisitedTabs.push(tab);
  }

  return nextVisitedTabs;
}
