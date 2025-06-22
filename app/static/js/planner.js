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
    this.restoreFormData();
  }

  /**
   * Setup form submission handling with loading states
   */
  setupFormHandling() {
    const form = document.querySelector('form');
    const submitBtn = document.querySelector('.btn-submit');
    
    if (form && submitBtn) {
      // Save form data on any change
      form.addEventListener('change', () => {
        this.saveFormData();
      });
      
      form.addEventListener('input', () => {
        this.saveFormData();
      });
      
      form.addEventListener('submit', () => {
        // Save form data before submission
        this.saveFormData();
        
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
   * Save form data to sessionStorage
   */
  saveFormData() {
    const formData = {
      padding_before: document.querySelector('input[name="padding_before"]')?.value || '10',
      padding_after: document.querySelector('input[name="padding_after"]')?.value || '35',
      scope: document.querySelector('select[name="scope"]')?.value || 'today'
    };
    
    sessionStorage.setItem('plannerFormData', JSON.stringify(formData));
  }

  /**
   * Restore form data from sessionStorage
   */
  restoreFormData() {
    const savedData = sessionStorage.getItem('plannerFormData');
    if (!savedData) return;
    
    try {
      const formData = JSON.parse(savedData);
      
      // Restore form values
      const paddingBefore = document.querySelector('input[name="padding_before"]');
      const paddingAfter = document.querySelector('input[name="padding_after"]');
      const scope = document.querySelector('select[name="scope"]');
      
      if (paddingBefore && formData.padding_before) {
        paddingBefore.value = formData.padding_before;
      }
      if (paddingAfter && formData.padding_after) {
        paddingAfter.value = formData.padding_after;
      }
      if (scope && formData.scope) {
        scope.value = formData.scope;
      }
    } catch (error) {
      console.error('Error restoring form data:', error);
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