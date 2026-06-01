// src/hooks/useSmartProgress.ts

import { useMemo } from 'react'
import type { SmartObjective,SmartProgress } from '@/types/smart'  

export function useSmartProgress(obj: SmartObjective): SmartProgress {
  return useMemo(() => {


    if (!obj) {
      return {
      percentage:0,
      label:"stable",
      daysRemaining:0,
      isOverdue: false
      };
    }




    const current = obj.current_progress ?? obj.current_value
    const start = obj.current_value
    const target = obj.target_value

    // Progress = how much we've closed the gap
    const totalGap = Math.abs(start - target)
    const closedGap = Math.abs(start - current)
    const percentage = totalGap === 0 
      ? 100 
      : Math.min(100, Math.round((closedGap / totalGap) * 100))

    const now = new Date()
    const deadlineDate = new Date(obj.deadline)
    const daysRemaining = Math.ceil(
      (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    // Determine trend label
    const label = current < start 
      ? 'improvement'   // negative reviews going down = good
      : current > start 
      ? 'degradation' 
      : 'stable'

    return {
      percentage,
      label,
      daysRemaining,
      isOverdue: daysRemaining < 0 && obj.status !== 'completed'
    }
  }, [obj])
}