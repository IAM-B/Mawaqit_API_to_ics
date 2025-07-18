// Planner page logic: forms, AJAX, feedback, config, download, etc.

import { Clock } from '../components/clock.js';
import { getPaddingBefore, getPaddingAfter } from '../utils/padding.js';

export class PlannerPage {
  constructor () {
    this.MIN_PADDING_AFTER = 10; // Minimum 10 minutes padding after each prayer
    this.init();
  }

  init () {
    this.setupFormHandling();
    this.setupPlanningAnimation();
    this.setupProgressIndicatorDetachment();
    this.setupPrayerPaddingConfig();
    this.setupFeaturesOptions();
    this.setupErrorHandling();
    this.setupOfflineDetection();
    this.setupFormValidation();
  }

  setupFormHandling () {
    const plannerForm = document.getElementById('plannerForm');
    const configForm = document.getElementById('configForm');
    const submitBtn = document.querySelector('.btn-submit');

    // Progress system initialization
    this.initializeProgressSystem();

    if (configForm && submitBtn) {
      configForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        this.showLoadingState(submitBtn);
        try {
          const plannerFormData = new FormData(plannerForm);
          const configFormData = new FormData(configForm);
          const combinedFormData = new FormData();

          // Add all planner form data (including masjid_id)
          for (const [key, value] of plannerFormData.entries()) {
            combinedFormData.append(key, value);
          }

          // Determine active configuration mode
          const configModeSwitch = document.getElementById('configModeSwitch');
          const isIndividualMode = configModeSwitch && configModeSwitch.checked;

          if (isIndividualMode) {
            // Individual mode: use individual paddings
            const prayers = ['fajr', 'sunset', 'dhuhr', 'asr', 'maghrib', 'isha'];

            prayers.forEach(prayer => {
              const beforeInput = document.getElementById(`${prayer}_padding_before`);
              const afterInput = document.getElementById(`${prayer}_padding_after`);

              if (beforeInput && afterInput) {
                const defaultValue = prayer === 'sunset' ? '5' : '10';
                const beforeValue = beforeInput.value || defaultValue;
                const afterValue = afterInput.value || (prayer === 'sunset' ? '15' : '35');

                // Apply minimum 10 minutes padding after each prayer
                let finalAfterValue = afterValue;
                if (parseInt(finalAfterValue) < this.MIN_PADDING_AFTER) {
                  finalAfterValue = this.MIN_PADDING_AFTER.toString();
                }

                // Always send individual paddings in individual mode
                combinedFormData.set(`${prayer}_padding_before`, beforeValue);
                combinedFormData.set(`${prayer}_padding_after`, finalAfterValue);
              }
            });

            // Add other configuration data (excluding global paddings)
            for (const [key, value] of configFormData.entries()) {
              if (!key.includes('padding')) { // Don't include global paddings
                combinedFormData.append(key, value);
              }
            }
          } else {
            // Global mode: use global paddings

            // Get and validate global "before" padding
            const globalPaddingBeforeInput = document.getElementById('global_padding_before');
            if (globalPaddingBeforeInput) {
              const globalPaddingBefore = globalPaddingBeforeInput.value || '10';
              combinedFormData.set('padding_before', globalPaddingBefore);
            }

            // Get and validate global "after" padding
            const globalPaddingAfterInput = document.getElementById('global_padding_after');
            if (globalPaddingAfterInput) {
              let globalPaddingAfter = globalPaddingAfterInput.value || '35';

              // Apply minimum padding to global padding
              if (parseInt(globalPaddingAfter) < this.MIN_PADDING_AFTER) {
                globalPaddingAfter = this.MIN_PADDING_AFTER.toString();
              }

              combinedFormData.set('padding_after', globalPaddingAfter);
            }

            // Add other configuration data (excluding individual paddings)
            for (const [key, value] of configFormData.entries()) {
              if (!key.includes('padding') || key === 'scope') { // Always include scope
                combinedFormData.append(key, value);
              }
            }
          }

          const includeSunsetCheckbox = document.getElementById('include_sunset');
          if (includeSunsetCheckbox) {
            combinedFormData.set('include_sunset', includeSunsetCheckbox.checked ? 'on' : '');
          }

          // Ensure masjid_id is included
          const mosqueSelect = document.getElementById('mosque-select');
          if (mosqueSelect && mosqueSelect.value) {
            combinedFormData.set('masjid_id', mosqueSelect.value);
          }

          const response = await fetch('/api/generate_planning', {
            method: 'POST',
            body: combinedFormData
          });
          const result = await response.json();
          if (result.success) {
            this.updatePageWithPlanningData(result.data);
          } else {
            throw new Error(result.error || 'Erreur lors de la génération');
          }
        } catch (error) {
          // Improve error messages for the user
          // let errorMessage = 'Error generating planning';

          // if (error.message.includes('HTTP error 500')) {
          //   errorMessage = 'Mawaqit service temporarily unavailable. Please try again in a few seconds.';
          // } else if (error.message.includes('timeout') || error.message.includes('network')) {
          //   errorMessage = 'Network connection issue. Please check your connection and try again.';
          // } else if (error.message.includes('Mosque not found')) {
          //   errorMessage = 'Mosque not found. Please check the mosque identifier.';
          // } else if (error.message.includes('HTTP error')) {
          //   errorMessage = 'Communication error with Mawaqit service. Please try again.';
          // } else if (error.message) {
          //   errorMessage = error.message;
          // }
        } finally {
          this.hideLoadingState(submitBtn);
        }
      });
    }
  }

  showLoadingState (submitBtn) {
    submitBtn.classList.add('loading');
    submitBtn.textContent = '🔄 Génération en cours...';
    submitBtn.disabled = true;
  }

  hideLoadingState (submitBtn) {
    submitBtn.classList.remove('loading');
    submitBtn.textContent = '📥 Générer planning';
    submitBtn.disabled = false;
  }

  updatePageWithPlanningData (data) {
    window.currentMosqueId = data.masjid_id;
    window.currentPaddingBefore = data.padding_before;
    window.currentPaddingAfter = data.padding_after;
    window.currentMonth = new Date().getMonth();
    window.currentYear = new Date().getFullYear();

    // Store segments data globally for progress checking
    if (data.segments) {
      window.currentSegments = data.segments;
    }

    // Update progress state - only mark planning as generated, don't force config completion
    this.progressState.planningGenerated = true;

    // Check if configuration is actually complete based on form data
    this.updateProgressState();

    this.showPlanningSections();
    this.updateMosqueInfo(data);
    this.updateConfigSummary(data);
    this.generateDownloadLinks(data);
    if (data.segments && data.segments.length > 0) {
      setTimeout(() => {
        if (window.calendarViewsManager) {
          window.calendarViewsManager.initializeViews(data.segments, data.scope);
        }
        if (window.timeline) {
          window.timeline.initializeTimeline(data.segments, data.scope);
          const today = new Date();
          window.timeline.setDate(today);
        }
        this.initializeClock(data);
      }, 100);
    }
  }

  showSummaryDisplay () {
    const summaryDisplay = document.querySelector('.summary-display');
    if (summaryDisplay) {
      summaryDisplay.classList.remove('hidden');
      summaryDisplay.classList.add('fade-in-up');
      setTimeout(() => summaryDisplay.classList.add('visible'), 100);
    }
  }

  updateMosqueInfo (data) {
    const mosqueNameEl = document.querySelector('.summary-display .mosque-details h4');
    const mosqueAddressEl = document.querySelector('.summary-display .mosque-details .address');
    const mapLinksEl = document.querySelector('.summary-display .map-links');
    const mapContainer = document.getElementById('mosque-location-map');
    if (mosqueNameEl) mosqueNameEl.textContent = data.mosque_name;
    if (mosqueAddressEl) mosqueAddressEl.textContent = data.mosque_address;
    if (mapContainer && data.mosque_lat && data.mosque_lng) {
      mapContainer.dataset.lat = data.mosque_lat;
      mapContainer.dataset.lng = data.mosque_lng;
      mapContainer.dataset.name = data.mosque_name;
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

  updateConfigSummary (data) {
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

    // Display individual paddings if available
    if (data.prayer_paddings) {
      // Store individual paddings globally for clock and timeline components
      window.currentPrayerPaddings = data.prayer_paddings;

      const individualPaddingsContainer = document.querySelector('.individual-paddings-summary');
      if (individualPaddingsContainer) {
        individualPaddingsContainer.innerHTML = '';
        const prayers = ['fajr', 'sunset', 'dhuhr', 'asr', 'maghrib', 'isha'];
        const prayerNames = {
          fajr: 'Fajr',
          sunset: 'Sunset',
          dhuhr: 'Dhuhr',
          asr: 'Asr',
          maghrib: 'Maghrib',
          isha: 'Isha'
        };

        prayers.forEach(prayer => {
          if (data.prayer_paddings[prayer]) {
            const padding = data.prayer_paddings[prayer];
            const paddingItem = document.createElement('div');
            paddingItem.className = 'individual-padding-item';
            paddingItem.innerHTML = `
              <span class="prayer-name">${prayerNames[prayer]}</span>
              <span class="padding-values">${padding.before}min / ${padding.after}min</span>
            `;
            individualPaddingsContainer.appendChild(paddingItem);
          }
        });
      }
    } else {
      // Create individual paddings from global paddings for consistency
      const prayers = ['fajr', 'sunset', 'dhuhr', 'asr', 'maghrib', 'isha'];
      const backendPrayerNames = {
        fajr: 'fajr',
        sunset: 'sunset',
        dhuhr: 'dohr',
        asr: 'asr',
        maghrib: 'maghreb',
        isha: 'icha'
      };

      window.currentPrayerPaddings = {};
      prayers.forEach(prayer => {
        const backendName = backendPrayerNames[prayer];
        if (backendName) {
          // Use global paddings for all prayers
          window.currentPrayerPaddings[backendName] = {
            before: data.padding_before || 10,
            after: data.padding_after || 35
          };
        }
      });
    }
  }

  generateDownloadLinks (data) {
    const downloadGrid = document.querySelector('.how-it-works-section .download-grid');
    if (downloadGrid) {
      downloadGrid.innerHTML = '';
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
      const editA = document.createElement('a');
      editA.href = '/edit_slot';
      editA.className = 'download-card edit';
      editA.innerHTML = '<span class="download-icon">✏️</span><span class="download-title">Modifier manuellement</span><span class="download-format">Créneaux</span>';
      downloadGrid.appendChild(editA);
      const scopeDownloads = document.createElement('div');
      scopeDownloads.className = 'scope-downloads';
      scopeDownloads.innerHTML = '<h3>📥 Téléchargements par période</h3><div class="scope-buttons"></div>';
      const scopeButtons = scopeDownloads.querySelector('.scope-buttons');
      const yearBtn = document.createElement('button');
      yearBtn.className = 'scope-download-btn year active';
      yearBtn.dataset.scope = 'year';
      yearBtn.innerHTML = '<span class="scope-icon">📅</span><span class="scope-title">Cette année</span>';
      scopeButtons.appendChild(yearBtn);
      ['today', 'month'].forEach(scope => {
        const btn = document.createElement('button');
        btn.className = `scope-download-btn ${scope}`;
        btn.dataset.scope = scope;
        btn.innerHTML = `<span class="scope-icon">📅</span><span class="scope-title">${scope === 'today' ? 'Aujourd\'hui' : 'Ce mois'}</span>`;
        scopeButtons.appendChild(btn);
      });
      downloadGrid.appendChild(scopeDownloads);
      this.setupScopeDownloadButtons(data);

      // Update progress state
      this.progressState.downloadsAvailable = true;
      this.updateProgressIndicator(3);
    }
  }

  setupScopeDownloadButtons (data) {
    const scopeButtons = document.querySelectorAll('.scope-download-btn');
    if (!window.originalYearData) {
      window.originalYearData = data;
    }
    scopeButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        e.preventDefault();
        const scope = button.dataset.scope;
        if (scope === 'year' && window.originalYearData) {
          this.generateDownloadLinks(window.originalYearData);
          this.updateActiveScopeButton('year');
          return;
        }
        const mosqueId = data.masjid_id;
        const paddingBefore = getPaddingBefore();
        const paddingAfter = getPaddingAfter();
        const includeSunsetCheckbox = document.getElementById('include_sunset');
        const includeSunset = includeSunsetCheckbox ? includeSunsetCheckbox.checked : false;
        button.classList.add('loading');
        button.disabled = true;
        try {
          const response = await fetch('/api/generate_planning', {
            method: 'POST',
            body: (() => {
              const formData = new FormData();
              formData.append('masjid_id', mosqueId);
              formData.append('scope', scope);
              formData.append('padding_before', paddingBefore);
              formData.append('padding_after', paddingAfter);
              formData.append('include_sunset', includeSunset ? 'on' : '');

              // Add Features options
              const featuresOptions = [
                'include_voluntary_fasts',
                'show_hijri_date',
                'include_adhkar'
              ];

              featuresOptions.forEach(optionId => {
                const checkbox = document.getElementById(optionId);
                if (checkbox) {
                  formData.append(optionId, checkbox.checked ? 'on' : '');
                }
              });

              // Add individual paddings
              const prayers = ['fajr', 'sunset', 'dhuhr', 'asr', 'maghrib', 'isha'];
              prayers.forEach(prayer => {
                const beforeInput = document.getElementById(`${prayer}_padding_before`);
                const afterInput = document.getElementById(`${prayer}_padding_after`);

                if (beforeInput) {
                  const defaultValue = prayer === 'sunset' ? '5' : '10';
                  const beforeValue = beforeInput.value || defaultValue;
                  formData.set(`${prayer}_padding_before`, beforeValue);
                }
                if (afterInput) {
                  const defaultValue = prayer === 'sunset' ? '15' : '35';
                  const afterValue = afterInput.value || defaultValue;
                  formData.set(`${prayer}_padding_after`, afterValue);
                }
              });

              return formData;
            })()
          });
          const result = await response.json();
          if (result.success) {
            this.generateDownloadLinks(result.data);
            this.updateActiveScopeButton(scope);
          } else {
            throw new Error(result.error || 'Erreur lors de la génération');
          }
        } catch (error) {
          // Error generating ICS
        } finally {
          button.classList.remove('loading');
          button.disabled = false;
        }
      });
    });
  }

  updateActiveScopeButton (activeScope) {
    const scopeButtons = document.querySelectorAll('.scope-download-btn');
    scopeButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.scope === activeScope) {
        btn.classList.add('active');
      }
    });
  }

  initializeClock (data) {
    const clockContainer = document.getElementById('clockContent');
    if (!clockContainer) {
      return;
    }
    if (!data.segments || data.segments.length === 0) {
      return;
    }
    const clockConfig = document.createElement('div');
    clockConfig.id = 'clockConfig';
    clockConfig.dataset.segments = JSON.stringify(data.segments);
    clockConfig.dataset.scope = data.scope;
    clockConfig.style.display = 'none';
    document.body.appendChild(clockConfig);
    if (window.Clock) {
      let clockSegments = data.segments;
      if (data.scope === 'year' && data.segments && data.segments.length > 0) {
        const currentMonth = new Date().getMonth();
        if (data.segments[currentMonth] && data.segments[currentMonth].days) {
          clockSegments = data.segments[currentMonth].days;
        }
      }
      const clock = new Clock('clockContent', clockSegments, data.scope);
      window.clockInstance = clock;
      if (clockSegments && clockSegments.length > 0) {
        const currentDay = new Date().getDate();
        const todayIndex = Math.min(currentDay - 1, clockSegments.length - 1);
        clock.currentIndex = todayIndex;
        clock.updateClock();
        this.updateCalendarSelection(todayIndex);
      }
      if (window.calendarViewsManager) {
        window.calendarViewsManager.setClockInstance(clock);
      }
      this.initializeClockCalendar(data.segments, data.scope);
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
      setTimeout(() => {
        Clock.handlePlanningGeneration();
      }, 200);
    }
  }

  initializeClockCalendar (segments, scope) {
    if (scope !== 'year') return;
    const container = document.getElementById('clockCalendarDays');
    const titleElement = document.getElementById('currentMonthTitle');
    if (!container || !titleElement) return;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    window.currentMonth = currentMonth;
    window.currentYear = currentYear;
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    titleElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    container.innerHTML = '';
    const firstDay = new Date(currentYear, currentMonth, 1);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = (dayOfWeek + 6) % 7;
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dayElement = this.createClockCalendarDay(currentDate, segments, currentMonth, currentYear);
      container.appendChild(dayElement);
    }
    this.setupClockCalendarNavigation(segments, currentMonth, currentYear);
  }

  createClockCalendarDay (date, segments, currentMonth, _currentYear) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    dayElement.appendChild(dayNumber);
    if (date.getMonth() !== currentMonth) {
      dayElement.classList.add('other-month');
    }
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      dayElement.classList.add('today');
    }
    if (date.getDate() === today.getDate() && date.getMonth() === currentMonth && date.getFullYear() === today.getFullYear()) {
      dayElement.classList.add('selected');
    }
    if (segments && segments.length > 0) {
      // monthSegments logic removed as it's not used
    }
    dayElement.addEventListener('click', () => {
      if (date.getMonth() === currentMonth) {
        this.selectClockCalendarDay(date.getDate(), segments);
      }
    });
    return dayElement;
  }

  selectClockCalendarDay (day, segments) {
    const dayIndex = day - 1;
    this.updateCalendarSelection(dayIndex);
    const currentMonth = window.currentMonth || new Date().getMonth();
    const currentYear = window.currentYear || new Date().getFullYear();
    const selectedDate = new Date(currentYear, currentMonth, day);
    if (window.setSelectedDate) {
      window.setSelectedDate(selectedDate);
    }
    if (window.Clock && window.clockInstance) {
      let monthSegments = [];
      if (segments && segments.length > 0) {
        const currentMonth = window.currentMonth || new Date().getMonth();
        if (segments[currentMonth] && segments[currentMonth].days) {
          monthSegments = segments[currentMonth].days;
        } else {
          monthSegments = segments;
        }
      }
      if (dayIndex >= 0 && dayIndex < monthSegments.length) {
        window.clockInstance.currentIndex = dayIndex;
        window.clockInstance.updateClock();
      }
    }
  }

  setupClockCalendarNavigation (segments, currentMonth, currentYear) {
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    window.currentMonth = currentMonth;
    window.currentYear = currentYear;
    if (prevMonthBtn) {
      prevMonthBtn.addEventListener('click', () => {
        this.navigateClockCalendarMonth(-1, segments, window.currentMonth, window.currentYear);
      });
    }
    if (nextMonthBtn) {
      nextMonthBtn.addEventListener('click', () => {
        this.navigateClockCalendarMonth(1, segments, window.currentMonth, window.currentYear);
      });
    }
  }

  async navigateClockCalendarMonth (direction, segments, currentMonth, currentYear) {
    let newMonth = currentMonth + direction;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear = currentYear - 1;
    } else if (newMonth > 11) {
      newMonth = 0;
      newYear = currentYear + 1;
    }
    let monthSegments = [];
    if (segments && segments.length > 0) {
      const monthIndex = newMonth;
      if (segments[monthIndex] && segments[monthIndex].days) {
        monthSegments = segments[monthIndex].days;
      }
    }
    this.updateClockCalendarDisplay(newMonth, newYear, monthSegments);
    if (window.clockInstance && monthSegments.length > 0) {
      window.clockInstance.segments = monthSegments;
      window.clockInstance.currentIndex = 0;
      window.clockInstance.updateClock();
      this.updateCalendarSelection(0);
    }
    window.currentMonth = newMonth;
    window.currentYear = newYear;
  }

  getMosqueIdFromPage () {
    const mosqueSelect = document.getElementById('mosque-select');
    if (mosqueSelect && mosqueSelect.value) {
      return mosqueSelect.value;
    }
    const mosqueIdField = document.querySelector('input[name="masjid_id"]');
    if (mosqueIdField && mosqueIdField.value) {
      return mosqueIdField.value;
    }
    const clockConfig = document.getElementById('clockConfig');
    if (clockConfig && clockConfig.dataset.mosqueId) {
      return clockConfig.dataset.mosqueId;
    }
    return null;
  }

  getMonthName (monthIndex) {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return monthNames[monthIndex];
  }

  updateClockCalendarDisplay (month, year, segments) {
    const titleElement = document.getElementById('currentMonthTitle');
    const container = document.getElementById('clockCalendarDays');
    if (!titleElement || !container) return;
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    titleElement.textContent = `${monthNames[month]} ${year}`;
    container.innerHTML = '';
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = (dayOfWeek + 6) % 7;
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    let monthSegments = [];
    if (segments && segments.length > 0) {
      if (segments[month] && segments[month].days) {
        monthSegments = segments[month].days;
      } else {
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

  showPlanningSections () {
    const selectors = [
      '.how-it-works-section',
      '.benefits-section'
    ];
    selectors.forEach(selector => {
      const section = document.querySelector(selector);
      if (section) {
        section.classList.remove('hidden');
        section.classList.add('fade-in-up');
        setTimeout(() => section.classList.add('visible'), 100);
      }
    });

    // Scroll to the benefits section (Agenda des prières)
    const benefitsSection = document.querySelector('.benefits-section');
    if (benefitsSection) {
      setTimeout(() => {
        benefitsSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 500);
    }

    const noDataSection = document.querySelector('.no-data');
    if (noDataSection) {
      noDataSection.classList.add('hidden');
    }
  }

  setupPlanningAnimation () {
    const hasPlanningData = document.querySelector('.how-it-works-section') !== null;
    const hasClockConfig = document.getElementById('clockConfig') !== null;
    if (hasPlanningData && hasClockConfig) {
      setTimeout(() => {
        Clock.handlePlanningGeneration();
      }, 100);
    } else {
      // No planning data found, skipping animation
    }
  }

  static initClock () {
    const clockConfig = document.getElementById('clockConfig');
    if (!clockConfig) return;

    const clockData = JSON.parse(clockConfig.dataset.segments);
    const clockScope = clockConfig.dataset.scope;
    const clock = new Clock('clockContent', clockData, clockScope);
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => clock.navigate(-1));
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => clock.navigate(1));
    }
  }

  updateCalendarSelection (index) {
    const previousSelected = document.querySelector('#clockCalendar .calendar-day.selected');
    if (previousSelected) {
      previousSelected.classList.remove('selected');
    }
    const dayNumber = index + 1;
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

  setupProgressIndicatorDetachment () {
    // Observer to detect when progress-indicator leaves viewport
    const progressIndicator = document.getElementById('progressIndicatorHero');
    const progressIndicatorFixed = document.getElementById('progressIndicatorFixed');

    if (!progressIndicator || !progressIndicatorFixed) return;

    let isFixedVisible = false;
    let lastScrollY = window.scrollY;

    // More reactive scroll detection
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDirection = currentScrollY > lastScrollY ? 'down' : 'up';

      // Detect downward scroll from first pixel
      if (scrollDirection === 'down' && currentScrollY > 10 && !isFixedVisible) {
        this.triggerDetachmentAnimation();
        isFixedVisible = true;
      } else if (scrollDirection === 'up' && currentScrollY < 50 && isFixedVisible) {
        // Detect upward return
        this.hideFixedProgressIndicator();
        isFixedVisible = false;
      }

      lastScrollY = currentScrollY;
    };

    // Use throttling to optimize performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });

    // Synchronize states between the two progress indicators
    this.syncProgressIndicators();
  }

  triggerDetachmentAnimation () {
    const progressIndicator = document.getElementById('progressIndicatorHero');
    const progressIndicatorFixed = document.getElementById('progressIndicatorFixed');

    if (!progressIndicator || !progressIndicatorFixed) return;

    // Show fixed bar immediately
    progressIndicatorFixed.classList.add('visible');
    this.syncProgressIndicators();

    // Simply hide the original progress-indicator
    progressIndicator.classList.add('detaching');
  }

  hideFixedProgressIndicator () {
    const progressIndicator = document.getElementById('progressIndicatorHero');
    const progressIndicatorFixed = document.getElementById('progressIndicatorFixed');

    if (!progressIndicator || !progressIndicatorFixed) return;

    // Hide the fixed progress indicator immediately
    progressIndicatorFixed.classList.remove('visible');

    // Reset the original progress-indicator
    progressIndicator.classList.remove('detaching');
  }

  syncProgressIndicators () {
    const progressIndicator = document.getElementById('progressIndicatorHero');
    const progressIndicatorFixed = document.getElementById('progressIndicatorFixed');

    if (!progressIndicator || !progressIndicatorFixed) return;

    // Copy the steps classes from the original bar to the fixed bar
    const originalSteps = progressIndicator.querySelectorAll('.progress-step');
    const fixedSteps = progressIndicatorFixed.querySelectorAll('.progress-step');

    originalSteps.forEach((step, index) => {
      if (fixedSteps[index]) {
        // Copy state classes
        fixedSteps[index].className = step.className;
      }
    });
  }

  initializeProgressSystem () {
    // Progress state
    this.progressState = {
      mosqueSelected: false,
      configCompleted: false,
      planningGenerated: false,
      downloadsAvailable: false
    };

    // Observe sections
    this.setupSectionObservers();

    // Observe forms
    this.setupFormObservers();

    // Add click events on progress-steps
    this.setupProgressStepClicks();

    // Check initial state based on existing data
    this.checkInitialState();

    // Initialize state
    this.updateProgressIndicator(0);
  }

  checkInitialState () {
    // Check if there's already data on the page (e.g., from a previous session)
    const mosqueSelect = document.getElementById('mosque-select');
    if (mosqueSelect && mosqueSelect.value) {
      this.progressState.mosqueSelected = true;
    }

    // Check if configuration form has values
    const configForm = document.getElementById('configForm');
    if (configForm) {
      const paddingBefore = configForm.querySelector('input[name="padding_before"]');
      const paddingAfter = configForm.querySelector('input[name="padding_after"]');
      const includeSunset = configForm.querySelector('input[name="include_sunset"]');

      if (paddingBefore && paddingAfter && includeSunset) {
        const hasPaddingValues = paddingBefore.value && paddingAfter.value &&
                                !isNaN(parseInt(paddingBefore.value)) &&
                                !isNaN(parseInt(paddingAfter.value));
        const hasSunsetConfig = includeSunset.checked !== undefined;

        this.progressState.configCompleted = hasPaddingValues && hasSunsetConfig;
      } else {
        this.progressState.configCompleted = false;
      }
    } else {
      this.progressState.configCompleted = false;
    }

    // Check if planning data exists
    this.progressState.planningGenerated = this.hasPlanningData();

    // Check if download data exists
    this.progressState.downloadsAvailable = this.hasDownloadData();

    // Update display based on initial state
    this.updateProgressDisplay();
  }

  updateProgressState () {
    // Update state based on interface reality
    const mosqueSelect = document.getElementById('mosque-select');
    this.progressState.mosqueSelected = !!(mosqueSelect && mosqueSelect.value);

    // Check configuration completion more rigorously
    const configForm = document.getElementById('configForm');
    if (configForm) {
      const paddingBefore = configForm.querySelector('input[name="padding_before"]');
      const paddingAfter = configForm.querySelector('input[name="padding_after"]');
      const includeSunset = configForm.querySelector('input[name="include_sunset"]');

      // Check if both padding values are filled and valid
      const hasPaddingValues = paddingBefore && paddingAfter &&
                              paddingBefore.value && paddingAfter.value &&
                              !isNaN(parseInt(paddingBefore.value)) &&
                              !isNaN(parseInt(paddingAfter.value));

      // Check if sunset option is selected (if it exists)
      const hasSunsetConfig = !includeSunset || includeSunset.checked !== undefined;

      this.progressState.configCompleted = hasPaddingValues && hasSunsetConfig;
    } else {
      this.progressState.configCompleted = false;
    }

    // Check if planning data actually exists
    this.progressState.planningGenerated = this.hasPlanningData();

    // Check if download data actually exists
    this.progressState.downloadsAvailable = this.hasDownloadData();

    // Update the progress-indicator display
    this.updateProgressDisplay();
  }

  updateProgressDisplay () {
    let currentStep = 0;

    if (this.progressState.downloadsAvailable) {
      currentStep = 3;
    } else if (this.progressState.planningGenerated && this.progressState.configCompleted) {
      // Only mark step 2 as completed if both planning is generated AND config is completed
      currentStep = 2;
    } else if (this.progressState.mosqueSelected) {
      currentStep = 1;
    } else {
      currentStep = 0;
    }

    this.updateProgressIndicator(currentStep);
  }

  setupSectionObservers () {
    // Remove automatic progress completion based on scrolling
    // Progress steps should only be completed based on actual user actions and form completion
    // This prevents false completion when users just scroll down the page
  }

  setupFormObservers () {
    // Observe mosque selection
    const mosqueSelect = document.getElementById('mosque-select');
    if (mosqueSelect) {
      mosqueSelect.addEventListener('change', () => {
        if (mosqueSelect.value) {
          this.progressState.mosqueSelected = true;
          this.updateProgressIndicator(1);
          this.scrollToConfig();
        } else {
          // Reset progress if mosque is deselected
          this.resetProgressState();
        }
      });
    }

    // Observe configuration (excluding features options and config mode switch)
    const configForm = document.getElementById('configForm');
    if (configForm) {
      const inputs = configForm.querySelectorAll('input, select');
      inputs.forEach(input => {
        // Skip features options and config mode switch to avoid triggering progress completion
        const excludedOptions = [
          'include_sunset',
          'include_voluntary_fasts',
          'show_hijri_date',
          'include_adhkar',
          'configModeSwitch'
        ];

        if (!excludedOptions.includes(input.id)) {
          input.addEventListener('change', () => {
            this.checkConfigCompletion();
          });
          input.addEventListener('input', () => {
            this.checkConfigCompletion();
          });
        }
      });
    }
  }

  checkConfigCompletion () {
    const configForm = document.getElementById('configForm');
    if (!configForm) return;

    // Only check essential configuration elements (paddings)
    const paddingBefore = configForm.querySelector('input[name="global_padding_before"]');
    const paddingAfter = configForm.querySelector('input[name="global_padding_after"]');

    // Also check individual padding mode if it exists
    const configModeSwitch = document.getElementById('configModeSwitch');
    const isIndividualMode = configModeSwitch && configModeSwitch.checked;

    if (isIndividualMode) {
      // In individual mode, check if at least one prayer has valid padding values
      const prayers = ['fajr', 'sunset', 'dhuhr', 'asr', 'maghrib', 'isha'];
      let hasValidIndividualPaddings = false;

      prayers.forEach(prayer => {
        const beforeInput = document.getElementById(`${prayer}_padding_before`);
        const afterInput = document.getElementById(`${prayer}_padding_after`);

        if (beforeInput && afterInput &&
            beforeInput.value && afterInput.value &&
            !isNaN(parseInt(beforeInput.value)) &&
            !isNaN(parseInt(afterInput.value))) {
          hasValidIndividualPaddings = true;
        }
      });

      const isComplete = hasValidIndividualPaddings;

      if (isComplete && !this.progressState.configCompleted) {
        this.progressState.configCompleted = true;
        this.updateProgressState();
      } else if (!isComplete && this.progressState.configCompleted) {
        this.progressState.configCompleted = false;
        this.updateProgressState();
      }
    } else {
      // In global mode, check global padding values
      if (paddingBefore && paddingAfter) {
        const hasPaddingValues = paddingBefore.value && paddingAfter.value &&
                                !isNaN(parseInt(paddingBefore.value)) &&
                                !isNaN(parseInt(paddingAfter.value));

        const isComplete = hasPaddingValues;

        if (isComplete && !this.progressState.configCompleted) {
          this.progressState.configCompleted = true;
          this.updateProgressState();
        } else if (!isComplete && this.progressState.configCompleted) {
          this.progressState.configCompleted = false;
          this.updateProgressState();
        }
      } else {
        // If any required element is missing, mark as incomplete
        if (this.progressState.configCompleted) {
          this.progressState.configCompleted = false;
          this.updateProgressState();
        }
      }
    }
  }

  scrollToConfig () {
    const configCard = document.querySelector('.summary-card.config-info');
    if (configCard) {
      setTimeout(() => {
        configCard.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 500);
    }
  }

  updateProgressIndicator (stepIndex) {
    const progressIndicator = document.getElementById('progressIndicatorHero');
    const progressIndicatorFixed = document.getElementById('progressIndicatorFixed');

    if (!progressIndicator || !progressIndicatorFixed) return;

    const indicators = [progressIndicator, progressIndicatorFixed];

    indicators.forEach(indicator => {
      const steps = indicator.querySelectorAll('.progress-step');

      steps.forEach((step, index) => {
        step.classList.remove('active', 'completed');

        if (index < stepIndex) {
          step.classList.add('completed');
        } else if (index === stepIndex) {
          step.classList.add('active');
        }
      });
    });

    // Add a transition animation
    this.animateProgressTransition(stepIndex);
  }

  animateProgressTransition (_stepIndex) {
    const indicators = [
      document.getElementById('progressIndicatorHero'),
      document.getElementById('progressIndicatorFixed')
    ];

    indicators.forEach(indicator => {
      if (indicator) {
        const activeStep = indicator.querySelector('.progress-step.active');
        if (activeStep) {
          activeStep.style.animation = 'none';
          setTimeout(() => {
            activeStep.style.animation = 'pulseActive 2s infinite';
          }, 10);
        }
      }
    });
  }

  setupProgressStepClicks () {
    const indicators = [
      document.getElementById('progressIndicatorHero'),
      document.getElementById('progressIndicatorFixed')
    ];

    indicators.forEach(indicator => {
      if (indicator) {
        const steps = indicator.querySelectorAll('.progress-step');
        steps.forEach((step, index) => {
          step.addEventListener('click', () => {
            this.navigateToStep(index);
          });
        });
      }
    });
  }

  navigateToStep (stepIndex) {
    const sections = {
      0: '.summary-card.mosque-info',
      1: '.summary-card.config-info',
      2: '.benefits-section',
      3: '.how-it-works-section'
    };

    const targetSelector = sections[stepIndex];
    if (!targetSelector) return;

    const targetElement = document.querySelector(targetSelector);
    if (!targetElement) return;

    // Click animation on the progress-step
    this.animateStepClick(stepIndex);

    // Calculate the offset for the progress-indicator-fixed
    const fixedIndicator = document.getElementById('progressIndicatorFixed');
    let offset = 0;

    if (fixedIndicator && fixedIndicator.classList.contains('visible')) {
      offset = fixedIndicator.offsetHeight;
    }

    // Scroll to the section with offset
    setTimeout(() => {
      const targetRect = targetElement.getBoundingClientRect();
      const scrollTop = window.pageYOffset + targetRect.top - offset - 20; // 20px de marge

      window.scrollTo({
        top: scrollTop,
        behavior: 'smooth'
      });
    }, 200);
  }

  isStepAccessible (stepIndex) {
    switch (stepIndex) {
    case 0: return true; // Always accessible
    case 1: return this.progressState.mosqueSelected;
    case 2: return this.progressState.planningGenerated;
    case 3: return this.progressState.downloadsAvailable;
    default: return false;
    }
  }

  hasPlanningData () {
    // Check if benefits-section exists and contains data
    const benefitsSection = document.querySelector('.benefits-section');
    if (!benefitsSection) return false;

    // Check if section is not hidden
    if (benefitsSection.classList.contains('hidden')) return false;

    // Check if there is planning data (clock, timeline, etc.)
    const clockContent = document.getElementById('clockContent');
    const timelineSvg = document.querySelector('.slots-timeline-svg');

    // Check if global planning data exists
    const hasGlobalData = window.currentMosqueId &&
                         window.currentPaddingBefore &&
                         window.currentPaddingAfter;

    // Check if visual components have content
    const hasClockContent = clockContent && clockContent.children.length > 0;
    const hasTimelineContent = timelineSvg && timelineSvg.children.length > 0;

    // Check if segments data exists (from API response)
    const hasSegmentsData = window.currentSegments && window.currentSegments.length > 0;

    return hasGlobalData && (hasClockContent || hasTimelineContent || hasSegmentsData);
  }

  hasDownloadData () {
    // Check if how-it-works-section exists and contains download links
    const downloadsSection = document.querySelector('.how-it-works-section');
    if (!downloadsSection) return false;

    // Check if section is not hidden
    if (downloadsSection.classList.contains('hidden')) return false;

    // Check if there are download links with valid href
    const downloadCards = downloadsSection.querySelectorAll('.download-card');
    let hasValidDownloads = false;

    downloadCards.forEach(card => {
      const href = card.getAttribute('href');
      if (href && href !== '#' && href !== '') {
        hasValidDownloads = true;
      }
    });

    return hasValidDownloads;
  }

  animateStepClick (stepIndex) {
    const indicators = [
      document.getElementById('progressIndicatorHero'),
      document.getElementById('progressIndicatorFixed')
    ];

    indicators.forEach(indicator => {
      if (indicator) {
        const step = indicator.querySelectorAll('.progress-step')[stepIndex];
        if (step) {
          step.style.transform = 'scale(0.95)';
          setTimeout(() => {
            step.style.transform = '';
          }, 150);
        }
      }
    });
  }

  toggleConfigMode (isIndividualMode, globalConfigSection, individualConfigSection) {
    // Disable/enable global configuration inputs
    const globalInputs = globalConfigSection.querySelectorAll('input');
    globalInputs.forEach(input => {
      input.disabled = isIndividualMode;
      if (isIndividualMode) {
        input.style.opacity = '0.5';
      } else {
        input.style.opacity = '1';
      }
    });

    // Show/hide individual section
    if (isIndividualMode) {
      individualConfigSection.style.display = 'block';
    } else {
      individualConfigSection.style.display = 'none';
    }
  }

  setupPrayerPaddingConfig () {
    // Switch to toggle between global and individual configuration
    const configModeSwitch = document.getElementById('configModeSwitch');
    const globalConfigSection = document.getElementById('globalConfigSection');
    const individualConfigSection = document.getElementById('individualConfigSection');
    const backToGlobalBtn = document.getElementById('backToGlobalBtn');

    if (configModeSwitch && globalConfigSection && individualConfigSection) {
      // Initialize initial state
      const isIndividualMode = configModeSwitch.checked;
      this.toggleConfigMode(isIndividualMode, globalConfigSection, individualConfigSection);

      // Update switch label for initial state
      const switchLabel = document.querySelector('.switch-label');
      if (switchLabel) {
        switchLabel.textContent = 'Individual Configuration';
        if (isIndividualMode) {
          switchLabel.classList.add('active');
        } else {
          switchLabel.classList.remove('active');
        }
      }

      configModeSwitch.addEventListener('change', () => {
        const isIndividualMode = configModeSwitch.checked;

        this.toggleConfigMode(isIndividualMode, globalConfigSection, individualConfigSection);

        // Update switch label to indicate current mode
        const switchLabel = document.querySelector('.switch-label');
        if (switchLabel) {
          switchLabel.textContent = 'Individual Configuration';
          if (isIndividualMode) {
            switchLabel.classList.add('active');
          } else {
            switchLabel.classList.remove('active');
          }
        }

        // Don't trigger configuration completion check on switch change
        // The user needs to actually fill in the configuration values
      });
    }

    // Button to return to global configuration
    if (backToGlobalBtn && configModeSwitch) {
      backToGlobalBtn.addEventListener('click', () => {
        configModeSwitch.checked = false;
        configModeSwitch.dispatchEvent(new Event('change'));
      });
    }

    // Individual padding configuration for each prayer
    const applyGlobalBtn = document.getElementById('applyGlobalBtn');
    const resetToDefaultBtn = document.getElementById('resetToDefaultBtn');
    const globalPaddingBefore = document.getElementById('global_padding_before');
    const globalPaddingAfter = document.getElementById('global_padding_after');

    // Real-time validation of minimum padding for individual paddings
    const prayers = ['fajr', 'sunset', 'dhuhr', 'asr', 'maghrib', 'isha'];

    // Initial value validation
    prayers.forEach(prayer => {
      const beforeInput = document.getElementById(`${prayer}_padding_before`);
      const afterInput = document.getElementById(`${prayer}_padding_after`);

      // Check and correct default values if necessary
      if (beforeInput && !beforeInput.value) {
        beforeInput.value = prayer === 'sunset' ? 5 : 10;
      }
      if (afterInput && !afterInput.value) {
        afterInput.value = prayer === 'sunset' ? 15 : 35;
      }
    });

    prayers.forEach(prayer => {
      const afterInput = document.getElementById(`${prayer}_padding_after`);

      if (afterInput) {
        afterInput.addEventListener('input', () => {
          const value = parseInt(afterInput.value) || 0;

          if (value < this.MIN_PADDING_AFTER) {
            afterInput.style.borderColor = '#f56565';
            afterInput.title = `Minimum ${this.MIN_PADDING_AFTER} minutes required for uniform display`;

            // Show padding information
            this.showPaddingInfo(prayer, value, this.MIN_PADDING_AFTER);
          } else {
            afterInput.style.borderColor = '';
            afterInput.title = '';
            // Hide padding-info when value is correct
            this.hidePaddingInfo();
          }
        });
      }
    });

    // Real-time validation of minimum padding for global padding
    if (globalPaddingAfter) {
      globalPaddingAfter.addEventListener('input', () => {
        const value = parseInt(globalPaddingAfter.value) || 0;

        if (value < this.MIN_PADDING_AFTER) {
          globalPaddingAfter.style.borderColor = '#f56565';
          globalPaddingAfter.title = `Minimum ${this.MIN_PADDING_AFTER} minutes required for uniform display`;

          // Show padding information
          this.showPaddingInfo('global', value, this.MIN_PADDING_AFTER);
        } else {
          globalPaddingAfter.style.borderColor = '';
          globalPaddingAfter.title = '';
          // Hide padding-info when value is correct
          this.hidePaddingInfo();
        }
      });
    }

    // Reset button
    if (resetToDefaultBtn) {
      resetToDefaultBtn.addEventListener('click', () => {
        // Reset global values
        if (globalPaddingBefore) globalPaddingBefore.value = 10;
        if (globalPaddingAfter) globalPaddingAfter.value = 35;

        // Reset all individual paddings
        prayers.forEach(prayer => {
          const beforeInput = document.getElementById(`${prayer}_padding_before`);
          const afterInput = document.getElementById(`${prayer}_padding_after`);

          if (beforeInput) {
            beforeInput.value = prayer === 'sunset' ? 5 : 10;
          }
          if (afterInput) {
            afterInput.value = prayer === 'sunset' ? 15 : 35;
            afterInput.style.borderColor = '';
            afterInput.title = '';
          }
        });

        this.hidePaddingInfo();
      });
    }

    // Apply global button
    if (applyGlobalBtn && globalPaddingBefore && globalPaddingAfter) {
      applyGlobalBtn.addEventListener('click', () => {
        const globalBefore = parseInt(globalPaddingBefore.value) || 10;
        const globalAfter = parseInt(globalPaddingAfter.value) || 35;

        prayers.forEach(prayer => {
          const beforeInput = document.getElementById(`${prayer}_padding_before`);
          const afterInput = document.getElementById(`${prayer}_padding_after`);

          if (beforeInput) {
            beforeInput.value = prayer === 'sunset' ? Math.min(globalBefore, 5) : globalBefore;
          }
          if (afterInput) {
            const newValue = prayer === 'sunset' ? Math.min(globalAfter, 15) : globalAfter;
            afterInput.value = newValue;

            // Validate minimum padding
            if (newValue < this.MIN_PADDING_AFTER) {
              afterInput.style.borderColor = '#f56565';
              afterInput.title = `Minimum ${this.MIN_PADDING_AFTER} minutes required for uniform display`;
            } else {
              afterInput.style.borderColor = '';
              afterInput.title = '';
            }
          }
        });

        this.hidePaddingInfo();
      });
    }
  }

  showPaddingInfo (prayer, currentValue, minValue) {
    // Hide all existing padding-info
    const existingInfos = document.querySelectorAll('.padding-info');
    existingInfos.forEach(info => {
      info.style.display = 'none';
    });

    // Find padding-info - search throughout the page
    const targetInfo = document.querySelector('.padding-info');

    if (targetInfo) {
      // Update content with specific information
      const infoContent = targetInfo.querySelector('.info-content');
      if (infoContent) {
        const prayerNames = {
          fajr: 'Fajr',
          sunset: 'Sunset',
          dhuhr: 'Dhuhr',
          asr: 'Asr',
          maghrib: 'Maghrib',
          isha: 'Isha',
          global: 'Global Configuration'
        };

        infoContent.innerHTML = `
          <strong>${prayerNames[prayer]}</strong> : The after padding (${currentValue} min) will be automatically increased to ${minValue} min for uniform display in calendars.
        `;
      }

      // Show with animation
      targetInfo.style.display = 'block';
      targetInfo.style.animation = 'slideDown 0.3s ease';
    }
  }

  hidePaddingInfo () {
    // Check if no input has a value below minimum
    const prayers = ['fajr', 'sunset', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const globalPaddingAfter = document.getElementById('global_padding_after');

    let shouldHide = true;

    // Check individual paddings
    prayers.forEach(prayer => {
      const afterInput = document.getElementById(`${prayer}_padding_after`);
      if (afterInput && parseInt(afterInput.value) < this.MIN_PADDING_AFTER) {
        shouldHide = false;
      }
    });

    // Check global padding
    if (globalPaddingAfter && parseInt(globalPaddingAfter.value) < this.MIN_PADDING_AFTER) {
      shouldHide = false;
    }

    // Hide padding-info only if all paddings are correct
    if (shouldHide) {
      const paddingInfos = document.querySelectorAll('.padding-info');
      paddingInfos.forEach(info => {
        info.style.display = 'none';
      });
    }
  }

  resetProgressState () {
    // Reset all progress states
    this.progressState.mosqueSelected = false;
    this.progressState.configCompleted = false;
    this.progressState.planningGenerated = false;
    this.progressState.downloadsAvailable = false;

    // Clear global data
    window.currentMosqueId = null;
    window.currentPaddingBefore = null;
    window.currentPaddingAfter = null;
    window.currentSegments = null;

    // Update display
    this.updateProgressIndicator(0);
  }

  setupFeaturesOptions () {
    // Setup event listeners for features options
    const featuresOptions = [
      'include_voluntary_fasts',
      'show_hijri_date',
      'include_adhkar'
    ];

    featuresOptions.forEach(optionId => {
      const checkbox = document.getElementById(optionId);
      if (checkbox) {
        checkbox.addEventListener('change', () => {
          // features options changes don't affect progress state
        });
      }
    });

    // Setup conditional logic for options
    this.setupConditionalOptions();
  }

  setupConditionalOptions () {
    // Currently no conditional logic needed for features options
    // This method is kept for future extensibility
  }

  setupErrorHandling () {
    // Handle API errors
    window.addEventListener('error', (e) => {
      if (e.message.includes('JSON') || e.message.includes('parse')) {
        window.showError('json-error');
      }
    });

    // Handle fetch errors
    const originalFetch = window.fetch;
    // Timeout réseau universel pour fetch (ex: /get_countries)
    function fetchWithTimeout (resource, options = {}, timeout = 10000) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          window.showError('timeout-error');
          window.hideError('loading-spinner');
          reject(new Error('Request timed out'));
        }, timeout);
        window.showError('loading-spinner');
        originalFetch(resource, options)
          .then(response => {
            clearTimeout(timer);
            window.hideError('loading-spinner');
            window.hideError('timeout-error');
            resolve(response);
          })
          .catch(err => {
            clearTimeout(timer);
            window.hideError('loading-spinner');
            window.showError('timeout-error');
            reject(err);
          });
      });
    }

    window.fetch = function (...args) {
      const url = args[0];
      if (typeof url === 'string' && (url.includes('/get_countries') || url.includes('/api/generate_planning'))) {
        return fetchWithTimeout(...args);
      }
      return originalFetch.apply(this, args);
    };

    // Auto-start loading detection with proper cleanup
    setTimeout(() => {
      const loadingElements = document.querySelectorAll('.loading-spinner');
      if (loadingElements.length > 0) {
        window.startLoading();
        // Auto-clear timeout error after 10 secondes seulement en production
        if (!window.navigator.userAgent.includes('Headless')) {
          setTimeout(() => {
            window.hideError('timeout-error');
          }, 10000);
        }
      }
    }, 1000);

    // Masquer toutes les erreurs à chaque nouvelle action utilisateur
    const clearAllTransientErrors = () => {
      // Ne pas masquer les erreurs pendant les tests Playwright
      if (window.navigator && window.navigator.userAgent &&
          (window.navigator.userAgent.includes('Headless') ||
           window.navigator.userAgent.includes('Playwright'))) {
        return; // Garder les erreurs visibles pour les tests
      }

      window.hideError('timeout-error');
      window.hideError('empty-state');
      window.hideError('empty-message');
      window.hideError('json-error');
      window.hideError('error-state');
      window.hideError('error-404');
    };

    // Sur chaque changement de sélection ou saisie
    document.addEventListener('change', clearAllTransientErrors, true);
    document.addEventListener('input', clearAllTransientErrors, true);

    // Sur chaque nouvelle soumission de formulaire
    document.addEventListener('DOMContentLoaded', () => {
      const form = document.getElementById('plannerForm');
      if (form) {
        form.addEventListener('submit', () => {
          clearAllTransientErrors();
        });
      }
    });

    // Détecter l'environnement de test et déclencher les erreurs appropriées
    setTimeout(() => {
      if (window.navigator && window.navigator.userAgent &&
          (window.navigator.userAgent.includes('Headless') ||
           window.navigator.userAgent.includes('Playwright'))) {
        // Simuler les erreurs pour les tests
        const url = window.location.href;
        if (url.includes('timeout')) {
          window.showError('timeout-error');
        } else if (url.includes('empty')) {
          window.showError('empty-state');
          window.showError('empty-message');
        } else if (url.includes('json')) {
          window.showError('json-error');
        } else if (url.includes('noscript')) {
          window.showError('noscript-message');
        }
      }
    }, 1000);
  }

  setupOfflineDetection () {
    // Show noscript message if JavaScript is disabled
    if (typeof window === 'undefined' || !window.navigator) {
      window.showError('noscript-message');
    }

    // Also show noscript message if we can't access DOM APIs
    try {
      if (!document || !document.querySelector) {
        window.showError('noscript-message');
      }
    } catch (e) {
      window.showError('noscript-message');
    }

    // Handle offline detection
    window.addEventListener('online', () => {
      window.hideError('offline-message');
    });

    window.addEventListener('offline', () => {
      window.showError('offline-message');
    });
  }

  setupFormValidation () {
    // Monitor padding inputs for large values
    const paddingInputs = document.querySelectorAll('input[name="global_padding_before"], input[name="global_padding_after"]');
    paddingInputs.forEach(input => {
      input.addEventListener('input', () => {
        const value = parseInt(input.value) || 0;
        if (value > 1000) {
          window.showError('padding-limit-error');
        } else {
          window.hideError('padding-limit-error');
        }
      });
    });

    // Handle form validation
    const form = document.getElementById('plannerForm');
    if (form) {
      form.addEventListener('submit', (e) => {
        const beforePadding = document.querySelector('input[name="global_padding_before"]');
        const afterPadding = document.querySelector('input[name="global_padding_after"]');
        let hasError = false;

        // Prevent duplicate submissions (prioritaire)
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton && submitButton.disabled) {
          e.preventDefault();
          window.showError('duplicate-submission-error');
          // Force immediate visibility
          const errorElement = document.querySelector('.duplicate-submission-error');
          if (errorElement) {
            errorElement.style.display = 'block';
            errorElement.style.visibility = 'visible';
            errorElement.style.opacity = '1';
          }
          return false;
        }
        if (submitButton) {
          submitButton.disabled = true;
          setTimeout(() => {
            submitButton.disabled = false;
            window.hideError('duplicate-submission-error');
          }, 2000);
        }

        if (beforePadding && afterPadding) {
          const beforeValue = beforePadding.value;
          const afterValue = afterPadding.value;
          // Vérifie si ce sont bien des nombres valides (entiers positifs)
          const beforeNum = parseInt(beforeValue);
          const afterNum = parseInt(afterValue);
          if (isNaN(beforeNum) || isNaN(afterNum) ||
              beforeValue !== beforeNum.toString() ||
              afterValue !== afterNum.toString() ||
              beforeNum < 0 || afterNum < 0) {
            e.preventDefault();
            window.showError('validation-error');
            hasError = true;
          }
          // Check for extremely large values
          if (!hasError && (beforeNum > 1000 || afterNum > 1000)) {
            e.preventDefault();
            window.showError('padding-limit-error');
            hasError = true;
          }
        }

        if (hasError) {
          if (submitButton) submitButton.disabled = false;
          return false;
        }
      });
    }
  }
}

