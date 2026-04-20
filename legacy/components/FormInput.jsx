function FormInput({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error = '',
  step,
  min,
  max,
  rightAdornment,
}) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-white/90">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          step={step}
          min={min}
          max={max}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-pink-500/60"
        />
        {rightAdornment ? <div className="absolute inset-y-0 right-3 flex items-center">{rightAdornment}</div> : null}
      </div>
      <p className="mt-1 min-h-5 text-xs text-rose-500">{error || ' '}</p>
    </div>
  )
}

export default FormInput
