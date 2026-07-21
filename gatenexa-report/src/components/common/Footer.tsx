/**
 * src/components/common/Footer.tsx
 * Repeats on every page (fixed): org copyright, confidential marker, and
 * live "Page X of Y" numbering via react-pdf's render-prop pageNumber/
 * totalPages injection.
 */
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/typography';
import { layout, spacing } from '../../theme/spacing';
import { ReportMeta } from '../../types/report.types';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: layout.pageWidth,
    paddingHorizontal: layout.pageMargin,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 0.6,
    borderTopColor: colors.hairline,
  },
  text: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
});

export interface FooterProps {
  meta: ReportMeta;
}

export const Footer: React.FC<FooterProps> = ({ meta }) => {
  return (
    <View style={styles.container} fixed>
      <Text style={styles.text}>{'\u00A9'} {meta.organisationName} AI {'\u00B7'} Confidential Report</Text>
      <Text
        style={styles.text}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
};
