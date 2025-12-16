'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  label?: string;
  value: string;
  onChange: (val: string) => void;
  showText?: boolean; // optional hex textbox
  variant?: 'inline' | 'popover';
  allowCustom?: boolean;
  palette?: string[];
}

const DEFAULT_BRAND_PALETTE: string[] = [
  // Blues (primary family)
  '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8', '#1E40AF',
  // Cyans / Teals
  '#22D3EE', '#06B6D4', '#14B8A6', '#0D9488',
  // Greens (accent family)
  '#34D399', '#10B981', '#059669', '#16A34A', '#22C55E',
  // Yellows / Ambers
  '#FDE047', '#FACC15', '#FBBF24', '#F59E0B',
  // Oranges
  '#FB923C', '#F97316', '#EA580C',
  // Reds
  '#FCA5A5', '#F87171', '#EF4444', '#DC2626',
  // Pinks
  '#FDA4AF', '#FB7185', '#EC4899',
  // Purples
  '#C4B5FD', '#A78BFA', '#8B5CF6', '#7C3AED',
  // Neutrals
  '#CBD5E1', '#94A3B8', '#64748B', '#334155'
];

const normalizeHex = (raw: string) => {
  const s = (raw ?? '').trim();
  if (!s) return s;
  const withHash = s.startsWith('#') ? s : `#${s}`;
  return withHash.toUpperCase();
};

const isValidHex6 = (val: string) => /^#([0-9A-F]{6})$/.test(val);

function SwatchGrid({
  palette,
  selected,
  onPick,
  onAfterPick
}: {
  palette: string[];
  selected: string;
  onPick: (hex: string) => void;
  onAfterPick?: () => void;
}) {
  return (
    <div
      role="listbox"
      aria-label="Color palette"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(9, 24px)',
        gap: 8,
        padding: 8
      }}
    >
      {palette.map((hex) => {
        const isSelected = normalizeHex(selected) === hex;
        return (
          <button
            key={hex}
            type="button"
            role="option"
            aria-selected={isSelected}
            title={hex}
            onClick={() => {
              onPick(hex);
              onAfterPick?.();
            }}
            style={{
              width: 24,
              height: 24,
              borderRadius: 'var(--radius-sm)',
              background: hex,
              border: isSelected ? '2px solid var(--color-text)' : '2px solid var(--color-divider)',
              boxShadow: isSelected ? '0 0 0 2px rgba(0,0,0,0.35)' : undefined,
              cursor: 'pointer'
            }}
          />
        );
      })}
    </div>
  );
}

export default function ColorPicker({
  label,
  value,
  onChange,
  showText = true,
  variant = 'inline',
  allowCustom = true,
  palette
}: Props) {
  const paletteToUse = palette ?? DEFAULT_BRAND_PALETTE;
  const normalizedValue = useMemo(() => normalizeHex(value), [value]);
  const valid = useMemo(() => isValidHex6(normalizedValue), [normalizedValue]);
  const safeValue = valid ? normalizedValue : paletteToUse[0];
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; width: number } | null>(null);

  const setColor = (hex: string) => onChange(normalizeHex(hex));

  const handleText = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value.toUpperCase());
  };

  const customPicker = allowCustom ? (
    <input
      type="color"
      value={safeValue}
      onChange={(e) => setColor(e.target.value)}
      className="w-10 h-10 rounded-lg border-0 cursor-pointer"
      style={{ background: 'transparent' }}
      aria-label={(label ?? 'Color') + ' custom picker'}
    />
  ) : null;

  const textField = showText ? (
    <input
      type="text"
      className="input input-sm"
      value={value}
      onChange={handleText}
      placeholder="#RRGGBB"
      aria-label={label ?? 'Color'}
      style={{ width: 140 }}
    />
  ) : null;

  if (variant === 'popover') {
    useEffect(() => {
      if (!open) return;

      const update = () => {
        const el = triggerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setPopoverPos({
          top: r.bottom + 8,
          left: r.left,
          width: r.width
        });
      };

      update();
      window.addEventListener('scroll', update, true);
      window.addEventListener('resize', update);
      return () => {
        window.removeEventListener('scroll', update, true);
        window.removeEventListener('resize', update);
      };
    }, [open]);

    useEffect(() => {
      if (!open) return;

      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setOpen(false);
      };
      document.addEventListener('keydown', onKeyDown);
      return () => document.removeEventListener('keydown', onKeyDown);
    }, [open]);

    return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          title={safeValue}
          ref={triggerRef}
          style={{
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-sm)',
            border: '2px solid var(--color-divider)',
            background: safeValue,
            boxShadow: open ? 'var(--focus-ring)' : undefined
          }}
        />
        {textField}
        {customPicker}
        {open && typeof document !== 'undefined' && popoverPos &&
          createPortal(
            <>
              <div
                onClick={() => setOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  zIndex: 1000
                }}
              />
              <div
                style={{
                  position: 'fixed',
                  top: popoverPos.top,
                  left: popoverPos.left,
                  zIndex: 1001,
                  background: 'var(--color-bg-elevated)',
                  border: '1px solid var(--color-divider)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)'
                }}
              >
                <SwatchGrid
                  palette={paletteToUse}
                  selected={safeValue}
                  onPick={setColor}
                  onAfterPick={() => setOpen(false)}
                />
              </div>
            </>,
            document.body
          )}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {customPicker}
        {textField}
      </div>
      <div
        style={{
          border: '1px solid var(--color-divider)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-surface)'
        }}
      >
        <SwatchGrid palette={paletteToUse} selected={safeValue} onPick={setColor} />
      </div>
    </div>
  );
}
