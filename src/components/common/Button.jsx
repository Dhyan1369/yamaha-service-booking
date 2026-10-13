export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  icon: Icon,
  loading = false,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 ' +
    'focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'px-3.5 py-1.5 text-xs gap-1.5',
    md: 'px-5 py-2.5 text-sm gap-2',
    lg: 'px-7 py-3.5 text-base gap-2.5 rounded-xl',
  };

  const variantStyles = {
    primary: 'text-white hover:-translate-y-0.5',
    secondary: 'text-white hover:opacity-90',
    outline: 'text-body hover:text-white',
    danger: 'text-red-400 hover:text-red-300',
    ghost: 'text-mutedText hover:text-white',
  };

  const variantStyleObj = {
    primary: {
      background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
      border: '1px solid rgba(37, 99, 235, 0.5)',
      boxShadow: '0 4px 20px rgba(37, 99, 235, 0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
    },
    secondary: {
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.1)',
    },
    outline: {
      background: 'transparent',
      border: '1px solid rgba(255,255,255,0.12)',
    },
    danger: {
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.25)',
    },
    ghost: {
      background: 'transparent',
      border: 'none',
    },
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      style={variantStyleObj[variant] || variantStyleObj.primary}
      className={`${baseStyles} ${sizeStyles[size] || sizeStyles.md} ${variantStyles[variant] || variantStyles.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
}
