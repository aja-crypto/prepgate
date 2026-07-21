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
    borderTopWidth: 0.5,
    borderTopColor: colors.hairline,
  },
  accentBar: {
    position: 'absolute',
    top: -1,
    left: layout.pageMargin,
    right: layout.pageMargin,
    height: 1.5,
    backgroundColor: colors.brandViolet,
    opacity: 0.4,
    borderRadius: 1,
  },
  text: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
});

export interface FooterProps {
  meta: ReportMeta;
  pageNum?: number;
  total?: number;
}

export const Footer: React.FC<FooterProps> = ({ meta, pageNum, total }) => {
  return (
    <View style={styles.container}>
      <View style={styles.accentBar} />
      <Text style={styles.text}>(c) {meta.organisationName} . Confidential Report</Text>
      <Text style={styles.text}>
        Page {pageNum} of {total}
      </Text>
    </View>
  );
};
