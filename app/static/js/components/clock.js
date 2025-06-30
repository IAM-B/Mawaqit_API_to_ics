// Clock component for circular prayer/slot visualization

import { formatDateForDisplay, timeToMinutes, minutesToTime } from '../utils/utils.js';
import { getPaddingBefore, getPaddingAfter } from '../utils/padding.js';

/**
 * Main class for the circular clock (slots and prayers)
 */
export class Clock {
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
  // Animation of planning appearance
  static handlePlanningGeneration() {
    const planningContent = document.querySelector('.quick-actions');
    if (planningContent) planningContent.classList.add('planning-generated');
    const clockSection = document.querySelector('.clock-section');
    if (clockSection) {
      clockSection.classList.add('visible');
      setTimeout(() => {
        try { clockSection.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (error) { clockSection.scrollIntoView(); }
      }, 500);
    }
    const sections = document.querySelectorAll('.available-slots, .summary-section');
    sections.forEach((section, index) => {
      setTimeout(() => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'all 0.6s ease';
        setTimeout(() => {
          section.style.opacity = '1';
          section.style.transform = 'translateY(0)';
        }, 100);
      }, (index + 1) * 300);
    });
  }
  // Conversion minutes -> angle
  minutesToAngle(minutes) {
    return (minutes * 360) / (24 * 60);
  }
  // Calculate the duration between two times
  calculateDuration(start, end) {
    const startMinutes = timeToMinutes(start);
    const endMinutes = timeToMinutes(end);
    let duration = endMinutes - startMinutes;
    if (duration < 0) duration += 24 * 60;
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (hours === 0) return `(${minutes}min)`;
    else if (minutes === 0) return `(${hours}h)`;
    else return `(${hours}h${minutes.toString().padStart(2, '0')}min)`;
  }
  // Helper: Subtract padding from a time
  subtractPadding(timeStr, paddingMinutes) {
    if (!timeStr || !paddingMinutes) return timeStr;
    const totalMinutes = timeToMinutes(timeStr);
    const adjustedMinutes = totalMinutes - paddingMinutes;
    return minutesToTime(adjustedMinutes);
  }
  // Helper: Add padding to a time
  addPadding(timeStr, paddingMinutes) {
    if (!timeStr || !paddingMinutes) return timeStr;
    const totalMinutes = timeToMinutes(timeStr);
    const adjustedMinutes = totalMinutes + paddingMinutes;
    return minutesToTime(adjustedMinutes);
  }
  // Create an SVG arc for an event (prayer or slot)
  createEventElement(event, type) {
    const startMinutes = timeToMinutes(event.start);
    const endMinutes = timeToMinutes(event.end);
    const startAngle = this.minutesToAngle(startMinutes);
    const endAngle = this.minutesToAngle(endMinutes);
    const radius = type === 'prayer' ? 135 : 120;
    const centerX = 150;
    const centerY = 150;
    const startX = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const startY = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const endX = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const endY = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let angleDiff = endMinutes - startMinutes;
    if (angleDiff < 0) angleDiff += 24 * 60;
    const largeArcFlag = angleDiff > 12 * 60 ? 1 : 0;
    const d = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
    path.setAttribute("d", d);
    path.setAttribute("class", `clock-arc ${type}`);
    path.setAttribute('data-start', event.start);
    path.setAttribute('data-end', event.end);
    path.setAttribute('data-type', type);
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = type === 'prayer' ? radius + 25 : radius - 25;
    const labelX = centerX + labelRadius * Math.cos((midAngle - 90) * Math.PI / 180);
    const labelY = centerY + labelRadius * Math.sin((midAngle - 90) * Math.PI / 180);
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", "150");
    label.setAttribute("y", "150");
    label.setAttribute("class", "clock-label");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "middle");
    if (type === 'prayer') label.textContent = `${event.content} (${event.start})`;
    else label.textContent = `${event.start} - ${event.end}`;
    path.addEventListener("mouseover", () => {
      const timelineEvent = document.querySelector(`.timeline-event[data-start="${event.start}"][data-end="${event.end}"]`);
      if (timelineEvent) {
        timelineEvent.classList.add('active');
      }
      path.classList.add('active');
    });
    path.addEventListener("mouseout", () => {
      const timelineEvent = document.querySelector(`.timeline-event[data-start="${event.start}"][data-end="${event.end}"]`);
      if (timelineEvent) {
        timelineEvent.classList.remove('active');
      }
      path.classList.remove('active');
    });
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.appendChild(path);
    group.appendChild(label);
    if (type === 'prayer') {
      const tooltipGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      tooltipGroup.setAttribute("class", "tooltip-group");
      tooltipGroup.style.display = "none";
      const tooltipRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      tooltipRect.setAttribute("class", "tooltip-rect");
      tooltipRect.setAttribute("rx", "5");
      tooltipRect.setAttribute("ry", "5");
      const tooltipText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      tooltipText.setAttribute("class", "tooltip-text");
      tooltipText.textContent = `${event.content}\nTime: ${event.start}`;
      tooltipGroup.appendChild(tooltipRect);
      tooltipGroup.appendChild(tooltipText);
      const tooltipX = labelX;
      const tooltipY = labelY - 40;
      tooltipGroup.setAttribute("transform", `translate(${tooltipX}, ${tooltipY})`);
      path.addEventListener("mouseover", () => { tooltipGroup.style.display = "block"; });
      path.addEventListener("mouseout", () => { tooltipGroup.style.display = "none"; });
      group.appendChild(tooltipGroup);
    }
    return group;
  }
  // Create an SVG arc for a slot
  createSlotElement(slot) {
    const startMinutes = timeToMinutes(slot.start);
    const endMinutes = timeToMinutes(slot.end);
    
    // Skip slots that are too short (less than 5 minutes)
    const duration = endMinutes - startMinutes;
    if (duration < 5) {
      return null; // Don't create slot for very short durations
    }
    
    // Apply slot size adjustment for UI purposes, but ensure minimum visibility
    const slotSizeAdjustment = -25;
    const adjustedEndMinutes = endMinutes + slotSizeAdjustment;
    const adjustedEndTime = minutesToTime(adjustedEndMinutes);
    
    // Ensure the adjusted end time doesn't go before the start time
    if (adjustedEndMinutes <= startMinutes) {
      return null; // Skip if adjustment makes slot too small
    }
    
    const startAngle = this.minutesToAngle(startMinutes);
    const endAngle = this.minutesToAngle(adjustedEndMinutes);
    const radius = 120;
    const centerX = 150;
    const centerY = 150;
    const startX = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const startY = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const endX = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const endY = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    let angleDiff = adjustedEndMinutes - startMinutes;
    if (angleDiff < 0) angleDiff += 24 * 60;
    const largeArcFlag = angleDiff > 12 * 60 ? 1 : 0;
    const d = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
    path.setAttribute("d", d);
    path.setAttribute("class", "clock-arc slot");
    path.dataset.start = slot.start;
    path.dataset.end = slot.end;
    path.setAttribute('data-type', 'slot');
    const midAngle = (startAngle + endAngle) / 2;
    const labelRadius = radius - 25;
    const labelX = centerX + labelRadius * Math.cos((midAngle - 90) * Math.PI / 180);
    const labelY = centerY + labelRadius * Math.sin((midAngle - 90) * Math.PI / 180);
    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    label.setAttribute("x", "150");
    label.setAttribute("y", "150");
    label.setAttribute("class", "clock-label");
    label.setAttribute("text-anchor", "middle");
    label.setAttribute("dominant-baseline", "middle");
    
    // Get duration from timeline if available, otherwise calculate it
    const timelineEvent = document.querySelector(`.timeline-event[data-start="${slot.start}"][data-end="${slot.end}"]`);
    if (timelineEvent) {
      const timelineText = timelineEvent.nextElementSibling;
      if (timelineText && timelineText.classList.contains('timeline-event-text')) {
        const timelineTitle = timelineText.textContent;
        const durationMatch = timelineTitle.match(/Disponibilité \((.+?)\)/);
        if (durationMatch) {
          label.textContent = `(${durationMatch[1]})`;
        } else {
          label.textContent = this.calculateDuration(slot.start, slot.end);
        }
      } else {
        label.textContent = this.calculateDuration(slot.start, slot.end);
      }
    } else {
      label.textContent = this.calculateDuration(slot.start, slot.end);
    }
    
    // Alternative: Display the adjusted duration (visual duration)
    // label.textContent = this.calculateDuration(slot.start, adjustedEndTime);
    
    path.addEventListener("mouseover", () => {
      const timelineEvent = document.querySelector(`.timeline-event[data-start="${slot.start}"][data-end="${slot.end}"]`);
      if (timelineEvent) {
        timelineEvent.classList.add('active');
      }
      path.classList.add('active');
      const listItem = document.querySelector(`.slot-item[data-start="${slot.start}"][data-end="${slot.end}"]`);
      if (listItem) listItem.classList.add("active");
    });
    path.addEventListener("mouseout", () => {
      const timelineEvent = document.querySelector(`.timeline-event[data-start="${slot.start}"][data-end="${slot.end}"]`);
      if (timelineEvent) {
        timelineEvent.classList.remove('active');
      }
      path.classList.remove('active');
      const listItem = document.querySelector(`.slot-item[data-start="${slot.start}"][data-end="${slot.end}"]`);
      if (listItem) listItem.classList.remove("active");
    });
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.appendChild(path);
    group.appendChild(label);
    return group;
  }
  // Update the list of available slots
  updateAvailableSlots(data) {
    if (!this.slotsContainer) return;
    this.slotsContainer.innerHTML = '';
    if (!data || !data.prayer_times) {
      this.slotsContainer.innerHTML = '<p>No slots available for this period.</p>';
      return;
    }
    const paddingBefore = getPaddingBefore();
    const paddingAfter = getPaddingAfter();
    
    // Define the logical order of prayers (not chronological)
    const prayerOrder = ['fajr', 'sunset', 'dohr', 'asr', 'maghreb', 'icha'];
    
    const calculatedSlots = [];
    
    // Create slots between prayers in logical order
    for (let i = 0; i < prayerOrder.length - 1; i++) {
      const currentPrayerName = prayerOrder[i];
      const nextPrayerName = prayerOrder[i + 1];
      
      const currentPrayerTime = data.prayer_times[currentPrayerName];
      const nextPrayerTime = data.prayer_times[nextPrayerName];
      
      // Skip if either prayer time is missing
      if (!currentPrayerTime || !nextPrayerTime) {
        continue;
      }
      
      // Special handling for the slot between maghreb and icha when icha is after midnight
      if (currentPrayerName === 'maghreb' && nextPrayerName === 'icha') {
        const ichaMinutes = timeToMinutes(nextPrayerTime);
        
        // Check if icha is after midnight by comparing with maghreb
        const maghrebMinutes = timeToMinutes(currentPrayerTime);
        if (ichaMinutes < maghrebMinutes) {
          // icha is after midnight, create two slots: maghreb to midnight and midnight to icha
          const maghrebToMidnightStart = this.addPadding(currentPrayerTime, paddingAfter);
          const maghrebToMidnightEnd = "23:59";
          
          const midnightToIchaStart = "00:00";
          const midnightToIchaEnd = this.subtractPadding(nextPrayerTime, paddingBefore);
          
          // First slot: maghreb to 23:59
          if (maghrebToMidnightStart && maghrebToMidnightEnd && timeToMinutes(maghrebToMidnightEnd) > timeToMinutes(maghrebToMidnightStart)) {
            const duration = timeToMinutes(maghrebToMidnightEnd) - timeToMinutes(maghrebToMidnightStart);
            if (duration >= 5) { // Only add slots with duration >= 5 minutes
              calculatedSlots.push({
                start: maghrebToMidnightStart,
                end: maghrebToMidnightEnd
              });
            }
          }
          
          // Second slot: 00:00 to icha
          if (midnightToIchaStart && midnightToIchaEnd && timeToMinutes(midnightToIchaEnd) > timeToMinutes(midnightToIchaStart)) {
            const duration = timeToMinutes(midnightToIchaEnd) - timeToMinutes(midnightToIchaStart);
            if (duration >= 5) { // Only add slots with duration >= 5 minutes
              calculatedSlots.push({
                start: midnightToIchaStart,
                end: midnightToIchaEnd
              });
            }
          }
          
          continue; // Skip the normal slot creation for this pair
        }
      }
      
      const slotStart = this.addPadding(currentPrayerTime, paddingAfter);
      const slotEnd = this.subtractPadding(nextPrayerTime, paddingBefore);
      
      if (slotStart && slotEnd && timeToMinutes(slotEnd) > timeToMinutes(slotStart)) {
        const duration = timeToMinutes(slotEnd) - timeToMinutes(slotStart);
        if (duration >= 5) { // Only add slots with duration >= 5 minutes
        calculatedSlots.push({
          start: slotStart,
          end: slotEnd
        });
        }
      }
    }
    if (calculatedSlots.length === 0) {
      this.slotsContainer.innerHTML = '<p>No slots available for this period.</p>';
      return;
    }
    const slotsList = document.createElement('ul');
    slotsList.className = 'slots-list';
    calculatedSlots.forEach(slot => {
      const slotItem = document.createElement('li');
      slotItem.className = 'slot-item';
      slotItem.dataset.start = slot.start;
      slotItem.dataset.end = slot.end;
      const slotTime = document.createElement('span');
      slotTime.className = 'slot-time';
      slotTime.textContent = `${slot.start} - ${slot.end}`;
      const slotDuration = document.createElement('span');
      slotDuration.className = 'slot-duration';
      // Get duration from timeline if available, otherwise calculate it
      const timelineEvent = document.querySelector(`.timeline-event[data-start="${slot.start}"][data-end="${slot.end}"]`);
      if (timelineEvent) {
        const timelineText = timelineEvent.nextElementSibling;
        if (timelineText && timelineText.classList.contains('timeline-event-text')) {
          const timelineTitle = timelineText.textContent;
          const durationMatch = timelineTitle.match(/Disponibilité \((.+?)\)/);
          if (durationMatch) {
            slotDuration.textContent = `(${durationMatch[1]})`;
          } else {
            slotDuration.textContent = this.calculateDuration(slot.start, slot.end);
          }
        } else {
          slotDuration.textContent = this.calculateDuration(slot.start, slot.end);
        }
      } else {
        slotDuration.textContent = this.calculateDuration(slot.start, slot.end);
      }
      slotItem.appendChild(slotTime);
      slotItem.appendChild(slotDuration);
      slotsList.appendChild(slotItem);
      slotItem.addEventListener('mouseover', () => {
        const arc = document.querySelector(`.clock-arc[data-start="${slot.start}"][data-end="${slot.end}"]`);
        if (arc) arc.classList.add('active');
      });
      slotItem.addEventListener('mouseout', () => {
        const arc = document.querySelector(`.clock-arc[data-start="${slot.start}"][data-end="${slot.end}"]`);
        if (arc) arc.classList.remove('active');
      });
    });
    this.slotsContainer.appendChild(slotsList);
  }
  // Update the clock display
  updateClock() {
    this.container.innerHTML = '';
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "-80 -80 460 460");
    svg.setAttribute("class", "clock-svg");
    this.container.appendChild(svg);
    const clockFace = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    clockFace.setAttribute("cx", "150");
    clockFace.setAttribute("cy", "150");
    clockFace.setAttribute("r", "180");
    clockFace.setAttribute("class", "clock-face");
    svg.appendChild(clockFace);
    for (let hour = 0; hour < 24; hour++) {
      const angle = this.minutesToAngle(hour * 60);
      const x1 = 150 + 170 * Math.cos((angle - 90) * Math.PI / 180);
      const y1 = 150 + 170 * Math.sin((angle - 90) * Math.PI / 180);
      const x2 = 150 + 180 * Math.cos((angle - 90) * Math.PI / 180);
      const y2 = 150 + 180 * Math.sin((angle - 90) * Math.PI / 180);
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "line");
      marker.setAttribute("x1", x1);
      marker.setAttribute("y1", y1);
      marker.setAttribute("x2", x2);
      marker.setAttribute("y2", y2);
      marker.setAttribute("class", "hour-marker");
      svg.appendChild(marker);
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      const labelX = 150 + 155 * Math.cos((angle - 90) * Math.PI / 180);
      const labelY = 150 + 155 * Math.sin((angle - 90) * Math.PI / 180);
      label.setAttribute("x", labelX);
      label.setAttribute("y", labelY);
      label.setAttribute("class", "hour-label");
      label.textContent = hour;
      svg.appendChild(label);
    }
    for (let minute = 0; minute < 60; minute++) {
      if (minute % 5 === 0) continue;
      const angle = this.minutesToAngle(minute);
      const x1 = 150 + 175 * Math.cos((angle - 90) * Math.PI / 180);
      const y1 = 150 + 175 * Math.sin((angle - 90) * Math.PI / 180);
      const x2 = 150 + 180 * Math.cos((angle - 90) * Math.PI / 180);
      const y2 = 150 + 180 * Math.sin((angle - 90) * Math.PI / 180);
      const marker = document.createElementNS("http://www.w3.org/2000/svg", "line");
      marker.setAttribute("x1", x1);
      marker.setAttribute("y1", y1);
      marker.setAttribute("x2", x2);
      marker.setAttribute("y2", y2);
      marker.setAttribute("class", "minute-marker");
      svg.appendChild(marker);
    }
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
    if (currentData && currentData.prayer_times) {
      const paddingBefore = getPaddingBefore();
      const paddingAfter = getPaddingAfter();
      // Define the logical order of prayers (not chronological)
      const prayerOrder = ['fajr', 'sunset', 'dohr', 'asr', 'maghreb', 'icha'];
      
      // Create slots between prayers in logical order
      for (let i = 0; i < prayerOrder.length - 1; i++) {
        const currentPrayerName = prayerOrder[i];
        const nextPrayerName = prayerOrder[i + 1];
        
        const currentPrayerTime = currentData.prayer_times[currentPrayerName];
        const nextPrayerTime = currentData.prayer_times[nextPrayerName];
        
        // Skip if either prayer time is missing
        if (!currentPrayerTime || !nextPrayerTime) {
          continue;
        }
        
        // Special handling for the slot between maghreb and icha when icha is after midnight
        if (currentPrayerName === 'maghreb' && nextPrayerName === 'icha') {
          const ichaMinutes = timeToMinutes(nextPrayerTime);
          
          // Check if icha is after midnight by comparing with maghreb
          const maghrebMinutes = timeToMinutes(currentPrayerTime);
          if (ichaMinutes < maghrebMinutes) {
            // icha is after midnight, create two slots: maghreb to midnight and midnight to icha
            const maghrebToMidnightStart = this.addPadding(currentPrayerTime, paddingAfter);
            const maghrebToMidnightEnd = "23:59";
            
            const midnightToIchaStart = "00:00";
            const midnightToIchaEnd = this.subtractPadding(nextPrayerTime, paddingBefore);
            
            // First slot: maghreb to 23:59
            if (maghrebToMidnightStart && maghrebToMidnightEnd && timeToMinutes(maghrebToMidnightEnd) > timeToMinutes(maghrebToMidnightStart)) {
              const duration = timeToMinutes(maghrebToMidnightEnd) - timeToMinutes(maghrebToMidnightStart);
              if (duration >= 5) { // Only add slots with duration >= 5 minutes
                const slot = {
                  start: maghrebToMidnightStart,
                  end: maghrebToMidnightEnd
                };
                const slotElement = this.createSlotElement(slot);
                if (slotElement) {
                  svg.appendChild(slotElement);
                }
              }
            }
            
            // Second slot: 00:00 to icha
            if (midnightToIchaStart && midnightToIchaEnd && timeToMinutes(midnightToIchaEnd) > timeToMinutes(midnightToIchaStart)) {
              const duration = timeToMinutes(midnightToIchaEnd) - timeToMinutes(midnightToIchaStart);
              if (duration >= 5) { // Only add slots with duration >= 5 minutes
                const slot = {
                  start: midnightToIchaStart,
                  end: midnightToIchaEnd
                };
                const slotElement = this.createSlotElement(slot);
                if (slotElement) {
                  svg.appendChild(slotElement);
                }
              }
            }
            
            continue; // Skip the normal slot creation for this pair
          }
        }
        
        const slotStart = this.addPadding(currentPrayerTime, paddingAfter);
        const slotEnd = this.subtractPadding(nextPrayerTime, paddingBefore);
        
        if (slotStart && slotEnd && timeToMinutes(slotEnd) > timeToMinutes(slotStart)) {
          const duration = timeToMinutes(slotEnd) - timeToMinutes(slotStart);
          if (duration >= 5) { // Only add slots with duration >= 5 minutes
            const slot = {
              start: slotStart,
              end: slotEnd
            };
            const slotElement = this.createSlotElement(slot);
            if (slotElement) {
              svg.appendChild(slotElement);
            }
          }
        }
      }
    }
    const dateElement = document.getElementById('currentDate');
    if (dateElement && currentData && currentData.date) {
      const [day, month, year] = currentData.date.split('/');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      dateElement.textContent = formatDateForDisplay(date);
    }
    const timezoneElement = document.getElementById('timezone');
    if (timezoneElement) {
      timezoneElement.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
    this.updateAvailableSlots(currentData);
  }
  // Get the current day's data
  getCurrentData() {
    if (this.scope === 'today') return this.segments[0];
    else if (this.scope === 'month') return this.segments[this.currentIndex];
    else if (this.scope === 'year') return this.segments[this.currentIndex];
    return null;
  }
  // Clock initialization
  init() {
    this.updateClock();
  }
  // Day/month navigation
  navigate(direction) {
    if (this.scope === 'month' || this.scope === 'year') {
      let idx = this.currentIndex + direction;
      if (idx < 0) idx = 0;
      if (idx >= this.segments.length) idx = this.segments.length - 1;
      const seg = this.segments[idx];
      if (seg && seg.date) {
        const [day, month, year] = seg.date.split('/');
        const selectedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        window.setSelectedDate(selectedDate);
      }
    }
  }
  // Method called by central sync
  setDate(date) {
    if (!date || !this.segments || this.segments.length === 0) return;
    let idx = 0;
    if (this.scope === 'month' || this.scope === 'year') {
      for (let i = 0; i < this.segments.length; i++) {
        const seg = this.segments[i];
        if (seg.date) {
          const [day, month, year] = seg.date.split('/');
          const segDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (segDate.toDateString() === date.toDateString()) {
            idx = i;
            break;
          }
        }
      }
    }
    this.currentIndex = idx;
    this.updateClock();
  }
} 