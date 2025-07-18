module.exports = {
  // Environment de test
  testEnvironment: 'jsdom',
  
  // Patterns de test - Mise à jour pour la nouvelle structure
  testMatch: [
    '<rootDir>/tests/js/**/*.js',
    '!<rootDir>/tests/e2e/**/*.js' // Exclure les tests Playwright
  ],
  
  // Exclure les fichiers de setup des tests
  testPathIgnorePatterns: [
    '<rootDir>/tests/js/unit/jest.setup.js'
  ],
  
  // Coverage - Collecte uniquement sur les fichiers testés
  collectCoverageFrom: [
    'app/static/js/**/*.js',
    '!app/static/js/**/*.min.js',
    '!**/node_modules/**'
  ],
  
  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Coverage directory
  coverageDirectory: 'coverage/js',
  
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