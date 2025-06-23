/**
 * Calendar Views Manager
 * Handles different calendar views for month and year scopes
 */
class CalendarViewsManager {
  constructor() {
    this.currentMonth = new Date().getMonth();
    this.currentYear = new Date().getFullYear();
    this.selectedMonth = this.currentMonth;
    this.selectedYear = this.currentYear;
    this.selectedDay = new Date().getDate();
    this.segments = [];
    this.scope = '';
    this.clockInstance = null;
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Month navigation
    document.addEventListener('click', (e) => {
      if (e.target.id === 'prevMonthBtn') {
        this.navigateMonth(-1);
      } else if (e.target.id === 'nextMonthBtn') {
        this.navigateMonth(1);
      } else if (e.target.id === 'prevYearBtn') {
        this.navigateYear(-1);
      } else if (e.target.id === 'nextYearBtn') {
        this.navigateYear(1);
      }
    });
  }

  /**
   * Set clock instance for synchronization
   */
  setClockInstance(clockInstance) {
    this.clockInstance = clockInstance;
  }

  /**
   * Initialize calendar views based on scope
   */
  initializeViews(segments, scope) {
    this.segments = segments;
    this.scope = scope;
    
    // Hide all views first
    this.hideAllViews();
    
    if (scope === 'month') {
      this.showMonthView();
      this.renderMonthCalendar();
    } else if (scope === 'year') {
      this.showYearView();
      this.renderYearCalendar();
    } else {
      this.showDefaultView();
    }
  }

  hideAllViews() {
    const views = [
      'monthCalendarView',
      'yearCalendarView', 
      'defaultSlotsView'
    ];
    
    views.forEach(viewId => {
      const view = document.getElementById(viewId);
      if (view) view.style.display = 'none';
    });
  }

  showMonthView() {
    const view = document.getElementById('monthCalendarView');
    if (view) view.style.display = 'block';
  }

  showYearView() {
    const view = document.getElementById('yearCalendarView');
    if (view) view.style.display = 'block';
  }

  showDefaultView() {
    const view = document.getElementById('defaultSlotsView');
    if (view) view.style.display = 'block';
  }

