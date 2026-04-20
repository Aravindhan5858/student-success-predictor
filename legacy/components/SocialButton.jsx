function SocialButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition-all duration-300 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500"
    >
      <span className="text-base" aria-hidden="true">
        {icon}
      </span>
      <span>{label}</span>
    </button>
  )
}

export default SocialButton