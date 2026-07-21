import React from 'react';
import { Image, StyleSheet } from '@react-pdf/renderer';
const styles = StyleSheet.create({ icon: { objectFit: 'contain' } });
export interface NSymbolProps { size?: number; gradientId?: string; }
export const NSymbol: React.FC<NSymbolProps> = ({ size = 64 }) => (
  <Image src="/icons/N SYMBOL.jpeg" style={[styles.icon, { width: size, height: size }]} />
);
