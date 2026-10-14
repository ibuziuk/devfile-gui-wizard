import { useWizard } from '../../hooks/useWizardState'
import { WIZARD_STEPS } from '../../utils/constants'

export default function WizardProgressBar() {
  const { state, dispatch, actions } = useWizard()

  // Every section of a devfile is optional, so the wizard is freely navigable.
  const goTo = (stepIndex) => dispatch({ type: actions.GOTO_STEP, payload: stepIndex })

  return (
    <nav className="mb-8" aria-label="Wizard steps">
      <ol className="flex items-start">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = state.completedSteps.includes(index) && state.currentStep !== index
          const isCurrent = state.currentStep === index

          return (
            <li key={step.id} className="flex-1 flex flex-col items-center relative min-w-0">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className={`absolute top-5 right-1/2 w-full h-0.5 ${
                    state.completedSteps.includes(index - 1) ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              )}
              <button
                type="button"
                onClick={() => goTo(index)}
                aria-current={isCurrent ? 'step' : undefined}
                title={step.title}
                className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-colors
                  ${isCurrent
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : isCompleted
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
              >
                {isCompleted ? '✓' : index + 1}
                <span className="sr-only">{step.title}</span>
              </button>
              <span
                className={`mt-2 text-xs text-center px-1 truncate w-full ${
                  isCurrent ? 'font-semibold text-blue-600' : 'text-gray-600'
                }`}
              >
                {step.title}
              </span>
            </li>
          )
        })}
      </ol>
      <p className="text-center text-sm text-gray-500 mt-4">
        Step {state.currentStep + 1} of {WIZARD_STEPS.length} — {WIZARD_STEPS[state.currentStep].title}
      </p>
    </nav>
  )
}
