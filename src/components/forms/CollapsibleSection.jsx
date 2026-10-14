import { useState } from 'react'

/** Groups the less-used parts of a form so a full schema editor stays readable. */
export default function CollapsibleSection({ title, description, badge, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border border-gray-200 rounded-md mb-4 bg-gray-50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2 text-left"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{title}</span>
          {badge !== undefined && badge !== null && badge !== 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {badge}
            </span>
          )}
        </span>
        <span className="text-gray-400 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 bg-white border-t border-gray-200 rounded-b-md">
          {description && <p className="text-sm text-gray-500 mb-3">{description}</p>}
          {children}
        </div>
      )}
    </div>
  )
}
