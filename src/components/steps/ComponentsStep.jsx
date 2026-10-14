import { useSection } from '../../hooks/useWizardState'
import WizardNavigation from '../wizard/WizardNavigation'
import ComponentListEditor from '../editors/ComponentListEditor'

export default function ComponentsStep() {
  const [components, setComponents] = useSection('components')

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Components</h2>
      <p className="text-gray-600 mb-2">
        The building blocks of the workspace. Each component is exactly one of five kinds:
      </p>
      <ul className="text-sm text-gray-600 mb-6 list-disc list-inside space-y-1">
        <li>
          <strong>container</strong> — a development container the workspace runs in
        </li>
        <li>
          <strong>kubernetes</strong> / <strong>openshift</strong> — a manifest applied to the cluster
        </li>
        <li>
          <strong>volume</strong> — storage that container components can mount
        </li>
        <li>
          <strong>image</strong> — an image built from a Dockerfile
        </li>
      </ul>

      <ComponentListEditor components={components} onChange={setComponents} />

      <WizardNavigation />
    </div>
  )
}
