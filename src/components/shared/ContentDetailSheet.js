import { Feather } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, shadows, spacing } from '../../theme';

function DetailMetadata({ metadataItems = [] }) {
  if (!metadataItems.length) {
    return null;
  }

  return (
    <View style={styles.metadataWrap}>
      {metadataItems.map((item) => (
        <View key={`${item.label}-${item.value}`} style={styles.metadataPill}>
          <Text style={styles.metadataLabel}>{item.label}</Text>
          <Text style={styles.metadataValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function DetailSections({ sections = [] }) {
  if (!sections.length) {
    return null;
  }

  return (
    <View style={styles.sectionsWrap}>
      {sections.map((section) => (
        <View key={section.title} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <View style={styles.sectionItems}>
            {(section.items || []).map((item) => (
              <View key={`${section.title}-${item.label}-${item.value}`} style={styles.sectionRow}>
                <Text style={styles.sectionLabel}>{item.label}</Text>
                <Text style={styles.sectionValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

export function ContentDetailSheet({
  visible = false,
  title,
  eyebrow = 'Details',
  subtitle = '',
  timestamp = '',
  metadataItems = [],
  sections = [],
  body = '',
  footer = null,
  closeLabel = 'Close details',
  onClose,
}) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.root, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <Text style={styles.title}>{title || 'Untitled item'}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {timestamp ? <Text style={styles.timestamp}>{timestamp}</Text> : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={closeLabel}
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed ? styles.closeButtonPressed : null]}
          >
            <Feather name="x" size={20} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <DetailMetadata metadataItems={metadataItems} />
          <DetailSections sections={sections} />
          {body || !sections.length ? (
            <Text style={styles.body}>{body || 'No details available.'}</Text>
          ) : null}
        </ScrollView>

        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  timestamp: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  closeButton: {
    width: 46,
    height: 46,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  closeButtonPressed: {
    opacity: 0.9,
  },
  scroll: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  metadataWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  sectionsWrap: {
    gap: spacing.md,
  },
  metadataPill: {
    minWidth: 112,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 4,
    ...shadows.card,
  },
  metadataLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  metadataValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  sectionCard: {
    borderRadius: radii.xl,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.md,
    gap: spacing.sm,
    ...shadows.card,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionItems: {
    gap: spacing.sm,
  },
  sectionRow: {
    gap: 4,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionValue: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  body: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '600',
  },
  footer: {
    paddingTop: spacing.sm,
  },
});
