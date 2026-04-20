function Button({
  children,
  type = 'button',
  variant = 'primary',
  fullWidth = true,
  className = '',
  ...props
}) {
  const baseClasses =
    `inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-2.5 ${
      fullWidth ? 'w-full' : 'w-auto'
    }`

  const variantClasses =
    variant === 'outline'
      ? 'border border-white/15 bg-white/5 text-white hover:shadow-[0_0_18px_rgba(91,140,255,0.4)]'
      : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:scale-105 hover:shadow-[0_0_18px_rgba(255,46,159,0.6)]'

  return (
    <button type={type} className={`${baseClasses} ${variantClasses} ${className}`} {...props}>
      {children}
    </button>
  )
}

export default Button