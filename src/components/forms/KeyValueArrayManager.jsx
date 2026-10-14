import Button from '../common/Button'

/**
 * Editor for ordered { name, value } pairs. Backs every string map in the
 * devfile schema (env, git remotes, annotations, variables) so that key order
 * stays stable while editing.
 */
export default function KeyValueArrayManager({
  items = [],
  onUpdate,
  label,
  helpText,
  keyLabel = 'Key',
  valueLabel = 'Value',
  keyPlaceholder = 'key',
  valuePlaceholder = 'value',
  addButtonText = 'Add entry',
  emptyMessage = 'Nothing added yet.',
  newItem = () => ({ name: '', value: '' }),
  disableAdd = false
}) {
  const handleAdd = () => onUpdate([...items, newItem()])
  const handleRemove = (index) => onUpdate(items.filter((_, i) => i !== index))
  const handleUpdate = (index, field, value) =>
    onUpdate(items.map((item, i) => (i === index ? { ...item, [field]: value } : item)))

  const inputClass =
    'block w-full rounded-md shadow-sm sm:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-mono'

  return (
    <div className="mb-4">
      {label && <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>}
      {helpText && <p className="mb-2 text-sm text-gray-500">{helpText}</p>}

      {items.length === 0 ? (
        <p className="text-sm text-gray-500 italic mb-2">{emptyMessage}</p>
      ) : (
        <div className="space-y-2 mb-2">
          <div className="flex gap-2 text-xs font-medium text-gray-500">
            <span className="flex-1">{keyLabel}</span>
            <span className="flex-1">{valueLabel}</span>
            <span className="w-20" />
          </div>
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-center">
              <input
                type="text"
                value={item.name || ''}
                placeholder={keyPlaceholder}
                onChange={(event) => handleUpdate(index, 'name', event.target.value)}
                className={`flex-1 ${inputClass}`}
              />
              <input
                type="text"
                value={item.value || ''}
                placeholder={valuePlaceholder}
                onChange={(event) => handleUpdate(index, 'value', event.target.value)}
                className={`flex-1 ${inputClass}`}
              />
              <Button variant="danger" onClick={() => handleRemove(index)} className="text-xs px-2 py-1 w-20">
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      {!disableAdd && (
        <Button variant="outline" onClick={handleAdd} className="w-full text-sm">
          {addButtonText}
        </Button>
      )}
    </div>
  )
}
