import { Link } from 'react-router-dom'

const toneClasses = {
  view: 'text-indigo-500 hover:text-indigo-400',
  edit: 'text-amber-400 hover:text-amber-300',
  delete: 'text-rose-500 hover:text-rose-400',
  neutral: 'text-white/90 hover:text-white',
}

function ActionOption({ to = '', onClick, tone = 'neutral', children, className = '', disabled = false }) {
  const classes = `text-lg font-semibold transition-colors ${toneClasses[tone] || toneClasses.neutral} ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`

  if (to) {
    return (
      <Link to={to} className={classes} aria-disabled={disabled} onClick={disabled ? (event) => event.preventDefault() : undefined}>
        {children}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={classes} disabled={disabled}>
      {children}
    </button>
  )
}

export default ActionOption
