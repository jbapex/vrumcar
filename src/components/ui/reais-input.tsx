'use client';

import * as React from 'react';
import { Input, type InputProps } from '@/components/ui/input';
import {
  centsToReaisDisplay,
  formatReaisForInput,
  formatReaisWhileTyping,
  parseReaisFormatted,
} from '@/lib/format';

function initialReaisDisplay(
  defaultCents?: number | null,
  defaultValue?: string | number,
): string {
  if (defaultCents != null) return centsToReaisDisplay(defaultCents);
  if (defaultValue === undefined || defaultValue === null || defaultValue === '') {
    return '';
  }

  const raw = String(defaultValue).trim();
  if (/^\d+(\.\d+)?$/.test(raw)) {
    return formatReaisForInput(Number(raw));
  }

  return formatReaisWhileTyping(raw);
}

export type ReaisInputProps = Omit<
  InputProps,
  'type' | 'defaultValue' | 'value' | 'onChange' | 'name'
> & {
  name: string;
  defaultCents?: number | null;
  defaultValue?: string | number;
};

export function ReaisInput({
  name,
  id,
  defaultCents,
  defaultValue,
  required,
  className,
  ...props
}: ReaisInputProps) {
  const [display, setDisplay] = React.useState(() =>
    initialReaisDisplay(defaultCents, defaultValue),
  );

  const hiddenValue = React.useMemo(() => {
    const reais = parseReaisFormatted(display);
    if (reais == null) return '';
    return String(reais);
  }, [display]);

  return (
    <>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        required={required}
        value={display}
        onChange={(event) => setDisplay(formatReaisWhileTyping(event.target.value))}
        className={className}
        {...props}
      />
      <input type="hidden" name={name} value={hiddenValue} />
    </>
  );
}
