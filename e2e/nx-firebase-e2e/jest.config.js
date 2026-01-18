module.exports = {
  displayName: 'nx-firebase-e2e',
  preset: '../../jest.preset.js',
  globals: {},
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],

  // Global setup runs once before all test files
  globalSetup: '<rootDir>/jest.globalSetup.js',
  globalTeardown: '<rootDir>/jest.globalTeardown.js',

  // Custom sequencer ensures tests run in correct order
  testSequencer: '<rootDir>/jest.testSequencer.js',

  // Long timeout for e2e tests (3 minutes per test)
  testTimeout: 180000,

  // Match spec files in tests directory
  testMatch: ['<rootDir>/tests/**/*.spec.ts'],
}
