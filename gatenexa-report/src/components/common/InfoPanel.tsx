/**
 * src/components/common/InfoPanel.tsx
 * Reusable bordered panel used for "Data Sources Used" / "How to Read This
 * Report" (Prediction Basis section) and the disclaimer box.
 */
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize, lineHeight } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';

const styles = StyleSheet.create({
  panel: {
    flexGrow: 1,
    flexBasis: 0,
    backgroundColor: colors.bgPanelAlt,
    borderWidth: 0.8,
    borderColor: colors.bgCardBorder,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  title: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.body,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.bodySm,
    color: colors.textSecondary,
    lineHeight: lineHeight.normal,
  },
});

export interface InfoPanelProps {
  title: string;
  children: React.ReactNode;
}

export const InfoPanel: React.FC<InfoPanelProps> = ({ title, children }) => {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
};

export interface DataSourceRowProps {
  name: string;
  available: boolean;
}

export const DataSourceRow: React.FC<DataSourceRowProps> = ({ name, available }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 3.5,
        borderBottomWidth: 0.5,
        borderBottomColor: colors.hairline,
      }}
    >
      <Text style={{ fontFamily: fontFamily.sans, fontSize: fontSize.bodySm, color: colors.textSecondary }}>
        {name}
      </Text>
      <Text
        style={{
          fontFamily: fontFamily.sansSemibold,
          fontSize: fontSize.bodySm,
          color: available ? colors.success : colors.textMuted,
        }}
      >
        {available ? 'Available' : 'Not yet available'}
      </Text>
    </View>
  );
};

export const InfoPanelBody: React.FC<{ text: string }> = ({ text }) => (
  <Text style={styles.body}>{text}</Text>
);
