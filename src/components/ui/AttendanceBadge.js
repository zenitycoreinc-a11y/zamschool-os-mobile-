import { StyleSheet, Text, View } from 'react-native';

const MAP = {
  present: { label: 'Present', bg: '#DCFCE7', fg: '#166534' },
  absent: { label: 'Absent', bg: '#FEE2E2', fg: '#991B1B' },
  late: { label: 'Late', bg: '#FEF3C7', fg: '#92400E' },
  excused: { label: 'Excused', bg: '#E0E7FF', fg: '#3730A3' },
};

export function AttendanceBadge({ status }) {
  const cfg = MAP[status] || { label: String(status || 'Unknown'), bg: '#E2E8F0', fg: '#334155' };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}> 
      <Text style={[styles.text, { color: cfg.fg }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
