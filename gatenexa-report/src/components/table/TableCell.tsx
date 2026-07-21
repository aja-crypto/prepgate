/**
 * src/components/table/TableCell.tsx
 * Low-level cell primitive for both header and body rows.
 */
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const styles = StyleSheet.create({
  cell: {
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  headerText: {
    fontFamily: fontFamily.sansBold,
    fontSize: fontSize.tableHeader,
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  bodyText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.tableCell,
    color: colors.textSecondary,
  },
  bodyTextStrong: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: fontSize.tableCell,
    color: colors.textPrimary,
  },
});

export interface TableCellProps {
  width: number;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
  isHeader?: boolean;
  strong?: boolean;
}

export const TableCell: React.FC<TableCellProps> = ({
  width,
  align = 'left',
  children,
  isHeader = false,
  strong = false,
}) => {
  const textStyle = isHeader ? styles.headerText : strong ? styles.bodyTextStrong : styles.bodyText;
  return (
    <View style={[styles.cell, { width, alignItems: align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center' }]}>
      {typeof children === 'string' || typeof children === 'number' ? (
        <Text style={[textStyle, { textAlign: align }]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
};
