// XP necessário para cada nível (progressão quadrática suave)
const LEVEL_THRESHOLDS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200]

export function calculateLevel(totalXP: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export function xpForCurrentLevel(totalXP: number): number {
  const level = calculateLevel(totalXP)
  return totalXP - (LEVEL_THRESHOLDS[level - 1] ?? 0)
}

export function xpToNextLevel(totalXP: number): number {
  const level = calculateLevel(totalXP)
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0
  return nextThreshold - currentThreshold
}

export function levelProgressPercent(totalXP: number): number {
  const current = xpForCurrentLevel(totalXP)
  const total = xpToNextLevel(totalXP)
  return Math.round((current / total) * 100)
}
