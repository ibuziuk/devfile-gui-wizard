import { useSection } from '../../hooks/useWizardState'
import { PARENT_SOURCE_TYPES, PROJECT_KINDS, newParent } from '../../utils/constants'
import { validators } from '../../utils/validation'
import FormInput from '../forms/FormInput'
import FormSelect from '../forms/FormSelect'
import FormSection from '../forms/FormSection'
import FormCheckbox from '../forms/FormCheckbox'
import AttributesEditor from '../forms/AttributesEditor'
import CollapsibleSection from '../forms/CollapsibleSection'
import KeyValueArrayManager from '../forms/KeyValueArrayManager'
import WizardNavigation from '../wizard/WizardNavigation'
import Alert from '../common/Alert'
import ComponentListEditor from '../editors/ComponentListEditor'
import CommandListEditor from '../editors/CommandListEditor'
import ProjectListEditor from '../editors/ProjectListEditor'

/**
 * Editor for the `parent` section: the devfile this one inherits from, plus the
 * overrides applied on top of it. Overrides reuse the regular editors because
 * they accept the same shapes, with every field optional.
 */
export default function ParentStep() {
  const [parent, setParent] = useSection('parent')
  const current = parent || newParent()
  const overrides = current.overrides || {}

  const set = (field, value) => setParent((prev) => ({ ...(prev || newParent()), [field]: value }))
  const setOverride = (field, value) =>
    setParent((prev) => {
      const base = prev || newParent()
      return { ...base, overrides: { ...(base.overrides || {}), [field]: value } }
    })

  const overrideCount =
    (overrides.components?.length || 0) +
    (overrides.commands?.length || 0) +
    (overrides.projects?.length || 0) +
    (overrides.starterProjects?.length || 0) +
    (overrides.dependentProjects?.length || 0) +
    (overrides.variables?.length || 0) +
    (overrides.attributes ? 1 : 0)

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Parent</h2>
      <p className="text-gray-600 mb-4">
        Inherit from another devfile. The parent is resolved first and this devfile is merged on top of it.
      </p>

      <Alert type="info">
        A devfile may define a parent by URI, by registry id, or by pointing at a Kubernetes
        DevWorkspaceTemplate. Exactly one of these is allowed.
      </Alert>

      <div className="mt-6">
        <FormCheckbox
          name="parent-enabled"
          label="This devfile inherits from a parent"
          checked={!!current.enabled}
          onChange={(event) => set('enabled', event.target.checked)}
          helpText="Leave unchecked to omit the parent section entirely."
        />
      </div>

      {current.enabled && (
        <>
          <FormSection title="Parent source">
            <FormSelect
              name="parent-sourceType"
              label="Reference type"
              value={current.sourceType || 'uri'}
              onChange={(event) => set('sourceType', event.target.value)}
              options={PARENT_SOURCE_TYPES}
              placeholder=""
            />

            {current.sourceType === 'id' && (
              <>
                <FormInput
                  name="parent-id"
                  label="Registry id"
                  value={current.id || ''}
                  onChange={(event) => set('id', event.target.value)}
                  required
                  placeholder="nodejs"
                  helpText="Id of the parent devfile in a devfile registry."
                />
                <FormInput
                  name="parent-registryUrl"
                  label="Registry URL"
                  value={current.registryUrl || ''}
                  onChange={(event) => set('registryUrl', event.target.value)}
                  error={validators.uri(current.registryUrl)}
                  placeholder="https://registry.devfile.io"
                  helpText="Registry to resolve the id against."
                />
              </>
            )}

            {current.sourceType === 'kubernetes' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <FormInput
                  name="parent-kubernetes-name"
                  label="Resource name"
                  value={current.kubernetes?.name || ''}
                  onChange={(event) => set('kubernetes', { ...(current.kubernetes || {}), name: event.target.value })}
                  required
                  placeholder="my-devworkspace-template"
                />
                <FormInput
                  name="parent-kubernetes-namespace"
                  label="Namespace"
                  value={current.kubernetes?.namespace || ''}
                  onChange={(event) =>
                    set('kubernetes', { ...(current.kubernetes || {}), namespace: event.target.value })
                  }
                  placeholder="my-namespace"
                />
              </div>
            )}

            {(current.sourceType === 'uri' || !current.sourceType) && (
              <FormInput
                name="parent-uri"
                label="URI"
                value={current.uri || ''}
                onChange={(event) => set('uri', event.target.value)}
                error={validators.uri(current.uri)}
                required
                placeholder="https://example.com/devfile.yaml"
                helpText="URL or path of the parent devfile, relative to this devfile."
              />
            )}

            <FormInput
              name="parent-version"
              label="Version"
              value={current.version || ''}
              onChange={(event) => set('version', event.target.value)}
              placeholder="latest"
              helpText='"latest" or a specific stack version such as 1.2.0.'
            />
          </FormSection>

          <FormSection
            title="Overrides"
            description="Patches applied on top of the parent devfile. Only the fields you set are overridden, so required fields may be left empty here."
          >
            {overrideCount === 0 && (
              <p className="text-sm text-gray-500 italic mb-4">
                No overrides defined — the parent is inherited as-is.
              </p>
            )}

            <CollapsibleSection title="Component overrides" badge={overrides.components?.length || 0}>
              <ComponentListEditor
                components={overrides.components || []}
                onChange={(value) => setOverride('components', value)}
                idPrefix="parent-component"
              />
            </CollapsibleSection>

            <CollapsibleSection title="Command overrides" badge={overrides.commands?.length || 0}>
              <CommandListEditor
                commands={overrides.commands || []}
                onChange={(value) => setOverride('commands', value)}
                components={overrides.components || []}
                idPrefix="parent-command"
              />
            </CollapsibleSection>

            <CollapsibleSection title="Project overrides" badge={overrides.projects?.length || 0}>
              <ProjectListEditor
                projects={overrides.projects || []}
                onChange={(value) => setOverride('projects', value)}
                config={PROJECT_KINDS.projects}
                idPrefix="parent-project"
              />
            </CollapsibleSection>

            <CollapsibleSection title="Starter project overrides" badge={overrides.starterProjects?.length || 0}>
              <ProjectListEditor
                projects={overrides.starterProjects || []}
                onChange={(value) => setOverride('starterProjects', value)}
                config={PROJECT_KINDS.starterProjects}
                idPrefix="parent-starter-project"
              />
            </CollapsibleSection>

            <CollapsibleSection title="Dependent project overrides" badge={overrides.dependentProjects?.length || 0}>
              <ProjectListEditor
                projects={overrides.dependentProjects || []}
                onChange={(value) => setOverride('dependentProjects', value)}
                config={PROJECT_KINDS.dependentProjects}
                idPrefix="parent-dependent-project"
              />
            </CollapsibleSection>

            <CollapsibleSection title="Variable overrides" badge={overrides.variables?.length || 0}>
              <KeyValueArrayManager
                items={overrides.variables || []}
                onUpdate={(value) => setOverride('variables', value)}
                keyLabel="Variable"
                valueLabel="Value"
                keyPlaceholder="VERSION"
                valuePlaceholder="1.0.0"
                addButtonText="Add variable override"
                emptyMessage="No variable overrides."
              />
            </CollapsibleSection>

            <CollapsibleSection title="Attribute overrides" badge={overrides.attributes ? 1 : 0}>
              <AttributesEditor
                name="parent-attributes"
                value={overrides.attributes || ''}
                onChange={(value) => setOverride('attributes', value)}
              />
            </CollapsibleSection>
          </FormSection>
        </>
      )}

      <WizardNavigation />
    </div>
  )
}
