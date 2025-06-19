/**
 * Clock class for displaying prayer times and available slots
 */
class Clock {
  constructor(containerId, segments, scope) {
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
   * Converts time to minutes since midnight
   * @param {string} time - Format HH:MM
   * @returns {number} Minutes since midnight
   */
  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60) + minutes;
  }

  /**
   * Converts minutes to angle
   * @param {number} minutes - Minutes since midnight
   * @returns {number} Angle in degrees
   */
  minutesToAngle(minutes) {
    return (minutes * 360) / (24 * 60);
  }

  /**
   * Calculates duration between two times
   * @param {string} start - Start time (HH:MM)
   * @param {string} end - End time (HH:MM)
   * @returns {string} Duration in format "Xh YYmin"
   */
  calculateDuration(start, end) {
    const startMinutes = this.timeToMinutes(start);
    const endMinutes = this.timeToMinutes(end);
    let duration = endMinutes - startMinutes;
    
    if (duration < 0) {
      duration += 24 * 60; // Add 24 hours if end time is next day
    }
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours === 0) {
      return `(${minutes}min)`;
    } else if (minutes === 0) {
      return `(${hours}h)`;
    } else {
      // Format minutes with leading zero
      const formattedMinutes = minutes.toString().padStart(2, '0');
      return `(${hours}h${formattedMinutes}min)`;
    }
  }

  /**
   * Creates an SVG element for an event
   */
  createEventElement(event, type) {
    const startMinutes = this.timeToMinutes(event.start);
    const endMinutes = this.timeToMinutes(event.end);
    
    const startAngle = this.minutesToAngle(startMinutes);
    const endAngle = this.minutesToAngle(endMinutes);
    
    const radius = type === 'prayer' ? 120 : 100;
    const centerX = 150;
    const centerY = 150;
    
    // Calculate start and end points
    const startX = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const startY = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const endX = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const endY = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    
    // Create SVG path
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    
    // Calculate angle difference
    let angleDiff = endMinutes - startMinutes;
    if (angleDiff < 0) {
      angleDiff += 24 * 60;
    }
    
    const largeArcFlag = angleDiff > 12 * 60 ? 1 : 0;
    const d = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
    
    path.setAttribute("d", d);
    path.setAttribute("class", `clock-arc ${type}`);
    
    // Add label
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = type === 'prayer' ? radius + 20 : radius - 20;
    const labelX = centerX + labelRadius * Math.cos((midAngle - 90) * Math.PI / 180);
    const labelY = centerY + labelRadius * Math.sin((midAngle - 90) * Math.PI / 180);
    
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", labelX);
    label.setAttribute("y", labelY);
    label.setAttribute("class", "clock-label");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "middle");
    
    if (type === 'prayer') {
      label.textContent = `${event.content} (${event.start})`;
    } else {
      label.textContent = `${event.start} - ${event.end}`;
    }
    
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.appendChild(path);
    group.appendChild(label);

    // Add tooltip for prayers
    if (type === 'prayer') {
      // Create tooltip group
      const tooltipGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      tooltipGroup.setAttribute("class", "tooltip-group");
      tooltipGroup.style.display = "none"; // Hidden by default

      // Create background rectangle
      const tooltipRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      tooltipRect.setAttribute("class", "tooltip-rect");
      tooltipRect.setAttribute("rx", "5");
      tooltipRect.setAttribute("ry", "5");

      // Create tooltip text
      const tooltipText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      tooltipText.setAttribute("class", "tooltip-text");
      tooltipText.textContent = `${event.content}\nTime: ${event.start}`;

      // Add elements to tooltip
      tooltipGroup.appendChild(tooltipRect);
      tooltipGroup.appendChild(tooltipText);

      // Position tooltip
      const tooltipX = labelX;
      const tooltipY = labelY - 40;
      tooltipGroup.setAttribute("transform", `translate(${tooltipX}, ${tooltipY})`);

      // Add hover events
      path.addEventListener("mouseover", () => {
        tooltipGroup.style.display = "block";
      });

      path.addEventListener("mouseout", () => {
        tooltipGroup.style.display = "none";
      });

      group.appendChild(tooltipGroup);
    }
    
    return group;
  }

  /**
   * Creates an SVG element for a slot
   */
  createSlotElement(slot) {
    const startMinutes = this.timeToMinutes(slot.start);
    const endMinutes = this.timeToMinutes(slot.end);
    
    // Add 25 minutes delay at the start
    const delayedStartMinutes = startMinutes + 25;
    const startAngle = this.minutesToAngle(delayedStartMinutes);
    const endAngle = this.minutesToAngle(endMinutes);
    
    const radius = 100; // Smaller radius than prayers
    const centerX = 150;
    const centerY = 150;
    
    // Calculate start and end points
    const startX = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const startY = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const endX = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const endY = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    
    // Create SVG path
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    
    // Calculate angle difference
    let angleDiff = endMinutes - delayedStartMinutes;
    if (angleDiff < 0) {
      angleDiff += 24 * 60;
    }
    
    const largeArcFlag = angleDiff > 12 * 60 ? 1 : 0;
    const d = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
    
    path.setAttribute("d", d);
    path.setAttribute("class", "clock-arc slot");
    path.dataset.start = slot.start;
    path.dataset.end = slot.end;
    
    // Add label for duration
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = radius - 20;
    const labelX = centerX + labelRadius * Math.cos((midAngle - 90) * Math.PI / 180);
    const labelY = centerY + labelRadius * Math.sin((midAngle - 90) * Math.PI / 180);
    
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", labelX);
    label.setAttribute("y", labelY);
    label.setAttribute("class", "clock-label");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "middle");
    label.textContent = this.calculateDuration(slot.start, slot.end);
    
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.appendChild(path);
    group.appendChild(label);
    
    // Add events
    path.addEventListener("mouseover", () => {
      path.classList.add("active");
      const listItem = document.querySelector(`.slot-item[data-start="${slot.start}"][data-end="${slot.end}"]`);
      if (listItem) {
        listItem.classList.add("active");
      }
    });

    path.addEventListener("mouseout", () => {
      path.classList.remove("active");
      const listItem = document.querySelector(`.slot-item[data-start="${slot.start}"][data-end="${slot.end}"]`);
      if (listItem) {
        listItem.classList.remove("active");
      }
    });
    
    return group;
  }

  /**
   * Formats date for display
   */
  formatDate(data) {
    if (!data) return '';
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
    return this.scope === 'month' ? `Day ${data.day}` : 
           this.scope === 'year' ? `Month ${data.month}` : 'Today';
  }

  /**
   * Updates the available slots list
   */
  updateAvailableSlots(data) {
    if (!this.slotsContainer) return;

    this.slotsContainer.innerHTML = '';

    if (!data || !data.slots || data.slots.length === 0) {
      this.slotsContainer.innerHTML = '<p>Aucun créneau disponible pour cette période.</p>';
      return;
    }

    const slotsList = document.createElement('ul');
    slotsList.className = 'slots-list';
    
    data.slots.forEach(slot => {
      const slotItem = document.createElement('li');
      slotItem.className = 'slot-item';
      slotItem.dataset.start = slot.start;
      slotItem.dataset.end = slot.end;
      
      const slotTime = document.createElement('span');
      slotTime.className = 'slot-time';
      slotTime.textContent = `${slot.start} - ${slot.end}`;
      
      const slotDuration = document.createElement('span');
      slotDuration.className = 'slot-duration';
      slotDuration.textContent = this.calculateDuration(slot.start, slot.end);
      
      slotItem.appendChild(slotTime);
      slotItem.appendChild(slotDuration);
      slotsList.appendChild(slotItem);

      // Add events for synchronization
      slotItem.addEventListener('mouseover', () => {
        // Here we can add logic to highlight the corresponding arc
        const arc = document.querySelector(`.clock-arc[data-start="${slot.start}"][data-end="${slot.end}"]`);
        if (arc) {
          arc.classList.add('active');
        }
      });

      slotItem.addEventListener('mouseout', () => {
        const arc = document.querySelector(`.clock-arc[data-start="${slot.start}"][data-end="${slot.end}"]`);
        if (arc) {
          arc.classList.remove('active');
        }
      });
    });

    this.slotsContainer.appendChild(slotsList);
  }

  /**
   * Updates the clock display
   */
  updateClock() {
    this.container.innerHTML = '';
    
    // Create SVG container with larger viewBox
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "-50 -50 400 400"); // Adjusted for more space
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
    for (let hour = 0; hour < 24; hour++) {
      const angle = this.minutesToAngle(hour * 60);
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
      label.textContent = hour;
      svg.appendChild(label);
    }

    // Add minute markers
    for (let minute = 0; minute < 60; minute++) {
      if (minute % 5 === 0) continue; // Skip minutes that are hours
      const angle = this.minutesToAngle(minute);
      const x1 = 150 + 145 * Math.cos((angle - 90) * Math.PI / 180);
      const y1 = 150 + 145 * Math.sin((angle - 90) * Math.PI / 180);
      const x2 = 150 + 150 * Math.cos((angle - 90) * Math.PI / 180);
      const y2 = 150 + 150 * Math.sin((angle - 90) * Math.PI / 180);
      
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "line");
      marker.setAttribute("x1", x1);
      marker.setAttribute("y1", y1);
      marker.setAttribute("x2", x2);
      marker.setAttribute("y2", y2);
      marker.setAttribute("class", "minute-marker");
      svg.appendChild(marker);
    }

    // Display events
    const currentData = this.getCurrentData();
    if (currentData && currentData.prayer_times) {
      Object.entries(currentData.prayer_times).forEach(([prayer, time]) => {
        const eventElement = this.createEventElement({
          content: prayer,
          start: time,
          end: time
        }, 'prayer');
        svg.appendChild(eventElement);
      });
    }

    // Display slots
    if (currentData && currentData.slots) {
      currentData.slots.forEach(slot => {
        const slotElement = this.createSlotElement(slot);
        svg.appendChild(slotElement);
      });
    }

    // Update date
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
      dateElement.textContent = this.formatDate(currentData);
    }

    // Update timezone
    const timezoneElement = document.getElementById('timezone');
    if (timezoneElement) {
      timezoneElement.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    // Update available slots
    this.updateAvailableSlots(currentData);
  }

  /**
   * Gets current data
   */
  getCurrentData() {
    if (this.scope === 'today') {
      return this.segments[0];
    } else if (this.scope === 'month') {
      return this.segments[this.currentIndex];
    } else if (this.scope === 'year') {
      return this.segments[this.currentIndex].days[this.currentDayIndex];
    }
    return null;
  }

  /**
   * Initializes the clock
   */
  init() {
    this.updateClock();
  }

  /**
   * Navigates between days/months
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
}

// Export the class
window.Clock = Clock;
