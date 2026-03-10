import { CalorieCalculatorClient } from '@/app/library/calorie-calculator/CalorieCalculatorClient'

export const metadata = {
  title: 'Calorie & Macro Calculator | CULTR Health',
  description: 'Advanced calorie and macronutrient calculator with multiple BMR formulas, activity tracking, and goal-based adjustments.',
}

export default function PublicCalorieCalculatorPage() {
  return <CalorieCalculatorClient backHref="/tools" />
}
