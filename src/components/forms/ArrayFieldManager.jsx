import Button from '../common/Button'

/**
 * Renders an editable list of complex entries (components, commands, projects).
 * Order is preserved and adjustable because the devfile spec gives meaning to
 * it, for example preStart events run as init containers in declaration order.
 */
export default function ArrayFieldManager({
  items = [],
  onAdd,
  onRemove,
  onMove,
  renderItem,
  itemTitle,
  addButtonText = 'Add item',
  emptyMessage = 'No items added yet.'
}) {
  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <p className="text-gray-500">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="relative border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-medium text-gray-700">
                  {itemTitle ? itemTitle(item, index) : `Item ${index + 1}`}
                </span>
                <div className="flex gap-2">
                  {onMove && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => onMove(index, index - 1)}
                        disabled={index === 0}
                        className="text-xs px-2 py-1"
                      >
                        <span aria-hidden="true">↑</span>
                        <span className="sr-only">Move up</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => onMove(index, index + 1)}
                        disabled={index === items.length - 1}
                        className="text-xs px-2 py-1"
                      >
                        <span aria-hidden="true">↓</span>
                        <span className="sr-only">Move down</span>
                      </Button>
                    </>
                  )}
                  <Button variant="danger" onClick={() => onRemove(index)} className="text-xs px-2 py-1">
                    Remove
                  </Button>
                </div>
              </div>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      )}
      <Button variant="outline" onClick={onAdd} className="w-full">
        {addButtonText}
      </Button>
    </div>
  )
}

/** Shared list helpers so every editor mutates its array the same way. */
export function listHelpers(items, onChange) {
  return {
    add: (item) => onChange([...items, item]),
    remove: (index) => onChange(items.filter((_, i) => i !== index)),
    update: (index, updater) =>
      onChange(items.map((item, i) => (i === index ? (typeof updater === 'function' ? updater(item) : { ...item, ...updater }) : item))),
    move: (from, to) => {
      if (to < 0 || to >= items.length) return
      const next = [...items]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      onChange(next)
    }
  }
}
