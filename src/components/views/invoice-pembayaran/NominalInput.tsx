import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles } from 'lucide-react';
import { formatRupiah } from './types';

export interface NominalInputProps {
  id?: string;
  name?: string;
  value: number | undefined;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  label?: string;
  badgeLabel?: string;
  showPreview?: boolean;
  helperAction?: React.ReactNode;
}

/**
 * Format a number into Indonesian display string with dots
 * Example: 45000000 -> "45.000.000"
 */
export function formatNumberToDisplay(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return '';
  if (val === 0) return '0';

  const parts = val.toString().split('.');
  const integerPart = parts[0];
  const decimalPart = parts[1];

  const formattedInt = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (decimalPart !== undefined && decimalPart.length > 0) {
    return `${formattedInt},${decimalPart}`;
  }
  return formattedInt;
}

/**
 * Konversi angka ke kalimat Terbilang Bahasa Indonesia
 * (Membantu verifikasi otomatis skala ratusan, ribuan, jutaan, milyaran)
 */
export function terbilangRupiah(n: number): string {
  if (n === 0) return 'Nol Rupiah';
  if (isNaN(n) || !isFinite(n) || n < 0) return '';

  const satuan = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];

  function toWords(num: number): string {
    num = Math.floor(num);
    if (num < 12) return satuan[num];
    if (num < 20) return toWords(num - 10) + ' Belas';
    if (num < 100) return toWords(Math.floor(num / 10)) + ' Puluh ' + toWords(num % 10);
    if (num < 200) return 'Seratus ' + toWords(num - 100);
    if (num < 1000) return toWords(Math.floor(num / 100)) + ' Ratus ' + toWords(num % 100);
    if (num < 2000) return 'Seribu ' + toWords(num - 1000);
    if (num < 1000000) return toWords(Math.floor(num / 1000)) + ' Ribu ' + toWords(num % 1000);
    if (num < 1000000000) return toWords(Math.floor(num / 1000000)) + ' Juta ' + toWords(num % 1000000);
    if (num < 1000000000000) return toWords(Math.floor(num / 1000000000)) + ' Milyar ' + toWords(num % 1000000000);
    return toWords(Math.floor(num / 1000000000000)) + ' Triliun ' + toWords(num % 1000000000000);
  }

  const intPart = Math.floor(n);
  const words = toWords(intPart).replace(/\s+/g, ' ').trim();
  return `${words} Rupiah`;
}

/**
 * Parsing input string including quick text multipliers:
 * - "45jt" / "45 jt" / "45juta" -> 45.000.000
 * - "500k" / "500rb" / "500 ribu" -> 500.000
 * - "1.5jt" / "1,5jt" -> 1.500.000
 * - "2m" / "2 milyar" -> 2.000.000.000
 * - Regular typing: "45000000" -> 45.000.000
 */
export function parseAndFormatNominalInput(inputStr: string): {
  displayStr: string;
  numericValue: number;
} {
  if (!inputStr || !inputStr.trim()) {
    return { displayStr: '', numericValue: 0 };
  }

  let raw = inputStr.trim().toLowerCase().replace(/^rp\.?\s*/i, '');
  if (!raw) return { displayStr: '', numericValue: 0 };

  // Detect shortcut suffixes (jt, juta, k, rb, ribu, m, milyar, miliar)
  const isJuta = /(jt|juta)$/i.test(raw);
  const isRibu = /(k|rb|ribu)$/i.test(raw);
  const isMilyar = /(m|milyar|miliar)$/i.test(raw);

  if (isJuta || isRibu || isMilyar) {
    const stripped = raw.replace(/(jt|juta|k|rb|ribu|m|milyar|miliar)$/i, '').trim();
    // Normalize decimal in shortcut (e.g. "1,5" -> "1.5")
    const normalizedNum = parseFloat(stripped.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(normalizedNum)) {
      const multiplier = isMilyar ? 1000000000 : isJuta ? 1000000 : 1000;
      const calculated = Math.round(normalizedNum * multiplier);
      return {
        displayStr: formatNumberToDisplay(calculated),
        numericValue: calculated,
      };
    }
  }

  // Standard character cleaning for continuous Indonesian typing
  let integerDigits = '';
  let decimalDigits: string | null = null;

  if (raw.includes(',')) {
    const commaParts = raw.split(',');
    integerDigits = commaParts[0].replace(/\D/g, '');
    decimalDigits = commaParts.slice(1).join('').replace(/\D/g, '');
  } else if (raw.endsWith('.')) {
    // If ending with dot, treat as intentional decimal separator
    const withoutTrailingDot = raw.slice(0, -1);
    integerDigits = withoutTrailingDot.replace(/\D/g, '');
    decimalDigits = '';
  } else if (raw.includes('.')) {
    // Standard US decimal or thousand separator
    const dotParts = raw.split('.');
    if (dotParts.length === 2 && dotParts[1].length <= 2 && dotParts[0].length > 3) {
      integerDigits = dotParts[0].replace(/\D/g, '');
      decimalDigits = dotParts[1].replace(/\D/g, '');
    } else {
      // In Indonesian convention, dots are thousand separators
      integerDigits = raw.replace(/\D/g, '');
    }
  } else {
    // Digits only
    integerDigits = raw.replace(/\D/g, '');
  }

  if (integerDigits.length > 1 && integerDigits.startsWith('0')) {
    integerDigits = integerDigits.replace(/^0+/, '') || '0';
  }

  let formattedInt = integerDigits ? integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
  if (formattedInt === '' && decimalDigits !== null) {
    formattedInt = '0';
  }

  let displayStr = formattedInt;
  let numVal = 0;

  if (decimalDigits !== null) {
    displayStr = `${formattedInt},${decimalDigits}`;
    const intVal = integerDigits ? parseInt(integerDigits, 10) : 0;
    const decVal = decimalDigits ? parseFloat(`0.${decimalDigits}`) : 0;
    numVal = intVal + decVal;
  } else {
    numVal = integerDigits ? parseInt(integerDigits, 10) : 0;
  }

  return { displayStr, numericValue: numVal };
}

