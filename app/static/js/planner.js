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
    // Store mosque and configuration data globally for navigation
    window.currentMosqueId = data.masjid_id;
    window.currentPaddingBefore = data.padding_before;
    window.currentPaddingAfter = data.padding_after;
    window.currentMonth = new Date().getMonth();
    window.currentYear = new Date().getFullYear();
    
    // Show the planning sections first
    this.showPlanningSections();
    
    // Update mosque information
    this.updateMosqueInfo(data);
    
    // Update configuration summary
    this.updateConfigSummary(data);
    
    // Generate download links
    this.generateDownloadLinks(data);
    
    // Initialize calendar views if segments are available
    if (data.segments && data.segments.length > 0) {
      setTimeout(() => {
        // Initialize calendar views
        if (window.calendarViewsManager) {
          window.calendarViewsManager.initializeViews(data.segments, data.scope);
        }
        
        // Initialize clock
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
   * Generate download links for ICS files
   */
  generateDownloadLinks(data) {
    const downloadGrid = document.querySelector('.download-grid');
    
    if (downloadGrid) {
      let linksHTML = '';
      
      // Original scope links (if available)
      if (data.ics_path) {
        linksHTML += `
          <a href="/static/ics/${data.ics_path}" download class="download-card primary">
            <span class="download-icon">📅</span>
            <span class="download-title">Horaires de prière (${data.scope})</span>
            <span class="download-format">.ics</span>
          </a>
        `;
      }
      
      if (data.available_slots_path) {
        linksHTML += `
          <a href="/static/ics/${data.available_slots_path}" download class="download-card secondary">
            <span class="download-icon">🕒</span>
            <span class="download-title">Créneaux synchronisés (${data.scope})</span>
            <span class="download-format">.ics</span>
          </a>
        `;
      }
      
      if (data.empty_slots_path) {
        linksHTML += `
          <a href="/static/ics/${data.empty_slots_path}" download class="download-card secondary">
            <span class="download-icon">📋</span>
            <span class="download-title">Créneaux disponibles (${data.scope})</span>
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
    
      // Add scope-specific download buttons
      linksHTML += `
        <div class="scope-downloads">
          <h3>📥 Téléchargements par période</h3>
          <div class="scope-buttons">
            <button class="scope-download-btn today" data-scope="today">
              <span class="scope-icon">📅</span>
              <span class="scope-title">Aujourd'hui</span>
            </button>
            <button class="scope-download-btn month" data-scope="month">
              <span class="scope-icon">📅</span>
              <span class="scope-title">Ce mois</span>
            </button>
          </div>
        </div>
      `;
      
      downloadGrid.innerHTML = linksHTML;
      
      // Setup scope download buttons
      this.setupScopeDownloadButtons(data);
    }
  }

  /**
   * Setup scope download buttons
   */
  setupScopeDownloadButtons(data) {
    const scopeButtons = document.querySelectorAll('.scope-download-btn');
    
    scopeButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const scope = button.dataset.scope;
        const mosqueId = data.masjid_id;
        const paddingBefore = data.padding_before || 10;
        const paddingAfter = data.padding_after || 35;
        
        // Show loading state
        button.classList.add('loading');
        button.disabled = true;
        
        try {
          // Generate ICS for the selected scope
          const response = await fetch('/api/generate_ics', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              masjid_id: mosqueId,
              scope: scope,
              padding_before: paddingBefore,
              padding_after: paddingAfter
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            // Create download link
            const link = document.createElement('a');
            link.href = `/static/ics/${result.ics_path}`;
            link.download = `prayer_times_${scope}.ics`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.showSuccessMessage(`Fichier ICS pour ${scope} téléchargé !`);
          } else {
            throw new Error(result.error || 'Erreur lors de la génération');
          }
          
        } catch (error) {
          console.error('Error generating ICS:', error);
          this.showErrorMessage(error.message);
        } finally {
          // Hide loading state
          button.classList.remove('loading');
          button.disabled = false;
        }
      });
    });
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
      // For year scope, extract current month's data for clock display
      let clockSegments = data.segments;
      if (data.scope === 'year' && data.segments && data.segments.length > 0) {
        const currentMonth = new Date().getMonth();
        if (data.segments[currentMonth] && data.segments[currentMonth].days) {
          clockSegments = data.segments[currentMonth].days;
        }
      }
      
      // Create a new Clock instance with the appropriate segments
      const clock = new Clock('clockContent', clockSegments, 'month'); // Use 'month' scope for display
      
      // Store clock instance globally for access from other functions
      window.clockInstance = clock;
      
      // Set the clock to show today's view by default
      if (clockSegments && clockSegments.length > 0) {
        // Get current day of month (1-based)
        const currentDay = new Date().getDate();
        // Convert to 0-based index, but ensure it's within bounds
        const todayIndex = Math.min(currentDay - 1, clockSegments.length - 1);
        
        clock.currentIndex = todayIndex;
        clock.updateClock();
        
        // Update calendar selection to match today
        this.updateCalendarSelection(todayIndex);
      }
      
      // Pass clock instance to calendar views manager for synchronization
      if (window.calendarViewsManager) {
        window.calendarViewsManager.setClockInstance(clock);
      }
      
      // Initialize the clock calendar for month navigation
      this.initializeClockCalendar(data.segments, 'year');
      
      // Setup navigation
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');
      
      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          clock.navigate(-1);
          this.updateCalendarSelection(clock.currentIndex);
        });
      }
      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          clock.navigate(1);
          this.updateCalendarSelection(clock.currentIndex);
        });
      }
      
      // Trigger planning generation animation after a short delay
      setTimeout(() => {
        Clock.handlePlanningGeneration();
      }, 200);
    }
  }

  /**
   * Initialize clock calendar for month navigation
   */
  initializeClockCalendar(segments, scope) {
    if (scope !== 'year') return;
    
    const container = document.getElementById('clockCalendarDays');
    const titleElement = document.getElementById('currentMonthTitle');
    
    if (!container || !titleElement) return;

    // Get current month and year
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Initialize global variables
    window.currentMonth = currentMonth;
    window.currentYear = currentYear;
    
    // Update title
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    titleElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;

    // Clear container
    container.innerHTML = '';

    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1); // Start from Monday

    // Generate calendar days
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayElement = this.createClockCalendarDay(currentDate, segments, currentMonth, currentYear);
      container.appendChild(dayElement);
    }
    
    // Setup month navigation
    this.setupClockCalendarNavigation(segments, currentMonth, currentYear);
  }

  /**
   * Create a day element for the clock calendar
   */
  createClockCalendarDay(date, segments, currentMonth, currentYear) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    
    dayElement.appendChild(dayNumber);

    // Check if it's current month
    if (date.getMonth() !== currentMonth) {
      dayElement.classList.add('other-month');
    }

    // Check if it's today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      dayElement.classList.add('today');
    }

    // Check if it's selected day (default to today)
    if (date.getDate() === today.getDate() && date.getMonth() === currentMonth && date.getFullYear() === today.getFullYear()) {
      dayElement.classList.add('selected');
    }

    // Check if day has slots data
    if (segments && segments.length > 0) {
      // For year scope, segments contain monthly data
      // Extract the current month's data
      let monthSegments = [];
      if (segments[currentMonth] && segments[currentMonth].days) {
        monthSegments = segments[currentMonth].days;
      } else {
        // If segments is already daily data (month scope)
        monthSegments = segments;
      }
      
      const dayIndex = date.getDate() - 1;
      if (dayIndex >= 0 && dayIndex < monthSegments.length) {
        const dayData = monthSegments[dayIndex];
        if (dayData && dayData.slots && dayData.slots.length > 0) {
          dayElement.classList.add('has-slots');
        }
      }
    }

    // Add click event to select day and update clock
    dayElement.addEventListener('click', () => {
      if (date.getMonth() === currentMonth) {
        this.selectClockCalendarDay(date.getDate(), segments);
      }
    });

    return dayElement;
  }

  /**
   * Select a day in the clock calendar and update clock
   */
  selectClockCalendarDay(day, segments) {
    const dayIndex = day - 1;
    
    // Update calendar selection
    this.updateCalendarSelection(dayIndex);

    // Update clock if available
    if (window.Clock && window.clockInstance) {
      // For year scope, extract current month's data
      let monthSegments = [];
      if (segments && segments.length > 0) {
        const currentMonth = window.currentMonth || new Date().getMonth();
        if (segments[currentMonth] && segments[currentMonth].days) {
          monthSegments = segments[currentMonth].days;
        } else {
          // If segments is already daily data (month scope)
          monthSegments = segments;
        }
      }
      
      if (dayIndex >= 0 && dayIndex < monthSegments.length) {
        window.clockInstance.currentIndex = dayIndex;
        window.clockInstance.updateClock();
      }
    }
  }

  /**
   * Setup navigation for clock calendar
   */
  setupClockCalendarNavigation(segments, currentMonth, currentYear) {
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    
    // Store initial values globally
    window.currentMonth = currentMonth;
    window.currentYear = currentYear;
    
    if (prevMonthBtn) {
      prevMonthBtn.addEventListener('click', () => {
        // Use global values instead of local parameters
        this.navigateClockCalendarMonth(-1, segments, window.currentMonth, window.currentYear);
      });
    }
    
    if (nextMonthBtn) {
      nextMonthBtn.addEventListener('click', () => {
        // Use global values instead of local parameters
        this.navigateClockCalendarMonth(1, segments, window.currentMonth, window.currentYear);
      });
    }
  }

  /**
   * Navigate to previous/next month in clock calendar
   */
  async navigateClockCalendarMonth(direction, segments, currentMonth, currentYear) {
    // Calculate new month and year
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    
    // Handle year boundary
    if (newMonth < 0) {
      newMonth = 11;
      newYear = currentYear - 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear = currentYear + 1;
    }
    
    // Since we have year data, we can navigate locally without API calls
    // Find the month data in the year segments
    let monthSegments = [];
    if (segments && segments.length > 0) {
      // For year scope, segments contain monthly data
      // Each segment represents a month with a 'days' array
      const monthIndex = newMonth; // 0-based month index
      if (segments[monthIndex] && segments[monthIndex].days) {
        monthSegments = segments[monthIndex].days;
      }
    }
    
    // Update the calendar display with new month data
    this.updateClockCalendarDisplay(newMonth, newYear, monthSegments);
    
    // Update the clock with new month data
    if (window.clockInstance && monthSegments.length > 0) {
      window.clockInstance.segments = monthSegments;
      window.clockInstance.currentIndex = 0; // Reset to first day of month
      window.clockInstance.updateClock();
      
      // Update calendar selection to match the clock
      this.updateCalendarSelection(0);
    }
    
    // Store current month/year for future navigation
    window.currentMonth = newMonth;
    window.currentYear = newYear;
    
    this.showSuccessMessage(`Navigation vers ${this.getMonthName(newMonth)} ${newYear}`);
  }

  /**
   * Get mosque ID from the page
   */
  getMosqueIdFromPage() {
    // Try to get from form
    const mosqueSelect = document.getElementById('mosque-select');
    if (mosqueSelect && mosqueSelect.value) {
      return mosqueSelect.value;
    }
    
    // Try to get from hidden field
    const mosqueIdField = document.querySelector('input[name="masjid_id"]');
    if (mosqueIdField && mosqueIdField.value) {
      return mosqueIdField.value;
    }
    
    // Try to get from data attributes
    const clockConfig = document.getElementById('clockConfig');
    if (clockConfig && clockConfig.dataset.mosqueId) {
      return clockConfig.dataset.mosqueId;
    }
    
    return null;
  }

  /**
   * Get month name in French
   */
  getMonthName(monthIndex) {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return monthNames[monthIndex];
  }

  /**
   * Update clock calendar display
   */
  updateClockCalendarDisplay(month, year, segments) {
    const titleElement = document.getElementById('currentMonthTitle');
    const container = document.getElementById('clockCalendarDays');
    
    if (!titleElement || !container) return;

    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    titleElement.textContent = `${monthNames[month]} ${year}`;

    // Clear and regenerate calendar days
    container.innerHTML = '';
    
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1);

    // For year scope, segments contain monthly data
    let monthSegments = [];
    if (segments && segments.length > 0) {
      // If segments is an array of months (year scope)
      // Each segment represents a month with a 'days' array
      if (segments[month] && segments[month].days) {
        monthSegments = segments[month].days;
      } else {
        // If segments is already daily data (month scope)
        monthSegments = segments;
      }
    }

    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayElement = this.createClockCalendarDay(currentDate, monthSegments, month, year);
      container.appendChild(dayElement);
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
        <h2>📅 Vue calendrier</h2>
        
        <!-- Calendar and slots container -->
        <div class="calendar-slots-container">
          <!-- Calendar for month navigation -->
          <div id="clockCalendar" class="clock-calendar">
            <div class="calendar-header">
              <button id="prevMonthBtn" class="calendar-nav-btn">←</button>
              <h3 id="currentMonthTitle" class="calendar-title"></h3>
              <button id="nextMonthBtn" class="calendar-nav-btn">→</button>
            </div>
            <div class="calendar-grid">
              <div class="calendar-weekdays">
                <div class="weekday">Lun</div>
                <div class="weekday">Mar</div>
                <div class="weekday">Mer</div>
                <div class="weekday">Jeu</div>
                <div class="weekday">Ven</div>
                <div class="weekday">Sam</div>
                <div class="weekday">Dim</div>
              </div>
              <div id="clockCalendarDays" class="calendar-days">
                <!-- Calendar days will be generated here -->
              </div>
            </div>
          </div>
          
          <!-- Default slots list (for today scope) -->
          <div id="defaultSlotsView" class="slots-view">
            <div id="availableSlotsList" class="slots-list">
              <!-- Slots will be displayed here dynamically -->
            </div>
          </div>
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

    // Hidden fields for mosque coordinates
    const mosqueLatField = document.createElement('input');
    mosqueLatField.type = 'hidden';
    mosqueLatField.id = 'mosque_lat';
    mosqueLatField.name = 'mosque_lat';
    mosqueLatField.value = '';
    configSection.appendChild(mosqueLatField);

    const mosqueLngField = document.createElement('input');
    mosqueLngField.type = 'hidden';
    mosqueLngField.id = 'mosque_lng';
    mosqueLngField.name = 'mosque_lng';
    mosqueLngField.value = '';
    configSection.appendChild(mosqueLngField);

    const mosqueNameField = document.createElement('input');
    mosqueNameField.type = 'hidden';
    mosqueNameField.id = 'mosque_name';
    mosqueNameField.name = 'mosque_name';
    mosqueNameField.value = '';
    configSection.appendChild(mosqueNameField);

    const mosqueAddressField = document.createElement('input');
    mosqueAddressField.type = 'hidden';
    mosqueAddressField.id = 'mosque_address';
    mosqueAddressField.name = 'mosque_address';
    mosqueAddressField.value = '';
    configSection.appendChild(mosqueAddressField);

    // Hidden scope field - always year
    const scopeField = document.createElement('input');
    scopeField.type = 'hidden';
    scopeField.name = 'scope';
    scopeField.value = 'year';
    configSection.appendChild(scopeField);
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

  /**
   * Update calendar selection based on clock index
   */
  updateCalendarSelection(index) {
    // Remove previous selection
    const previousSelected = document.querySelector('#clockCalendar .calendar-day.selected');
    if (previousSelected) {
      previousSelected.classList.remove('selected');
    }

    // Calculate the actual day number (index + 1)
    const dayNumber = index + 1;
    
    // Find the calendar day element that corresponds to this day number
    const dayElements = document.querySelectorAll('#clockCalendar .calendar-day');
    
    for (let i = 0; i < dayElements.length; i++) {
      const dayElement = dayElements[i];
      const dayText = dayElement.querySelector('.day-number');
      
      if (dayText && parseInt(dayText.textContent) === dayNumber && !dayElement.classList.contains('other-month')) {
        dayElement.classList.add('selected');
        break;
      }
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