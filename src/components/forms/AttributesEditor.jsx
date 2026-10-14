import { validators } from '../../utils/validation'

/**
 * Editor for the devfile's free-form `attributes` maps, which accept arbitrary
 * implementation-dependant YAML. Written as YAML text and parsed on generation.
 */
export default function AttributesEditor({
  name,
  value = '',
  onChange,
  label = 'Attributes',
  helpText = 'Free-form YAML map of implementation-specific attributes.',
  rows = 4
}) {
  const error = validators.yamlMap(value)

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        rows={rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={'controller.devfile.io/storage-type: ephemeral'}
        spellCheck={false}
        className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm font-mono
          ${error
            ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }
        `}
      />
      {error ? (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      ) : (
        helpText && <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  )
}
