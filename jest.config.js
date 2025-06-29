module.exports = {
  // Environment de test
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/js/setup.js'],
  
  // Patterns de test
  testMatch: [
    '<rootDir>/tests/js/**/*.test.js',
    '<rootDir>/tests/js/**/*.spec.js'
  ],
  
  // Coverage
  collectCoverageFrom: [
    'app/static/js/**/*.js',
    '!app/static/js/**/*.min.js',
    '!**/node_modules/**'
  ],
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Coverage directory
  coverageDirectory: 'htmlcov/js',
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/static/js/$1'
  },
  
  // Transform files
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Reset modules between tests
  resetModules: true
}; 