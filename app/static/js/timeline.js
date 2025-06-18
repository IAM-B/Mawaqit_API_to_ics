class Timeline {
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
    this.init();
  }

  formatTime(time) {
    const [hours, minutes] = time.split(':');
    return (parseInt(hours) + parseInt(minutes) / 60) * (100 / 24);
  }

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

  updateTimeline() {
    console.log('Updating timeline');
    this.container.innerHTML = '';
    const currentData = this.getCurrentData();
    console.log('Current data:', currentData);

    if (!currentData) {
      console.error('No current data available');
      return;
    }

    // Show prayer times with padding
    const prayerPeriods = [];
    if (currentData.prayer_times) {
      Object.entries(currentData.prayer_times).forEach(([prayer, time]) => {
        const [hours, minutes] = time.split(':');
        const prayerTime = new Date();
        prayerTime.setHours(parseInt(hours), parseInt(minutes));
        
        const paddingBefore = new Date(prayerTime);
        paddingBefore.setMinutes(paddingBefore.getMinutes() - 10); // padding_before default
        
        const paddingAfter = new Date(prayerTime);
        paddingAfter.setMinutes(paddingAfter.getMinutes() + 35); // padding_after default

        prayerPeriods.push({
          start: paddingBefore.toTimeString().slice(0, 5),
          end: paddingAfter.toTimeString().slice(0, 5),
          prayer: prayer
        });

        // Show prayer period
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

      // If not the last period, create a slot until the next prayer
      if (nextPeriod) {
        availableSlots.push({
          start: currentPeriod.end,
          end: nextPeriod.start
        });
      }
    }

    // Show available slots
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
  }

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
        // Navigate to the right
        if (this.currentDayIndex < this.segments[this.currentIndex].days.length - 1) {
          this.currentDayIndex++;
        } else if (this.currentIndex < this.segments.length - 1) {
          this.currentIndex++;
          this.currentDayIndex = 0;
        }
      } else {
        // Navigate to the left
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

  init() {
    console.log('Initializing timeline');
    this.updateTimeline();
  }
}

// Export the class to be used in the template
window.Timeline = Timeline;