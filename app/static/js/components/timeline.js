// Timeline component for vertical agenda display

import { formatDateForDisplay, timeToMinutes, minutesToTime } from '../utils/utils.js';

/**
 * Main class for the vertical timeline (SVG agenda)
 */
export class Timeline {
  constructor() {
    this.container = null;
    this.svg = null;
    this.currentDate = new Date();
    this.segments = [];
    this.scope = 'today';
    this.tooltip = null;
    this.currentView = 'timeline'; // 'timeline' or 'slots'
    this.init();
  }

  // Timeline initialization
  init() {
    this.createTimelineContainer();
    this.createTooltip();
    this.setupViewToggle();
    
    // Set initial date to today and update display
    const today = new Date();
    this.currentDate = today;
    this.updateTimelineDate();
    
    if (this.container && this.svg) {
      this.showTimelineView();
    } else {
      this.showSlotsView();
    }
  }

  // Create the main container
  createTimelineContainer() {
    this.container = document.querySelector('.slots-half');
    this.svg = document.querySelector('.slots-timeline-svg');
    if (this.container && this.svg) {
      this.createSVGGrid(this.svg);
    }
  }

  // Create the SVG grid (hours, labels, groups)
  createSVGGrid(svg) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    
    // Add definitions for gradients (now defined in CSS)
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    
    // Night gradient (primary to dark)
    const nightGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    nightGradient.setAttribute('id', 'nightGradient');
    nightGradient.setAttribute('x1', '0%');
    nightGradient.setAttribute('y1', '0%');
    nightGradient.setAttribute('x2', '100%');
    nightGradient.setAttribute('y2', '100%');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    
    nightGradient.appendChild(stop1);
    nightGradient.appendChild(stop2);
    
    // Night gradient hover (primary-hover to darker)
    const nightGradientHover = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    nightGradientHover.setAttribute('id', 'nightGradientHover');
    nightGradientHover.setAttribute('x1', '0%');
    nightGradientHover.setAttribute('y1', '0%');
    nightGradientHover.setAttribute('x2', '100%');
    nightGradientHover.setAttribute('y2', '100%');
    
    const stop1Hover = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1Hover.setAttribute('offset', '0%');
    
    const stop2Hover = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2Hover.setAttribute('offset', '100%');
    
    nightGradientHover.appendChild(stop1Hover);
    nightGradientHover.appendChild(stop2Hover);
    
    // Day gradient (dark to primary - inverse of night gradient)
    const dayGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    dayGradient.setAttribute('id', 'dayGradient');
    dayGradient.setAttribute('x1', '0%');
    dayGradient.setAttribute('y1', '0%');
    dayGradient.setAttribute('x2', '100%');
    dayGradient.setAttribute('y2', '100%');
    
    const dayStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    dayStop1.setAttribute('offset', '0%');
    
    const dayStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    dayStop2.setAttribute('offset', '100%');
    
    dayGradient.appendChild(dayStop1);
    dayGradient.appendChild(dayStop2);
    
    // Day gradient hover (darker to primary-hover - inverse of night gradient hover)
    const dayGradientHover = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    dayGradientHover.setAttribute('id', 'dayGradientHover');
    dayGradientHover.setAttribute('x1', '0%');
    dayGradientHover.setAttribute('y1', '0%');
    dayGradientHover.setAttribute('x2', '100%');
    dayGradientHover.setAttribute('y2', '100%');
    
    const dayStop1Hover = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    dayStop1Hover.setAttribute('offset', '0%');
    
    const dayStop2Hover = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    dayStop2Hover.setAttribute('offset', '100%');
    
    dayGradientHover.appendChild(dayStop1Hover);
    dayGradientHover.appendChild(dayStop2Hover);
    
