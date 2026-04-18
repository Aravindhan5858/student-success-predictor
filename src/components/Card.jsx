function Card({ children, className = '' }) {
  return (
    <div
      className={`card-animate rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_0_30px_rgba(255,46,159,0.2)] transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(138,43,226,0.4)] ${className}`}
    >
      {children}
    </div>
  )
}

export default Card