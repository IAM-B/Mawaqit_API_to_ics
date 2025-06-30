module.exports = {
  // Environment de test
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/js/unit/setup.js'],
  
  // Patterns de test - Mise à jour pour la nouvelle structure
  testMatch: [
    '<rootDir>/tests/js/unit/test_*.js',
    '<rootDir>/tests/js/integration/test_*.js',
    '<rootDir>/tests/js/e2e/*.spec.js'
  ],
  
  // Coverage - Collecte uniquement sur les fichiers testés
  collectCoverageFrom: [
    'app/static/js/pages/landing.js',
    'app/static/js/main.js',
    'app/static/js/components/*.js',
    'app/static/js/utils/*.js',
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