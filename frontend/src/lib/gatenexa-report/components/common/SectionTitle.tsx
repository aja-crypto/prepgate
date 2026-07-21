/**
 * src/components/common/SectionTitle.tsx
 * Numbered section heading, e.g. "① Executive Summary" — the circled
 * number badge plus bold title used to open each report section.
 */
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  badge: {
    width: 16,
    height: 16,
    borderRadius: radius.circle,
    borderWidth: 0.8,
    borderColor: colors.brandVioletLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  badgeText: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.bodySm,
    color: colors.brandVioletLight,
  },
  title: {
    fontFamily: fontFamily.sansBold,
    fontSize: fontSize.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodySm,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export interface SectionTitleProps {
  number: number;
  title: string;
  subtitle?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ number, title, subtitle }) => {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <View style={styles.row}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{number}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
};