export const NominalInput: React.FC<NominalInputProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder = '0',
  className = '',
  inputClassName = '',
  required = false,
  disabled = false,
  autoFocus = false,
  label,
  badgeLabel,
  showPreview = true,
  helperAction,
}) => {
  const [displayValue, setDisplayValue] = useState<string>(() => formatNumberToDisplay(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    const currentNum = parseAndFormatNominalInput(displayValue).numericValue;
    if (value !== undefined && value !== currentNum) {
      setDisplayValue(formatNumberToDisplay(value));
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const rawValue = input.value;
    const selectionStart = input.selectionStart || 0;

    // Count non-separator characters before cursor
    const meaningfulCharsBeforeCursor = rawValue
      .slice(0, selectionStart)
      .replace(/\./g, '').length;

    const { displayStr, numericValue } = parseAndFormatNominalInput(rawValue);
    setDisplayValue(displayStr);
    onChange(numericValue);

    // Maintain accurate cursor position
    requestAnimationFrame(() => {
      if (inputRef.current) {
        let charCount = 0;
        let newCursor = displayStr.length;
        for (let i = 0; i < displayStr.length; i++) {
          if (displayStr[i] !== '.') {
            charCount++;
          }
          if (charCount >= meaningfulCharsBeforeCursor) {
            newCursor = i + 1;
            break;
          }
        }
        if (meaningfulCharsBeforeCursor === 0) newCursor = 0;
        inputRef.current.setSelectionRange(newCursor, newCursor);
      }
    });
  };

  const handleClear = () => {
    setDisplayValue('');
    onChange(0);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const currentNumericValue = parseAndFormatNominalInput(displayValue).numericValue;
  const wording = currentNumericValue > 0 ? terbilangRupiah(currentNumericValue) : '';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {(label || helperAction || badgeLabel) && (
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          {label && (
            <label htmlFor={id} className="block text-xs font-bold text-slate-700">
              {label}
            </label>
          )}
          <div className="flex items-center gap-1.5 ml-auto">
            {helperAction}
            {badgeLabel && (
              <span className="text-[10px] font-semibold text-slate-400">
                {badgeLabel}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Input container */}
      <div className="relative rounded-xl shadow-2xs group">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-xs select-none">
          Rp
        </div>
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onFocus={(e) => {
            // Auto select for immediate effortless typing
            e.target.select();
          }}
          className={`w-full pl-10 pr-9 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition disabled:bg-slate-100 disabled:text-slate-400 ${inputClassName}`}
        />
        {displayValue && displayValue !== '0' && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
            title="Reset ke 0"
          >
            <div className="w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
              <X size={12} />
            </div>
          </button>
        )}
      </div>

      {/* Live Scale & Terbilang Preview */}
      {showPreview && currentNumericValue > 0 && (
        <div className="text-[11px] px-1 pt-0.5 space-y-0.5 text-slate-600">
          <div className="flex items-center justify-between">
            <span className="font-mono font-bold text-slate-900">
              {formatRupiah(currentNumericValue)}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              {currentNumericValue >= 1000000000
                ? 'Skala Milyaran'
                : currentNumericValue >= 1000000
                ? 'Skala Jutaan'
                : currentNumericValue >= 1000
                ? 'Skala Ribuan'
                : 'Skala Ratusan'}
            </span>
          </div>
          {wording && (
            <p className="text-[10px] text-slate-500 italic truncate" title={wording}>
              {wording}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
