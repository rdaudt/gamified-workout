import { formatDuration } from '@/lib/challenge/pushup'

export const sponsorBusinessName = 'NODoubt Fitness'
export const sponsorCoachName = 'Coach Gabe'
export const sponsorLogoPath = '/sponsor-logo.png'
export const sponsorChallengeTitle = 'Pushup Challenge'
export const sponsorCardFilename = 'nodoubt-pushup-challenge-card.png'
export const sponsorVideoFilenameBase = 'nodoubt-pushup-session'

export function buildSponsorShareText(reps: number, durationSeconds: number) {
  return `${sponsorCoachName}'s ${sponsorChallengeTitle}: ${reps} pushups in ${formatDuration(durationSeconds)} at ${sponsorBusinessName}.`
}
