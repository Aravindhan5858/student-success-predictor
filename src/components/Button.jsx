function Button({
  children,
  type = 'button',
  variant = 'primary',
  fullWidth = true,
  className = '',
  ...props
}) {
  const baseClasses =
    `inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-3 ${
      fullWidth ? 'w-full' : 'w-auto'
    }`

  const variantClasses =
    variant === 'outline'
      ? 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
      : 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700'

  return (
    <button type={type} className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  )
}

export default Button