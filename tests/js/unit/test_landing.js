/**
 * Unit tests for landing.js
 * Tests interactions and redirects
 */

// Import functions to test
const { handleSmoothRedirect, initSmoothRedirects } = require('../../../app/static/js/landing.js');

describe('Landing.js - Redirect functions', () => {
  
  beforeEach(() => {
    // Setup DOM for tests
    document.body.innerHTML = `
      <button class="cta-button" href="/planner">Start</button>
      <a class="cta-button" href="/about">About</a>
      <div class="hero-title">Title</div>
      <div class="hero-subtitle">Subtitle</div>
    `;
    
    // Mock setTimeout
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('handleSmoothRedirect', () => {
    test('should add redirecting class to button', () => {
      const button = document.querySelector('.cta-button');
      const event = { target: button };
      
      handleSmoothRedirect('/test', event);
      
      expect(button.classList.contains('redirecting')).toBe(true);
    });

    test('should call setTimeout for redirect', () => {
      const button = document.querySelector('.cta-button');
      const event = { target: button };
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout');
      
      handleSmoothRedirect('/test', event);
      
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 300);
    });

    test('should not add class if no button', () => {
      const event = { target: document.createElement('div') };
      
      handleSmoothRedirect('/test', event);
      
      // Check that no class was added
      const buttons = document.querySelectorAll('.cta-button');
      buttons.forEach(button => {
        expect(button.classList.contains('redirecting')).toBe(false);
      });
    });
  });

  describe('initSmoothRedirects', () => {
    test('should add event listeners to CTA buttons', () => {
      const button = document.querySelector('.cta-button');
      const clickSpy = jest.spyOn(button, 'addEventListener');
      
      initSmoothRedirects();
      
      expect(clickSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should prevent default behavior on click', () => {
      const button = document.querySelector('.cta-button');
      const preventDefaultSpy = jest.fn();
      
      initSmoothRedirects();
      
      // Simulate click
      const clickEvent = new Event('click');
      clickEvent.preventDefault = preventDefaultSpy;
      button.dispatchEvent(clickEvent);
      
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    test('should handle multiple CTA buttons', () => {
      const buttons = document.querySelectorAll('.cta-button');
      expect(buttons).toHaveLength(2);
      
      initSmoothRedirects();
      
      buttons.forEach(button => {
        expect(button.getAttribute('href')).toBeTruthy();
      });
    });
  });
});

describe('Landing.js - Initialization', () => {
  
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="hero-title">Title</div>
      <div class="hero-subtitle">Subtitle</div>
      <button class="cta-button">Button</button>
    `;
  });

  test('should add animation delays to hero elements', () => {
    const heroElements = document.querySelectorAll('.hero-title, .hero-subtitle, .cta-button');
    
    // Simulate DOM loading
    document.dispatchEvent(new Event('DOMContentLoaded'));
    
    heroElements.forEach((element, index) => {
      const expectedDelay = `${index * 0.2}s`;
      expect(element.style.animationDelay).toBe(expectedDelay);
    });
  });
});

describe('Landing.js - Error cases', () => {
  
  test('should handle buttons without href attribute', () => {
    document.body.innerHTML = '<button class="cta-button">No href</button>';
    
    expect(() => {
      initSmoothRedirects();
    }).not.toThrow();
  });

  test('should handle missing hero elements', () => {
    document.body.innerHTML = '<div>No hero elements</div>';
    
    expect(() => {
      document.dispatchEvent(new Event('DOMContentLoaded'));
    }).not.toThrow();
  });
});

describe('Landing.js - Integration', () => {
  
  test('should work with complete workflow', () => {
    document.body.innerHTML = `
      <button class="cta-button" href="/planner">Start</button>
      <div class="hero-title">Title</div>
      <div class="hero-subtitle">Subtitle</div>
    `;
    
    jest.useFakeTimers();
    
    // Initialize
    initSmoothRedirects();
    
    // Simulate click
    const button = document.querySelector('.cta-button');
    button.dispatchEvent(new Event('click'));
    
    // Check that class is added
    expect(button.classList.contains('redirecting')).toBe(true);
    
    jest.useRealTimers();
  });
}); 