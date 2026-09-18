export type FeatureKey = 'colorTest' | 'outfit'

export type FeatureStepImage = {
  key: string
  src: string
}

export const FEATURE_STEP_IMAGES = {
  colorTest: [
    { key: 'quiz', src: '/home/feature-steps/color-test-quiz.jpg' },
    { key: 'result', src: '/home/feature-steps/color-test-result.jpg' },
    { key: 'ar', src: '/home/feature-steps/color-test-ar.jpg' },
  ],
  outfit: [
    { key: 'chooseGarment', src: '/home/feature-steps/outfit-choose-garment.jpg' },
    { key: 'modelAndFace', src: '/home/feature-steps/outfit-model-and-face.jpg' },
    { key: 'viewResult', src: '/home/feature-steps/outfit-view-result.jpg' },
  ],
} as const satisfies Record<FeatureKey, FeatureStepImage[]>
