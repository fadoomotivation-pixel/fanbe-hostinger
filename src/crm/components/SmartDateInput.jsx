// src/crm/components/SmartDateInput.jsx
// Date input that accepts typed/pasted dates in DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
// and converts them to YYYY-MM-DD for the native <input type="date">.
// Shows a green tick or red warning next to the field as validation feedback.
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

/**
 * Try to parse a string into a valid YYYY-MM-DD date.
 * Supports: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY, MM-DD-YYYY
 */
const parseFlexibleDate = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();

  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split('-').map(Number);
    if (isValidDate(y, m, d)) return pad(y, m, d);
    return null;
  }

  // DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const slashDot = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (slashDot) {
    const a = parseInt(slashDot[1], 10);
    const b = parseInt(slashDot[2], 10);
    const y = parseInt(slashDot[3], 10);

    // If first number > 12, it must be DD/MM/YYYY
    if (a > 12 && b <= 12) {
      if (isValidDate(y, b, a)) return pad(y, b, a);
      return null;
    }
    // If second number > 12, it must be MM/DD/YYYY
    if (b > 12 && a <= 12) {
      if (isValidDate(y, a, b)) return pad(y, a, b);
      return null;
    }
    // Both <= 12: prefer DD/MM/YYYY (Indian locale)
    if (isValidDate(y, b, a)) return pad(y, b, a);
    if (isValidDate(y, a, b)) return pad(y, a, b);
    return null;
  }

  return null;
};

const isValidDate = (y, m, d) => {
  if (y < 2020 || y > 2099 || m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
};

const pad = (y, m, d) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const SmartDateInput = ({
  value,
  onChange,
  min,
  className = '',
  placeholder,
}) => {
  const [textValue, setTextValue] = useState('');
  const [validation, setValidation] = useState(null); // 'valid' | 'invalid' | null
  const clearTimer = useRef(null);
  const didAutoFill = useRef(false);

  // Auto-fill today's date on initial mount when value is empty
  useEffect(() => {
    if (!didAutoFill.current && !value) {
      didAutoFill.current = true;
      const now = new Date();
      const todayStr = pad(now.getFullYear(), now.getMonth() + 1, now.getDate());
      onChange(todayStr);
      setValidation('valid');
      clearTimeout(clearTimer.current);
      clearTimer.current = setTimeout(() => setValidation(null), 3000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const showValidation = useCallback((status) => {
    setValidation(status);
    clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setValidation(null), 3000);
  }, []);

  // Handle native date picker change (always YYYY-MM-DD)
  const handleNativeChange = (e) => {
    const v = e.target.value;
    setTextValue('');
    onChange(v);
    if (v) showValidation('valid');
    else setValidation(null);
  };

  // Handle paste into the text field
  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text');
    if (!pasted) return;
    const parsed = parseFlexibleDate(pasted);
    if (parsed) {
      e.preventDefault();
      setTextValue('');
      onChange(parsed);
      showValidation('valid');
    }
  };

  // Handle typing in the helper text field
  const handleTextChange = (e) => {
    const raw = e.target.value;
    setTextValue(raw);
    const parsed = parseFlexibleDate(raw);
    if (parsed) {
      onChange(parsed);
      showValidation('valid');
    } else if (raw.length >= 8) {
      showValidation('invalid');
    } else {
      setValidation(null);
    }
  };

  // On text blur, if valid date was parsed, clear text field
  const handleTextBlur = () => {
    if (textValue) {
      const parsed = parseFlexibleDate(textValue);
      if (parsed) {
        setTextValue('');
        onChange(parsed);
        showValidation('valid');
      } else if (textValue.length >= 6) {
        showValidation('invalid');
      }
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Native date picker */}
      <input
        type="date"
        min={min}
        value={value || ''}
        onChange={handleNativeChange}
        onPaste={handlePaste}
        className={className || 'flex-1 border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-[#0F3A5F]'}
      />
      {/* Text input for manual typing */}
      <input
        type="text"
        value={textValue}
        onChange={handleTextChange}
        onBlur={handleTextBlur}
        onPaste={handlePaste}
        placeholder={placeholder || 'DD/MM/YYYY'}
        className="w-[120px] border-2 border-gray-100 rounded-xl px-3 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#0F3A5F] placeholder:text-gray-300"
      />
      {/* Validation indicator */}
      {validation === 'valid' && (
        <CheckCircle size={18} className="text-emerald-500 shrink-0 animate-in fade-in" />
      )}
      {validation === 'invalid' && (
        <AlertCircle size={18} className="text-red-500 shrink-0 animate-in fade-in" />
      )}
    </div>
  );
};

export default SmartDateInput;
