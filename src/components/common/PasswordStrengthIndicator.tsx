import React, { useMemo } from 'react';
import { Check, ShieldAlert, ShieldCheck } from 'lucide-react';

export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordCriterion {
  key: 'length' | 'alphanumeric' | 'mixedCase' | 'symbolOrLong';
  label: string;
  met: boolean;
  required: boolean;
}

export interface PasswordStrengthAnalysis {
  score: 0 | 1 | 2 | 3 | 4;
  level: PasswordStrengthLevel;
  label: string;
  helperText: string;
  meetsMinimumRequirements: boolean;
  exceedsMaxLength: boolean;
  criteria: PasswordCriterion[];
}

export function evaluatePasswordStrength(password: string): PasswordStrengthAnalysis {
  const hasMinLength = password.length >= 8;
  const exceedsMaxLength = password.length > 128;
  const hasLetter = /[A-Za-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasMixedCase = hasLower && hasUpper;
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const hasLongLength = password.length >= 12;

  const criteria: PasswordCriterion[] = [
    {
      key: 'length',
      label: '8+ characters',
      met: hasMinLength && !exceedsMaxLength,
      required: true,
    },
    {
      key: 'alphanumeric',
      label: 'Letter & number',
      met: hasLetter && hasNumber,
      required: true,
    },
    {
      key: 'mixedCase',
      label: 'Upper & lowercase',
      met: hasMixedCase,
      required: false,
    },
    {
      key: 'symbolOrLong',
      label: 'Symbol or 12+ chars',
      met: hasSymbol || hasLongLength,
      required: false,
    },
  ];

  if (password.length === 0) {
    return {
      score: 0,
      level: 'empty',
      label: 'Not entered',
      helperText: 'Use 8+ characters with at least one letter and one number.',
      meetsMinimumRequirements: false,
      exceedsMaxLength: false,
      criteria,
    };
  }

  if (exceedsMaxLength) {
    return {
      score: 1,
      level: 'weak',
      label: 'Weak',
      helperText: 'Must be 128 characters or fewer.',
      meetsMinimumRequirements: false,
      exceedsMaxLength: true,
      criteria,
    };
  }

  const meetsMinimumRequirements = hasMinLength && hasLetter && hasNumber;

  if (!meetsMinimumRequirements) {
    return {
      score: 1,
      level: 'weak',
      label: 'Weak',
      helperText: 'Add 8+ characters including both a letter and a number.',
      meetsMinimumRequirements: false,
      exceedsMaxLength: false,
      criteria,
    };
  }

  const bonusCount = (hasMixedCase ? 1 : 0) + (hasSymbol || hasLongLength ? 1 : 0);

  if (bonusCount === 0) {
    return {
      score: 2,
      level: 'fair',
      label: 'Fair',
      helperText: 'Meets minimum rules. Add uppercase letters or a symbol for stronger protection.',
      meetsMinimumRequirements: true,
      exceedsMaxLength: false,
      criteria,
    };
  }

  if (bonusCount === 1) {
    return {
      score: 3,
      level: 'good',
      label: 'Good',
      helperText:
        hasMixedCase
          ? 'Add a symbol or extend to 12+ characters for maximum strength.'
          : 'Mix uppercase and lowercase letters for maximum strength.',
      meetsMinimumRequirements: true,
      exceedsMaxLength: false,
      criteria,
    };
  }

  return {
    score: 4,
    level: 'strong',
    label: 'Strong',
    helperText: 'Strong password ready for your AZ OVERVERSE account.',
    meetsMinimumRequirements: true,
    exceedsMaxLength: false,
    criteria,
  };
}

const LEVEL_STYLES: Record<
  PasswordStrengthLevel,
  {
    fillClass: string;
    labelClass: string;
  }
> = {
  empty: {
    fillClass: 'bg-slate-700',
    labelClass: 'text-slate-400',
  },
  weak: {
    fillClass: 'bg-rose-500',
    labelClass: 'text-rose-300',
  },
  fair: {
    fillClass: 'bg-amber-400',
    labelClass: 'text-amber-300',
  },
  good: {
    fillClass: 'bg-sky-400',
    labelClass: 'text-sky-300',
  },
  strong: {
    fillClass: 'bg-emerald-400',
    labelClass: 'text-emerald-300',
  },
};

export interface PasswordStrengthIndicatorProps {
  password: string;
  id?: string;
  compact?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  id = 'password-strength-indicator',
  compact = false,
}) => {
  const analysis = useMemo(() => evaluatePasswordStrength(password), [password]);
  const activeStyle = LEVEL_STYLES[analysis.level];

  return (
    <div
      id={id}
      className="mt-2.5 space-y-2"
      data-strength-level={analysis.level}
    >
      {/* Header row: explicit text label + numeric step ratio (never color-only) */}
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-400 font-medium">Password strength</span>
        <span
          aria-live="polite"
          className={`inline-flex items-center gap-1.5 font-semibold tabular-nums ${activeStyle.labelClass}`}
        >
          {analysis.level === 'strong' && (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
          )}
          {analysis.level === 'weak' && (
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0" aria-hidden="true" />
          )}
          <span>{analysis.label}</span>
          {analysis.score > 0 && (
            <span className="text-[11px] text-slate-500 font-mono">
              ({analysis.score}/4)
            </span>
          )}
        </span>
      </div>

      {/* 4-segment compositor-friendly strength meter */}
      <div
        role="meter"
        aria-label="Password strength"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={analysis.score}
        aria-valuetext={`${analysis.label} (${analysis.score} of 4)`}
        className="grid grid-cols-4 gap-1.5"
      >
        {[1, 2, 3, 4].map((segmentIndex) => {
          const isFilled = analysis.score >= segmentIndex;
          return (
            <div
              key={segmentIndex}
              className="h-1.5 w-full overflow-hidden rounded-[3px] bg-slate-800/90"
            >
              <div
                className={`h-full w-full origin-left transition-transform duration-150 ease-out ${
                  isFilled ? `${activeStyle.fillClass} scale-x-100` : 'bg-slate-700 scale-x-0'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Criteria checklist */}
      {!compact ? (
        <ul
          aria-label="Password requirements"
          className="grid grid-cols-2 gap-x-3 gap-y-1 pt-0.5 text-[11px]"
        >
          {analysis.criteria.map((criterion) => (
            <li
              key={criterion.key}
              className={`flex items-center gap-1.5 transition-colors duration-150 ${
                criterion.met ? 'text-emerald-300' : 'text-slate-400'
              }`}
            >
              {criterion.met ? (
                <Check
                  className="w-3.5 h-3.5 text-emerald-400 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="inline-block h-1.5 w-1.5 rounded-full bg-slate-600 mx-1 shrink-0"
                />
              )}
              <span className="truncate">{criterion.label}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[11px] text-slate-400 leading-snug">{analysis.helperText}</p>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
