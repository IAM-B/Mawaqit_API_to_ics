// Planner page logic: forms, AJAX, feedback, config, download, etc.

import { initializeCompactMap } from '../components/map.js';
import { Clock } from '../components/clock.js';
import { formatDateForDisplay, timeToMinutes, minutesToTime } from '../utils/utils.js';
import { getPaddingBefore, getPaddingAfter, getRealPaddingBefore, getRealPaddingAfter } from '../utils/padding.js';

export class PlannerPage {
  constructor() {
    this.init();
  }

  init() {
    this.setupFormHandling();
    this.setupPlanningAnimation();
  }

  setupFormHandling() {
    const plannerForm = document.getElementById('plannerForm');
    const configForm = document.getElementById('configForm');
    const submitBtn = document.querySelector('.btn-submit');
    if (configForm && submitBtn) {
      configForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        this.showLoadingState(submitBtn);
        try {
          const plannerFormData = new FormData(plannerForm);
          const configFormData = new FormData(configForm);
          const combinedFormData = new FormData();
          for (let [key, value] of plannerFormData.entries()) {
            combinedFormData.append(key, value);
          }
          for (let [key, value] of configFormData.entries()) {
            combinedFormData.append(key, value);
          }
          const includeSunsetCheckbox = document.getElementById('include_sunset');
          if (includeSunsetCheckbox) {
            combinedFormData.set('include_sunset', includeSunsetCheckbox.checked ? 'on' : '');
          }
          const response = await fetch('/api/generate_planning', {
            method: 'POST',
            body: combinedFormData
          });
          const result = await response.json();
          if (result.success) {
            this.updatePageWithPlanningData(result.data);
            this.showSuccessMessage('Planning généré avec succès !');
          } else {
            throw new Error(result.error || 'Erreur lors de la génération');
          }
        } catch (error) {
          console.error('Error generating planning:', error);
          this.showErrorMessage(error.message);
        } finally {
          this.hideLoadingState(submitBtn);
        }
      });
    }
  }

  showLoadingState(submitBtn) {
    submitBtn.classList.add('loading');
    submitBtn.textContent = '🔄 Génération en cours...';
    submitBtn.disabled = true;
  }

  hideLoadingState(submitBtn) {
    submitBtn.classList.remove('loading');
    submitBtn.textContent = '📥 Générer planning';
    submitBtn.disabled = false;
  }

  showSuccessMessage(message) {
    this.showMessage(message, 'success');
  }

  showErrorMessage(message) {
    this.showMessage(message, 'error');
  }

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

  updatePageWithPlanningData(data) {
    window.currentMosqueId = data.masjid_id;
    window.currentPaddingBefore = data.padding_before;
    window.currentPaddingAfter = data.padding_after;
    window.currentMonth = new Date().getMonth();
    window.currentYear = new Date().getFullYear();
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
    let year, month;
    if (window.clockCalendar && window.clockCalendar.selectedYear && window.clockCalendar.selectedMonth) {
      year = window.clockCalendar.selectedYear;
      month = window.clockCalendar.selectedMonth;
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }
  }

  showSummaryDisplay() {
    const summaryDisplay = document.querySelector('.summary-display');
    if (summaryDisplay) {
      summaryDisplay.classList.remove('hidden');
      summaryDisplay.classList.add('fade-in-up');
      setTimeout(() => summaryDisplay.classList.add('visible'), 100);
    }
  }

  updateMosqueInfo(data) {
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

  generateDownloadLinks(data) {
    const downloadGrid = document.querySelector('.download-grid');
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
      editA.innerHTML = `<span class="download-icon">✏️</span><span class="download-title">Modifier manuellement</span><span class="download-format">Créneaux</span>`;
      downloadGrid.appendChild(editA);
      const scopeDownloads = document.createElement('div');
      scopeDownloads.className = 'scope-downloads';
      scopeDownloads.innerHTML = `<h3>📥 Téléchargements par période</h3><div class="scope-buttons"></div>`;
      const scopeButtons = scopeDownloads.querySelector('.scope-buttons');
      const yearBtn = document.createElement('button');
      yearBtn.className = 'scope-download-btn year active';
      yearBtn.dataset.scope = 'year';
      yearBtn.innerHTML = `<span class="scope-icon">📅</span><span class="scope-title">Cette année</span>`;
      scopeButtons.appendChild(yearBtn);
      ['today', 'month'].forEach(scope => {
        const btn = document.createElement('button');
        btn.className = `scope-download-btn ${scope}`;
        btn.dataset.scope = scope;
        btn.innerHTML = `<span class="scope-icon">📅</span><span class="scope-title">${scope === 'today' ? "Aujourd'hui" : 'Ce mois'}</span>`;
        scopeButtons.appendChild(btn);
      });
      downloadGrid.appendChild(scopeDownloads);
      this.setupScopeDownloadButtons(data);
    }
  }

  setupScopeDownloadButtons(data) {
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
          this.showSuccessMessage(`Fichiers ICS pour ${scope} générés !`);
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
              return formData;
            })()
          });
          const result = await response.json();
          if (result.success) {
            this.generateDownloadLinks(result.data);
            this.updateActiveScopeButton(scope);
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

  updateActiveScopeButton(activeScope) {
    const scopeButtons = document.querySelectorAll('.scope-download-btn');
    scopeButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.scope === activeScope) {
        btn.classList.add('active');
      }
    });
  }

  initializeClock(data) {
    const clockContainer = document.getElementById('clockContent');
    if (!clockContainer) {
      console.error('❌ Clock container #clockContent not found in DOM');
      return;
    }
    if (!data.segments || data.segments.length === 0) {
      console.warn('⚠️ No segments data available for clock initialization');
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
        } else {
          console.warn('⚠️ No days data found for month', currentMonth);
        }
      }
      try {
        const clock = new Clock('clockContent', clockSegments, data.scope);
        window.clockInstance = clock;
        if (clockSegments && clockSegments.length > 0) {
          const currentDay = new Date().getDate();
          const todayIndex = Math.min(currentDay - 1, clockSegments.length - 1);
          clock.currentIndex = todayIndex;
          clock.updateClock();
          this.updateCalendarSelection(todayIndex);
        } else {
          console.warn('⚠️ No clock segments available for display');
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
      } catch (error) {
        console.error('❌ Error creating clock instance:', error);
      }
    } else {
      console.error('❌ Clock class not found in window.Clock');
    }
  }

  initializeClockCalendar(segments, scope) {
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

  createClockCalendarDay(date, segments, currentMonth, currentYear) {
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
      let monthSegments = [];
      if (segments[currentMonth] && segments[currentMonth].days) {
        monthSegments = segments[currentMonth].days;
      } else {
        monthSegments = segments;
      }
    }
    dayElement.addEventListener('click', () => {
      if (date.getMonth() === currentMonth) {
        this.selectClockCalendarDay(date.getDate(), segments);
      }
    });
    return dayElement;
  }

  selectClockCalendarDay(day, segments) {
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

  setupClockCalendarNavigation(segments, currentMonth, currentYear) {
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

  async navigateClockCalendarMonth(direction, segments, currentMonth, currentYear) {
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
    this.showSuccessMessage(`Navigation vers ${this.getMonthName(newMonth)} ${newYear}`);
  }

  getMosqueIdFromPage() {
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

  getMonthName(monthIndex) {
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return monthNames[monthIndex];
  }

  updateClockCalendarDisplay(month, year, segments) {
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

  showPlanningSections() {
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
    const noDataSection = document.querySelector('.no-data');
    if (noDataSection) {
      noDataSection.classList.add('hidden');
    }
  }

  setupPlanningAnimation() {
    const hasPlanningData = document.querySelector('.quick-actions') !== null;
    const hasClockConfig = document.getElementById('clockConfig') !== null;
    if (hasPlanningData && hasClockConfig) {
      setTimeout(() => {
        Clock.handlePlanningGeneration();
      }, 100);
    } else {
      console.log('No planning data found, skipping animation');
    }
  }

  static initClock() {
    const clockConfig = document.getElementById('clockConfig');
    if (!clockConfig) return;
    try {
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
    } catch (error) {
      console.error('Error initializing clock:', error);
    }
  }

  updateCalendarSelection(index) {
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
}
