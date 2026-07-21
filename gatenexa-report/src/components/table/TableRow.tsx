/**
 * src/components/table/TableRow.tsx
 * A single programme row: rank, institute, programme, chance badge,
 * cutoff, fees, avg package. Zebra-striped by index for readability.
 */
import React from 'react';
import { View, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../theme/colors';
import { TableCell } from './TableCell';
import { ChanceBadge } from '../common/ChanceBadge';
import { ProgrammeRow as ProgrammeRowType } from '../../types/report.types';
import { orDash } from '../../utils/formatters';
import { PROGRAMME_TABLE_COLUMNS } from '../../utils/layoutUtils';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: colors.hairline,
  },
});

export interface TableRowProps {
  row: ProgrammeRowType;
  index: number;
}

export const TableRow: React.FC<TableRowProps> = ({ row, index }) => {
  const bg = index % 2 === 0 ? colors.tableRowBase : colors.tableRowAlt;
  const c = PROGRAMME_TABLE_COLUMNS;

  return (
    <View style={[styles.row, { backgroundColor: bg }]} wrap={false}>
      <TableCell width={c.rank} align="center">
        {row.rank}
      </TableCell>
      <TableCell width={c.institute} strong>
        {row.institute}
      </TableCell>
      <TableCell width={c.programme}>{row.programme}</TableCell>
      <TableCell width={c.chance} align="center">
        <ChanceBadge percent={row.chancePct} tier={row.tier} />
      </TableCell>
      <TableCell width={c.cutoff} align="center">
        {orDash(row.cutoff)}
      </TableCell>
      <TableCell width={c.fees} align="center">
        {orDash(row.fees)}
      </TableCell>
      <TableCell width={c.avgPackage} align="center" strong>
        {orDash(row.avgPackage)}
      </TableCell>
    </View>
  );
};
