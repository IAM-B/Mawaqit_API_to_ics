import { initMosqueSearchDropdowns } from './components/mosque_search.js';
import { initMosqueMapLoader } from './components/map.js';
import { Timeline } from './components/timeline.js';
import { CalendarViewsManager } from './components/calendar.js';
import { Clock } from './components/clock.js';
import { PlannerPage } from './pages/planner_page.js';

// Central initialization of all merged JS modules
document.addEventListener('DOMContentLoaded', () => {
  // 1. Dropdowns TomSelect (pays & mosquée)
  initMosqueSearchDropdowns();

  // 2. Main map (OpenStreetMap with clusters)
  initMosqueMapLoader();

  // 3. Vertical timeline (SVG agenda)
  window.timeline = new Timeline();

  // 4. Calendar (calendar grid)
  window.calendarViewsManager = new CalendarViewsManager();

  // 5. Circular clock (clock) - Expose Clock class globally
  window.Clock = Clock;

  // 6. PlannerPage (formulaires, config, etc.)
  // eslint-disable-next-line no-new
  new PlannerPage();

  // 7. Clock initialization if segments are already present (ex: after planning generation)
  if (document.getElementById('clockConfig')) {
    PlannerPage.initClock();
  }
});

// Central synchronization of planner views
window.selectedDate = new Date();
window.setSelectedDate = function (date) {
  if (!date) return;
  if (window.selectedDate && window.selectedDate.toDateString && window.selectedDate.toDateString() === date.toDateString()) {
    return;
  }
  window.selectedDate = new Date(date);

  // Timeline
  if (window.timeline && typeof window.timeline.setDate === 'function') {
    window.timeline.setDate(window.selectedDate);
  }

  // Clock
  if (window.clockInstance && typeof window.clockInstance.setDate === 'function') {
    window.clockInstance.setDate(window.selectedDate);
  }

  // Calendar
  if (window.calendarViewsManager && typeof window.calendarViewsManager.setDate === 'function') {
    window.calendarViewsManager.setDate(window.selectedDate);
  }
};
