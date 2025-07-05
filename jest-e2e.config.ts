import type { Config } from 'jest'

const config: Config = {
  displayName: 'e2e',
  testMatch: ['<rootDir>/tests/e2e/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  preset: 'jest-puppeteer',
  testEnvironment: 'jest-environment-puppeteer',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testTimeout: 30000,
}

export default config