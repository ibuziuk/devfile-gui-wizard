import { useWizard } from '../../hooks/useWizardState'
import { EVENT_TYPES } from '../../utils/constants'
import Button from '../common/Button'
import FormSection from '../forms/FormSection'
import WizardNavigation from '../wizard/WizardNavigation'
import Alert from '../common/Alert'

/**
 * preStart and postStop may only run apply commands, postStart and preStop may
 * only run exec commands; a composite command qualifies when all of its
 * sub-commands do.
 */
function isEligible(command, requiredType, byId) {
  if (!command) return false
  if (command.commandType === requiredType) return true
  if (command.commandType !== 'composite') return false
  const subCommands = (command.composite?.commands || []).filter(Boolean)
  if (subCommands.length === 0) return false
  return subCommands.every((subId) => {
    const sub = byId.get(subId.trim().toLowerCase())
    return !sub || sub.commandType === requiredType
  })
}

export default function EventsStep() {
  const { state, dispatch, actions } = useWizard()
  const { events, commands } = state.devfileData

  const byId = new Map()
  commands.forEach((command) => {
    const id = (command.id || '').trim().toLowerCase()
    if (id) byId.set(id, command)
  })

  const setEvent = (eventType, value) => dispatch({ type: actions.UPDATE_EVENTS, payload: { [eventType]: value } })

  const renderEvent = ({ value: eventType, label, description, allows }) => {
    const bound = events[eventType] || []
    const eligible = commands.filter(
      (command) => (command.id || '').trim() && isEligible(command, allows, byId)
    )
    const available = eligible.filter((command) => !bound.includes(command.id.trim()))

    const move = (from, to) => {
      if (to < 0 || to >= bound.length) return
      const next = [...bound]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      setEvent(eventType, next)
    }

    return (
      <FormSection key={eventType} title={label} description={description}>
        {bound.length === 0 ? (
          <p className="text-sm text-gray-500 italic mb-2">No commands bound to this event.</p>
        ) : (
          <ol className="space-y-2 mb-3">
            {bound.map((commandId, index) => {
              const command = byId.get(commandId.trim().toLowerCase())
              const valid = isEligible(command, allows, byId)
              return (
                <li
                  key={`${commandId}-${index}`}
                  className={`flex items-center gap-2 p-2 rounded border ${
                    valid ? 'border-gray-200 bg-white' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <span className="text-xs text-gray-400 w-5 text-right">{index + 1}</span>
                  <span className="flex-1 text-sm font-medium text-gray-800">
                    {commandId}
                    {command ? (
                      <span className="ml-2 text-xs text-gray-500">({command.commandType})</span>
                    ) : (
                      <span className="ml-2 text-xs text-red-600">unknown command</span>
                    )}
                    {command && !valid && (
                      <span className="ml-2 text-xs text-red-600">must be an {allows} command</span>
                    )}
                  </span>
                  <Button variant="outline" onClick={() => move(index, index - 1)} disabled={index === 0} className="text-xs px-2 py-1">
                    <span aria-hidden="true">↑</span>
                    <span className="sr-only">Move up</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => move(index, index + 1)}
                    disabled={index === bound.length - 1}
                    className="text-xs px-2 py-1"
                  >
                    <span aria-hidden="true">↓</span>
                    <span className="sr-only">Move down</span>
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setEvent(eventType, bound.filter((_, i) => i !== index))}
                    className="text-xs px-2 py-1"
                  >
                    Remove
                  </Button>
                </li>
              )
            })}
          </ol>
        )}

        <div className="flex gap-2 items-center">
          <select
            id={`${eventType}-add`}
            value=""
            onChange={(event) => {
              if (event.target.value) setEvent(eventType, [...bound, event.target.value])
            }}
            disabled={available.length === 0}
            className="flex-1 rounded-md shadow-sm sm:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">
              {available.length === 0
                ? `No further ${allows} commands available`
                : `Bind an ${allows} command…`}
            </option>
            {available.map((command) => (
              <option key={command.id} value={command.id.trim()}>
                {command.id.trim()} ({command.commandType})
              </option>
            ))}
          </select>
        </div>
      </FormSection>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Events</h2>
      <p className="text-gray-600 mb-4">
        Bind commands to points in the workspace lifecycle. Commands run in the order listed.
      </p>

      {commands.length === 0 ? (
        <Alert type="warning" title="No commands defined">
          Events bind existing commands. Add commands in the previous step first.
        </Alert>
      ) : (
        <Alert type="info">
          <strong>preStart</strong> and <strong>postStop</strong> accept apply commands;{' '}
          <strong>postStart</strong> and <strong>preStop</strong> accept exec commands. A composite command is
          accepted when all of its sub-commands are of the required kind.
        </Alert>
      )}

      <div className="mt-6">{EVENT_TYPES.map(renderEvent)}</div>

      <WizardNavigation />
    </div>
  )
}
