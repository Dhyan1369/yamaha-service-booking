import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function Input({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  helperText,
  icon: Icon,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password';
  const inputType = isPasswordField ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold mb-1.5"
          style={{ color: 'var(--text-body)' }}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div
            className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full text-sm outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
            Icon ? 'pl-10' : 'px-3.5'
          } ${isPasswordField ? 'pr-10' : 'pr-3.5'} py-2.5 ${className}`}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: error
              ? '1px solid rgba(239,68,68,0.5)'
              : '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            color: 'var(--text-heading)',
            caretColor: '#3b82f6',
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = error
              ? '1px solid rgba(239,68,68,0.7)'
              : '1px solid rgba(37, 99, 235, 0.5)';
            e.currentTarget.style.boxShadow = error
              ? '0 0 0 3px rgba(239,68,68,0.1)'
              : '0 0 0 3px rgba(37, 99, 235, 0.1)';
            e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = error
              ? '1px solid rgba(239,68,68,0.5)'
              : '1px solid rgba(255,255,255,0.08)';
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
          }}
          {...props}
        />

        {/* Password toggle — single eye icon, right side only */}
        {isPasswordField && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors duration-200"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-heading)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
            title={showPassword ? 'Hide Password' : 'Show Password'}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>

      {error && (
        <p className="text-[11px] mt-1.5 font-medium" style={{ color: '#f87171' }}>{error}</p>
      )}
      {helperText && !error && (
        <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)' }}>{helperText}</p>
      )}
    </div>
  );
}