  /**
   * Render month calendar (Google Calendar style)
   */
  renderMonthCalendar() {
    const container = document.getElementById('monthCalendarDays');
    const titleElement = document.getElementById('currentMonthTitle');
    
    if (!container || !titleElement) return;

    // Update title
    const monthNames = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    titleElement.textContent = `${monthNames[this.selectedMonth]} ${this.selectedYear}`;

    // Clear container
    container.innerHTML = '';

    // Get first day of month and number of days
    const firstDay = new Date(this.selectedYear, this.selectedMonth, 1);
    const lastDay = new Date(this.selectedYear, this.selectedMonth + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1); // Start from Monday

    // Generate calendar days
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayElement = this.createDayElement(currentDate);
      container.appendChild(dayElement);
    }
  }

  createDayElement(date) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    
    dayElement.appendChild(dayNumber);

    // Check if it's current month
    if (date.getMonth() !== this.selectedMonth) {
      dayElement.classList.add('other-month');
    }

    // Check if it's today
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      dayElement.classList.add('today');
    }

    // Check if it's selected day
    if (date.getDate() === this.selectedDay && date.getMonth() === this.selectedMonth) {
      dayElement.classList.add('selected');
    }

    // Check if day has slots data
    if (this.scope === 'month' && this.segments.length > 0) {
      const dayIndex = date.getDate() - 1;
      if (dayIndex >= 0 && dayIndex < this.segments.length) {
        const dayData = this.segments[dayIndex];
        if (dayData && dayData.slots && dayData.slots.length > 0) {
          dayElement.classList.add('has-slots');
          
          const slotsIndicator = document.createElement('div');
          slotsIndicator.className = 'day-slots-indicator';
          
          const slotsCount = document.createElement('div');
          slotsCount.className = 'day-slots-count';
          slotsCount.textContent = `${dayData.slots.length} créneau${dayData.slots.length > 1 ? 'x' : ''}`;
          
          slotsIndicator.appendChild(slotsCount);
          dayElement.appendChild(slotsIndicator);

          // Add click event to select day and update clock
          dayElement.addEventListener('click', () => {
            this.selectDay(date.getDate(), dayData);
          });
        }
      }
    }

    // Add click event for all days (even without slots)
    dayElement.addEventListener('click', () => {
      if (date.getMonth() === this.selectedMonth) {
        this.selectDay(date.getDate());
      }
    });

    return dayElement;
  }

  /**
   * Render year calendar (Phone calendar style)
   */
  renderYearCalendar() {
    const container = document.getElementById('yearMonthsGrid');
    const titleElement = document.getElementById('currentYearTitle');
    
    if (!container || !titleElement) return;

    // Update title
    titleElement.textContent = this.selectedYear.toString();

    // Clear container
    container.innerHTML = '';

    // Generate month cards
    const monthNames = [
      'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
      'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'
    ];

    for (let month = 0; month < 12; month++) {
      const monthCard = this.createMonthCard(month, monthNames[month]);
      container.appendChild(monthCard);
    }
  }

  createMonthCard(monthIndex, monthName) {
    const monthCard = document.createElement('div');
    monthCard.className = 'month-card';
    
    const monthNameElement = document.createElement('div');
    monthNameElement.className = 'month-name';
    monthNameElement.textContent = monthName;
    
    const monthYearElement = document.createElement('div');
    monthYearElement.className = 'month-year';
    monthYearElement.textContent = this.selectedYear.toString();
    
    monthCard.appendChild(monthNameElement);
    monthCard.appendChild(monthYearElement);

    // Check if it's current month
    if (monthIndex === this.currentMonth && this.selectedYear === this.currentYear) {
      monthCard.classList.add('current-month');
    }

    // Check if it's selected month
    if (monthIndex === this.selectedMonth) {
      monthCard.classList.add('selected');
    }

    // Check if month has data
    if (this.scope === 'year' && this.segments.length > 0) {
      const monthData = this.segments[monthIndex];
      if (monthData && monthData.days && monthData.days.length > 0) {
        monthCard.classList.add('has-data');
        
        const slotsInfo = document.createElement('div');
        slotsInfo.className = 'month-slots-info';
        
        // Count total slots in month
        let totalSlots = 0;
        monthData.days.forEach(day => {
          if (day.slots) totalSlots += day.slots.length;
        });
        
        const slotsCount = document.createElement('div');
        slotsCount.className = 'month-slots-count';
        slotsCount.textContent = `${totalSlots} créneau${totalSlots > 1 ? 'x' : ''}`;
        
        slotsInfo.appendChild(slotsCount);
        monthCard.appendChild(slotsInfo);
      }
    }

    // Add click event to select month and update clock
    monthCard.addEventListener('click', () => {
      this.selectMonth(monthIndex);
    });

    return monthCard;
  }

  /**
   * Select a day and update clock
   */
  selectDay(day, dayData = null) {
    // Remove previous selection
    const previousSelected = document.querySelector('.calendar-day.selected');
    if (previousSelected) {
      previousSelected.classList.remove('selected');
    }

    // Add selection to current day
    const currentDay = document.querySelector(`.calendar-day:not(.other-month)`);
    if (currentDay) {
      currentDay.classList.add('selected');
    }

    this.selectedDay = day;

    // Update clock if available
    if (this.clockInstance && this.scope === 'month') {
      const dayIndex = day - 1;
      if (dayIndex >= 0 && dayIndex < this.segments.length) {
        this.clockInstance.currentIndex = dayIndex;
        this.clockInstance.updateClock();
      }
    }
  }

  /**
   * Select a month and update clock
   */
  selectMonth(monthIndex) {
    // Remove previous selection
    const previousSelected = document.querySelector('.month-card.selected');
    if (previousSelected) {
      previousSelected.classList.remove('selected');
    }

    // Add selection to current month
    const monthCards = document.querySelectorAll('.month-card');
    if (monthCards[monthIndex]) {
      monthCards[monthIndex].classList.add('selected');
    }

    this.selectedMonth = monthIndex;

    // Update clock if available
    if (this.clockInstance && this.scope === 'year') {
      this.clockInstance.currentIndex = monthIndex;
      this.clockInstance.currentDayIndex = 0; // Reset to first day of month
      this.clockInstance.updateClock();
    }
  }

  /**
   * Navigate between months
   */
  navigateMonth(direction) {
    this.selectedMonth += direction;
    
    if (this.selectedMonth < 0) {
      this.selectedMonth = 11;
      this.selectedYear--;
    } else if (this.selectedMonth > 11) {
      this.selectedMonth = 0;
      this.selectedYear++;
    }
    
    this.renderMonthCalendar();
  }

  /**
   * Navigate between years
   */
  navigateYear(direction) {
    this.selectedYear += direction;
    this.renderYearCalendar();
  }

  /**
   * Show day details in a modal or expand view
   */
  showDayDetails(dayData, date) {
    // Create modal for day details
    const modal = document.createElement('div');
    modal.className = 'day-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${date.toLocaleDateString('fr-FR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="day-slots-list">
            ${this.renderDaySlots(dayData)}
          </div>
        </div>
      </div>
    `;

    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
      .day-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal-content {
        background: var(--form-bg);
        border-radius: 12px;
        max-width: 500px;
        width: 90%;
        max-height: 80%;
        overflow-y: auto;
      }
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        border-bottom: 1px solid var(--border-color);
      }
      .modal-close {
        background: none;
        border: none;
        font-size: 1.5em;
        cursor: pointer;
        color: var(--text-muted);
      }
      .modal-body {
        padding: 20px;
      }
      .day-slots-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
    `;
    document.head.appendChild(style);

    // Add close functionality
    modal.querySelector('.modal-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    document.body.appendChild(modal);
  }

  /**
   * Show month details in a modal or expand view
   */
  showMonthDetails(monthData, monthIndex, monthName) {
    // Create modal for month details
    const modal = document.createElement('div');
    modal.className = 'month-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${monthName} ${this.selectedYear}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="month-days-grid">
            ${this.renderMonthDays(monthData)}
          </div>
        </div>
      </div>
    `;

    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
      .month-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .month-days-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 5px;
      }
      .month-day-item {
        padding: 8px;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      .month-day-item:hover {
        background: var(--primary);
        color: white;
      }
      .month-day-item.has-slots {
        background: var(--primary);
        color: white;
      }
    `;
    document.head.appendChild(style);

    // Add close functionality
    modal.querySelector('.modal-close').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });

    document.body.appendChild(modal);
  }

  /**
   * Render day slots for modal
   */
  renderDaySlots(dayData) {
    if (!dayData.slots || dayData.slots.length === 0) {
      return '<p>Aucun créneau disponible pour ce jour.</p>';
    }

    return dayData.slots.map(slot => `
      <div class="slot-item">
        <span class="slot-time">${slot.start} - ${slot.end}</span>
        <span class="slot-duration">${this.calculateDuration(slot.start, slot.end)}</span>
      </div>
    `).join('');
  }

  /**
   * Render month days for modal
   */
  renderMonthDays(monthData) {
    if (!monthData.days || monthData.days.length === 0) {
      return '<p>Aucune donnée disponible pour ce mois.</p>';
    }

    return monthData.days.map(day => `
      <div class="month-day-item ${day.slots && day.slots.length > 0 ? 'has-slots' : ''}">
        <div class="day-number">${day.day}</div>
        ${day.slots && day.slots.length > 0 ? 
          `<div class="day-slots-count">${day.slots.length}</div>` : 
          ''
        }
      </div>
    `).join('');
  }

  /**
   * Calculate duration between two times
   */
  calculateDuration(start, end) {
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);
    const duration = endMinutes - startMinutes;
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? minutes : ''}`;
    } else {
      return `${minutes}min`;
    }
  }

  /**
   * Convert time string to minutes
   */
  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

// Initialize calendar views manager
let calendarViewsManager;

document.addEventListener('DOMContentLoaded', () => {
  calendarViewsManager = new CalendarViewsManager();
  // Expose globally for access from other scripts
  window.calendarViewsManager = calendarViewsManager;
}); 