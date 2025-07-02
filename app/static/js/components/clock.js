// Clock component for circular prayer/slot visualization

import { formatDateForDisplay, timeToMinutes, minutesToTime } from '../utils/utils.js';

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

  // Get individual padding for a specific prayer
  getIndividualPadding(prayerName) {
    // Check if we have individual paddings from the backend
    if (window.currentPrayerPaddings && window.currentPrayerPaddings[prayerName]) {
      return window.currentPrayerPaddings[prayerName];
    }
    
    // Fallback to global paddings
    return {
      before: window.currentPaddingBefore || 0,
      after: window.currentPaddingAfter || 0
    };
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
  createSlotElement(slot, nightSlotId = null, isDaySlot = false, deepNightSlotId = null, allNightSlotId = null) {
    const startMinutes = timeToMinutes(slot.start);
    const endMinutes = timeToMinutes(slot.end);
    
    // Skip slots that are too short (less than 2 minutes)
    const duration = endMinutes - startMinutes;
    if (duration < 2 && !slot.isNightSlot) {
      return null; // Don't create slot for very short durations (except night slots)
    }
    
    // Apply slot size adjustment for UI purposes, but ensure minimum visibility
    const slotSizeAdjustment = -25;
    const adjustedEndMinutes = endMinutes + slotSizeAdjustment;
    const adjustedEndTime = minutesToTime(adjustedEndMinutes);
    
    // For night slots that cross midnight, we need special handling
    let startAngle, endAngle;
    if (slot.isNightSlot && endMinutes < startMinutes) {
      // This is a night slot crossing midnight
      // We'll create an arc that goes from start to 23:59, then from 00:00 to end
      startAngle = this.minutesToAngle(startMinutes);
      endAngle = this.minutesToAngle(adjustedEndMinutes);
    } else {
      // Normal slot or night slot not crossing midnight
      startAngle = this.minutesToAngle(startMinutes);
      endAngle = this.minutesToAngle(adjustedEndMinutes);
      
      // Ensure the adjusted end time doesn't go before the start time
      if (adjustedEndMinutes <= startMinutes) {
        return null; // Skip if adjustment makes slot too small
      }
    }
    
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
    // Determine the CSS class based on slot type
    let slotClass = "clock-arc slot";
    if (deepNightSlotId) {
      slotClass += " deep-night";
    } else if (nightSlotId) {
      slotClass += " night";
    } else if (isDaySlot) {
      slotClass += " day";
    }
    path.setAttribute("class", slotClass);
    path.dataset.start = slot.start;
    path.dataset.end = slot.end;
    path.setAttribute('data-type', 'slot');
    
    // Add deep night slot ID if provided
    if (deepNightSlotId) {
      path.setAttribute('data-deep-night-slot-id', deepNightSlotId);
    }
    // Add night slot ID if provided
    if (nightSlotId) {
      path.setAttribute('data-night-slot-id', nightSlotId);
    }
    // Add all night slot ID if provided
    if (allNightSlotId) {
      path.setAttribute('data-all-night-slot-id', allNightSlotId);
    }
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
      // For night slots, try to find any timeline event with the same night-slot-id
      if (nightSlotId) {
        const timelineEvents = document.querySelectorAll(`.timeline-event[data-night-slot-id="${nightSlotId}"]`);
        if (timelineEvents.length > 0) {
          // Get the text from the first timeline event with this night-slot-id
          const firstTimelineEvent = timelineEvents[0];
          const timelineText = firstTimelineEvent.nextElementSibling;
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
      } else {
    label.textContent = this.calculateDuration(slot.start, slot.end);
      }
    }
    
    // Alternative: Display the adjusted duration (visual duration)
    // label.textContent = this.calculateDuration(slot.start, adjustedEndTime);
    
    path.addEventListener("mouseover", () => {
      if (allNightSlotId) {
        // For all night slots, activate all related elements (maghreb-icha and icha-fajr)
        const relatedTimelineEvents = document.querySelectorAll(`.timeline-event[data-all-night-slot-id="${allNightSlotId}"]`);
        relatedTimelineEvents.forEach(event => event.classList.add('active'));
        
        const relatedClockArcs = document.querySelectorAll(`.clock-arc[data-all-night-slot-id="${allNightSlotId}"]`);
        relatedClockArcs.forEach(arc => arc.classList.add('active'));
        
        const relatedListItems = document.querySelectorAll(`.slot-item[data-all-night-slot-id="${allNightSlotId}"]`);
        relatedListItems.forEach(item => item.classList.add('active'));
      } else if (deepNightSlotId) {
        // For deep night slots, activate all related elements
        const relatedTimelineEvents = document.querySelectorAll(`.timeline-event[data-deep-night-slot-id="${deepNightSlotId}"]`);
        relatedTimelineEvents.forEach(event => event.classList.add('active'));
        
        const relatedClockArcs = document.querySelectorAll(`.clock-arc[data-deep-night-slot-id="${deepNightSlotId}"]`);
        relatedClockArcs.forEach(arc => arc.classList.add('active'));
        
        const relatedListItems = document.querySelectorAll(`.slot-item[data-deep-night-slot-id="${deepNightSlotId}"]`);
        relatedListItems.forEach(item => item.classList.add('active'));
      } else if (nightSlotId) {
        // For night slots, activate all related elements
        const relatedTimelineEvents = document.querySelectorAll(`.timeline-event[data-night-slot-id="${nightSlotId}"]`);
        relatedTimelineEvents.forEach(event => event.classList.add('active'));
        
        const relatedClockArcs = document.querySelectorAll(`.clock-arc[data-night-slot-id="${nightSlotId}"]`);
        relatedClockArcs.forEach(arc => arc.classList.add('active'));
        
        const relatedListItems = document.querySelectorAll(`.slot-item[data-night-slot-id="${nightSlotId}"]`);
        relatedListItems.forEach(item => item.classList.add('active'));
      } else {
        // Normal synchronization for regular slots
      const timelineEvent = document.querySelector(`.timeline-event[data-start="${slot.start}"][data-end="${slot.end}"]`);
      if (timelineEvent) {
        timelineEvent.classList.add('active');
      }
      path.classList.add('active');
      const listItem = document.querySelector(`.slot-item[data-start="${slot.start}"][data-end="${slot.end}"]`);
      if (listItem) listItem.classList.add("active");
      }
    });
    path.addEventListener("mouseout", () => {
      if (allNightSlotId) {
        // For all night slots, deactivate all related elements (maghreb-icha and icha-fajr)
        const relatedTimelineEvents = document.querySelectorAll(`.timeline-event[data-all-night-slot-id="${allNightSlotId}"]`);
        relatedTimelineEvents.forEach(event => event.classList.remove('active'));
        
        const relatedClockArcs = document.querySelectorAll(`.clock-arc[data-all-night-slot-id="${allNightSlotId}"]`);
        relatedClockArcs.forEach(arc => arc.classList.remove('active'));
        
        const relatedListItems = document.querySelectorAll(`.slot-item[data-all-night-slot-id="${allNightSlotId}"]`);
        relatedListItems.forEach(item => item.classList.remove('active'));
      } else if (deepNightSlotId) {
        // For deep night slots, deactivate all related elements
        const relatedTimelineEvents = document.querySelectorAll(`.timeline-event[data-deep-night-slot-id="${deepNightSlotId}"]`);
        relatedTimelineEvents.forEach(event => event.classList.remove('active'));
        
        const relatedClockArcs = document.querySelectorAll(`.clock-arc[data-deep-night-slot-id="${deepNightSlotId}"]`);
        relatedClockArcs.forEach(arc => arc.classList.remove('active'));
        
        const relatedListItems = document.querySelectorAll(`.slot-item[data-deep-night-slot-id="${deepNightSlotId}"]`);
        relatedListItems.forEach(item => item.classList.remove('active'));
      } else if (nightSlotId) {
        // For night slots, deactivate all related elements
        const relatedTimelineEvents = document.querySelectorAll(`.timeline-event[data-night-slot-id="${nightSlotId}"]`);
        relatedTimelineEvents.forEach(event => event.classList.remove('active'));
        
        const relatedClockArcs = document.querySelectorAll(`.clock-arc[data-night-slot-id="${nightSlotId}"]`);
        relatedClockArcs.forEach(arc => arc.classList.remove('active'));
        
        const relatedListItems = document.querySelectorAll(`.slot-item[data-night-slot-id="${nightSlotId}"]`);
        relatedListItems.forEach(item => item.classList.remove('active'));
      } else {
        // Normal synchronization for regular slots
      const timelineEvent = document.querySelector(`.timeline-event[data-start="${slot.start}"][data-end="${slot.end}"]`);
      if (timelineEvent) {
        timelineEvent.classList.remove('active');
      }
      path.classList.remove('active');
      const listItem = document.querySelector(`.slot-item[data-start="${slot.start}"][data-end="${slot.end}"]`);
      if (listItem) listItem.classList.remove("active");
      }
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
    
    // Build dynamic prayer order based on available prayers
    const prayerOrder = ['fajr'];
    
    // Add sunset only if it exists in the data
    if (data.prayer_times['sunset']) {
      prayerOrder.push('sunset');
    }
    
    prayerOrder.push('dohr', 'asr', 'maghreb', 'icha');
    
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
      
      // Special handling for the slot between maghreb and icha (always night slot)
      if (currentPrayerName === 'maghreb' && nextPrayerName === 'icha') {
        const ichaMinutes = timeToMinutes(nextPrayerTime);
        const maghrebMinutes = timeToMinutes(currentPrayerTime);
        
        // Check if icha is after midnight by comparing with maghreb
        if (ichaMinutes < maghrebMinutes) {
          // icha is after midnight, create two slots: maghreb to midnight and midnight to icha
          const maghrebPadding = this.getIndividualPadding(currentPrayerName);
          const ichaPadding = this.getIndividualPadding(nextPrayerName);
          
          const maghrebToMidnightStart = this.addPadding(currentPrayerTime, maghrebPadding.after);
          const maghrebToMidnightEnd = "23:59";
          
          const midnightToIchaStart = "00:00";
          const midnightToIchaEnd = this.subtractPadding(nextPrayerTime, ichaPadding.before);
          
          // Create a unique identifier for the night slot pair
          const nightSlotId = `night-slot-${maghrebToMidnightStart}-${midnightToIchaEnd}`;
          // Create a common identifier for maghreb-icha slots only
          const allNightSlotId = `maghreb-icha-slots`;
          
          // First slot: maghreb to 23:59
          if (maghrebToMidnightStart && maghrebToMidnightEnd && timeToMinutes(maghrebToMidnightEnd) > timeToMinutes(maghrebToMidnightStart)) {
            const duration = timeToMinutes(maghrebToMidnightEnd) - timeToMinutes(maghrebToMidnightStart);
            if (duration >= 5) { // Only add slots with duration >= 5 minutes
              calculatedSlots.push({
                start: maghrebToMidnightStart,
                end: maghrebToMidnightEnd,
                nightSlotId: nightSlotId,
                allNightSlotId: allNightSlotId
              });
            }
          }
          
          // Second slot: 00:00 to icha
          if (midnightToIchaStart && midnightToIchaEnd && timeToMinutes(midnightToIchaEnd) > timeToMinutes(midnightToIchaStart)) {
            const duration = timeToMinutes(midnightToIchaEnd) - timeToMinutes(midnightToIchaStart);
            if (duration >= 5) { // Only add slots with duration >= 5 minutes
              calculatedSlots.push({
                start: midnightToIchaStart,
                end: midnightToIchaEnd,
                nightSlotId: nightSlotId,
                allNightSlotId: allNightSlotId
              });
            }
          }
          
          continue; // Skip the normal slot creation for this pair
        } else {
          // icha is before midnight, create a single night slot
          const currentPadding = this.getIndividualPadding(currentPrayerName);
          const nextPadding = this.getIndividualPadding(nextPrayerName);
          
          const slotStart = this.addPadding(currentPrayerTime, currentPadding.after);
          const slotEnd = this.subtractPadding(nextPrayerTime, nextPadding.before);
          
          if (slotStart && slotEnd && timeToMinutes(slotEnd) > timeToMinutes(slotStart)) {
            const duration = timeToMinutes(slotEnd) - timeToMinutes(slotStart);
            if (duration >= 5) { // Only add slots with duration >= 5 minutes
              const nightSlotId = `night-slot-${slotStart}-${slotEnd}`;
              // Create a common identifier for maghreb-icha slots only
              const allNightSlotId = `maghreb-icha-slots`;
              calculatedSlots.push({
                start: slotStart,
                end: slotEnd,
                nightSlotId: nightSlotId,
                allNightSlotId: allNightSlotId
              });
            }
          }
          
          continue; // Skip the normal slot creation for this pair
        }
      }
      
      const currentPadding = this.getIndividualPadding(currentPrayerName);
      const nextPadding = this.getIndividualPadding(nextPrayerName);
      
      const slotStart = this.addPadding(currentPrayerTime, currentPadding.after);
      const slotEnd = this.subtractPadding(nextPrayerTime, nextPadding.before);
      
      if (slotStart && slotEnd && timeToMinutes(slotEnd) > timeToMinutes(slotStart)) {
        const duration = timeToMinutes(slotEnd) - timeToMinutes(slotStart);
        if (duration >= 5) { // Only add slots with duration >= 5 minutes
          // Determine if this is a day slot (between fajr and sunset)
          const fajrTime = data.prayer_times['fajr'];
          const sunsetTime = data.prayer_times['sunset'];
          let isDaySlot = false;
          
          if (fajrTime && sunsetTime) {
            const fajrMinutes = timeToMinutes(fajrTime);
            const sunsetMinutes = timeToMinutes(sunsetTime);
            const currentPrayerMinutes = timeToMinutes(currentPrayerTime);
            const nextPrayerMinutes = timeToMinutes(nextPrayerTime);
            
            // Check if the slot is between fajr and sunset
            if (fajrMinutes < sunsetMinutes) {
              // Normal case: fajr before sunset
              isDaySlot = currentPrayerMinutes >= fajrMinutes && nextPrayerMinutes <= sunsetMinutes;
            } else {
              // Special case: fajr after sunset (polar day/night)
              isDaySlot = currentPrayerMinutes >= fajrMinutes || nextPrayerMinutes <= sunsetMinutes;
            }
          }
          
          calculatedSlots.push({
            start: slotStart,
            end: slotEnd,
            isDaySlot: isDaySlot
          });
        }
      }
      
      // Special handling for the slot between icha and fajr (always deep night slot)
      // This is handled separately because icha is the last prayer in the order
      const ichaTime = data.prayer_times['icha'];
      const fajrTime = data.prayer_times['fajr'];
      
      if (ichaTime && fajrTime) {
        // For circular clock display, we don't need to split the slot
        // The circular display naturally handles the midnight crossing
        const ichaPadding = this.getIndividualPadding('icha');
        const fajrPadding = this.getIndividualPadding('fajr');
        
        const slotStart = this.addPadding(ichaTime, ichaPadding.after);
        const slotEnd = this.subtractPadding(fajrTime, fajrPadding.before);
        
        if (slotStart && slotEnd) {
          // For circular display, we need to handle the case where fajr is after midnight
          let adjustedSlotEnd = slotEnd;
          if (timeToMinutes(slotEnd) < timeToMinutes(slotStart)) {
            // fajr is after midnight, so the slot goes from icha to 23:59, then from 00:00 to fajr
            // In circular display, this creates a continuous arc
            adjustedSlotEnd = "23:59";
          }
          
          if (timeToMinutes(adjustedSlotEnd) > timeToMinutes(slotStart)) {
            const duration = timeToMinutes(adjustedSlotEnd) - timeToMinutes(slotStart);
            if (duration >= 5) { // Only add slots with duration >= 5 minutes
        calculatedSlots.push({
          start: slotStart,
                end: adjustedSlotEnd,
                deepNightSlotId: `deep-night-slot-${slotStart}-${slotEnd}`,
                allNightSlotId: `icha-fajr-slots`
              });
            }
          }
          
          // If fajr is after midnight, also create the second part of the arc (00:00 to fajr)
          if (timeToMinutes(slotEnd) < timeToMinutes(slotStart)) {
            const midnightToFajrStart = "00:00";
            const midnightToFajrEnd = slotEnd;
            
            if (timeToMinutes(midnightToFajrEnd) > timeToMinutes(midnightToFajrStart)) {
              const duration = timeToMinutes(midnightToFajrEnd) - timeToMinutes(midnightToFajrStart);
              if (duration >= 5) { // Only add slots with duration >= 5 minutes
                calculatedSlots.push({
                  start: midnightToFajrStart,
                  end: midnightToFajrEnd,
                  deepNightSlotId: `deep-night-slot-${slotStart}-${slotEnd}`,
                  allNightSlotId: `icha-fajr-slots`
                });
              }
            }
          }
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
      // Determine the CSS class based on slot type
      let slotClass = 'slot-item';
      if (slot.deepNightSlotId) {
        slotClass += ' deep-night';
      } else if (slot.nightSlotId) {
        slotClass += ' night';
      } else if (slot.isDaySlot) {
        slotClass += ' day';
      }
      slotItem.className = slotClass;
      slotItem.dataset.start = slot.start;
      slotItem.dataset.end = slot.end;
      
      // Add deep night slot ID if provided
      if (slot.deepNightSlotId) {
        slotItem.dataset.deepNightSlotId = slot.deepNightSlotId;
      }
      // Add night slot ID if provided
      if (slot.nightSlotId) {
        slotItem.dataset.nightSlotId = slot.nightSlotId;
      }
      // Add all night slot ID if provided
      if (slot.allNightSlotId) {
        slotItem.dataset.allNightSlotId = slot.allNightSlotId;
      }
      
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
        if (slot.allNightSlotId) {
          // For all night slots, activate all related elements (maghreb-icha and icha-fajr)
          const relatedTimelineEvents = document.querySelectorAll(`.timeline-event[data-all-night-slot-id="${slot.allNightSlotId}"]`);
          relatedTimelineEvents.forEach(event => event.classList.add('active'));
          
          const relatedClockArcs = document.querySelectorAll(`.clock-arc[data-all-night-slot-id="${slot.allNightSlotId}"]`);
          relatedClockArcs.forEach(arc => arc.classList.add('active'));
          
          const relatedListItems = document.querySelectorAll(`.slot-item[data-all-night-slot-id="${slot.allNightSlotId}"]`);
          relatedListItems.forEach(item => item.classList.add('active'));
        } else if (slot.deepNightSlotId) {
          // For deep night slots, activate all related elements
          const relatedTimelineEvents = document.querySelectorAll(`.timeline-event[data-deep-night-slot-id="${slot.deepNightSlotId}"]`);
          relatedTimelineEvents.forEach(event => event.classList.add('active'));
          
          const relatedClockArcs = document.querySelectorAll(`.clock-arc[data-deep-night-slot-id="${slot.deepNightSlotId}"]`);
          relatedClockArcs.forEach(arc => arc.classList.add('active'));
          
          const relatedListItems = document.querySelectorAll(`.slot-item[data-deep-night-slot-id="${slot.deepNightSlotId}"]`);
          relatedListItems.forEach(item => item.classList.add('active'));
        } else if (slot.nightSlotId) {
          // For night slots, activate all related elements
          const relatedTimelineEvents = document.querySelectorAll(`.timeline-event[data-night-slot-id="${slot.nightSlotId}"]`);
          relatedTimelineEvents.forEach(event => event.classList.add('active'));
          
          const relatedClockArcs = document.querySelectorAll(`.clock-arc[data-night-slot-id="${slot.nightSlotId}"]`);
          relatedClockArcs.forEach(arc => arc.classList.add('active'));
          
          const relatedListItems = document.querySelectorAll(`.slot-item[data-night-slot-id="${slot.nightSlotId}"]`);
          relatedListItems.forEach(item => item.classList.add('active'));
        } else {
          // Normal synchronization for regular slots
        const arc = document.querySelector(`.clock-arc[data-start="${slot.start}"][data-end="${slot.end}"]`);
        if (arc) arc.classList.add('active');
        }
      });
      
      slotItem.addEventListener('mouseout', () => {
        if (slot.allNightSlotId) {
          // For all night slots, deactivate all related elements (maghreb-icha and icha-fajr)
          const relatedTimelineEvents = document.querySelectorAll(`.timeline-event[data-all-night-slot-id="${slot.allNightSlotId}"]`);
          relatedTimelineEvents.forEach(event => event.classList.remove('active'));
          
          const relatedClockArcs = document.querySelectorAll(`.clock-arc[data-all-night-slot-id="${slot.allNightSlotId}"]`);
          relatedClockArcs.forEach(arc => arc.classList.remove('active'));
          
          const relatedListItems = document.querySelectorAll(`.slot-item[data-all-night-slot-id="${slot.allNightSlotId}"]`);
          relatedListItems.forEach(item => item.classList.remove('active'));
        } else if (slot.deepNightSlotId) {
          // For deep night slots, deactivate all related elements
          const relatedTimelineEvents = document.querySelectorAll(`.timeline-event[data-deep-night-slot-id="${slot.deepNightSlotId}"]`);
          relatedTimelineEvents.forEach(event => event.classList.remove('active'));
          
          const relatedClockArcs = document.querySelectorAll(`.clock-arc[data-deep-night-slot-id="${slot.deepNightSlotId}"]`);
          relatedClockArcs.forEach(arc => arc.classList.remove('active'));
          
          const relatedListItems = document.querySelectorAll(`.slot-item[data-deep-night-slot-id="${slot.deepNightSlotId}"]`);
          relatedListItems.forEach(item => item.classList.remove('active'));
        } else if (slot.nightSlotId) {
          // For night slots, deactivate all related elements
          const relatedTimelineEvents = document.querySelectorAll(`.timeline-event[data-night-slot-id="${slot.nightSlotId}"]`);
          relatedTimelineEvents.forEach(event => event.classList.remove('active'));
          
          const relatedClockArcs = document.querySelectorAll(`.clock-arc[data-night-slot-id="${slot.nightSlotId}"]`);
          relatedClockArcs.forEach(arc => arc.classList.remove('active'));
          
          const relatedListItems = document.querySelectorAll(`.slot-item[data-night-slot-id="${slot.nightSlotId}"]`);
          relatedListItems.forEach(item => item.classList.remove('active'));
        } else {
          // Normal synchronization for regular slots
        const arc = document.querySelector(`.clock-arc[data-start="${slot.start}"][data-end="${slot.end}"]`);
        if (arc) arc.classList.remove('active');
        }
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
    
    // Add definitions for gradients (now defined in CSS)
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    
    // Night gradient (primary to dark)
    const nightGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    nightGradient.setAttribute("id", "nightGradient");
    nightGradient.setAttribute("x1", "0%");
    nightGradient.setAttribute("y1", "0%");
    nightGradient.setAttribute("x2", "100%");
    nightGradient.setAttribute("y2", "100%");
    
    const stop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1.setAttribute("offset", "0%");
    
    const stop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2.setAttribute("offset", "100%");
    
    nightGradient.appendChild(stop1);
    nightGradient.appendChild(stop2);
    
    // Night gradient hover (primary-hover to darker)
    const nightGradientHover = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    nightGradientHover.setAttribute("id", "nightGradientHover");
    nightGradientHover.setAttribute("x1", "0%");
    nightGradientHover.setAttribute("y1", "0%");
    nightGradientHover.setAttribute("x2", "100%");
    nightGradientHover.setAttribute("y2", "100%");
    
    const stop1Hover = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop1Hover.setAttribute("offset", "0%");
    
    const stop2Hover = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    stop2Hover.setAttribute("offset", "100%");
    
    nightGradientHover.appendChild(stop1Hover);
    nightGradientHover.appendChild(stop2Hover);
    
    // Day gradient (dark to primary - inverse of night gradient)
    const dayGradient = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    dayGradient.setAttribute("id", "dayGradient");
    dayGradient.setAttribute("x1", "0%");
    dayGradient.setAttribute("y1", "0%");
    dayGradient.setAttribute("x2", "100%");
    dayGradient.setAttribute("y2", "100%");
    
    const dayStop1 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    dayStop1.setAttribute("offset", "0%");
    
    const dayStop2 = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    dayStop2.setAttribute("offset", "100%");
    
    dayGradient.appendChild(dayStop1);
    dayGradient.appendChild(dayStop2);
    
    // Day gradient hover (darker to primary-hover - inverse of night gradient hover)
    const dayGradientHover = document.createElementNS("http://www.w3.org/2000/svg", "linearGradient");
    dayGradientHover.setAttribute("id", "dayGradientHover");
    dayGradientHover.setAttribute("x1", "0%");
    dayGradientHover.setAttribute("y1", "0%");
    dayGradientHover.setAttribute("x2", "100%");
    dayGradientHover.setAttribute("y2", "100%");
    
    const dayStop1Hover = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    dayStop1Hover.setAttribute("offset", "0%");
    
    const dayStop2Hover = document.createElementNS("http://www.w3.org/2000/svg", "stop");
    dayStop2Hover.setAttribute("offset", "100%");
    
    dayGradientHover.appendChild(dayStop1Hover);
    dayGradientHover.appendChild(dayStop2Hover);
    
    defs.appendChild(nightGradient);
    defs.appendChild(nightGradientHover);
    defs.appendChild(dayGradient);
    defs.appendChild(dayGradientHover);
    svg.appendChild(defs);
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
      // Build dynamic prayer order based on available prayers
      const prayerOrder = ['fajr'];
      
      // Add sunset only if it exists in the data
      if (currentData.prayer_times['sunset']) {
        prayerOrder.push('sunset');
      }
      
      prayerOrder.push('dohr', 'asr', 'maghreb', 'icha');
      
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
        
        // Special handling for the slot between maghreb and icha (always night slot)
        if (currentPrayerName === 'maghreb' && nextPrayerName === 'icha') {
          const ichaMinutes = timeToMinutes(nextPrayerTime);
          const maghrebMinutes = timeToMinutes(currentPrayerTime);
          
          // Check if icha is after midnight by comparing with maghreb
          if (ichaMinutes < maghrebMinutes) {
            // icha is after midnight, create two slots: maghreb to midnight and midnight to icha
            const maghrebPadding = this.getIndividualPadding(currentPrayerName);
            const ichaPadding = this.getIndividualPadding(nextPrayerName);
            
            const maghrebToMidnightStart = this.addPadding(currentPrayerTime, maghrebPadding.after);
            const maghrebToMidnightEnd = "23:59";
            
            const midnightToIchaStart = "00:00";
            const midnightToIchaEnd = this.subtractPadding(nextPrayerTime, ichaPadding.before);
            
            // Create a unique identifier for the night slot pair
            const nightSlotId = `night-slot-${maghrebToMidnightStart}-${midnightToIchaEnd}`;
            // Create a common identifier for maghreb-icha slots only
            const allNightSlotId = `maghreb-icha-slots`;
            
            // First slot: maghreb to 23:59
            if (maghrebToMidnightStart && maghrebToMidnightEnd && timeToMinutes(maghrebToMidnightEnd) > timeToMinutes(maghrebToMidnightStart)) {
              const duration = timeToMinutes(maghrebToMidnightEnd) - timeToMinutes(maghrebToMidnightStart);
              if (duration >= 5) { // Only add slots with duration >= 5 minutes
                const slot = {
                  start: maghrebToMidnightStart,
                  end: maghrebToMidnightEnd
                };
                const slotElement = this.createSlotElement(slot, nightSlotId, false, null, allNightSlotId);
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
                const slotElement = this.createSlotElement(slot, nightSlotId, false, null, allNightSlotId);
                if (slotElement) {
                  svg.appendChild(slotElement);
                }
              }
            }
            
            continue; // Skip the normal slot creation for this pair
          } else {
            // icha is before midnight, create a single night slot
            const currentPadding = this.getIndividualPadding(currentPrayerName);
            const nextPadding = this.getIndividualPadding(nextPrayerName);
            
            const slotStart = this.addPadding(currentPrayerTime, currentPadding.after);
            const slotEnd = this.subtractPadding(nextPrayerTime, nextPadding.before);
            
            if (slotStart && slotEnd && timeToMinutes(slotEnd) > timeToMinutes(slotStart)) {
              const duration = timeToMinutes(slotEnd) - timeToMinutes(slotStart);
              if (duration >= 5) { // Only add slots with duration >= 5 minutes
                const nightSlotId = `night-slot-${slotStart}-${slotEnd}`;
                // Create a common identifier for maghreb-icha slots only
                const allNightSlotId = `maghreb-icha-slots`;
                const slot = {
                  start: slotStart,
                  end: slotEnd
                };
                const slotElement = this.createSlotElement(slot, nightSlotId, false, null, allNightSlotId);
                if (slotElement) {
                  svg.appendChild(slotElement);
                }
              }
            }
            
            continue; // Skip the normal slot creation for this pair
          }
        }
        
        const currentPadding = this.getIndividualPadding(currentPrayerName);
        const nextPadding = this.getIndividualPadding(nextPrayerName);
        
        const slotStart = this.addPadding(currentPrayerTime, currentPadding.after);
        const slotEnd = this.subtractPadding(nextPrayerTime, nextPadding.before);
        
        if (slotStart && slotEnd && timeToMinutes(slotEnd) > timeToMinutes(slotStart)) {
          const duration = timeToMinutes(slotEnd) - timeToMinutes(slotStart);
          if (duration >= 5) { // Only add slots with duration >= 5 minutes
            // Determine if this is a day slot (between fajr and sunset)
            const fajrTime = currentData.prayer_times['fajr'];
            const sunsetTime = currentData.prayer_times['sunset'];
            let isDaySlot = false;
            
            if (fajrTime && sunsetTime) {
              const fajrMinutes = timeToMinutes(fajrTime);
              const sunsetMinutes = timeToMinutes(sunsetTime);
              const currentPrayerMinutes = timeToMinutes(currentPrayerTime);
              const nextPrayerMinutes = timeToMinutes(nextPrayerTime);
              
              // Check if the slot is between fajr and sunset
              if (fajrMinutes < sunsetMinutes) {
                // Normal case: fajr before sunset
                isDaySlot = currentPrayerMinutes >= fajrMinutes && nextPrayerMinutes <= sunsetMinutes;
              } else {
                // Special case: fajr after sunset (polar day/night)
                isDaySlot = currentPrayerMinutes >= fajrMinutes || nextPrayerMinutes <= sunsetMinutes;
              }
            }
            
            const slot = {
              start: slotStart,
              end: slotEnd
            };
            const slotElement = this.createSlotElement(slot, null, isDaySlot);
            if (slotElement) {
              svg.appendChild(slotElement);
            }
          }
        }
      }
      
      // Special handling for the slot between icha and fajr (always deep night slot)
      // This is handled separately because icha is the last prayer in the order
      const ichaTime = currentData.prayer_times['icha'];
      const fajrTime = currentData.prayer_times['fajr'];
      
      if (ichaTime && fajrTime) {
        const ichaPadding = this.getIndividualPadding('icha');
        const fajrPadding = this.getIndividualPadding('fajr');
        
        const slotStart = this.addPadding(ichaTime, ichaPadding.after);
        const slotEnd = this.subtractPadding(fajrTime, fajrPadding.before);
        
        if (slotStart && slotEnd) {
          // Create a single continuous arc from icha to fajr
          // For circular display, we can create one arc that goes from icha to fajr
          // even if it crosses midnight
          const slot = {
            start: slotStart,
            end: slotEnd,
            isNightSlot: true
          };
          const deepNightSlotId = `deep-night-slot-${slotStart}-${slotEnd}`;
          const slotElement = this.createSlotElement(slot, null, false, deepNightSlotId, `icha-fajr-slots`);
          if (slotElement) {
          svg.appendChild(slotElement);
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