import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radii, shadows } from '../../theme';

function formatDate(value) {
  if (!value) return 'Recent';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Recent';
  return d.toLocaleDateString();
}

export function AnnouncementCard({ announcement, onPress }) {
  const Wrapper = onPress ? Pressable : View;
  const baseStyle = [styles.card, onPress ? styles.cardPressable : null];

  return (
    <Wrapper
      style={onPress ? ({ pressed }) => [...baseStyle, pressed ? styles.cardPressed : null] : baseStyle}
      onPress={onPress}
    >
      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          <Feather name="info" size={13} color="#1B3A6B" />
          <Text style={styles.metaText}>School Admin</Text>
        </View>
        <Text style={styles.dateText}>{formatDate(announcement?.created_at || announcement?.published_at)}</Text>
      </View>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{announcement?.title || 'Announcement'}</Text>
        {onPress ? <Feather name="chevron-right" size={16} color="#94A3B8" /> : null}
      </View>
      <Text numberOfLines={onPress ? 3 : undefined} style={styles.body}>{announcement?.body || ''}</Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  cardPressable: {
    ...shadows.card,
  },
  cardPressed: {
    opacity: 0.88,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  dateText: {
    color: colors.mutedSoft,
    fontSize: 11,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  body: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 20,
  },
});
