import { createContext, useContext, useMemo, useReducer } from 'react'
import { DEFAULT_SCHEMA_VERSION, WIZARD_STEPS, newParent } from '../utils/constants'

const WizardContext = createContext()

/**
 * The wizard keeps a UI-shaped mirror of the devfile:
 *  - string maps (variables, remotes, annotations) are ordered {name, value} arrays
 *  - optional booleans are tri-state ('' = not set, true, false)
 *  - free-form `attributes` maps are YAML text
 *  - each polymorphic entry carries a discriminator (componentType, commandType,
 *    sourceType) that is stripped when the devfile is generated
 */
const initialState = {
  currentStep: 0,
  completedSteps: [],
  devfileData: {
    schemaVersion: DEFAULT_SCHEMA_VERSION,
    metadata: {
      name: '',
      version: '',
      displayName: '',
      description: '',
      tags: [],
      icon: '',
      globalMemoryLimit: '',
      projectType: '',
      language: '',
      website: '',
      provider: '',
      supportUrl: '',
      architectures: [],
      attributes: ''
    },
    attributes: '',
    parent: newParent(),
    projects: [],
    starterProjects: [],
    dependentProjects: [],
    components: [],
    commands: [],
    events: {
      preStart: [],
      postStart: [],
      preStop: [],
      postStop: []
    },
    variables: []
  }
}

const WIZARD_ACTIONS = {
  NEXT_STEP: 'NEXT_STEP',
  PREV_STEP: 'PREV_STEP',
  GOTO_STEP: 'GOTO_STEP',
  MARK_STEP_COMPLETED: 'MARK_STEP_COMPLETED',
  UPDATE_METADATA: 'UPDATE_METADATA',
  UPDATE_EVENTS: 'UPDATE_EVENTS',
  SET_SECTION: 'SET_SECTION',
  LOAD_DEVFILE: 'LOAD_DEVFILE',
  RESET_WIZARD: 'RESET_WIZARD'
}

function wizardReducer(state, action) {
  switch (action.type) {
    case WIZARD_ACTIONS.NEXT_STEP:
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, WIZARD_STEPS.length - 1),
        completedSteps: [...new Set([...state.completedSteps, state.currentStep])]
      }

    case WIZARD_ACTIONS.PREV_STEP:
      return { ...state, currentStep: Math.max(state.currentStep - 1, 0) }

    case WIZARD_ACTIONS.GOTO_STEP:
      return { ...state, currentStep: action.payload }

    case WIZARD_ACTIONS.MARK_STEP_COMPLETED:
      return { ...state, completedSteps: [...new Set([...state.completedSteps, action.payload])] }

    case WIZARD_ACTIONS.UPDATE_METADATA:
      return {
        ...state,
        devfileData: {
          ...state.devfileData,
          metadata: { ...state.devfileData.metadata, ...action.payload }
        }
      }

    case WIZARD_ACTIONS.UPDATE_EVENTS:
      return {
        ...state,
        devfileData: {
          ...state.devfileData,
          events: { ...state.devfileData.events, ...action.payload }
        }
      }

    // Replaces a whole top-level section (components, commands, parent, ...).
    // The value may be an updater function so that several updates batched into
    // one event still build on each other.
    case WIZARD_ACTIONS.SET_SECTION: {
      const { section, value } = action.payload
      return {
        ...state,
        devfileData: {
          ...state.devfileData,
          [section]: typeof value === 'function' ? value(state.devfileData[section]) : value
        }
      }
    }

    case WIZARD_ACTIONS.LOAD_DEVFILE:
      return {
        ...state,
        currentStep: 0,
        completedSteps: [],
        devfileData: action.payload
      }

    case WIZARD_ACTIONS.RESET_WIZARD:
      return JSON.parse(JSON.stringify(initialState))

    default:
      return state
  }
}

export function WizardProvider({ children }) {
  const [state, dispatch] = useReducer(wizardReducer, JSON.parse(JSON.stringify(initialState)))

  const value = useMemo(() => ({ state, dispatch, actions: WIZARD_ACTIONS }), [state])

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
}

export function useWizard() {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider')
  }
  return context
}

/**
 * Convenience hook for sections that are edited as a whole (arrays/objects).
 * `setValue` accepts either the next value or an updater function.
 */
export function useSection(section) {
  const { state, dispatch, actions } = useWizard()
  const value = state.devfileData[section]
  const setValue = (next) => dispatch({ type: actions.SET_SECTION, payload: { section, value: next } })
  return [value, setValue]
}

export { initialState as initialWizardState }
