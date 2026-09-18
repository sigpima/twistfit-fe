export type FeatureKey = 'colorTest' | 'outfit'

export type FeatureStepImage = {
  key: string
  src: string
  bg: string
}

export const FEATURE_STEP_IMAGES = {
  colorTest: [
    {
      key: 'quiz',
      src: '/home/feature-steps/color-test-quiz.jpg',
      bg: '/home/feature-steps/backgrounds/color-test-quiz-bg.jpg',
    },
    {
      key: 'result',
      src: '/home/feature-steps/color-test-result.jpg',
      bg: '/home/feature-steps/backgrounds/color-test-result-bg.jpg',
    },
    {
      key: 'ar',
      src: '/home/feature-steps/color-test-ar.jpg',
      bg: '/home/feature-steps/backgrounds/color-test-ar-bg.jpg',
    },
  ],
  outfit: [
    {
      key: 'chooseGarment',
      src: '/home/feature-steps/outfit-choose-garment.jpg',
      bg: '/home/feature-steps/backgrounds/outfit-choose-garment-bg.jpg',
    },
    {
      key: 'modelAndFace',
      src: '/home/feature-steps/outfit-model-and-face.jpg',
      bg: '/home/feature-steps/backgrounds/outfit-model-and-face-bg.jpg',
    },
    {
      key: 'viewResult',
      src: '/home/feature-steps/outfit-view-result.jpg',
      bg: '/home/feature-steps/backgrounds/outfit-view-result-bg.jpg',
    },
  ],
} as const satisfies Record<FeatureKey, FeatureStepImage[]>
