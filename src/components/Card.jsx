function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl bg-white shadow-md ${className}`}>
      {children}
    </div>
  )
}

export default Card