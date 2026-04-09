function InputField({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error = '',
  rightAdornment,
  ...props
}) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition duration-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          {...props}
        />
        {rightAdornment ? <div className="absolute inset-y-0 right-3 flex items-center">{rightAdornment}</div> : null}
      </div>
      <p className="mt-1 min-h-5 text-xs text-rose-500">{error || ' '}</p>
    </div>
  )
}

export default InputField