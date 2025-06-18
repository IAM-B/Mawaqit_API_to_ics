/**
 * Timeline class for displaying prayer times and available slots
 * This class handles the visualization of prayer times and available time slots
 * in a timeline format, with navigation capabilities.
 */
class Timeline {
  /**
   * Constructor initializes the timeline with segments data and scope
   * @param {string} containerId - ID of the HTML container element
   * @param {Object} segments - Prayer time segments data
   * @param {string} scope - Time scope ('today', 'month', or 'year')
   */
  constructor(containerId, segments, scope) {
    console.log('Timeline constructor called with:', { containerId, segments, scope });
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Container not found:', containerId);
      return;
    }
    this.segments = segments;
    this.scope = scope;
    this.currentIndex = 0;
    this.currentDayIndex = 0;
    this.slotsContainer = document.getElementById('availableSlotsList');
    this.init();
  }

  /**
   * Converts time string (HH:MM) to percentage position on timeline
   * @param {string} time - Time in HH:MM format
   * @returns {number} Position as percentage of 24-hour day
   */
  formatTime(time) {
    const [hours, minutes] = time.split(':');
    return (parseInt(hours) + parseInt(minutes) / 60) * (100 / 24);
  }

  /**
   * Creates a visual element for an event on the timeline
   * @param {Object} event - Event data with start/end times and content
   * @param {string} type - Type of event ('prayer' or 'slot')
   * @returns {HTMLElement} Created event element
   */
  createEventElement(event, type) {
    const element = document.createElement('div');
    element.className = `timeline-event ${type}`;
    element.style.left = `${this.formatTime(event.start)}%`;
    if (event.end) {
      element.style.width = `${this.formatTime(event.end) - this.formatTime(event.start)}%`;
    } else {
      element.style.width = '2%';
    }
    element.title = `${event.content} (${event.start}${event.end ? ' - ' + event.end : ''})`;
    return element;
  }

  /**
   * Gets the current data based on scope and navigation state
   * @returns {Object} Current segment data
   */
  getCurrentData() {
    console.log('Getting current data for scope:', this.scope);
    console.log('Current segments:', this.segments);
    
    if (this.scope === 'today') {
      return this.segments;
    } else if (this.scope === 'month') {
      return this.segments[this.currentIndex];
    } else if (this.scope === 'year') {
      return this.segments[this.currentIndex].days[this.currentDayIndex];
    }
    return null;
  }

  /**
   * Formats date for display based on scope and data
   * @param {Object} data - Current segment data
   * @returns {string} Formatted date string
   */
  formatDate(data) {
    if (!data) {
      console.error('No data provided to formatDate');
      return '';
    }
    if (data.date) {
      const [day, month, year] = data.date.split('/');
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    return this.scope === 'month' ? `Jour ${data.day}` : 
           this.scope === 'year' ? `Mois ${data.month}` : 'Aujourd\'hui';
  }

  /**
   * Updates the available slots display section
   * @param {Object} data - Current segment data containing slots
   */
  updateAvailableSlots(data) {
    if (!this.slotsContainer) {
      console.error('Slots container not found');
      return;
    }

    this.slotsContainer.innerHTML = '';

    if (!data) {
      this.slotsContainer.innerHTML = '<p>Aucune donnée disponible.</p>';
      return;
    }

    const slotsList = document.createElement('ul');

    // Handle different scopes (today/month vs year)
    if (this.scope === 'today' || this.scope === 'month') {
      if (data.slots && data.slots.length > 0) {
        const formattedDate = this.formatDate(data);
        const dateItem = document.createElement('li');
        dateItem.innerHTML = `<strong>${formattedDate} :</strong>`;
        
        const slotsSubList = document.createElement('ul');
        data.slots.forEach(slot => {
          const slotItem = document.createElement('li');
          slotItem.textContent = `${slot.start} - ${slot.end}`;
          slotsSubList.appendChild(slotItem);
        });

        dateItem.appendChild(slotsSubList);
        slotsList.appendChild(dateItem);
      }
    } else if (this.scope === 'year') {
      const currentMonth = this.segments[this.currentIndex];
      if (currentMonth && currentMonth.days && currentMonth.days.length > 0) {
        const currentDay = currentMonth.days[this.currentDayIndex];
        if (currentDay && currentDay.slots && currentDay.slots.length > 0) {
          const formattedDate = this.formatDate(currentDay);
          const dateItem = document.createElement('li');
          dateItem.innerHTML = `<strong>${formattedDate} :</strong>`;
          
          const slotsSubList = document.createElement('ul');
          currentDay.slots.forEach(slot => {
            const slotItem = document.createElement('li');
            slotItem.textContent = `${slot.start} - ${slot.end}`;
            slotsSubList.appendChild(slotItem);
          });

          dateItem.appendChild(slotsSubList);
          slotsList.appendChild(dateItem);
        }
      }
    }

    if (slotsList.children.length === 0) {
      this.slotsContainer.innerHTML = '<p>Aucun créneau disponible pour cette période.</p>';
    } else {
      this.slotsContainer.appendChild(slotsList);
    }
  }

  /**
   * Updates the entire timeline display
   * This includes prayer times, available slots, and navigation controls
   */
  updateTimeline() {
    console.log('Updating timeline');
    this.container.innerHTML = '';
    const currentData = this.getCurrentData();
    console.log('Current data:', currentData);

    if (!currentData) {
      console.error('No current data available');
      return;
    }

    // Calculate prayer periods with padding
    const prayerPeriods = [];
    if (currentData.prayer_times) {
      Object.entries(currentData.prayer_times).forEach(([prayer, time]) => {
        // Calculate start and end times with padding
        const [hours, minutes] = time.split(':');
        const prayerTime = new Date();
        prayerTime.setHours(parseInt(hours), parseInt(minutes));
        
        const paddingBefore = new Date(prayerTime);
        paddingBefore.setMinutes(paddingBefore.getMinutes() - 10); // default padding_before
        
        const paddingAfter = new Date(prayerTime);
        paddingAfter.setMinutes(paddingAfter.getMinutes() + 35); // default padding_after

        prayerPeriods.push({
          start: paddingBefore.toTimeString().slice(0, 5),
          end: paddingAfter.toTimeString().slice(0, 5),
          prayer: prayer
        });

        // Display prayer period
        this.container.appendChild(this.createEventElement({
          content: prayer,
          start: paddingBefore.toTimeString().slice(0, 5),
          end: paddingAfter.toTimeString().slice(0, 5)
        }, 'prayer'));
      });
    }

    // Sort prayer periods by start time
    prayerPeriods.sort((a, b) => a.start.localeCompare(b.start));

    // Calculate available slots between prayer periods
    const availableSlots = [];
    for (let i = 0; i < prayerPeriods.length; i++) {
      const currentPeriod = prayerPeriods[i];
      const nextPeriod = prayerPeriods[i + 1];

      // If not the last period, create a slot until next prayer
      if (nextPeriod) {
        availableSlots.push({
          start: currentPeriod.end,
          end: nextPeriod.start
        });
      }
    }

    // Display available slots
    availableSlots.forEach(slot => {
      this.container.appendChild(this.createEventElement({
        content: 'Disponible',
        start: slot.start,
        end: slot.end
      }, 'slot'));
    });

    // Update displayed date
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
      dateElement.textContent = this.formatDate(currentData);
    } else {
      console.error('Date element not found');
    }

    // Update navigation buttons
    if (this.scope !== 'today') {
      const prevBtn = document.getElementById('prevBtn');
      const nextBtn = document.getElementById('nextBtn');

      if (this.scope === 'month') {
        prevBtn.disabled = this.currentIndex === 0;
        nextBtn.disabled = this.currentIndex === this.segments.length - 1;
      } else if (this.scope === 'year') {
        prevBtn.disabled = this.currentIndex === 0 && this.currentDayIndex === 0;
        nextBtn.disabled = this.currentIndex === this.segments.length - 1 && 
                         this.currentDayIndex === this.segments[this.currentIndex].days.length - 1;
      }
    }

    // Update available slots display
    this.updateAvailableSlots(currentData);
  }

  /**
   * Handles timeline navigation
   * @param {number} direction - Navigation direction (-1 for previous, 1 for next)
   */
  navigate(direction) {
    console.log('Navigating:', direction);
    if (this.scope === 'month') {
      this.currentIndex += direction;
      if (this.currentIndex < 0) this.currentIndex = 0;
      if (this.currentIndex >= this.segments.length) {
        this.currentIndex = this.segments.length - 1;
      }
    } else if (this.scope === 'year') {
      if (direction > 0) {
        // Navigate right
        if (this.currentDayIndex < this.segments[this.currentIndex].days.length - 1) {
          this.currentDayIndex++;
        } else if (this.currentIndex < this.segments.length - 1) {
          this.currentIndex++;
          this.currentDayIndex = 0;
        }
      } else {
        // Navigate left
        if (this.currentDayIndex > 0) {
          this.currentDayIndex--;
        } else if (this.currentIndex > 0) {
          this.currentIndex--;
          this.currentDayIndex = this.segments[this.currentIndex].days.length - 1;
        }
      }
    }
    this.updateTimeline();
  }

  /**
   * Initializes the timeline
   * Called after constructor to set up initial display
   */
  init() {
    console.log('Initializing timeline');
    this.updateTimeline();
  }
}

// Export the class for use in template
window.Timeline = Timeline;