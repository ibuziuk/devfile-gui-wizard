import { COMMAND_GROUP_KINDS, COMMAND_TYPES, newCommand } from '../../utils/constants'
import { validators } from '../../utils/validation'
import Button from '../common/Button'
import FormInput from '../forms/FormInput'
import FormSelect from '../forms/FormSelect'
import FormBoolean from '../forms/FormBoolean'
import AttributesEditor from '../forms/AttributesEditor'
import CollapsibleSection from '../forms/CollapsibleSection'
import KeyValueArrayManager from '../forms/KeyValueArrayManager'
import ArrayFieldManager, { listHelpers } from '../forms/ArrayFieldManager'

/** Ordered list of references to other commands, used by composite commands. */
function CommandRefListEditor({ refs = [], onChange, options, id }) {
  const list = listHelpers(refs, onChange)

  return (
    <div className="mb-4">
      <span className="block text-sm font-medium text-gray-700 mb-1">Commands</span>
      <p className="mb-2 text-sm text-gray-500">
        Executed in this order, unless the composite command runs in parallel.
      </p>
      {refs.length === 0 ? (
        <p className="text-sm text-gray-500 italic mb-2">No sub-commands referenced yet.</p>
      ) : (
        <div className="space-y-2 mb-2">
          {refs.map((ref, index) => (
            <div key={index} className="flex gap-2 items-center">
              <span className="text-xs text-gray-400 w-6 text-right">{index + 1}</span>
              <select
                id={`${id}-ref-${index}`}
                value={ref}
                onChange={(event) => onChange(refs.map((item, i) => (i === index ? event.target.value : item)))}
                className="flex-1 rounded-md shadow-sm sm:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select a command</option>
                {options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
                {ref && !options.some((option) => option.value === ref) && (
                  <option value={ref}>{ref} (unknown)</option>
                )}
              </select>
              <Button variant="outline" onClick={() => list.move(index, index - 1)} disabled={index === 0} className="text-xs px-2 py-1">
                <span aria-hidden="true">↑</span>
                <span className="sr-only">Move up</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => list.move(index, index + 1)}
                disabled={index === refs.length - 1}
                className="text-xs px-2 py-1"
              >
                <span aria-hidden="true">↓</span>
                <span className="sr-only">Move down</span>
              </Button>
              <Button variant="danger" onClick={() => list.remove(index)} className="text-xs px-2 py-1">
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
      <Button variant="outline" onClick={() => list.add('')} className="w-full text-sm">
        Add sub-command
      </Button>
    </div>
  )
}

function GroupEditor({ group = {}, onChange, id }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
      <FormSelect
        name={`${id}-group-kind`}
        label="Group kind"
        value={group.kind || ''}
        onChange={(event) => onChange({ ...group, kind: event.target.value })}
        options={COMMAND_GROUP_KINDS}
        placeholder="No group"
        helpText="Groups the command under build, run, test, debug or deploy."
      />
      <FormBoolean
        name={`${id}-group-isDefault`}
        label="Default for this group"
        value={group.isDefault}
        onChange={(value) => onChange({ ...group, isDefault: value })}
        helpText="Only one command per group kind may be the default."
      />
    </div>
  )
}

/** Editor for the `commands` array, reused for parent command overrides. */
export default function CommandListEditor({ commands = [], onChange, components = [], idPrefix = 'command' }) {
  const list = listHelpers(commands, onChange)

  const componentOptions = (names) =>
    components
      .filter((component) => (component.name || '').trim() && names.includes(component.componentType))
      .map((component) => ({ value: component.name.trim(), label: `${component.name.trim()} (${component.componentType})` }))

  const renderCommand = (command, index) => {
    const id = `${idPrefix}-${index}`
    const set = (field, value) => list.update(index, { [field]: value })
    const setType = (type, value) => set(type, { ...(command[type] || {}), ...value })

    // exec commands must target a container; apply commands may also target
    // kubernetes, openshift and image components.
    const execComponents = componentOptions(['container'])
    const applyComponents = componentOptions(['container', 'kubernetes', 'openshift', 'image'])

    const otherCommandOptions = commands
      .filter((other, otherIndex) => otherIndex !== index && (other.id || '').trim())
      .map((other) => ({ value: other.id.trim(), label: `${other.id.trim()} (${other.commandType})` }))

    return (
      <div className="space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormInput
            name={`${id}-id`}
            label="Id"
            value={command.id || ''}
            onChange={(event) => set('id', event.target.value)}
            error={validators.k8sName(command.id)}
            required
            placeholder="build"
            helpText="Unique across all commands."
          />
          <FormSelect
            name={`${id}-type`}
            label="Type"
            value={command.commandType || 'exec'}
            onChange={(event) => set('commandType', event.target.value)}
            options={COMMAND_TYPES}
            placeholder=""
          />
        </div>

        {command.commandType === 'exec' && (
          <div>
            <FormInput
              name={`${id}-commandLine`}
              label="Command line"
              value={command.exec?.commandLine || ''}
              onChange={(event) => setType('exec', { commandLine: event.target.value })}
              required
              placeholder="npm install"
              helpText="Shell command executed in the container."
            />
            <FormSelect
              name={`${id}-exec-component`}
              label="Component"
              value={command.exec?.component || ''}
              onChange={(event) => setType('exec', { component: event.target.value })}
              options={execComponents}
              required
              placeholder={execComponents.length > 0 ? 'Select a container component' : 'No container components defined'}
              helpText="exec commands must reference a container component."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <FormInput
                name={`${id}-exec-workingDir`}
                label="Working directory"
                value={command.exec?.workingDir || ''}
                onChange={(event) => setType('exec', { workingDir: event.target.value })}
                placeholder="${PROJECT_SOURCE}"
              />
              <FormInput
                name={`${id}-exec-label`}
                label="Label"
                value={command.exec?.label || ''}
                onChange={(event) => setType('exec', { label: event.target.value })}
                placeholder="Install dependencies"
                helpText="Human readable name shown in the UI."
              />
            </div>
            <FormBoolean
              name={`${id}-exec-hotReloadCapable`}
              label="Hot reload capable"
              value={command.exec?.hotReloadCapable}
              onChange={(value) => setType('exec', { hotReloadCapable: value })}
              helpText="The command does not need to be restarted on source changes. Defaults to false."
            />
            <GroupEditor
              group={command.exec?.group || {}}
              onChange={(value) => setType('exec', { group: value })}
              id={`${id}-exec`}
            />
            <CollapsibleSection title="Environment variables" badge={command.exec?.env?.length || 0}>
              <KeyValueArrayManager
                items={command.exec?.env || []}
                onUpdate={(value) => setType('exec', { env: value })}
                keyLabel="Name"
                valueLabel="Value"
                keyPlaceholder="NODE_ENV"
                valuePlaceholder="production"
                addButtonText="Add environment variable"
                emptyMessage="No environment variables defined."
              />
            </CollapsibleSection>
          </div>
        )}

        {command.commandType === 'apply' && (
          <div>
            <FormSelect
              name={`${id}-apply-component`}
              label="Component"
              value={command.apply?.component || ''}
              onChange={(event) => setType('apply', { component: event.target.value })}
              options={applyComponents}
              required
              placeholder={applyComponents.length > 0 ? 'Select a component' : 'No applicable components defined'}
              helpText="apply commands may reference container, kubernetes, openshift or image components."
            />
            <FormInput
              name={`${id}-apply-label`}
              label="Label"
              value={command.apply?.label || ''}
              onChange={(event) => setType('apply', { label: event.target.value })}
              placeholder="Deploy the application"
            />
            <GroupEditor
              group={command.apply?.group || {}}
              onChange={(value) => setType('apply', { group: value })}
              id={`${id}-apply`}
            />
          </div>
        )}

        {command.commandType === 'composite' && (
          <div>
            <CommandRefListEditor
              refs={command.composite?.commands || []}
              onChange={(value) => setType('composite', { commands: value })}
              options={otherCommandOptions}
              id={id}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
              <FormInput
                name={`${id}-composite-label`}
                label="Label"
                value={command.composite?.label || ''}
                onChange={(event) => setType('composite', { label: event.target.value })}
                placeholder="Build and test"
              />
              <FormBoolean
                name={`${id}-composite-parallel`}
                label="Run in parallel"
                value={command.composite?.parallel}
                onChange={(value) => setType('composite', { parallel: value })}
                helpText="Run the sub-commands concurrently instead of sequentially."
              />
            </div>
            <GroupEditor
              group={command.composite?.group || {}}
              onChange={(value) => setType('composite', { group: value })}
              id={`${id}-composite`}
            />
          </div>
        )}

        <CollapsibleSection title="Command attributes" badge={command.attributes ? 1 : 0}>
          <AttributesEditor
            name={`${id}-attributes`}
            value={command.attributes || ''}
            onChange={(value) => set('attributes', value)}
          />
        </CollapsibleSection>
      </div>
    )
  }

  return (
    <ArrayFieldManager
      items={commands}
      onAdd={() => list.add(newCommand())}
      onRemove={list.remove}
      onMove={list.move}
      renderItem={renderCommand}
      itemTitle={(command, index) => `${command.id || `Command ${index + 1}`} · ${command.commandType || 'exec'}`}
      addButtonText="Add command"
      emptyMessage="No commands defined."
    />
  )
}