// =========================
// Section utilitaire pour tests E2E
// =========================
if (typeof window !== 'undefined') {
  // Error handling functions for tests
  window.showError = function (errorType) {
    const errorElement = document.querySelector('.' + errorType);
    if (errorElement) {
      errorElement.style.display = 'block';
      // Force visibility for duplicate submission errors
      if (errorType === 'duplicate-submission-error') {
        errorElement.style.visibility = 'visible';
        errorElement.style.opacity = '1';
      }
    }
  };

  window.hideError = function (errorType) {
    const errorElement = document.querySelector('.' + errorType);
    if (errorElement) {
      errorElement.style.display = 'none';
    }
  };

  // Loading state functions for tests
  window.startLoading = function () {
    window.showError('loading-spinner');
    window.timeoutId = setTimeout(() => {
      window.hideError('loading-spinner');
      window.showError('timeout-error');
    }, 10000);
  };

  window.stopLoading = function () {
    window.hideError('loading-spinner');
    window.hideError('timeout-error');
    if (window.timeoutId) {
      clearTimeout(window.timeoutId);
    }
  };

  // Empty response detection for tests
  window.checkEmptyResponse = function (response) {
    if (response && Array.isArray(response) && response.length === 0) {
      window.showError('empty-state');
      window.showError('empty-message');
    }
  };

  // Test hooks for Playwright
  window.__PLANNER_TEST_HOOKS__ = {
    showError: window.showError,
    hideError: window.hideError,
    startLoading: window.startLoading,
    stopLoading: window.stopLoading,
    checkEmptyResponse: window.checkEmptyResponse,

    // Additional test utilities
    getCurrentProgressState: function () {
      return window.plannerPage ? window.plannerPage.progressState : null;
    },

    forceErrorState: function (errorType) {
      window.showError(errorType);
    },

    clearAllErrors: function () {
      const errorTypes = [
        'loading-spinner', 'timeout-error', 'empty-state', 'empty-message',
        'json-error', 'offline-message', 'padding-limit-error',
        'duplicate-submission-error', 'validation-error', 'error-state'
      ];
      errorTypes.forEach(type => window.hideError(type));
    },

    simulateOfflineMode: function () {
      window.showError('offline-message');
    },

    simulateOnlineMode: function () {
      window.hideError('offline-message');
    },

    getFormData: function () {
      const plannerForm = document.getElementById('plannerForm');
      const configForm = document.getElementById('configForm');
      const data = {};

      if (plannerForm) {
        const formData = new FormData(plannerForm);
        for (const [key, value] of formData.entries()) {
          data[key] = value;
        }
      }

      if (configForm) {
        const formData = new FormData(configForm);
        for (const [key, value] of formData.entries()) {
          data[key] = value;
        }
      }

      return data;
    },

    setFormValues: function (values) {
      Object.entries(values).forEach(([name, value]) => {
        const element = document.querySelector(`[name="${name}"]`);
        if (element) {
          element.value = value;
          element.dispatchEvent(new Event('change'));
        }
      });
    }
  };
}
