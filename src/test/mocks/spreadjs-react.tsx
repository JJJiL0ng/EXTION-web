import type { ReactNode } from 'react';
import React from 'react';

interface SpreadComponentProps {
  children?: ReactNode;
}

export function SpreadSheets({ children }: SpreadComponentProps) {
  return <div data-testid="spreadjs-workbook">{children}</div>;
}

export function Worksheet({ children }: SpreadComponentProps) {
  return <div data-testid="spreadjs-worksheet">{children}</div>;
}

export function Column() {
  return null;
}
