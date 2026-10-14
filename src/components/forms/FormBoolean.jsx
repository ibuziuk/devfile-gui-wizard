/**
 * Tri-state control for the devfile's optional booleans.
 *
 * Most boolean fields in the devfile schema are optional and carry a
 * tool-specific default, so "not set" has to stay distinguishable from an
 * explicit `false`. The value is '' (unset), true or false.
 */
export default function FormBoolean({ name, label, value, onChange, helpText, trueLabel = 'Yes', falseLabel = 'No', unsetLabel = 'Not set (use default)' }) {
  const current = value === true || value === 'true' ? 'true' : value === false || value === 'false' ? 'false' : ''

  const handleChange = (event) => {
    const next = event.target.value
    onChange(next === '' ? '' : next === 'true')
  }

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={current}
        onChange={handleChange}
        className="mt-1 block w-full rounded-md shadow-sm sm:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="">{unsetLabel}</option>
        <option value="true">{trueLabel}</option>
        <option value="false">{falseLabel}</option>
      </select>
      {helpText && <p className="mt-1 text-sm text-gray-500">{helpText}</p>}
    </div>
  )
}
