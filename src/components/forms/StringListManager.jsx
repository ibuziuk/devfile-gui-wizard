import Button from '../common/Button'

/** Editor for arrays of plain strings (container command/args, dockerfile args, tags). */
export default function StringListManager({
  items = [],
  onChange,
  label,
  helpText,
  placeholder = '',
  addButtonText = 'Add entry',
  emptyMessage = 'Nothing added yet.'
}) {
  const handleAdd = () => onChange([...items, ''])
  const handleRemove = (index) => onChange(items.filter((_, i) => i !== index))
  const handleUpdate = (index, value) => onChange(items.map((item, i) => (i === index ? value : item)))

  return (
    <div className="mb-4">
      {label && <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>}
      {helpText && <p className="mb-2 text-sm text-gray-500">{helpText}</p>}
      {items.length === 0 ? (
        <p className="text-sm text-gray-500 italic mb-2">{emptyMessage}</p>
      ) : (
        <div className="space-y-2 mb-2">
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-center">
              <span className="text-xs text-gray-400 w-6 text-right">{index}</span>
              <input
                type="text"
                value={item}
                placeholder={placeholder}
                onChange={(event) => handleUpdate(index, event.target.value)}
                className="flex-1 rounded-md shadow-sm sm:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 font-mono"
              />
              <Button variant="danger" onClick={() => handleRemove(index)} className="text-xs px-2 py-1">
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button variant="outline" onClick={handleAdd} className="w-full text-sm">
        {addButtonText}
      </Button>
    </div>
  )
}
