import { PROJECT_SOURCE_TYPES, newProject } from '../../utils/constants'
import { validators } from '../../utils/validation'
import FormInput from '../forms/FormInput'
import FormSelect from '../forms/FormSelect'
import FormTextarea from '../forms/FormTextarea'
import AttributesEditor from '../forms/AttributesEditor'
import CollapsibleSection from '../forms/CollapsibleSection'
import ArrayFieldManager, { listHelpers } from '../forms/ArrayFieldManager'
import GitSourceEditor from './GitSourceEditor'

/**
 * Editor for `projects`, `starterProjects` and `dependentProjects`. The three
 * share the git/zip source shape; `config` carries the per-kind differences.
 */
export default function ProjectListEditor({ projects = [], onChange, config, idPrefix }) {
  const list = listHelpers(projects, onChange)

  const renderProject = (project, index) => {
    const id = `${idPrefix}-${index}`
    const set = (field, value) => list.update(index, { [field]: value })

    return (
      <div className="space-y-2">
        <FormInput
          name={`${id}-name`}
          label="Name"
          value={project.name || ''}
          onChange={(event) => set('name', event.target.value)}
          error={validators.k8sName(project.name)}
          required
          placeholder="my-project"
          helpText="Lowercase alphanumeric characters and '-', max 63 characters."
        />

        {config.hasClonePath && (
          <FormInput
            name={`${id}-clonePath`}
            label="Clone path"
            value={project.clonePath || ''}
            onChange={(event) => set('clonePath', event.target.value)}
            placeholder="my-project"
            helpText="Relative path inside the projects root. Defaults to the project name."
          />
        )}

        {config.hasDescription && (
          <FormTextarea
            name={`${id}-description`}
            label="Description"
            value={project.description || ''}
            onChange={(event) => set('description', event.target.value)}
            rows={2}
            placeholder="A minimal starter for ..."
          />
        )}

        {config.hasSubDir && (
          <FormInput
            name={`${id}-subDir`}
            label="Sub directory"
            value={project.subDir || ''}
            onChange={(event) => set('subDir', event.target.value)}
            placeholder="examples/basic"
            helpText="Sub-directory of the downloaded source to use as the project root."
          />
        )}

        <FormSelect
          name={`${id}-sourceType`}
          label="Source"
          value={project.sourceType || 'git'}
          onChange={(event) => set('sourceType', event.target.value)}
          options={PROJECT_SOURCE_TYPES}
          placeholder=""
        />

        {project.sourceType === 'zip' ? (
          <FormInput
            name={`${id}-zip-location`}
            label="Zip location"
            value={project.zip?.location || ''}
            onChange={(event) => set('zip', { ...(project.zip || {}), location: event.target.value })}
            placeholder="https://example.com/archive.zip"
            helpText="URL of the zip archive to download."
          />
        ) : (
          <GitSourceEditor
            git={project.git || {}}
            onChange={(value) => set('git', value)}
            idPrefix={`${id}-git`}
            singleRemote={config.singleRemote}
          />
        )}

        <CollapsibleSection title="Attributes" badge={project.attributes ? 1 : 0}>
          <AttributesEditor
            name={`${id}-attributes`}
            value={project.attributes || ''}
            onChange={(value) => set('attributes', value)}
          />
        </CollapsibleSection>
      </div>
    )
  }

  return (
    <ArrayFieldManager
      items={projects}
      onAdd={() => list.add(newProject())}
      onRemove={list.remove}
      onMove={list.move}
      renderItem={renderProject}
      itemTitle={(project, index) => project.name || `${config.label.replace(/s$/, '')} ${index + 1}`}
      addButtonText={`Add ${config.singular}`}
      emptyMessage={`No ${config.label.toLowerCase()} defined.`}
    />
  )
}
