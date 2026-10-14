import { useWizard, useSection } from '../../hooks/useWizardState'
import WizardNavigation from '../wizard/WizardNavigation'
import Alert from '../common/Alert'
import CommandListEditor from '../editors/CommandListEditor'

export default function CommandsStep() {
  const { state } = useWizard()
  const [commands, setCommands] = useSection('commands')
  const components = state.devfileData.components

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Commands</h2>
      <p className="text-gray-600 mb-2">
        Actions the workspace can run. Each command is exactly one of three kinds:
      </p>
      <ul className="text-sm text-gray-600 mb-6 list-disc list-inside space-y-1">
        <li>
          <strong>exec</strong> — run a command line inside a container component
        </li>
        <li>
          <strong>apply</strong> — apply a container, kubernetes, openshift or image component
        </li>
        <li>
          <strong>composite</strong> — run other commands, in sequence or in parallel
        </li>
      </ul>

      {components.length === 0 && (
        <Alert type="warning" title="No components defined">
          exec and apply commands must reference a component. Add components first, then come back to this
          step.
        </Alert>
      )}

      <div className="mt-4">
        <CommandListEditor commands={commands} onChange={setCommands} components={components} />
      </div>

      <WizardNavigation />
    </div>
  )
}
