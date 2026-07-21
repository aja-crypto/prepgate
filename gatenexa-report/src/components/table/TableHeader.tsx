/**
 * src/components/table/TableHeader.tsx
 * The solid-violet header row shared by the IIT and NIT/IIIT/GFTI tables.
 */
import React from 'react';
import { View, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';
import { TableCell } from './TableCell';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.tableHeaderBg,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
});

export interface ColumnDef {
  key: string;
  label: string;
  width: number;
  align?: 'left' | 'center' | 'right';
}

export interface TableHeaderProps {
  columns: ColumnDef[];
}

export const TableHeader: React.FC<TableHeaderProps> = ({ columns }) => {
  return (
    <View style={styles.row} fixed>
      {columns.map((col) => (
        <TableCell key={col.key} width={col.width} align={col.align} isHeader>
          {col.label}
        </TableCell>
      ))}
    </View>
  );
};
