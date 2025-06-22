/**
 * Planner page functionality
 * Handles form submission, animations, and clock initialization
 */

class PlannerPage {
  constructor() {
    this.init();
  }

  /**
   * Initialize planner page functionality
   */
  init() {
    this.setupFormHandling();
    this.setupPlanningAnimation();
  }

  /**
   * Setup form submission handling with loading states
   */
  setupFormHandling() {
    const form = document.querySelector('form');
    const submitBtn = document.querySelector('.btn-submit');
    
    if (form && submitBtn) {
      form.addEventListener('submit', () => {
        // Add loading state
        submitBtn.classList.add('loading');
        submitBtn.textContent = '🔄 Génération en cours...';
        
        // Remove loading state after form submission
        setTimeout(() => {
          submitBtn.classList.remove('loading');
          submitBtn.textContent = '📥 Générer planning';
        }, 2000);
      });
    }
  }

  /**
   * Setup planning generation animations
   */
  setupPlanningAnimation() {
    // Check if planning was just generated
    const hasPlanningData = document.querySelector('.quick-actions') !== null;
    const hasClockConfig = document.getElementById('clockConfig') !== null;
    
    console.log('Planning animation setup:', {
      hasPlanningData,
      hasClockConfig,
      quickActions: document.querySelector('.quick-actions'),
      clockConfig: document.getElementById('clockConfig')
    });
    
    if (hasPlanningData && hasClockConfig) {
      console.log('Triggering planning generation animation');
      // Add a small delay to ensure DOM is fully loaded
      setTimeout(() => {
        Clock.handlePlanningGeneration();
      }, 100);
    } else {
      console.log('No planning data found, skipping animation');
    }
  }

  /**
   * Initialize clock with data from server
   */
  static initClock() {
    const clockConfig = document.getElementById('clockConfig');
    if (!clockConfig) return;

    try {
      const clockData = JSON.parse(clockConfig.dataset.segments);
      const clockScope = clockConfig.dataset.scope;

      // Initialize clock
      const clock = new Clock('clockContent', clockData, clockScope);

      // Setup navigation
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');
      
      if (prevBtn) {
        prevBtn.addEventListener('click', () => clock.navigate(-1));
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', () => clock.navigate(1));
      }
    } catch (error) {
      console.error('Error initializing clock:', error);
    }
  }
}

// Initialize planner page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PlannerPage();
  
  // Initialize clock if segments are available
  if (document.getElementById('clockConfig')) {
    PlannerPage.initClock();
  }
}); 