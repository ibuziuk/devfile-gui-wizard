import { createContext, useContext, useReducer } from 'react'

const WizardContext = createContext()

const initialState = {
  currentStep: 0,
  completedSteps: [],
  devfileData: {
    schemaVersion: '2.3.0',
    metadata: {
      name: '',
      version: '',
      displayName: '',
      description: '',
      language: '',
      projectType: '',
      provider: '',
      tags: [],
      website: '',
      supportUrl: ''
    },
    projects: [],
    components: [],
    commands: [],
    events: {
      preStart: [],
      postStart: [],
      preStop: [],
      postStop: []
    },
    variables: {},
    starterProjects: [],
    attributes: {}
  },
  validationErrors: {}
}

const WIZARD_ACTIONS = {
  NEXT_STEP: 'NEXT_STEP',
  PREV_STEP: 'PREV_STEP',
  GOTO_STEP: 'GOTO_STEP',
  UPDATE_METADATA: 'UPDATE_METADATA',
  ADD_PROJECT: 'ADD_PROJECT',
  REMOVE_PROJECT: 'REMOVE_PROJECT',
  UPDATE_PROJECT: 'UPDATE_PROJECT',
  ADD_COMPONENT: 'ADD_COMPONENT',
  REMOVE_COMPONENT: 'REMOVE_COMPONENT',
  UPDATE_COMPONENT: 'UPDATE_COMPONENT',
  ADD_COMMAND: 'ADD_COMMAND',
  REMOVE_COMMAND: 'REMOVE_COMMAND',
  UPDATE_COMMAND: 'UPDATE_COMMAND',
  UPDATE_EVENTS: 'UPDATE_EVENTS',
  UPDATE_VARIABLES: 'UPDATE_VARIABLES',
  SET_VALIDATION_ERRORS: 'SET_VALIDATION_ERRORS',
  RESET_WIZARD: 'RESET_WIZARD',
  MARK_STEP_COMPLETED: 'MARK_STEP_COMPLETED'
}

function wizardReducer(state, action) {
  switch (action.type) {
    case WIZARD_ACTIONS.NEXT_STEP:
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, 6),
        completedSteps: [...new Set([...state.completedSteps, state.currentStep])]
      }

    case WIZARD_ACTIONS.PREV_STEP:
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0)
      }

    case WIZARD_ACTIONS.GOTO_STEP:
      return {
        ...state,
        currentStep: action.payload
      }

    case WIZARD_ACTIONS.MARK_STEP_COMPLETED:
      return {
        ...state,
        completedSteps: [...new Set([...state.completedSteps, action.payload])]
      }

    case WIZARD_ACTIONS.UPDATE_METADATA:
      return {
        ...state,
        devfileData: {
          ...state.devfileData,
          metadata: {
            ...state.devfileData.metadata,
            ...action.payload
          }
        }
      }

    case WIZARD_ACTIONS.ADD_PROJECT:
      return {
        ...state,
        devfileData: {
          ...state.devfileData,
          projects: [...state.devfileData.projects, action.payload]
        }
      }

    case WIZARD_ACTIONS.REMOVE_PROJECT:
      return {
        ...state,
        devfileData: {
          ...state.devfileData,
          projects: state.devfileData.projects.filter((_, index) => index !== action.payload)
        }
      }

    case WIZARD_ACTIONS.UPDATE_PROJECT:
      return {
        ...state,
        devfileData: {
          ...state.devfileData,
          projects: state.devfileData.projects.map((project, index) =>
            index === action.payload.index
              ? { ...project, ...action.payload.data }
              : project
          )
        }
      }

    case WIZARD_ACTIONS.ADD_COMPONENT:
      return {
        ...state,
        devfileData: {
          ...state.devfileData,
          components: [...state.devfileData.components, action.payload]
        }
      }

    case WIZARD_ACTIONS.REMOVE_COMPONENT:
      return {
        ...state,
        devfileData: {
          ...state.devfileData,
          components: state.devfileData.components.filter((_, index) => index !== action.payload)
        }
      }

    case WIZARD_ACTIONS.UPDATE_COMPONENT:
      return {
        ...state,
        devfileData: {
          ...state.devfileData,
          components: state.devfileData.components.map((component, index) =>
            index === action.payload.index
              ? { ...component, ...action.payload.data }
              : component
          )
        }
      }

    case WIZARD_ACTIONS.ADD_COMMAND:
      return {
        ...state,
        devfileData: {
          ...state.devfileData,
          commands: [...state.devfileData.commands, action.payload]
        }
      }

    case WIZARD_ACTIONS.REMOVE_COMMAND:
      return {
        ...state,
        devfileData: {
          ...state.devfileData,
          commands: state.devfileData.commands.filter((_, index) => index !== action.payload)
        }
      }

    case WIZARD_ACTIONS.UPDATE_COMMAND:
      return {
        ...state,
        devfileData: {
          ...state.devfileData,
          commands: state.devfileData.commands.map((command, index) =>
            index === action.payload.index
              ? { ...command, ...action.payload.data }
              : command
          )
        }
      }

    case WIZARD_ACTIONS.UPDATE_EVENTS:
      return {
        ...state,
        devfileData: {
          ...state.devfileData,
          events: {
            ...state.devfileData.events,
            ...action.payload
          }
        }
      }

    case WIZARD_ACTIONS.UPDATE_VARIABLES:
      return {
        ...state,
        devfileData: {
          ...state.devfileData,
          variables: action.payload
        }
      }

    case WIZARD_ACTIONS.SET_VALIDATION_ERRORS:
      return {
        ...state,
        validationErrors: action.payload
      }

    case WIZARD_ACTIONS.RESET_WIZARD:
      return initialState

    default:
      return state
  }
}

export function WizardProvider({ children }) {
  const [state, dispatch] = useReducer(wizardReducer, initialState)

  return (
    <WizardContext.Provider value={{ state, dispatch, actions: WIZARD_ACTIONS }}>
      {children}
    </WizardContext.Provider>
  )
}

export function useWizard() {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider')
  }
  return context
}
