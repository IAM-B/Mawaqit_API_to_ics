/**
 * Clock class for displaying prayer times and available slots
 * This class handles the visualization of prayer times and available time slots
 * in a circular clock format, with navigation capabilities.
 */
class Clock {
  /**
   * Constructor initializes the clock with segments data and scope
   * @param {string} containerId - ID of the HTML container element
   * @param {Object} segments - Prayer time segments data
   * @param {string} scope - Time scope ('today', 'month', or 'year')
   */
  constructor(containerId, segments, scope) {
    console.log('Clock constructor called with:', { containerId, segments, scope });
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
   * Converts time string (HH:MM) to angle in degrees
   * @param {string} time - Time in HH:MM format
   * @returns {number} Angle in degrees (0-360)
   */
  timeToAngle(time) {
    const [hours, minutes] = time.split(':');
    return ((parseInt(hours) + parseInt(minutes) / 60) * 360) / 24;
  }

  /**
   * Creates a visual element for an event on the clock
   * @param {Object} event - Event data with start/end times and content
   * @param {string} type - Type of event ('prayer' or 'slot')
   * @returns {HTMLElement} Created event element
   */
  createEventElement(event, type) {
    const element = document.createElement('div');
    element.className = `clock-event ${type}`;
    
    const startAngle = this.timeToAngle(event.start);
    const endAngle = event.end ? this.timeToAngle(event.end) : startAngle + 5;
    
    // Calculate the arc path with different radius based on type
    const radius = type === 'prayer' ? 140 : 120; // Prayer arcs are outer, slots are inner
    const startX = 150 + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const startY = 150 + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const endX = 150 + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const endY = 150 + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    
    // Create SVG path for the arc
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;
    const d = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
    
    path.setAttribute("d", d);
    path.setAttribute("class", `clock-arc ${type}`);
    element.appendChild(path);
    
    // Add label with better positioning
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = type === 'prayer' ? radius + 20 : radius - 20; // Labels outside for prayers, inside for slots
    const labelX = 150 + labelRadius * Math.cos((midAngle - 90) * Math.PI / 180);
    const labelY = 150 + labelRadius * Math.sin((midAngle - 90) * Math.PI / 180);
    
    const label = document.createElement("div");
    label.className = "clock-label";
    
    // Format label content based on type
    if (type === 'prayer') {
      label.textContent = `${event.content} (${event.start.slice(0, 5)})`;
    } else {
      label.textContent = `${event.start.slice(0, 5)} - ${event.end.slice(0, 5)}`;
    }
    
    label.style.left = `${labelX}px`;
    label.style.top = `${labelY}px`;
    element.appendChild(label);
    
    return element;
  }

  /**
   * Gets the current data based on scope and navigation state
   * @returns {Object} Current segment data
   */
  getCurrentData() {
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
   * Updates the entire clock display
   * This includes prayer times, available slots, and navigation controls
   */
  updateClock() {
    console.log('Updating clock');
    this.container.innerHTML = '';
    
    // Create SVG container
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 300 300");
    svg.setAttribute("class", "clock-svg");
    this.container.appendChild(svg);

    // Create clock face
    const clockFace = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    clockFace.setAttribute("cx", "150");
    clockFace.setAttribute("cy", "150");
    clockFace.setAttribute("r", "150");
    clockFace.setAttribute("class", "clock-face");
    svg.appendChild(clockFace);

    // Add hour markers
    for (let i = 0; i < 24; i++) {
      const angle = (i * 360) / 24;
      const x1 = 150 + 140 * Math.cos((angle - 90) * Math.PI / 180);
      const y1 = 150 + 140 * Math.sin((angle - 90) * Math.PI / 180);
      const x2 = 150 + 150 * Math.cos((angle - 90) * Math.PI / 180);
      const y2 = 150 + 150 * Math.sin((angle - 90) * Math.PI / 180);
      
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "line");
      marker.setAttribute("x1", x1);
      marker.setAttribute("y1", y1);
      marker.setAttribute("x2", x2);
      marker.setAttribute("y2", y2);
      marker.setAttribute("class", "hour-marker");
      svg.appendChild(marker);

      // Add hour labels
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      const labelX = 150 + 130 * Math.cos((angle - 90) * Math.PI / 180);
      const labelY = 150 + 130 * Math.sin((angle - 90) * Math.PI / 180);
      label.setAttribute("x", labelX);
      label.setAttribute("y", labelY);
      label.setAttribute("class", "hour-label");
      label.textContent = i;
      svg.appendChild(label);
    }

    const currentData = this.getCurrentData();
    if (!currentData) {
      console.error('No current data available');
      return;
    }

    // Calculate prayer periods with padding
    const prayerPeriods = [];
    if (currentData.prayer_times) {
      Object.entries(currentData.prayer_times).forEach(([prayer, time]) => {
        const [hours, minutes] = time.split(':');
        const prayerTime = new Date();
        prayerTime.setHours(parseInt(hours), parseInt(minutes));
        
        const paddingBefore = new Date(prayerTime);
        paddingBefore.setMinutes(paddingBefore.getMinutes() - 10);
        
        const paddingAfter = new Date(prayerTime);
        paddingAfter.setMinutes(paddingAfter.getMinutes() + 35);

        prayerPeriods.push({
          start: paddingBefore.toTimeString().slice(0, 5),
          end: paddingAfter.toTimeString().slice(0, 5),
          prayer: prayer
        });

        svg.appendChild(this.createEventElement({
          content: prayer,
          start: paddingBefore.toTimeString().slice(0, 5),
          end: paddingAfter.toTimeString().slice(0, 5)
        }, 'prayer'));
      });
    }

    // Sort prayer periods by start time
    prayerPeriods.sort((a, b) => a.start.localeCompare(b.start));

    // Calculate and display available slots
    for (let i = 0; i < prayerPeriods.length; i++) {
      const currentPeriod = prayerPeriods[i];
      const nextPeriod = prayerPeriods[i + 1];

      if (nextPeriod) {
        svg.appendChild(this.createEventElement({
          content: 'Disponible',
          start: currentPeriod.end,
          end: nextPeriod.start
        }, 'slot'));
      }
    }

    // Update displayed date
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
      dateElement.textContent = this.formatDate(currentData);
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
   * Handles clock navigation
   * @param {number} direction - Navigation direction (-1 for previous, 1 for next)
   */
  navigate(direction) {
    if (this.scope === 'month') {
      this.currentIndex += direction;
      if (this.currentIndex < 0) this.currentIndex = 0;
      if (this.currentIndex >= this.segments.length) {
        this.currentIndex = this.segments.length - 1;
      }
    } else if (this.scope === 'year') {
      if (direction > 0) {
        if (this.currentDayIndex < this.segments[this.currentIndex].days.length - 1) {
          this.currentDayIndex++;
        } else if (this.currentIndex < this.segments.length - 1) {
          this.currentIndex++;
          this.currentDayIndex = 0;
        }
      } else {
        if (this.currentDayIndex > 0) {
          this.currentDayIndex--;
        } else if (this.currentIndex > 0) {
          this.currentIndex--;
          this.currentDayIndex = this.segments[this.currentIndex].days.length - 1;
        }
      }
    }
    this.updateClock();
  }

  /**
   * Initializes the clock
   * Called after constructor to set up initial display
   */
  init() {
    console.log('Initializing clock');
    this.updateClock();
  }
}

// Export the class for use in template
window.Clock = Clock; 