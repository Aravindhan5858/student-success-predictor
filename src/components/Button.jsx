function Button({
  children,
  type = 'button',
  variant = 'primary',
  fullWidth = true,
  className = '',
  ...props
}) {
  const baseClasses =
    `rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 ${
      fullWidth ? 'w-full' : 'w-auto'
    }`

  const variantClasses =
    variant === 'outline'
      ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
      : 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700'

  return (
    <button type={type} className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  )
}

export default Button