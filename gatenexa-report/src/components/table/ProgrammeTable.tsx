/**
 * src/components/table/ProgrammeTable.tsx
 * Composite table: legend row + header + body rows + "N additional
 * programmes available in the full CSV export" note. Used identically for
 * both the IIT section and the NIT/IIIT/GFTI section — only the data and
 * section number differ.
 */
import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';
import { colors } from '../../theme/colors';
import { fontFamily, fontSize } from '../../theme/typography';
import { spacing, radius } from '../../theme/spacing';
import { TableHeader, ColumnDef } from './TableHeader';
import { TableRow } from './TableRow';
import { LegendDot } from '../common/ChanceBadge';
import { SectionTitle } from '../common/SectionTitle';
import { ProgrammeTable as ProgrammeTableType } from '../../types/report.types';
import { TABLE_LEGEND_DEFINITIONS } from '../../utils/chanceUtils';
import { PROGRAMME_TABLE_COLUMNS } from '../../utils/layoutUtils';

const styles = StyleSheet.create({
  legendRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  tableWrap: {
    borderWidth: 0.8,
    borderColor: colors.bgCardBorder,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  note: {
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 0.6,
    borderStyle: 'dashed',
    borderColor: colors.hairlineStrong,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  noteText: {
    fontFamily: fontFamily.sans,
    fontSize: fontSize.caption,
    color: colors.textMuted,
  },
});

const columns: ColumnDef[] = [
  { key: 'rank', label: '#', width: PROGRAMME_TABLE_COLUMNS.rank, align: 'center' },
  { key: 'institute', label: 'Institute', width: PROGRAMME_TABLE_COLUMNS.institute },
  { key: 'programme', label: 'Programme', width: PROGRAMME_TABLE_COLUMNS.programme },
  { key: 'chance', label: 'Chance', width: PROGRAMME_TABLE_COLUMNS.chance, align: 'center' },
  { key: 'cutoff', label: 'Cutoff', width: PROGRAMME_TABLE_COLUMNS.cutoff, align: 'center' },
  { key: 'fees', label: 'Fees', width: PROGRAMME_TABLE_COLUMNS.fees, align: 'center' },
  { key: 'avgPackage', label: 'Avg. Package', width: PROGRAMME_TABLE_COLUMNS.avgPackage, align: 'center' },
];

export interface ProgrammeTableProps {
  data: ProgrammeTableType;
}

export const ProgrammeTable: React.FC<ProgrammeTableProps> = ({ data }) => {
  return (
    <View>
      <SectionTitle
        number={data.sectionNumber}
        title={`${data.title} (${data.totalEligible} eligible)`}
        subtitle={data.subtitle}
      />

      <View style={styles.legendRow}>
        {TABLE_LEGEND_DEFINITIONS.map((def) => (
          <LegendDot key={def.tier} tier={def.tier} label={`${def.label} ${def.rangeLabel}`} />
        ))}
      </View>

      <View style={styles.tableWrap}>
        <TableHeader columns={columns} />
        {data.rows.map((row, idx) => (
          <TableRow key={`${row.institute}-${row.programme}-${row.rank}`} row={row} index={idx} />
        ))}
      </View>

      {data.remainingCount > 0 && (
        <View style={styles.note}>
          <Text style={styles.noteText}>
            + {data.remainingCount} additional {data.title.toLowerCase()} ({data.totalEligible} total) {data.csvNote}
          </Text>
        </View>
      )}
    </View>
  );
};