    defs.appendChild(nightGradient);
    defs.appendChild(nightGradientHover);
    defs.appendChild(dayGradient);
    defs.appendChild(dayGradientHover);
    svg.appendChild(defs);
    
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('class', 'timeline-grid');
    const labelsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    labelsGroup.setAttribute('class', 'timeline-labels');
    const eventsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    eventsGroup.setAttribute('class', 'timeline-events');
    const nowGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nowGroup.setAttribute('class', 'timeline-now');
    svg.appendChild(gridGroup);
    svg.appendChild(labelsGroup);
    svg.appendChild(eventsGroup);
    svg.appendChild(nowGroup);
    this.eventsGroup = eventsGroup;
    this.nowGroup = nowGroup;
    for (let hour = 0; hour <= 24; hour++) {
      const y = hour * 60; // 60px per hour
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 60);
      line.setAttribute('y1', y);
      line.setAttribute('x2', 400);
      line.setAttribute('y2', y);
      line.setAttribute('class', 'timeline-hour-line');
      gridGroup.appendChild(line);
      if (hour < 24) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', 52);
        text.setAttribute('y', y + 5);
        text.textContent = `${hour.toString().padStart(2, '0')}:00`;
        text.setAttribute('class', 'timeline-hour-text');
        text.setAttribute('text-anchor', 'end');
        labelsGroup.appendChild(text);
      }
    }
    const verticalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    verticalLine.setAttribute('x1', 60);
    verticalLine.setAttribute('y1', 0);
    verticalLine.setAttribute('x2', 60);
    verticalLine.setAttribute('y2', 1440);
    verticalLine.setAttribute('class', 'timeline-hour-line');
    gridGroup.appendChild(verticalLine);
  }

  // Tooltip for events
  createTooltip() {
    this.tooltip = document.querySelector('.timeline-tooltip');
    if (!this.tooltip) {
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'timeline-tooltip';
      this.tooltip.style.position = 'absolute';
      this.tooltip.style.zIndex = '1000';
      this.tooltip.style.pointerEvents = 'none';
      document.body.appendChild(this.tooltip);
    }
  }

  // Timeline data initialization
  initializeTimeline(segments, scope) {
    this.segments = segments;
    this.scope = scope;
    
    // Set current date to today and update display
    const today = new Date();
    this.currentDate = today;
    this.updateTimelineDate();
    
    // Display events for today by default
    this.displayDayEvents(today);
  }

  // Update the date displayed in the header
  updateTimelineDate() {
    const currentDateElement = document.getElementById('slotsCurrentDate');
    if (currentDateElement) {
      currentDateElement.textContent = formatDateForDisplay(this.currentDate);
    }
  }

  // Display events for a given day
  displayDayEvents(date) {
    this.currentDate = date;
    this.updateTimelineDate();
    this.clearEvents();
    
    // Display Hijri date if option is enabled
    this.displayHijriDate(date);
    
    const dayData = this.getDayData(date);
    if (!dayData) {
      this.showEmptyState();
      return;
    }
    this.displayPrayers(dayData.prayer_times);
    this.displaySlots(dayData.slots);
  }

  // Display Hijri date at the top of the timeline
  displayHijriDate(date) {
    const showHijriCheckbox = document.getElementById('show_hijri_date');
    const includeVoluntaryFastsCheckbox = document.getElementById('include_voluntary_fasts');
    
    // Get voluntary fasts information if the option is enabled
    let voluntaryFastsInfo = [];
    if (includeVoluntaryFastsCheckbox && includeVoluntaryFastsCheckbox.checked) {
      voluntaryFastsInfo = this.getVoluntaryFastsInfo(date);
    }
    
    // Show Hijri date if the option is enabled
    let hijriDate = null;
    if (showHijriCheckbox && showHijriCheckbox.checked) {
      hijriDate = this.getHijriDate(date);
      if (!hijriDate) return;
    }
    
    // Only show if we have either Hijri date or voluntary fasts info
    if (!hijriDate && voluntaryFastsInfo.length === 0) return;
    
    // Combine Hijri date with voluntary fasts info
    let displayText = '';
    if (hijriDate) {
      displayText = hijriDate;
      if (voluntaryFastsInfo.length > 0) {
        displayText += ` - ${voluntaryFastsInfo.join(', ')}`;
      }
    } else {
      // Only voluntary fasts info (no Hijri date)
      displayText = voluntaryFastsInfo.join(', ');
    }
    
    // Create Hijri date background rectangle
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', 60 + 6);
    rect.setAttribute('y', -35);
    rect.setAttribute('width', 400 - 60 - 12);
    rect.setAttribute('height', 30);
    rect.setAttribute('rx', 5);
    rect.setAttribute('ry', 5);
    rect.setAttribute('class', 'timeline-hijri-date-bg');
    rect.setAttribute('fill', 'var(--accent-light)');
    rect.setAttribute('stroke', 'var(--accent)');
    rect.setAttribute('stroke-width', '1');
    
    // Create Hijri date text element
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', 60 + 16);
    text.setAttribute('y', -20);
    text.setAttribute('text-anchor', 'start');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('class', 'timeline-hijri-date');
    text.setAttribute('fill', 'var(--accent)');
    text.setAttribute('font-size', '14px');
    text.setAttribute('font-weight', '600');
    text.textContent = displayText;
    
    // Add directly to SVG
    this.svg.appendChild(rect);
    this.svg.appendChild(text);
  }

  // Get voluntary fasts information for a given date
  getVoluntaryFastsInfo(date) {
    const voluntaryFastsInfo = [];
    
    // Get Hijri date components
    const hijriDate = this.getHijriDateComponents(date);
    if (!hijriDate) return voluntaryFastsInfo;
    
    // Monday and Thursday fasts
    const weekday = date.getDay();
    if (weekday === 1 || weekday === 4) { // Monday (1) or Thursday (4)
      voluntaryFastsInfo.push("Jour de jeûne");
    }
    
    // Ayyam al-Bid (13-15 Hijri)
    if (hijriDate.day >= 13 && hijriDate.day <= 15) {
      voluntaryFastsInfo.push("Jour blanc");
    }
    
    return voluntaryFastsInfo;
  }

  // Get Hijri date components (year, month, day)
  getHijriDateComponents(date) {
    // Simplified Hijri conversion (approximate)
    // Reference: 1 Muharram 1445 AH = 19 July 2023 CE
    const referenceDate = new Date(2023, 6, 19); // July 19, 2023
    const referenceHijri = { year: 1445, month: 1, day: 1 };
    
    const daysDiff = Math.floor((date - referenceDate) / (1000 * 60 * 60 * 24));
    
    // Approximate Hijri year length (354.37 days)
    const hijriYear = referenceHijri.year + Math.floor(daysDiff / 354);
    let remainingDays = daysDiff % 354;
    
    // Simplified month calculation
    const hijriMonths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
    let hijriMonth = 1;
    let hijriDay = 1;
    
    for (const monthDays of hijriMonths) {
      if (remainingDays >= monthDays) {
        remainingDays -= monthDays;
        hijriMonth += 1;
      } else {
        hijriDay += remainingDays;
        break;
      }
    }
    
    return {
      year: hijriYear,
      month: hijriMonth,
      day: hijriDay
    };
  }

  // Get Hijri date string (simplified conversion)
  getHijriDate(date) {
    const hijriComponents = this.getHijriDateComponents(date);
    if (!hijriComponents) return null;
    
    // Hijri month names
    const hijriMonthNames = [
      'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
      'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban',
      'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'
    ];
    
    const monthName = hijriMonthNames[hijriComponents.month - 1];
    
    // Check if it's a sacred month (1, 7, 11, 12)
    const isSacredMonth = [1, 7, 11, 12].includes(hijriComponents.month);
    
    // Check if it's Friday (weekday 5)
    const isFriday = date.getDay() === 5;
    
    // Add star for sacred months
    const sacredPrefix = isSacredMonth ? '🌟 ' : '';
    
    // Add Jummah for Fridays
    const jummahSuffix = isFriday ? ' - Jummah' : '';
    
    return `${sacredPrefix}${hijriComponents.day} ${monthName} ${hijriComponents.year}${jummahSuffix}`;
  }

  // Get the day's data
  getDayData(date) {
    if (!this.segments || this.segments.length === 0) return null;
    const day = date.getDate();
    const month = date.getMonth();
    if (this.scope === 'today' && this.segments.length > 0) {
      return this.segments[0];
    }
    if (this.scope === 'month') {
      const dayIndex = day - 1;
      if (dayIndex >= 0 && dayIndex < this.segments.length) {
        return this.segments[dayIndex];
      }
    }
    if (this.scope === 'year') {
      const monthIndex = month;
      if (monthIndex >= 0 && monthIndex < this.segments.length) {
        const monthData = this.segments[monthIndex];
        if (monthData && monthData.days) {
          const dayIndex = day - 1;
          if (dayIndex >= 0 && dayIndex < monthData.days.length) {
            return monthData.days[dayIndex];
          }
        }
      }
    }
    return null;
  }

  // Display prayers
  displayPrayers(prayerTimes) {
    if (!prayerTimes) return;
    
    const prayerNames = {
      'fajr': 'Fajr',
      'sunset': 'Sunset',
      'dohr': 'Dohr',
      'asr': 'Asr',
      'maghreb': 'Maghreb',
      'icha': 'Icha'
    };
    Object.entries(prayerTimes).forEach(([prayer, time]) => {
      if (time && prayerNames[prayer]) {
        // Get individual padding for this specific prayer
        const prayerPadding = this.getIndividualPadding(prayer);
        
        // Calculate prayer time with individual padding values
        const exactStartTime = this.subtractPadding(time, prayerPadding.before);
        const exactEndTime = this.addPadding(time, prayerPadding.after);
        
        // Build prayer title with features
        let prayerTitle = `${prayerNames[prayer]} (${time})`;
        
        // Add Jummah prefix only for Dohr on Friday
        if (this.currentDate.getDay() === 5 && prayer === "dohr") { // Friday and Dohr only
          prayerTitle = `Jummah - ${prayerTitle}`;
        }
        
        // Handle sunset special case
        if (prayer === "sunset") {
          prayerTitle = `Chourouk (${time})`;
        }
        
        // For synchronization, use exact time (without padding)
        this.createSVGEvent(prayerTitle, exactStartTime, exactEndTime, 'prayer', 'prayer', time);
      }
    });
  }

  // Display slots
  displaySlots(slots) {
    if (!slots || !Array.isArray(slots)) return;
    
    // Get prayer times for slot calculation
    const dayData = this.getDayData(this.currentDate);
    const prayerTimes = dayData ? dayData.prayer_times : null;
    
    if (prayerTimes) {
      // Build dynamic prayer order based on available prayers
      const prayerOrder = ['fajr'];
      
      // Add sunset only if it exists in the data
      if (prayerTimes['sunset']) {
        prayerOrder.push('sunset');
      }
      
      prayerOrder.push('dohr', 'asr', 'maghreb', 'icha');
      
      // Create slots between prayers in logical order
      for (let i = 0; i < prayerOrder.length - 1; i++) {
        const currentPrayerName = prayerOrder[i];
        const nextPrayerName = prayerOrder[i + 1];
        
        const currentPrayerTime = prayerTimes[currentPrayerName];
        const nextPrayerTime = prayerTimes[nextPrayerName];
        
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
            const currentPadding = this.getIndividualPadding(currentPrayerName);
            const nextPadding = this.getIndividualPadding(nextPrayerName);
            
            const maghrebToMidnightStart = this.addPadding(currentPrayerTime, currentPadding.after);
            const maghrebToMidnightEnd = "23:59";
            
            const midnightToIchaStart = "00:00";
            const midnightToIchaEnd = this.subtractPadding(nextPrayerTime, nextPadding.before);
            
            // Calculate total duration for display
            const realMaghrebToMidnightStart = this.addPadding(currentPrayerTime, currentPadding.after);
            const realMidnightToIchaEnd = this.subtractPadding(nextPrayerTime, nextPadding.before);
            const realStartMinutes = timeToMinutes(realMaghrebToMidnightStart);
            const realEndMinutes = timeToMinutes(realMidnightToIchaEnd);
            
            // Handle case where icha is the next day
            let totalDurationMinutes;
            if (realEndMinutes <= realStartMinutes) {
              // icha is the next day, so we need to add 24 hours
              totalDurationMinutes = (realEndMinutes + 24 * 60) - realStartMinutes;
            } else {
              totalDurationMinutes = realEndMinutes - realStartMinutes;
            }
            
            const totalHours = Math.floor(totalDurationMinutes / 60);
            const totalMinutes = totalDurationMinutes % 60;
            const totalDurationText = totalHours > 0 ? `${totalHours}h${totalMinutes.toString().padStart(2, '0')}` : `${totalMinutes}min`;
            
            const slotTitle = `Disponibilité (${totalDurationText})`;
            
            // Calculate which slot is larger to determine where to show the text
            const maghrebToMidnightDuration = timeToMinutes(maghrebToMidnightEnd) - timeToMinutes(maghrebToMidnightStart);
            const midnightToIchaDuration = timeToMinutes(midnightToIchaEnd) - timeToMinutes(midnightToIchaStart);
            const showTextOnFirstSlot = maghrebToMidnightDuration >= midnightToIchaDuration;
            
            // Create a unique identifier for the night slot
            const nightSlotId = `night-slot-${maghrebToMidnightStart}-${midnightToIchaEnd}`;
            // Create a common identifier for maghreb-icha slots only
            const allNightSlotId = `maghreb-icha-slots`;
            
            // First slot: maghreb to 23:59
            if (maghrebToMidnightStart && maghrebToMidnightEnd && timeToMinutes(maghrebToMidnightEnd) > timeToMinutes(maghrebToMidnightStart)) {
              const adjustedStart = this.addPadding(maghrebToMidnightStart, 1);
              const adjustedEnd = this.subtractPadding(maghrebToMidnightEnd, 1);
              
              if (adjustedStart && adjustedEnd && timeToMinutes(adjustedEnd) > timeToMinutes(adjustedStart)) {
                this.createSVGEvent(slotTitle, adjustedStart, adjustedEnd, 'slot', 'slot night', maghrebToMidnightStart + '-' + maghrebToMidnightEnd, showTextOnFirstSlot, nightSlotId, null, allNightSlotId);
              }
            }
            
            // Second slot: 00:00 to icha
            if (midnightToIchaStart && midnightToIchaEnd && timeToMinutes(midnightToIchaEnd) > timeToMinutes(midnightToIchaStart)) {
              const adjustedStart = this.addPadding(midnightToIchaStart, 1);
              const adjustedEnd = this.subtractPadding(midnightToIchaEnd, 1);
              
              if (adjustedStart && adjustedEnd && timeToMinutes(adjustedEnd) > timeToMinutes(adjustedStart)) {
                this.createSVGEvent(slotTitle, adjustedStart, adjustedEnd, 'slot', 'slot night', midnightToIchaStart + '-' + midnightToIchaEnd, !showTextOnFirstSlot, nightSlotId, null, allNightSlotId);
              }
            }
            
            continue; // Skip the normal slot creation for this pair
          } else {
            // icha is before midnight, create a single night slot
            const currentPadding = this.getIndividualPadding(currentPrayerName);
            const nextPadding = this.getIndividualPadding(nextPrayerName);
            
            const slotStart = this.addPadding(currentPrayerTime, currentPadding.after);
            const slotEnd = this.subtractPadding(nextPrayerTime, nextPadding.before);
            
            // Calculate slot duration using real user values for display
            const realSlotStart = this.addPadding(currentPrayerTime, currentPadding.after);
            const realSlotEnd = this.subtractPadding(nextPrayerTime, nextPadding.before);
            const startMinutes = timeToMinutes(realSlotStart);
            const endMinutes = timeToMinutes(realSlotEnd);
            const durationMinutes = endMinutes - startMinutes;
            const hours = Math.floor(durationMinutes / 60);
            const minutes = durationMinutes % 60;
            const durationText = hours > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}` : `${minutes}min`;
            
            const slotTitle = `Disponibilité (${durationText})`;
            
            // Add 1 minute of margin at the beginning and end to improve UI (without affecting displayed duration)
            const adjustedSlotStart = this.addPadding(slotStart, 1);
            const adjustedSlotEnd = this.subtractPadding(slotEnd, 1);
            
            if (adjustedSlotStart && adjustedSlotEnd && timeToMinutes(adjustedSlotEnd) > timeToMinutes(adjustedSlotStart)) {
              // Create a unique identifier for the night slot
              const nightSlotId = `night-slot-${slotStart}-${slotEnd}`;
              // Create a common identifier for maghreb-icha slots only
              const allNightSlotId = `maghreb-icha-slots`;
              // For synchronization, use exact times (without padding)
              this.createSVGEvent(slotTitle, adjustedSlotStart, adjustedSlotEnd, 'slot', 'slot night', slotStart + '-' + slotEnd, true, nightSlotId, null, allNightSlotId);
            }
            
            continue; // Skip the normal slot creation for this pair
          }
        }
        
        // Normal slot creation for other prayer pairs
        // Slot starts at the end of the current prayer
        const currentPadding = this.getIndividualPadding(currentPrayerName);
        const nextPadding = this.getIndividualPadding(nextPrayerName);
        
        const slotStart = this.addPadding(currentPrayerTime, currentPadding.after);
        // Slot ends at the exact time of the next prayer
        const slotEnd = this.subtractPadding(nextPrayerTime, nextPadding.before);
        
        // Calculate slot duration using real user values for display
        const realSlotStart = this.addPadding(currentPrayerTime, currentPadding.after);
        const realSlotEnd = this.subtractPadding(nextPrayerTime, nextPadding.before);
        const startMinutes = timeToMinutes(realSlotStart);
        const endMinutes = timeToMinutes(realSlotEnd);
        const durationMinutes = endMinutes - startMinutes;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        const durationText = hours > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}` : `${minutes}min`;
        
        const slotTitle = `Disponibilité (${durationText})`;
        
        // Determine if this is a day slot (between fajr and sunset)
        const fajrTime = prayerTimes['fajr'];
        const sunsetTime = prayerTimes['sunset'];
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
        
        // Add 1 minute of margin at the beginning and end to improve UI (without affecting displayed duration)
        const adjustedSlotStart = this.addPadding(slotStart, 1);
        const adjustedSlotEnd = this.subtractPadding(slotEnd, 1);
        
        if (adjustedSlotStart && adjustedSlotEnd && timeToMinutes(adjustedSlotEnd) > timeToMinutes(adjustedSlotStart)) {
          // Determine the CSS class based on slot type
          const slotClass = isDaySlot ? 'slot day' : 'slot';
          
          // For synchronization, use exact times (without padding)
          this.createSVGEvent(slotTitle, adjustedSlotStart, adjustedSlotEnd, 'slot', slotClass, slotStart + '-' + slotEnd);
        }
      }
      
      // Special handling for the slot between icha and fajr (always deep night slot)
      // This is handled separately because icha is the last prayer in the order
      const ichaTime = prayerTimes['icha'];
      const fajrTime = prayerTimes['fajr'];
      
      if (ichaTime && fajrTime) {
        const ichaMinutes = timeToMinutes(ichaTime);
        const fajrMinutes = timeToMinutes(fajrTime);
        
        // Check if fajr is after midnight by comparing with icha
        if (fajrMinutes < ichaMinutes) {
          // fajr is after midnight, create two slots: icha to midnight and midnight to fajr
          const ichaPadding = this.getIndividualPadding('icha');
          const fajrPadding = this.getIndividualPadding('fajr');
          
          const ichaToMidnightStart = this.addPadding(ichaTime, ichaPadding.after);
          const ichaToMidnightEnd = "23:59";
          
          const midnightToFajrStart = "00:00";
          const midnightToFajrEnd = this.subtractPadding(fajrTime, fajrPadding.before);
          
          // Calculate total duration for display
          const realIchaToMidnightStart = this.addPadding(ichaTime, ichaPadding.after);
          const realMidnightToFajrEnd = this.subtractPadding(fajrTime, fajrPadding.before);
          const realStartMinutes = timeToMinutes(realIchaToMidnightStart);
          const realEndMinutes = timeToMinutes(realMidnightToFajrEnd);
          
          // Handle case where fajr is the next day
          let totalDurationMinutes;
          if (realEndMinutes <= realStartMinutes) {
            // fajr is the next day, so we need to add 24 hours
            totalDurationMinutes = (realEndMinutes + 24 * 60) - realStartMinutes;
          } else {
            totalDurationMinutes = realEndMinutes - realStartMinutes;
          }
          
          const totalHours = Math.floor(totalDurationMinutes / 60);
          const totalMinutes = totalDurationMinutes % 60;
          const totalDurationText = totalHours > 0 ? `${totalHours}h${totalMinutes.toString().padStart(2, '0')}` : `${totalMinutes}min`;
          
          const slotTitle = `Disponibilité (${totalDurationText})`;
          
          // Calculate which slot is larger to determine where to show the text
          const ichaToMidnightDuration = timeToMinutes(ichaToMidnightEnd) - timeToMinutes(ichaToMidnightStart);
          const midnightToFajrDuration = timeToMinutes(midnightToFajrEnd) - timeToMinutes(midnightToFajrStart);
          const showTextOnFirstSlot = ichaToMidnightDuration >= midnightToFajrDuration;
          
          // Create a unique identifier for the deep night slot
          const deepNightSlotId = `deep-night-slot-${ichaToMidnightStart}-${midnightToFajrEnd}`;
          // Create a common identifier for icha-fajr slots only
          const allNightSlotId = `icha-fajr-slots`;
          
          // First slot: icha to 23:59
          if (ichaToMidnightStart && ichaToMidnightEnd && timeToMinutes(ichaToMidnightEnd) > timeToMinutes(ichaToMidnightStart)) {
            const adjustedStart = this.addPadding(ichaToMidnightStart, 1);
            const adjustedEnd = this.subtractPadding(ichaToMidnightEnd, 1);
            
            if (adjustedStart && adjustedEnd && timeToMinutes(adjustedEnd) > timeToMinutes(adjustedStart)) {
              this.createSVGEvent(slotTitle, adjustedStart, adjustedEnd, 'slot', 'slot deep-night', ichaToMidnightStart + '-' + ichaToMidnightEnd, showTextOnFirstSlot, null, deepNightSlotId, allNightSlotId);
            }
          }
          
          // Second slot: 00:00 to fajr
          if (midnightToFajrStart && midnightToFajrEnd && timeToMinutes(midnightToFajrEnd) > timeToMinutes(midnightToFajrStart)) {
            const adjustedStart = this.addPadding(midnightToFajrStart, 1);
            const adjustedEnd = this.subtractPadding(midnightToFajrEnd, 1);
            
            if (adjustedStart && adjustedEnd && timeToMinutes(adjustedEnd) > timeToMinutes(adjustedStart)) {
              this.createSVGEvent(slotTitle, adjustedStart, adjustedEnd, 'slot', 'slot deep-night', midnightToFajrStart + '-' + midnightToFajrEnd, !showTextOnFirstSlot, null, deepNightSlotId, allNightSlotId);
            }
          }
        } else {
          // fajr is before midnight, create a single deep night slot
          const ichaPadding = this.getIndividualPadding('icha');
          const fajrPadding = this.getIndividualPadding('fajr');
          
          const slotStart = this.addPadding(ichaTime, ichaPadding.after);
          const slotEnd = this.subtractPadding(fajrTime, fajrPadding.before);
          
          // Calculate slot duration using real user values for display
          const realSlotStart = this.addPadding(ichaTime, ichaPadding.after);
          const realSlotEnd = this.subtractPadding(fajrTime, fajrPadding.before);
          const startMinutes = timeToMinutes(realSlotStart);
          const endMinutes = timeToMinutes(realSlotEnd);
          const durationMinutes = endMinutes - startMinutes;
          const hours = Math.floor(durationMinutes / 60);
          const minutes = durationMinutes % 60;
          const durationText = hours > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}` : `${minutes}min`;
          
          const slotTitle = `Disponibilité (${durationText})`;
          
          // Add 1 minute of margin at the beginning and end to improve UI (without affecting displayed duration)
          const adjustedSlotStart = this.addPadding(slotStart, 1);
          const adjustedSlotEnd = this.subtractPadding(slotEnd, 1);
          
          if (adjustedSlotStart && adjustedSlotEnd && timeToMinutes(adjustedSlotEnd) > timeToMinutes(adjustedSlotStart)) {
            // Create a unique identifier for the deep night slot
            const deepNightSlotId = `deep-night-slot-${slotStart}-${slotEnd}`;
            // Create a common identifier for icha-fajr slots only
            const allNightSlotId = `icha-fajr-slots`;
            // For synchronization, use exact times (without padding)
            this.createSVGEvent(slotTitle, adjustedSlotStart, adjustedSlotEnd, 'slot', 'slot deep-night', slotStart + '-' + slotEnd, true, null, deepNightSlotId, allNightSlotId);
          }
        }
      }
    } else if (slots && slots.length > 0) {
      // Fallback: use original slots if no prayer times available
      slots.forEach((slot, index) => {
        const startTime = slot.start_time || slot.start || slot.startTime;
        const endTime = slot.end_time || slot.end || slot.endTime;
        const title = slot.title || slot.summary || `Slot ${index + 1}`;
        
        // Calculate slot duration
        const startMinutes = timeToMinutes(startTime);
        const endMinutes = timeToMinutes(endTime);
        const durationMinutes = endMinutes - startMinutes;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        const durationText = hours > 0 ? `${hours}h${minutes.toString().padStart(2, '0')}` : `${minutes}min`;
        
        const slotTitle = `Disponibilité (${durationText})`;
        
        // Add 1 minute of margin at the beginning and end to improve UI
        const adjustedStartTime = this.addPadding(startTime, 1);
        const adjustedEndTime = this.subtractPadding(endTime, 1);
        
        if (adjustedStartTime && adjustedEndTime && timeToMinutes(adjustedEndTime) > timeToMinutes(adjustedStartTime)) {
          // For synchronization, use exact times (without padding)
          this.createSVGEvent(slotTitle, adjustedStartTime, adjustedEndTime, 'slot', 'slot', startTime + '-' + endTime);
        }
      });
    }
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

  // Create an SVG event
  createSVGEvent(title, startTime, endTime, type, className, syncTime = null, showText = true, nightSlotId = null, deepNightSlotId = null, allNightSlotId = null) {
    if (!this.svg || !this.eventsGroup) return;
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const y = startMin;
    const height = endMin - startMin;
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', 60 + 6);
    rect.setAttribute('y', y);
    rect.setAttribute('width', 400 - 60 - 12);
    rect.setAttribute('height', height);
    rect.setAttribute('rx', 5);
    rect.setAttribute('ry', 5);
    rect.setAttribute('class', `timeline-event ${className}`);
    
    // Add data-attributes for synchronization with clock-arc
    // For prayers, use syncTime (exact time), otherwise startTime
    // For slots, syncTime contains "start-end"
    let syncStartTime, syncEndTime;
    if (syncTime && syncTime.includes('-')) {
      // It's a slot: syncTime = "start-end"
      [syncStartTime, syncEndTime] = syncTime.split('-');
    } else {
      // It's a prayer: syncTime = exact time
      syncStartTime = syncTime || startTime;
      syncEndTime = syncTime || endTime;
    }
    rect.setAttribute('data-start', syncStartTime);
    rect.setAttribute('data-end', syncEndTime);
    rect.setAttribute('data-type', type);
    
    // Add deep night slot ID if provided
    if (deepNightSlotId) {
      rect.setAttribute('data-deep-night-slot-id', deepNightSlotId);
    }
    // Add night slot ID if provided
    if (nightSlotId) {
      rect.setAttribute('data-night-slot-id', nightSlotId);
    }
    // Add all night slot ID if provided
    if (allNightSlotId) {
      rect.setAttribute('data-all-night-slot-id', allNightSlotId);
    }
    
    // Add hover events for synchronization
    rect.addEventListener('mouseover', () => {
      if (allNightSlotId) {
        // For all night slots, activate all related elements (maghreb-icha and icha-fajr)
        const relatedTimelineEvents = document.querySelectorAll(`.timeline-event[data-all-night-slot-id="${allNightSlotId}"]`);
        relatedTimelineEvents.forEach(event => event.classList.add('active'));
        
        // Activate related clock arcs
        const relatedClockArcs = document.querySelectorAll(`.clock-arc[data-all-night-slot-id="${allNightSlotId}"]`);
        relatedClockArcs.forEach(arc => arc.classList.add('active'));
        
        // Also activate related list items
        const relatedListItems = document.querySelectorAll(`.slot-item[data-all-night-slot-id="${allNightSlotId}"]`);
        relatedListItems.forEach(item => item.classList.add('active'));
      } else if (deepNightSlotId) {
        // For deep night slots, activate all related elements
        const relatedTimelineEvents = document.querySelectorAll(`.timeline-event[data-deep-night-slot-id="${deepNightSlotId}"]`);
        relatedTimelineEvents.forEach(event => event.classList.add('active'));
        
        // Activate related clock arcs
        const relatedClockArcs = document.querySelectorAll(`.clock-arc[data-deep-night-slot-id="${deepNightSlotId}"]`);
        relatedClockArcs.forEach(arc => arc.classList.add('active'));
        
        // Also activate related list items
        const relatedListItems = document.querySelectorAll(`.slot-item[data-deep-night-slot-id="${deepNightSlotId}"]`);
        relatedListItems.forEach(item => item.classList.add('active'));
      } else if (nightSlotId) {
        // For night slots, activate all related elements
        const relatedTimelineEvents = document.querySelectorAll(`.timeline-event[data-night-slot-id="${nightSlotId}"]`);
        relatedTimelineEvents.forEach(event => event.classList.add('active'));
        
        // Activate related clock arcs
        const relatedClockArcs = document.querySelectorAll(`.clock-arc[data-night-slot-id="${nightSlotId}"]`);
        relatedClockArcs.forEach(arc => arc.classList.add('active'));
        
        // Also activate related list items
        const relatedListItems = document.querySelectorAll(`.slot-item[data-night-slot-id="${nightSlotId}"]`);
        relatedListItems.forEach(item => item.classList.add('active'));
      } else {
        // Normal synchronization for regular slots
      const clockArc = document.querySelector(`.clock-arc[data-start="${syncStartTime}"][data-end="${syncEndTime}"]`);
      if (clockArc) {
        clockArc.classList.add('active');
      }
      rect.classList.add('active');
      }
    });
    
    rect.addEventListener('mouseout', () => {
      if (allNightSlotId) {
        // For all night slots, deactivate all related elements (maghreb-icha and icha-fajr)
        const relatedTimelineEvents = document.querySelectorAll(`.timeline-event[data-all-night-slot-id="${allNightSlotId}"]`);
        relatedTimelineEvents.forEach(event => event.classList.remove('active'));
        
        // Deactivate related clock arcs
        const relatedClockArcs = document.querySelectorAll(`.clock-arc[data-all-night-slot-id="${allNightSlotId}"]`);
        relatedClockArcs.forEach(arc => arc.classList.remove('active'));
        
        // Also deactivate related list items
        const relatedListItems = document.querySelectorAll(`.slot-item[data-all-night-slot-id="${allNightSlotId}"]`);
        relatedListItems.forEach(item => item.classList.remove('active'));
      } else if (deepNightSlotId) {
        // For deep night slots, deactivate all related elements
        const relatedTimelineEvents = document.querySelectorAll(`.timeline-event[data-deep-night-slot-id="${deepNightSlotId}"]`);
        relatedTimelineEvents.forEach(event => event.classList.remove('active'));
        
        // Deactivate related clock arcs
        const relatedClockArcs = document.querySelectorAll(`.clock-arc[data-deep-night-slot-id="${deepNightSlotId}"]`);
        relatedClockArcs.forEach(arc => arc.classList.remove('active'));
        
        // Also deactivate related list items
        const relatedListItems = document.querySelectorAll(`.slot-item[data-deep-night-slot-id="${deepNightSlotId}"]`);
        relatedListItems.forEach(item => item.classList.remove('active'));
      } else if (nightSlotId) {
        // For night slots, deactivate all related elements
        const relatedTimelineEvents = document.querySelectorAll(`.timeline-event[data-night-slot-id="${nightSlotId}"]`);
        relatedTimelineEvents.forEach(event => event.classList.remove('active'));
        
        // Deactivate related clock arcs
        const relatedClockArcs = document.querySelectorAll(`.clock-arc[data-night-slot-id="${nightSlotId}"]`);
        relatedClockArcs.forEach(arc => arc.classList.remove('active'));
        
        // Also deactivate related list items
        const relatedListItems = document.querySelectorAll(`.slot-item[data-night-slot-id="${nightSlotId}"]`);
        relatedListItems.forEach(item => item.classList.remove('active'));
      } else {
        // Normal synchronization for regular slots
      const clockArc = document.querySelector(`.clock-arc[data-start="${syncStartTime}"][data-end="${syncEndTime}"]`);
      if (clockArc) {
        clockArc.classList.remove('active');
      }
      rect.classList.remove('active');
      }
    });
    
    // Add rect first, then text to ensure proper layering
    this.eventsGroup.appendChild(rect);
    
    // Only create text element if showText is true
    if (showText) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', 60 + 16);
      text.setAttribute('y', y + height / 2 + 6);
      text.textContent = title;
      text.setAttribute('class', 'timeline-event-text');
    this.eventsGroup.appendChild(text);
    }
  }

  // Calculate the end of a prayer (35min by default)
  calculatePrayerEndTime(startTime) {
    const startMin = timeToMinutes(startTime);
    const endMin = startMin + 35;
    return minutesToTime(endMin);
  }

  // Tooltip (show)
  showTooltip(event, title, startTime, endTime) {
    if (this.tooltip) {
      this.tooltip.textContent = `${title} - ${startTime} to ${endTime}`;
      this.tooltip.style.left = (event.clientX + 10) + 'px';
      this.tooltip.style.top = (event.clientY - 30) + 'px';
      this.tooltip.classList.add('show');
    }
  }

  // Tooltip (hide)
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.classList.remove('show');
    }
  }

  // Remove all SVG events
  clearEvents() {
    if (this.eventsGroup) {
      while (this.eventsGroup.firstChild) this.eventsGroup.removeChild(this.eventsGroup.firstChild);
    }
    
    // Also clear Hijri date elements from SVG
    if (this.svg) {
      const hijriDateElements = this.svg.querySelectorAll('.timeline-hijri-date, .timeline-hijri-date-bg');
      hijriDateElements.forEach(element => element.remove());
    }
  }

  // Show an empty state
  showEmptyState() {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '50%');
    text.setAttribute('y', '50%');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', 'var(--text-muted)');
    text.setAttribute('font-size', '16px');
    text.textContent = 'No events for this day';
    this.svg.appendChild(text);
  }

  // Day navigation
  navigateToDay(date) {
    this.displayDayEvents(date);
  }

  // Method called by central sync
  setDate(date) {
    if (!date) return;
    
    this.currentDate = new Date(date);
    this.updateTimelineDate();
    this.displayDayEvents(this.currentDate);
  }

  // Navigation and toggle buttons
  setupViewToggle() {
    const toggleBtn = document.getElementById('toggleViewBtn');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        this.toggleView();
      });
    }
    const prevBtn = document.getElementById('prevDayBtn');
    const nextBtn = document.getElementById('nextDayBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const d = new Date(this.currentDate);
        d.setDate(d.getDate() - 1);
        window.setSelectedDate(d);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const d = new Date(this.currentDate);
        d.setDate(d.getDate() + 1);
        window.setSelectedDate(d);
      });
    }
    
    // Listen for Hijri date option changes
    const showHijriCheckbox = document.getElementById('show_hijri_date');
    if (showHijriCheckbox) {
      showHijriCheckbox.addEventListener('change', () => {
        // Refresh the current day display to show/hide Hijri date
        this.displayDayEvents(this.currentDate);
      });
    }
    
    // Listen for voluntary fasts option changes
    const includeVoluntaryFastsCheckbox = document.getElementById('include_voluntary_fasts');
    if (includeVoluntaryFastsCheckbox) {
      includeVoluntaryFastsCheckbox.addEventListener('change', () => {
        // Refresh the current day display to show/hide voluntary fasts info
        this.displayDayEvents(this.currentDate);
      });
    }
  }

  // Show timeline view
  showTimelineView() {
    const timelineContent = document.querySelector('.timeline-content');
    const slotsList = document.getElementById('availableSlotsList');
    if (timelineContent && slotsList) {
      timelineContent.style.display = 'flex';
      slotsList.style.display = 'none';
      this.currentView = 'timeline';
    }
  }

  // Show classic slots view
  showSlotsView() {
    const timelineContent = document.querySelector('.timeline-content');
    const slotsList = document.getElementById('availableSlotsList');
    if (timelineContent && slotsList) {
      timelineContent.style.display = 'none';
      slotsList.style.display = 'block';
      this.currentView = 'slots';
    }
  }

  // Current view
  getCurrentView() {
    return this.currentView;
  }

  // Check if the timeline is initialized
  isInitialized() {
    return this.container !== null && this.svg !== null;
  }
} 