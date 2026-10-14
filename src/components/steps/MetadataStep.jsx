import { useWizard } from '../../hooks/useWizardState'
import { validateMetadata, validators } from '../../utils/validation'
import { ARCHITECTURES, LANGUAGES, PROJECT_TYPES, SCHEMA_VERSIONS } from '../../utils/constants'
import FormInput from '../forms/FormInput'
import FormTextarea from '../forms/FormTextarea'
import FormSelect from '../forms/FormSelect'
import FormSection from '../forms/FormSection'
import StringListManager from '../forms/StringListManager'
import AttributesEditor from '../forms/AttributesEditor'
import CollapsibleSection from '../forms/CollapsibleSection'
import WizardNavigation from '../wizard/WizardNavigation'

export default function MetadataStep() {
  const { state, dispatch, actions } = useWizard()
  const { metadata, schemaVersion } = state.devfileData
  const errors = validateMetadata(metadata)

  const setMetadata = (payload) => dispatch({ type: actions.UPDATE_METADATA, payload })
  const handleChange = (event) => setMetadata({ [event.target.name]: event.target.value })

  const toggleArchitecture = (architecture, checked) => {
    const current = metadata.architectures || []
    setMetadata({
      architectures: checked
        ? [...current, architecture]
        : current.filter((item) => item !== architecture)
    })
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Metadata</h2>
      <p className="text-gray-600 mb-6">
        Information about the devfile itself. Everything here is optional per the schema, but registries and
        tools rely on <code className="bg-gray-100 px-1 rounded">name</code> and{' '}
        <code className="bg-gray-100 px-1 rounded">version</code>.
      </p>

      <FormSection title="Devfile">
        <FormSelect
          name="schemaVersion"
          label="Schema version"
          value={schemaVersion}
          onChange={(event) =>
            dispatch({ type: actions.SET_SECTION, payload: { section: 'schemaVersion', value: event.target.value } })
          }
          options={SCHEMA_VERSIONS}
          required
          placeholder=""
          helpText="The version of the devfile schema this file conforms to."
        />
      </FormSection>

      <FormSection title="Identity">
        <FormInput
          name="name"
          label="Name"
          value={metadata.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="my-project"
          helpText="Lowercase alphanumeric characters and '-', max 63 characters."
        />

        <FormInput
          name="version"
          label="Version"
          value={metadata.version}
          onChange={handleChange}
          error={errors.version}
          placeholder="1.0.0"
          helpText="Semantic version of this devfile stack."
        />

        <FormInput
          name="displayName"
          label="Display name"
          value={metadata.displayName}
          onChange={handleChange}
          placeholder="My Awesome Project"
          helpText="Human readable name shown in registries and IDEs."
        />

        <FormTextarea
          name="description"
          label="Description"
          value={metadata.description}
          onChange={handleChange}
          rows={3}
          placeholder="A brief description of the stack"
        />
      </FormSection>

      <FormSection title="Classification">
        <FormSelect
          name="language"
          label="Language"
          value={metadata.language}
          onChange={handleChange}
          options={LANGUAGES}
          helpText="Primary language of the project. Any value is allowed."
        />

        <FormSelect
          name="projectType"
          label="Project type"
          value={metadata.projectType}
          onChange={handleChange}
          options={PROJECT_TYPES}
          helpText="Framework or runtime the stack targets. Any value is allowed."
        />

        <StringListManager
          label="Tags"
          items={metadata.tags || []}
          onChange={(value) => setMetadata({ tags: value })}
          placeholder="Node.js"
          addButtonText="Add tag"
          emptyMessage="No tags defined."
          helpText="Keywords used to categorise the stack in a registry."
        />

        <fieldset className="mb-4">
          <legend className="block text-sm font-medium text-gray-700 mb-1">Architectures</legend>
          <p className="mb-2 text-sm text-gray-500">
            CPU architectures the stack supports. Leaving this empty means all architectures.
          </p>
          <div className="flex flex-wrap gap-4">
            {ARCHITECTURES.map((architecture) => (
              <label key={architecture} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={(metadata.architectures || []).includes(architecture)}
                  onChange={(event) => toggleArchitecture(architecture, event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 font-mono">{architecture}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </FormSection>

      <FormSection title="Provider and links">
        <FormInput
          name="provider"
          label="Provider"
          value={metadata.provider}
          onChange={handleChange}
          placeholder="Red Hat"
          helpText="Organization or individual providing this devfile."
        />

        <FormInput
          name="website"
          label="Website"
          type="url"
          value={metadata.website}
          onChange={handleChange}
          error={errors.website}
          placeholder="https://example.com"
        />

        <FormInput
          name="supportUrl"
          label="Support URL"
          type="url"
          value={metadata.supportUrl}
          onChange={handleChange}
          error={errors.supportUrl}
          placeholder="https://example.com/support"
        />

        <FormInput
          name="icon"
          label="Icon"
          value={metadata.icon}
          onChange={handleChange}
          error={errors.icon}
          placeholder="https://example.com/icon.svg"
          helpText="URL or relative path of the stack icon."
        />
      </FormSection>

      <CollapsibleSection
        title="Advanced metadata"
        badge={(metadata.globalMemoryLimit ? 1 : 0) + (metadata.attributes ? 1 : 0)}
      >
        <FormInput
          name="globalMemoryLimit"
          label="Global memory limit"
          value={metadata.globalMemoryLimit}
          onChange={handleChange}
          error={errors.globalMemoryLimit || validators.quantity(metadata.globalMemoryLimit)}
          placeholder="2674Mi"
          helpText="Total memory limit applied to all the containers of the workspace."
        />
        <AttributesEditor
          name="metadata-attributes"
          label="Metadata attributes"
          value={metadata.attributes}
          onChange={(value) => setMetadata({ attributes: value })}
        />
      </CollapsibleSection>

      <WizardNavigation />
    </div>
  )
}
