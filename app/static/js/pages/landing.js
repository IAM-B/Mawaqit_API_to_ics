/**
 * Landing Page JavaScript
 * Handles smooth interactions and redirects
 */

// Handle smooth redirects
function handleSmoothRedirect (url, event) {
  const button = event && event.target ? event.target.closest('.cta-button') : null;
  if (button) {
    button.classList.add('redirecting');

    setTimeout(() => {
      window.location.href = url;
    }, 300);
  }
}

// Add smooth redirect functionality to CTA buttons
function initSmoothRedirects () {
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
document.addEventListener('DOMContentLoaded', function () {
  console.log('Landing page loaded');

  // CTA buttons management
  const ctaButtons = document.querySelectorAll('.cta-button');

  ctaButtons.forEach(button => {
    button.addEventListener('click', function (e) {
      e.preventDefault();

      const action = this.getAttribute('data-action');

      // Add ripple effect
      createRippleEffect(this, e);

      // Handle different actions
      switch (action) {
      case 'start-planning':
        // Redirect to planner page
        window.location.href = '/planner';
        break;

      case 'scroll-to-how-it-works':
        // Scroll to "How it works" section
        const howItWorksSection = document.getElementById('how-it-works');
        if (howItWorksSection) {
          howItWorksSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
        break;

      default:
        console.log('Action non reconnue:', action);
      }
    });

    // Focus effect for accessibility
    button.addEventListener('focus', function () {
      this.classList.add('focused');
    });

    button.addEventListener('blur', function () {
      this.classList.remove('focused');
    });
  });

  // Function to create ripple effect
  function createRippleEffect (button, event) {
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
      z-index: 3;
    `;

    button.appendChild(ripple);

    setTimeout(() => {
      ripple.remove();
    }, 600);
  }

  // CSS animation for ripple effect
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // Animation for sections with Intersection Observer
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');

        // Animate child elements
        const cards = entry.target.querySelectorAll('.value-card, .benefit-card, .step-card, .stat-item');
        cards.forEach((card, index) => {
          setTimeout(() => {
            card.classList.add('animate-in');
          }, index * 100);
        });
      }
    });
  }, observerOptions);

  // Observe sections for animation
  const sections = document.querySelectorAll('section');
  sections.forEach(section => {
    observer.observe(section);
  });

  // Smooth scroll for internal links
  const internalLinks = document.querySelectorAll('a[href^="#"]');
  internalLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

// Functions to be exported for Jest
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleSmoothRedirect,
    initSmoothRedirects
  };
}
