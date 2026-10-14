import { useWizard } from '../../hooks/useWizardState'
import { useYamlGenerator } from '../../hooks/useYamlGenerator'
import { downloadYamlFile } from '../../utils/downloadFile'
import { validateDevfile } from '../../utils/validation'
import Button from '../common/Button'
import Card from '../common/Card'
import Badge from '../common/Badge'
import Alert from '../common/Alert'
import YamlPreview from '../preview/YamlPreview'

export default function ReviewStep() {
  const { state, dispatch, actions } = useWizard()
  const { generateYaml } = useYamlGenerator()
  const data = state.devfileData

  const { errors, warnings } = validateDevfile(data)

  const handleDownload = () => downloadYamlFile(generateYaml(data), 'devfile.yaml')

  const handleReset = () => {
    if (window.confirm('Reset the wizard? All data will be lost.')) {
      dispatch({ type: actions.RESET_WIZARD })
    }
  }

  const goTo = (stepIndex) => dispatch({ type: actions.GOTO_STEP, payload: stepIndex })

  const countsByType = (items, field) =>
    items.reduce((acc, item) => {
      const key = item[field] || 'unknown'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

  const componentCounts = countsByType(data.components, 'componentType')
  const commandCounts = countsByType(data.commands, 'commandType')
  const eventCount = Object.values(data.events).reduce((total, list) => total + list.length, 0)

  const sections = [
    {
      title: 'Metadata',
      step: 0,
      configured: !!(data.metadata.name || data.metadata.displayName),
      details: [
        data.metadata.name && `name: ${data.metadata.name}`,
        data.metadata.version && `version: ${data.metadata.version}`,
        data.metadata.language && `language: ${data.metadata.language}`,
        `schemaVersion: ${data.schemaVersion}`
      ].filter(Boolean)
    },
    {
      title: 'Parent',
      step: 1,
      configured: !!data.parent?.enabled,
      details: data.parent?.enabled
        ? [
            `${data.parent.sourceType}: ${
              data.parent.sourceType === 'kubernetes'
                ? data.parent.kubernetes?.name || '—'
                : data.parent[data.parent.sourceType] || '—'
            }`,
            data.parent.version && `version: ${data.parent.version}`
          ].filter(Boolean)
        : ['No parent devfile']
    },
    {
      title: 'Projects',
      step: 2,
      configured:
        data.projects.length + data.starterProjects.length + data.dependentProjects.length > 0,
      details: [
        `${data.projects.length} project(s)`,
        `${data.starterProjects.length} starter project(s)`,
        `${data.dependentProjects.length} dependent project(s)`
      ]
    },
    {
      title: 'Components',
      step: 3,
      configured: data.components.length > 0,
      details:
        data.components.length > 0
          ? Object.entries(componentCounts).map(([type, count]) => `${count} × ${type}`)
          : ['No components']
    },
    {
      title: 'Commands',
      step: 4,
      configured: data.commands.length > 0,
      details:
        data.commands.length > 0
          ? Object.entries(commandCounts).map(([type, count]) => `${count} × ${type}`)
          : ['No commands']
    },
    {
      title: 'Events',
      step: 5,
      configured: eventCount > 0,
      details:
        eventCount > 0
          ? Object.entries(data.events)
              .filter(([, list]) => list.length > 0)
              .map(([type, list]) => `${type}: ${list.join(', ')}`)
          : ['No events bound']
    },
    {
      title: 'Variables & attributes',
      step: 6,
      configured: data.variables.length > 0 || !!data.attributes,
      details: [
        `${data.variables.length} variable(s)`,
        data.attributes ? 'devfile attributes set' : 'no devfile attributes'
      ]
    }
  ]

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & download</h2>
      <p className="text-gray-600 mb-6">
        The devfile is validated against the devfile {data.schemaVersion} schema and the devfile/api semantic
        rules.
      </p>

      {errors.length === 0 && warnings.length === 0 && (
        <Alert type="success" title="Valid devfile">
          No schema or semantic problems found.
        </Alert>
      )}

      {errors.length > 0 && (
        <Alert type="error" title={`${errors.length} error${errors.length === 1 ? '' : 's'}`}>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      {warnings.length > 0 && (
        <div className="mt-4">
          <Alert type="warning" title={`${warnings.length} warning${warnings.length === 1 ? '' : 's'}`}>
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </Alert>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-6">
        {sections.map((section) => (
          <Card key={section.title}>
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                <Badge variant={section.configured ? 'success' : 'default'} className="mt-1">
                  {section.configured ? 'Configured' : 'Not configured'}
                </Badge>
              </div>
              <Button variant="outline" onClick={() => goTo(section.step)} className="text-xs px-2 py-1">
                Edit
              </Button>
            </div>
            <ul className="text-sm text-gray-600 space-y-1">
              {section.details.map((detail, index) => (
                <li key={index} className="truncate" title={detail}>
                  {detail}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <YamlPreview />

      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <Button variant="secondary" onClick={handleReset}>
          Reset wizard
        </Button>

        <Button variant="success" onClick={handleDownload} disabled={errors.length > 0} className="px-6">
          Download devfile.yaml
        </Button>
      </div>
    </div>
  )
}
