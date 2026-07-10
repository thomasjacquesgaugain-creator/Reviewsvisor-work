// src/hooks/useSmartProgress.ts

import { useMemo } from 'react'
import type { SmartObjective, SmartProgress } from '@/types/smart'

// Per-objective gap stats, shared by both the single-objective and
// collective calculations below.
function getObjectiveStats(obj: SmartObjective) {
  const current = obj.current_progress ?? obj.current_value
  const start = obj.current_value
  const target = obj.target_value

  const totalGap = Math.abs(start - target)
  const closedGap = Math.abs(start - current)
  // Signed version (not abs) lets us tell improvement from degradation when
  // combining multiple objectives: current < start is progress (e.g. fewer
  // negative reviews), current > start is regression.
  const signedGap = start - current

  const now = new Date()
  const deadlineDate = new Date(obj.deadline)
  const daysRemaining = Math.ceil(
    (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  const isOverdue = daysRemaining < 0 && obj.status !== 'completed'

  return { totalGap, closedGap, signedGap, daysRemaining, isOverdue }
}

// Call with a single active objective to get that objective's own progress,
// exactly like before.
export function useSmartProgress(obj: SmartObjective): SmartProgress
// Call with the full list of objectives to get the collective progress
// across all of them.
export function useSmartProgress(objectives: SmartObjective[]): SmartProgress
export function useSmartProgress(
  input: SmartObjective | SmartObjective[]
): SmartProgress {
  return useMemo(() => {
    const objectives = Array.isArray(input) ? input.filter(Boolean) : input ? [input] : []

    if (objectives.length === 0) {
      return {
        percentage: 0,
        label: 'stable',
        daysRemaining: 0,
        isOverdue: false,
      }
    }

    const stats = objectives.map(getObjectiveStats)

    // Progress = how much of the total gap has been closed. For a single
    // objective this is identical to the original single-objective formula;
    // for multiple objectives the gaps are combined first.
    const totalGap = stats.reduce((sum, s) => sum + s.totalGap, 0)
    const totalClosedGap = stats.reduce((sum, s) => sum + s.closedGap, 0)
    const percentage =
      totalGap === 0 ? 100 : Math.min(100, Math.round((totalClosedGap / totalGap) * 100))

    // Most urgent deadline across whichever objective(s) were passed in.
    const daysRemaining = Math.min(...stats.map((s) => s.daysRemaining))

    // Overdue if any objective in the set is overdue.
    const isOverdue = stats.some((s) => s.isOverdue)

    // Trend label: sum the signed gaps. For a single objective this reduces
    // to the same current-vs-start comparison as before; for multiple
    // objectives it reflects the net direction across all of them.
    const totalSignedGap = stats.reduce((sum, s) => sum + s.signedGap, 0)
    const label =
      totalSignedGap > 0 ? 'improvement' : totalSignedGap < 0 ? 'degradation' : 'stable'

    return {
      percentage,
      label,
      daysRemaining,
      isOverdue,
    }
  }, [input])
}