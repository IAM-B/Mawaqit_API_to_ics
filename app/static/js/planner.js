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
   * Setup form submission handling with AJAX
   */
  setupFormHandling() {
    const form = document.getElementById('plannerForm');
    const submitBtn = document.querySelector('.btn-submit');
    
    if (form && submitBtn) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission
        
        // Show loading state
        this.showLoadingState(submitBtn);
        
        try {
          // Get form data
          const formData = new FormData(form);
          
          // Send AJAX request
          const response = await fetch('/api/generate_planning', {
            method: 'POST',
            body: formData
          });
          
          const result = await response.json();
          
          if (result.success) {
            // Update the page with new data
            this.updatePageWithPlanningData(result.data);
            this.showSuccessMessage('Planning généré avec succès !');
          } else {
            throw new Error(result.error || 'Erreur lors de la génération');
          }
          
        } catch (error) {
          console.error('Error generating planning:', error);
          this.showErrorMessage(error.message);
        } finally {
          // Hide loading state
          this.hideLoadingState(submitBtn);
        }
      });
    }
  }

  /**
   * Show loading state
   */
  showLoadingState(submitBtn) {
    submitBtn.classList.add('loading');
    submitBtn.textContent = '🔄 Génération en cours...';
    submitBtn.disabled = true;
  }

  /**
   * Hide loading state
   */
  hideLoadingState(submitBtn) {
    submitBtn.classList.remove('loading');
    submitBtn.textContent = '📥 Générer planning';
    submitBtn.disabled = false;
  }

  /**
   * Show success message
   */
  showSuccessMessage(message) {
    this.showMessage(message, 'success');
  }

  /**
   * Show error message
   */
  showErrorMessage(message) {
    this.showMessage(message, 'error');
  }

  /**
   * Show message
   */
  showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      background: ${type === 'success' ? '#48bb78' : '#f56565'};
      animation: slideInRight 0.3s ease;
    `;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
      messageDiv.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        document.body.removeChild(messageDiv);
      }, 300);
    }, 3000);
  }

  /**
   * Update page with planning data
   */
  updatePageWithPlanningData(data) {
    // Show the planning sections first
    this.showPlanningSections();
    
    // Update mosque information
    this.updateMosqueInfo(data);
    
    // Update configuration summary
    this.updateConfigSummary(data);
    
    // Generate download links
    this.generateDownloadLinks(data);
    
    // Initialize clock if segments are available (after sections are shown)
    if (data.segments && data.segments.length > 0) {
      setTimeout(() => {
        this.initializeClock(data);
      }, 100);
    }
  }

  /**
   * Update mosque information
   */
  updateMosqueInfo(data) {
    const mosqueNameEl = document.querySelector('.mosque-details h4');
    const mosqueAddressEl = document.querySelector('.mosque-details .address');
    const mapLinksEl = document.querySelector('.map-links');
    const mapContainer = document.getElementById('mosque-location-map');
    
    if (mosqueNameEl) mosqueNameEl.textContent = data.mosque_name;
    if (mosqueAddressEl) mosqueAddressEl.textContent = data.mosque_address;
    
    // Initialize compact map if coordinates are available
    if (mapContainer && data.mosque_lat && data.mosque_lng) {
      mapContainer.dataset.lat = data.mosque_lat;
      mapContainer.dataset.lng = data.mosque_lng;
      mapContainer.dataset.name = data.mosque_name;
      
      // Initialize the compact map
      if (window.initializeCompactMap) {
        window.initializeCompactMap(
          'mosque-location-map',
          parseFloat(data.mosque_lat),
          parseFloat(data.mosque_lng),
          data.mosque_name
        );
      }
    }
    
    if (mapLinksEl) {
      mapLinksEl.innerHTML = `
        <a href="${data.google_maps_url}" target="_blank" class="map-link">
          🗺️ Google Maps
        </a>
        <a href="${data.osm_url}" target="_blank" class="map-link">
          🗺️ OpenStreetMap
        </a>
        <a href="${data.mawaqit_url}" target="_blank" class="map-link">
          🌐 Mawaqit.net
        </a>
      `;
    }
  }

  /**
   * Update configuration summary
   */
  updateConfigSummary(data) {
    const configItems = document.querySelectorAll('.config-item');
    
    configItems.forEach(item => {
      const label = item.querySelector('.config-label');
      const value = item.querySelector('.config-value');
      
      if (label && value) {
        const labelText = label.textContent;
        
        if (labelText.includes('Période')) {
          value.textContent = `${data.start_date} → ${data.end_date}`;
        } else if (labelText.includes('Délai avant')) {
          value.textContent = `${data.padding_before} min`;
        } else if (labelText.includes('Délai après')) {
          value.textContent = `${data.padding_after} min`;
        } else if (labelText.includes('Fuseau horaire')) {
          value.textContent = data.timezone_str;
        } else if (labelText.includes('Portée')) {
          value.textContent = data.scope_display;
        }
      }
    });
  }

  /**
   * Generate download links
   */
  generateDownloadLinks(data) {
    const downloadGrid = document.querySelector('.download-grid');
    
    if (downloadGrid) {
      let linksHTML = '';
      
      if (data.ics_path) {
        linksHTML += `
          <a href="/static/ics/${data.ics_path}" download class="download-card primary">
            <span class="download-icon">📅</span>
            <span class="download-title">Horaires de prière</span>
            <span class="download-format">.ics</span>
          </a>
        `;
      }
      
      if (data.available_slots_path) {
        linksHTML += `
          <a href="/static/ics/${data.available_slots_path}" download class="download-card secondary">
            <span class="download-icon">🕒</span>
            <span class="download-title">Créneaux synchronisés</span>
            <span class="download-format">.ics</span>
          </a>
        `;
      }
      
      if (data.empty_slots_path) {
        linksHTML += `
          <a href="/static/ics/${data.empty_slots_path}" download class="download-card secondary">
            <span class="download-icon">📋</span>
            <span class="download-title">Créneaux disponibles</span>
            <span class="download-format">.ics</span>
          </a>
        `;
      }
      
      linksHTML += `
        <a href="/edit_slot" class="download-card edit">
          <span class="download-icon">✏️</span>
          <span class="download-title">Modifier manuellement</span>
          <span class="download-format">Créneaux</span>
        </a>
      `;
      
      downloadGrid.innerHTML = linksHTML;
    }
  }

  /**
   * Initialize clock with new data
   */
  initializeClock(data) {
    // Create clock config element
    const clockConfig = document.createElement('div');
    clockConfig.id = 'clockConfig';
    clockConfig.dataset.segments = JSON.stringify(data.segments);
    clockConfig.dataset.scope = data.scope;
    clockConfig.style.display = 'none';
    document.body.appendChild(clockConfig);
    
    // Initialize clock using the correct method
    if (window.Clock) {
      // Create a new Clock instance
      const clock = new Clock('clockContent', data.segments, data.scope);
      
      // Setup navigation
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');
      
      if (prevBtn) {
        prevBtn.addEventListener('click', () => clock.navigate(-1));
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', () => clock.navigate(1));
      }
      
      // Trigger planning generation animation after a short delay
      setTimeout(() => {
        Clock.handlePlanningGeneration();
      }, 200);
    }
  }

  /**
   * Show planning sections
   */
  showPlanningSections() {
    // Create sections if they don't exist
    this.createPlanningSections();
    
    const sections = [
      '.quick-actions',
      '.clock-section',
      '.available-slots',
      '.summary-section'
    ];
    
    sections.forEach(selector => {
      const section = document.querySelector(selector);
      if (section) {
        section.style.display = 'block';
        section.style.opacity = '1';
        section.style.visibility = 'visible';
        console.log(`Section ${selector} displayed`);
      } else {
        console.warn(`Section ${selector} not found`);
      }
    });
    
    // Hide no-data section if it exists
    const noDataSection = document.querySelector('.no-data');
    if (noDataSection) {
      noDataSection.style.display = 'none';
    }
    
    console.log('All planning sections should now be visible');
  }

  /**
   * Create planning sections if they don't exist
   */
  createPlanningSections() {
    const configSection = document.querySelector('.config-section');
    if (!configSection) return;

    // Create quick actions section
    if (!document.querySelector('.quick-actions')) {
      const quickActions = document.createElement('section');
      quickActions.className = 'quick-actions';
      quickActions.innerHTML = `
        <h2>📥 Téléchargements rapides</h2>
        <div class="download-grid"></div>
      `;
      configSection.parentNode.insertBefore(quickActions, configSection.nextSibling);
    }

    // Create clock section
    if (!document.querySelector('.clock-section')) {
      const clockSection = document.createElement('section');
      clockSection.className = 'clock-section';
      clockSection.innerHTML = `
        <h2>🕒 Horloge des prières</h2>
        <div class="clock-navigation">
          <button id="prevBtn" class="clock-nav-btn">←</button>
          <span id="currentDate" class="current-date"></span>
          <button id="nextBtn" class="clock-nav-btn">→</button>
        </div>
        <div id="clockContent" class="clock-container">
          <!-- Clock will be rendered here -->
        </div>
      `;
      configSection.parentNode.insertBefore(clockSection, configSection.nextSibling);
    }

    // Create available slots section
    if (!document.querySelector('.available-slots')) {
      const availableSlots = document.createElement('section');
      availableSlots.className = 'available-slots';
      availableSlots.innerHTML = `
        <h2>🕒 Créneaux disponibles</h2>
        <div id="availableSlotsList" class="slots-list">
          <!-- Slots will be displayed here dynamically -->
        </div>
      `;
      configSection.parentNode.insertBefore(availableSlots, configSection.nextSibling);
    }

    // Create summary section
    if (!document.querySelector('.summary-section')) {
      const summarySection = document.createElement('section');
      summarySection.className = 'summary-section';
      summarySection.innerHTML = `
        <div class="summary-grid">
          <!-- Mosque information -->
          <div class="summary-card mosque-info">
            <h3>🕌 Mosquée sélectionnée</h3>
            <div class="mosque-details">
              <h4></h4>
              <p class="address"></p>
              
              <!-- Compact map container -->
              <div id="mosque-location-map" class="compact-map"></div>
              
              <!-- Map links -->
              <div class="map-links"></div>
            </div>
          </div>

          <!-- Configuration summary -->
          <div class="summary-card config-info">
            <h3>⚙️ Configuration</h3>
            <div class="config-details">
              <div class="config-item">
                <span class="config-label">📅 Période :</span>
                <span class="config-value"></span>
              </div>
              <div class="config-item">
                <span class="config-label">⏰ Délai avant :</span>
                <span class="config-value"></span>
              </div>
              <div class="config-item">
                <span class="config-label">⏰ Délai après :</span>
                <span class="config-value"></span>
              </div>
              <div class="config-item">
                <span class="config-label">🌍 Fuseau horaire :</span>
                <span class="config-value"></span>
              </div>
              <div class="config-item">
                <span class="config-label">📊 Portée :</span>
                <span class="config-value"></span>
              </div>
            </div>
          </div>
        </div>
      `;
      configSection.parentNode.insertBefore(summarySection, configSection.nextSibling);
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