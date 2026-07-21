import React from 'react';
import { Image, StyleSheet } from '@react-pdf/renderer';
const styles = StyleSheet.create({ wordmark: { objectFit: 'contain' } });
export interface WordmarkProps { width?: number; height?: number; showTagline?: boolean; gradientId?: string; }
export const Wordmark: React.FC<WordmarkProps> = ({ width = 160, height = 44 }) => (
  <Image src="/icons/WORDMARK.jpeg" style={[styles.wordmark, { width, height }]} />
);
