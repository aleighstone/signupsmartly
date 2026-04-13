import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    // Resolve @/ path aliases to the project root
    '^@/(.*)$': '<rootDir>/$1',
  },
  // Only look for tests in __tests__ directories or *.test.ts files
  testMatch: ['**/__tests__/**/*.test.ts', '**/*.test.ts'],
  // Don't try to transform node_modules
  transformIgnorePatterns: ['/node_modules/'],
};

export default config;
