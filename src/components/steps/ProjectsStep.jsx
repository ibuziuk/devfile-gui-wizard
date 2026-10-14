import { useState } from 'react'
import { useWizard } from '../../hooks/useWizardState'
import { PROJECT_KINDS } from '../../utils/constants'
import { compareVersions } from '../../utils/validation'
import WizardNavigation from '../wizard/WizardNavigation'
import Alert from '../common/Alert'
import ProjectListEditor from '../editors/ProjectListEditor'

const TABS = [PROJECT_KINDS.projects, PROJECT_KINDS.starterProjects, PROJECT_KINDS.dependentProjects]

export default function ProjectsStep() {
  const { state, dispatch, actions } = useWizard()
  const [activeTab, setActiveTab] = useState('projects')

  const config = PROJECT_KINDS[activeTab]
  const projects = state.devfileData[activeTab] || []
  const supportsDependentProjects = compareVersions(state.devfileData.schemaVersion, '2.3.0') >= 0

  const setProjects = (value) =>
    dispatch({ type: actions.SET_SECTION, payload: { section: activeTab, value } })

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Projects</h2>
      <p className="text-gray-600 mb-6">
        Source code the workspace works with: the projects to clone, the starter templates offered to users,
        and the projects the main project depends on.
      </p>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-6" aria-label="Project kinds">
          {TABS.map((tab) => {
            const count = (state.devfileData[tab.key] || []).length
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 text-sm font-medium
                  ${isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {tab.label}
                {count > 0 && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      <p className="text-sm text-gray-600 mb-4">{config.description}</p>

      {activeTab === 'projects' && (
        <Alert type="info">
          If the devfile sits at the root of the repository it describes, omit this section — the tool cloning
          the devfile already knows the source.
        </Alert>
      )}

      {activeTab === 'dependentProjects' && !supportsDependentProjects && (
        <Alert type="warning" title="Not available in this schema version">
          <code>dependentProjects</code> was introduced in devfile 2.3.0. Select schema version 2.3.0 in the
          Metadata step to use it.
        </Alert>
      )}

      <div className="mt-4">
        <ProjectListEditor
          projects={projects}
          onChange={setProjects}
          config={config}
          idPrefix={activeTab}
        />
      </div>

      <WizardNavigation />
    </div>
  )
}
