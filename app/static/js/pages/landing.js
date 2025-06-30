/**
 * Landing Page JavaScript
 * Handles smooth interactions and redirects
 */

// Handle smooth redirects
function handleSmoothRedirect(url, event) {
  const button = event && event.target ? event.target.closest('.cta-button') : null;
  if (button) {
    button.classList.add('redirecting');
    
    setTimeout(() => {
      window.location.href = url;
    }, 300);
  }
}

// Add smooth redirect functionality to CTA buttons
function initSmoothRedirects() {
  const ctaButtons = document.querySelectorAll('.cta-button[href]');
  
  ctaButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const url = button.getAttribute('href');
      handleSmoothRedirect(url, e);
    });
  });
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initSmoothRedirects();
  
  // Add loading animation to hero elements
  const heroElements = document.querySelectorAll('.hero-title, .hero-subtitle, .cta-button');
  heroElements.forEach((element, index) => {
    element.style.animationDelay = `${index * 0.2}s`;
  });
});

// Functions to be exported for Jest
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleSmoothRedirect,
    initSmoothRedirects
  };
}