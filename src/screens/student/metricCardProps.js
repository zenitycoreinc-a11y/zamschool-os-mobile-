export function splitMetricCardProps(metric) {
  const { key, ...cardProps } = metric;
  return { cardKey: key, cardProps };
}
