import { useWizard } from '../../hooks/useWizardState'
import { WIZARD_STEPS } from '../../utils/constants'
import Button from '../common/Button'

export default function WizardNavigation({ onNext, canProceed = true }) {
  const { state, dispatch, actions } = useWizard()

  const isFirstStep = state.currentStep === 0
  const isLastStep = state.currentStep === WIZARD_STEPS.length - 1

  const handleNext = () => {
    if (onNext && onNext() === false) return
    dispatch({ type: actions.MARK_STEP_COMPLETED, payload: state.currentStep })
    dispatch({ type: actions.NEXT_STEP })
  }

  const goToReview = () => {
    dispatch({ type: actions.MARK_STEP_COMPLETED, payload: state.currentStep })
    dispatch({ type: actions.GOTO_STEP, payload: WIZARD_STEPS.length - 1 })
  }

  return (
    <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
      <div>
        {!isFirstStep && (
          <Button variant="secondary" onClick={() => dispatch({ type: actions.PREV_STEP })}>
            Previous
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        {!isLastStep && state.currentStep < WIZARD_STEPS.length - 2 && (
          <Button variant="outline" onClick={goToReview}>
            Skip to review
          </Button>
        )}
        {!isLastStep && (
          <Button variant="primary" onClick={handleNext} disabled={!canProceed}>
            Next
          </Button>
        )}
      </div>
    </div>
  )
}
