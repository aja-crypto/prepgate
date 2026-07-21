import React from 'react';
import { View, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../theme/colors';
import { radius } from '../../theme/spacing';
import { TableCell } from './TableCell';

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1.5,
    borderBottomColor: colors.brandViolet,
  },
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
    <View style={styles.wrapper}>
      <View style={styles.row}>
        {columns.map((col) => (
          <TableCell key={col.key} width={col.width} align={col.align} isHeader>
            {col.label}
          </TableCell>
        ))}
      </View>
    </View>
  );
};
