import type { ExerciseCatalogEntry, ExerciseId } from '@/lib/types/domain'

export const exerciseCatalog: ExerciseCatalogEntry[] = [
  {
    id: 'push-ups',
    name: 'Pushups',
    shortLabel: 'Pushups',
    unitLabel: 'reps',
    description:
      'Portrait, front-camera self-challenge that tracks reps and elapsed time.',
    isEnabled: true,
    orientation: 'portrait',
    preferredCamera: 'front',
  },
  {
    id: 'pull-ups',
    name: 'Pullups',
    shortLabel: 'Pullups',
    unitLabel: 'reps',
    description: 'Future challenge mode for pullup sessions.',
    isEnabled: false,
    orientation: 'either',
    preferredCamera: 'either',
  },
  {
    id: 'burpees',
    name: 'Burpees',
    shortLabel: 'Burpees',
    unitLabel: 'reps',
    description: 'Future challenge mode for full-body burpee sessions.',
    isEnabled: false,
    orientation: 'either',
    preferredCamera: 'either',
  },
  {
    id: 'squats',
    name: 'Squats',
    shortLabel: 'Squats',
    unitLabel: 'reps',
    description: 'Future challenge mode for squat sessions.',
    isEnabled: false,
    orientation: 'either',
    preferredCamera: 'either',
  },
  {
    id: 'crunches',
    name: 'Crunches',
    shortLabel: 'Crunches',
    unitLabel: 'reps',
    description: 'Future challenge mode for core sessions.',
    isEnabled: false,
    orientation: 'either',
    preferredCamera: 'either',
  },
  {
    id: 'lunges',
    name: 'Lunges',
    shortLabel: 'Lunges',
    unitLabel: 'reps',
    description: 'Future challenge mode for lunge sessions.',
    isEnabled: false,
    orientation: 'either',
    preferredCamera: 'either',
  },
]

export function getExerciseById(exerciseId: ExerciseId): ExerciseCatalogEntry {
  const exercise = exerciseCatalog.find((entry) => entry.id === exerciseId)

  if (!exercise) {
    throw new Error(`Unknown exercise id: ${exerciseId}`)
  }

  return exercise
}

export const enabledExercises = exerciseCatalog.filter((exercise) => exercise.isEnabled)
