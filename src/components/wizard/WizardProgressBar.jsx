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
      <div className="flex items-center mb-2 relative" style={{ minHeight: '80px' }}>
        {/* Connecting lines - positioned absolutely behind circles */}
        <div className="absolute left-0 right-0 flex items-center justify-between" style={{ top: '0.625rem', height: '4px', paddingLeft: '1.25rem', paddingRight: '1.25rem' }}>
          {WIZARD_STEPS.map((step, index) => {
            if (index === WIZARD_STEPS.length - 1) return null
            const isCompleted = state.completedSteps.includes(index)
            return (
              <div
                key={`line-${step.id}`}
                className={`h-1 ${
                  isCompleted ? 'bg-blue-600' : 'bg-gray-300'
                }`}
                style={{ flex: '1 1 0' }}
              />
            )
          })}
        </div>
        
        {/* Step circles */}
        <div className="flex items-center justify-between w-full relative z-10">
          {WIZARD_STEPS.map((step, index) => {
            const isCompleted = state.completedSteps.includes(index)
            const isCurrent = state.currentStep === index
            const isClickable = isCompleted || isCurrent

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium
                    ${isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-300 text-gray-600'
                    }
                    ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed'}
                  `}
                  onClick={() => isClickable && handleStepClick(index)}
                  title={step.title}
                >
                  {isCompleted && !isCurrent ? '✓' : index + 1}
                </div>
                <div className={`text-xs mt-2 text-center whitespace-nowrap ${isCurrent ? 'font-semibold text-blue-600' : 'text-gray-600'}`}>
                  {step.title}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="text-center text-sm text-gray-500 mt-4">
        Step {state.currentStep + 1} of {WIZARD_STEPS.length}
      </div>
    </div>
  )
}
