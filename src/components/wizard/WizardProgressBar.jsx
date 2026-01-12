import { useWizard } from '../../hooks/useWizardState'
import { WIZARD_STEPS } from '../../utils/constants'

export default function WizardProgressBar() {
  const { state, dispatch, actions } = useWizard()

  const handleStepClick = (stepIndex) => {
    // Can only navigate to completed steps or current step
    if (state.completedSteps.includes(stepIndex) || stepIndex === state.currentStep) {
      dispatch({ type: actions.GOTO_STEP, payload: stepIndex })
    }
  }

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        {WIZARD_STEPS.map((step, index) => {
          const isCompleted = state.completedSteps.includes(index)
          const isCurrent = state.currentStep === index
          const isClickable = isCompleted || isCurrent

          return (
            <div
              key={step.id}
              className="flex-1 relative"
              onClick={() => isClickable && handleStepClick(index)}
            >
              <div className="flex items-center">
                {index > 0 && (
                  <div
                    className={`flex-1 h-1 ${
                      isCompleted ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
                <div
                  className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium
                    ${isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                    }
                    ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}
                  `}
                  title={step.title}
                >
                  {isCompleted && !isCurrent ? '✓' : index + 1}
                </div>
              </div>
              <div className={`text-xs mt-2 text-center ${isCurrent ? 'font-semibold text-blue-600' : 'text-gray-600'}`}>
                {step.title}
              </div>
            </div>
          )
        })}
      </div>
      <div className="text-center text-sm text-gray-500 mt-4">
        Step {state.currentStep + 1} of {WIZARD_STEPS.length}
      </div>
    </div>
  )
}
