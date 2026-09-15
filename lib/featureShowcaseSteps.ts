export type FeatureKey = 'colorTest' | 'outfit' | 'community'

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
    { key: 'digitizeCloset', src: '/home/feature-steps/outfit-digitize-closet.jpg' },
    { key: 'setPreferences', src: '/home/feature-steps/outfit-set-preferences.jpg' },
    { key: 'chooseModel', src: '/home/feature-steps/outfit-choose-model.jpg' },
    { key: 'getOutfit', src: '/home/feature-steps/outfit-get-outfit.jpg' },
  ],
  community: [
    { key: 'share', src: '/home/feature-steps/community-share.jpg' },
    { key: 'connect', src: '/home/feature-steps/community-connect.jpg' },
    { key: 'save', src: '/home/feature-steps/community-save.jpg' },
  ],
} as const satisfies Record<FeatureKey, FeatureStepImage[]>
