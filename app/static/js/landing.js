/**
 * Landing Page JavaScript
 * Handles smooth interactions and redirects
 */

// Handle smooth redirects
function handleSmoothRedirect(url) {
  const button = event.target.closest('.cta-button');
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
      handleSmoothRedirect(url);
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