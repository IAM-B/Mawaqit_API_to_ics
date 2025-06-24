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
    const plannerForm = document.getElementById('plannerForm');
    const configForm = document.getElementById('configForm');
    const submitBtn = document.querySelector('.btn-submit');
    
    if (configForm && submitBtn) {
      configForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission
        
        // Show loading state
        this.showLoadingState(submitBtn);
        
        try {
          // Get form data from both forms
          const plannerFormData = new FormData(plannerForm);
          const configFormData = new FormData(configForm);
          
          // Combine the form data
          const combinedFormData = new FormData();
          
          // Add planner form data
          for (let [key, value] of plannerFormData.entries()) {
            combinedFormData.append(key, value);
          }
          
          // Add config form data
          for (let [key, value] of configFormData.entries()) {
            combinedFormData.append(key, value);
          }
          
          // Explicit inclusion of the include_sunset checkbox (to avoid any omission)
          const includeSunsetCheckbox = document.getElementById('include_sunset');
          if (includeSunsetCheckbox) {
            combinedFormData.set('include_sunset', includeSunsetCheckbox.checked ? 'on' : '');
          }
          
          // Send AJAX request
          const response = await fetch('/api/generate_planning', {
            method: 'POST',
            body: combinedFormData
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
    
    // Hide the configuration forms and show the display version
    this.hideConfigurationForms();
    this.showSummaryDisplay();
    
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
   * Hide configuration forms and show summary display
   */
  hideConfigurationForms() {
    const summarySection = document.querySelector('.summary-section');
    const summaryDisplay = document.querySelector('.summary-display');
    if (summarySection) {
      summarySection.classList.add('hidden');
    }
    if (summaryDisplay) {
      summaryDisplay.classList.remove('hidden');
      summaryDisplay.classList.add('fade-in-up');
      setTimeout(() => summaryDisplay.classList.add('visible'), 100);
    }
  }

  /**
   * Show summary display section
   */
  showSummaryDisplay() {
    const summaryDisplay = document.querySelector('.summary-display');
    if (summaryDisplay) {
      summaryDisplay.classList.remove('hidden');
      summaryDisplay.classList.add('fade-in-up');
      setTimeout(() => summaryDisplay.classList.add('visible'), 100);
    }
  }

  /**
   * Update mosque information
   */
  updateMosqueInfo(data) {
    const mosqueNameEl = document.querySelector('.summary-display .mosque-details h4');
    const mosqueAddressEl = document.querySelector('.summary-display .mosque-details .address');
    const mapLinksEl = document.querySelector('.summary-display .map-links');
    const mapContainer = document.getElementById('mosque-location-map');
    
    if (mosqueNameEl) mosqueNameEl.textContent = data.mosque_name;
    if (mosqueAddressEl) mosqueAddressEl.textContent = data.mosque_address;
    
    // Met à jour les attributs data du conteneur de la carte
    if (mapContainer && data.mosque_lat && data.mosque_lng) {
      mapContainer.dataset.lat = data.mosque_lat;
      mapContainer.dataset.lng = data.mosque_lng;
      mapContainer.dataset.name = data.mosque_name;
      
      // Initialise la carte compacte si la fonction existe
      if (window.initializeCompactMap) {
        window.initializeCompactMap(
          'mosque-location-map',
          parseFloat(data.mosque_lat),
          parseFloat(data.mosque_lng),
          data.mosque_name
        );
      }
    }
    
    // Met à jour les liens de la carte
    if (mapLinksEl) {
      mapLinksEl.innerHTML = '';
      if (data.google_maps_url) {
        const a = document.createElement('a');
        a.href = data.google_maps_url;
        a.target = '_blank';
        a.className = 'map-link';
        a.innerHTML = '🗺️ Google Maps';
        mapLinksEl.appendChild(a);
      }
      if (data.osm_url) {
        const a = document.createElement('a');
        a.href = data.osm_url;
        a.target = '_blank';
        a.className = 'map-link';
        a.innerHTML = '🗺️ OpenStreetMap';
        mapLinksEl.appendChild(a);
      }
      if (data.mawaqit_url) {
        const a = document.createElement('a');
        a.href = data.mawaqit_url;
        a.target = '_blank';
        a.className = 'map-link';
        a.innerHTML = '🌐 Mawaqit.net';
        mapLinksEl.appendChild(a);
      }
    }
  }

  /**
   * Update configuration summary
   */
  updateConfigSummary(data) {
    const configItems = document.querySelectorAll('.summary-display .config-item');
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
      downloadGrid.innerHTML = '';
      // Ajoute les liens de téléchargement si disponibles
      if (data.ics_path) {
        const a = document.createElement('a');
        a.href = `/static/ics/${data.ics_path}`;
        a.download = '';
        a.className = 'download-card primary';
        a.innerHTML = `<span class="download-icon">📅</span><span class="download-title">Horaires de prière (${data.scope})</span><span class="download-format">.ics</span>`;
        downloadGrid.appendChild(a);
      }
      if (data.available_slots_path) {
        const a = document.createElement('a');
        a.href = `/static/ics/${data.available_slots_path}`;
        a.download = '';
        a.className = 'download-card secondary';
        a.innerHTML = `<span class="download-icon">🕒</span><span class="download-title">Créneaux synchronisés (${data.scope})</span><span class="download-format">.ics</span>`;
        downloadGrid.appendChild(a);
      }
      if (data.empty_slots_path) {
        const a = document.createElement('a');
        a.href = `/static/ics/${data.empty_slots_path}`;
        a.download = '';
        a.className = 'download-card secondary';
        a.innerHTML = `<span class="download-icon">📋</span><span class="download-title">Créneaux disponibles (${data.scope})</span><span class="download-format">.ics</span>`;
        downloadGrid.appendChild(a);
      }
      // Lien pour édition manuelle
      const editA = document.createElement('a');
      editA.href = '/edit_slot';
      editA.className = 'download-card edit';
      editA.innerHTML = `<span class="download-icon">✏️</span><span class="download-title">Modifier manuellement</span><span class="download-format">Créneaux</span>`;
      downloadGrid.appendChild(editA);
      // Ajoute les boutons de téléchargement par période
      const scopeDownloads = document.createElement('div');
      scopeDownloads.className = 'scope-downloads';
      scopeDownloads.innerHTML = `<h3>📥 Téléchargements par période</h3><div class="scope-buttons"></div>`;
      const scopeButtons = scopeDownloads.querySelector('.scope-buttons');
      ['today', 'month'].forEach(scope => {
        const btn = document.createElement('button');
        btn.className = `scope-download-btn ${scope}`;
        btn.dataset.scope = scope;
        btn.innerHTML = `<span class="scope-icon">📅</span><span class="scope-title">${scope === 'today' ? "Aujourd'hui" : 'Ce mois'}</span>`;
        scopeButtons.appendChild(btn);
      });
      downloadGrid.appendChild(scopeDownloads);
      // Active les boutons
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
        // Recup checkbox include_sunset
        const includeSunsetCheckbox = document.getElementById('include_sunset');
        const includeSunset = includeSunsetCheckbox ? includeSunsetCheckbox.checked : false;
        
        // Show loading state
        button.classList.add('loading');
        button.disabled = true;
        
        try {
          // Slot generation for the selected scope
          const response = await fetch('/api/generate_planning', {
            method: 'POST',
            body: (() => {
              const formData = new FormData();
              formData.append('masjid_id', mosqueId);
              formData.append('scope', scope);
              formData.append('padding_before', paddingBefore);
              formData.append('padding_after', paddingAfter);
              formData.append('include_sunset', includeSunset ? 'on' : '');
              return formData;
            })()
          });
          const result = await response.json();
          if (result.success) {
            // Update download-cards with new links
            this.generateDownloadLinks(result.data);
            this.showSuccessMessage(`Fichiers ICS pour ${scope} générés !`);
          } else {
            throw new Error(result.error || 'Erreur lors de la génération');
          }
        } catch (error) {
          console.error('Error generating ICS:', error);
          this.showErrorMessage(error.message);
        } finally {
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
    // Affiche les sections existantes sans les créer dynamiquement
    const selectors = [
      '.quick-actions',
      '.clock-section',
      '.available-slots',
      '.summary-display'
    ];
    selectors.forEach(selector => {
      const section = document.querySelector(selector);
      if (section) {
        section.classList.remove('hidden');
        section.classList.add('fade-in-up');
        setTimeout(() => section.classList.add('visible'), 100);
      }
    });
    // Masque la section no-data si elle existe
    const noDataSection = document.querySelector('.no-data');
    if (noDataSection) {
      noDataSection.classList.add('hidden');
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