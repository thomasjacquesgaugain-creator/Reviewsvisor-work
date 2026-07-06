// src/hooks/useSmartProgress.ts

import { useMemo } from 'react'
import type { SmartObjective, SmartProgress } from '@/types/smart'

// Per-objective gap stats, reused when aggregating across the full list.
function getObjectiveStats(obj: SmartObjective) {
  const current = obj.current_progress ?? obj.current_value
  const start = obj.current_value
  const target = obj.target_value

  const totalGap = Math.abs(start - target)
  const closedGap = Math.abs(start - current)
  // Signed version (not abs) lets us tell improvement from degradation when
  // combining objectives: current < start is progress (e.g. fewer negative
  // reviews), current > start is regression.
  const signedGap = start - current

  const now = new Date()
  const deadlineDate = new Date(obj.deadline)
  const daysRemaining = Math.ceil(
    (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )

  const isOverdue = daysRemaining < 0 && obj.status !== 'completed'

  return { totalGap, closedGap, signedGap, daysRemaining, isOverdue }
}

export function useSmartProgress(objectives: SmartObjective[]): SmartProgress {
  return useMemo(() => {
    const validObjectives = (objectives ?? []).filter(Boolean)

    if (validObjectives.length === 0) {
      return {
        percentage: 0,
        label: 'stable',
        daysRemaining: 0,
        isOverdue: false,
      }
    }

    const stats = validObjectives.map(getObjectiveStats)

    // Combined progress = total gap closed across every objective / total gap
    // that existed across every objective.
    const totalGap = stats.reduce((sum, s) => sum + s.totalGap, 0)
    const totalClosedGap = stats.reduce((sum, s) => sum + s.closedGap, 0)
    const percentage =
      totalGap === 0 ? 100 : Math.min(100, Math.round((totalClosedGap / totalGap) * 100))

    // Most urgent deadline across all objectives.
    const daysRemaining = Math.min(...stats.map((s) => s.daysRemaining))

    // Overdue if any objective is overdue.
    const isOverdue = stats.some((s) => s.isOverdue)

    // Overall trend: sum the signed gaps: positive means the group is net
    // improving, negative means net degrading, zero means no net movement.
    const totalSignedGap = stats.reduce((sum, s) => sum + s.signedGap, 0)
    const label =
      totalSignedGap > 0 ? 'improvement' : totalSignedGap < 0 ? 'degradation' : 'stable'

    return {
      percentage,
      label,
      daysRemaining,
      isOverdue,
    }
  }, [objectives])
}