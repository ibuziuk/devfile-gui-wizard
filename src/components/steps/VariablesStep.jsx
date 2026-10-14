import { useSection } from '../../hooks/useWizardState'
import FormSection from '../forms/FormSection'
import KeyValueArrayManager from '../forms/KeyValueArrayManager'
import AttributesEditor from '../forms/AttributesEditor'
import WizardNavigation from '../wizard/WizardNavigation'
import Alert from '../common/Alert'

export default function VariablesStep() {
  const [variables, setVariables] = useSection('variables')
  const [attributes, setAttributes] = useSection('attributes')

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Variables & attributes</h2>
      <p className="text-gray-600 mb-4">
        Top-level variables for string substitution, and free-form attributes for tool-specific settings.
      </p>

      <FormSection
        title="Variables"
        description={'Referenced as {{variable-name}} in string fields throughout the devfile.'}
      >
        <Alert type="info" title="Where substitution applies">
          Variables are <em>not</em> substituted in <code>schemaVersion</code>, <code>metadata</code>, the{' '}
          <code>parent</code> source, element identifiers (<code>command.id</code>,{' '}
          <code>component.name</code>, <code>endpoint.name</code>, <code>project.name</code>), references to
          those identifiers, or string enumerations such as <code>group.kind</code> and{' '}
          <code>endpoint.exposure</code>. An undefined reference produces a non-blocking warning.
        </Alert>

        <div className="mt-4">
          <KeyValueArrayManager
            items={variables}
            onUpdate={setVariables}
            keyLabel="Variable name"
            valueLabel="Value"
            keyPlaceholder="version"
            valuePlaceholder="1.0.0"
            addButtonText="Add variable"
            emptyMessage="No variables defined."
          />
        </div>
      </FormSection>

      <FormSection
        title="Devfile attributes"
        description="Implementation-dependant free-form YAML applied to the devfile as a whole."
      >
        <AttributesEditor
          name="devfile-attributes"
          label=""
          value={attributes}
          onChange={setAttributes}
          rows={6}
          helpText="For example controller.devfile.io/storage-type: ephemeral"
        />
      </FormSection>

      <WizardNavigation />
    </div>
  )
}
