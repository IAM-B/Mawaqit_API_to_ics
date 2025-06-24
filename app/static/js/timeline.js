/**
 * Timeline verticale (agenda) pour visualiser les créneaux de prières, slots et empty
 * Inspiré de Google/Apple Calendar avec une grille horaire verticale
 */

class Timeline {
  constructor() {
    this.container = null;
    this.currentDate = new Date();
    this.segments = [];
    this.scope = 'today';
    this.init();
  }

  /**
   * Initialiser la timeline
   */
  init() {
    this.createTimelineContainer();
  }

  /**
   * Créer le conteneur de la timeline
   */
  createTimelineContainer() {
    // Remplacer le defaultSlotsView par la timeline
    const defaultSlotsView = document.getElementById('defaultSlotsView');
    if (defaultSlotsView) {
      // Créer le nouveau conteneur timeline
      const timelineContainer = document.createElement('div');
      timelineContainer.id = 'timelineContainer';
      timelineContainer.className = 'timeline-container';
      
      // Créer l'en-tête de la timeline
      const timelineHeader = document.createElement('div');
      timelineHeader.className = 'timeline-header';
      
      const timelineTitle = document.createElement('h3');
      timelineTitle.className = 'timeline-title';
      timelineTitle.innerHTML = '<i class="fa-regular fa-clock"></i> Agenda vertical';
      
      const timelineDate = document.createElement('div');
      timelineDate.className = 'timeline-date';
      timelineDate.id = 'timelineDate';
      
      timelineHeader.appendChild(timelineTitle);
      timelineHeader.appendChild(timelineDate);
      
      // Créer le contenu de la timeline
      const timelineContent = document.createElement('div');
      timelineContent.className = 'timeline-content';
      
      const timelineGrid = document.createElement('div');
      timelineGrid.className = 'timeline-grid';
      
      // Créer la colonne des heures
      const timelineHours = document.createElement('div');
      timelineHours.className = 'timeline-hours';
      
      // Générer les heures (00:00 à 23:00)
      for (let hour = 0; hour < 24; hour++) {
        const hourElement = document.createElement('div');
        hourElement.className = 'timeline-hour';
        hourElement.textContent = `${hour.toString().padStart(2, '0')}:00`;
        timelineHours.appendChild(hourElement);
      }
      
      // Créer la zone des événements
      const timelineEvents = document.createElement('div');
      timelineEvents.className = 'timeline-events';
      
      // Créer les lignes d'événements (24 heures)
      for (let hour = 0; hour < 24; hour++) {
        const eventRow = document.createElement('div');
        eventRow.className = 'timeline-event-row';
        timelineEvents.appendChild(eventRow);
      }
      
      // Créer les conteneurs de couches d'événements
      const eventsContainer = document.createElement('div');
      eventsContainer.className = 'timeline-events-container';
      
      const prayersLayer = document.createElement('div');
      prayersLayer.className = 'timeline-event-layer prayers';
      
      const slotsLayer = document.createElement('div');
      slotsLayer.className = 'timeline-event-layer slots';
      
      const emptyLayer = document.createElement('div');
      emptyLayer.className = 'timeline-event-layer empty';
      
      eventsContainer.appendChild(prayersLayer);
      eventsContainer.appendChild(slotsLayer);
      eventsContainer.appendChild(emptyLayer);
      
      timelineEvents.appendChild(eventsContainer);
      
      // Assembler la grille
      timelineGrid.appendChild(timelineHours);
      timelineGrid.appendChild(timelineEvents);
      
      timelineContent.appendChild(timelineGrid);
      timelineContainer.appendChild(timelineHeader);
      timelineContainer.appendChild(timelineContent);
      
      // Remplacer l'ancien conteneur
      defaultSlotsView.parentNode.replaceChild(timelineContainer, defaultSlotsView);
      
      this.container = timelineContainer;
    }
  }

  /**
   * Initialiser la timeline avec des données
   */
  initializeTimeline(segments, scope) {
    this.segments = segments;
    this.scope = scope;
    
    // Mettre à jour la date affichée
    this.updateTimelineDate();
    
    // Afficher les événements du jour sélectionné (par défaut aujourd'hui)
    this.displayDayEvents(new Date());
  }

  /**
   * Mettre à jour la date affichée dans l'en-tête
   */
  updateTimelineDate() {
    const timelineDate = document.getElementById('timelineDate');
    if (timelineDate) {
      const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      };
      timelineDate.textContent = this.currentDate.toLocaleDateString('fr-FR', options);
    }
  }

  /**
   * Afficher les événements d'un jour spécifique
   */
  displayDayEvents(date) {
    this.currentDate = date;
    this.updateTimelineDate();
    
    // Vider les couches d'événements
    this.clearEventLayers();
    
    // Trouver les données du jour
    const dayData = this.getDayData(date);
    if (!dayData) {
      this.showEmptyState();
      return;
    }
    
    // Afficher les prières
    this.displayPrayers(dayData.prayer_times);
    
    // Afficher les slots
    this.displaySlots(dayData.slots);
    
    // Afficher les empty slots
    this.displayEmptySlots(dayData.slots);
  }

  /**
   * Obtenir les données d'un jour spécifique
   */
  getDayData(date) {
    if (!this.segments || this.segments.length === 0) {
      return null;
    }
    
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    
    // Pour le scope "today"
    if (this.scope === 'today' && this.segments.length > 0) {
      return this.segments[0];
    }
    
    // Pour le scope "month"
    if (this.scope === 'month') {
      const dayIndex = day - 1;
      if (dayIndex >= 0 && dayIndex < this.segments.length) {
        return this.segments[dayIndex];
      }
    }
    
    // Pour le scope "year"
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

  /**
   * Afficher les prières
   */
  displayPrayers(prayerTimes) {
    if (!prayerTimes) return;
    
    const prayersLayer = this.container.querySelector('.timeline-event-layer.prayers');
    if (!prayersLayer) return;
    
    const prayerNames = {
      'fajr': 'Fajr',
      'sunset': 'Sunset',
      'dohr': 'Dohr',
      'asr': 'Asr',
      'maghreb': 'Maghreb',
      'icha': 'Icha'
    };
    
    Object.entries(prayerTimes).forEach(([prayerName, timeStr]) => {
      if (!timeStr) return;
      
      const event = this.createTimelineEvent(
        prayerNames[prayerName] || prayerName,
        timeStr,
        timeStr, // Même heure de début et fin pour les prières
        'prayer',
        prayersLayer
      );
      
      if (event) {
        event.setAttribute('data-tooltip', `${prayerNames[prayerName] || prayerName} - ${timeStr}`);
      }
    });
  }

  /**
   * Afficher les slots disponibles
   */
  displaySlots(slots) {
    if (!slots || slots.length === 0) return;
    
    const slotsLayer = this.container.querySelector('.timeline-event-layer.slots');
    if (!slotsLayer) return;
    
    slots.forEach((slot, index) => {
      const event = this.createTimelineEvent(
        `Disponible ${index + 1}`,
        slot.start,
        slot.end,
        'slot',
        slotsLayer
      );
      
      if (event) {
        const duration = this.calculateDuration(slot.start, slot.end);
        event.setAttribute('data-tooltip', `Créneau disponible - ${slot.start} à ${slot.end} (${duration})`);
      }
    });
  }

  /**
   * Afficher les empty slots (créneaux vides)
   */
  displayEmptySlots(slots) {
    if (!slots || slots.length === 0) return;
    
    const emptyLayer = this.container.querySelector('.timeline-event-layer.empty');
    if (!emptyLayer) return;
    
    // Utiliser les empty_slots fournis par le backend
    const dayData = this.getDayData(this.currentDate);
    if (!dayData || !dayData.empty_slots) return;
    
    dayData.empty_slots.forEach((emptySlot, index) => {
      const event = this.createTimelineEvent(
        `Vide ${index + 1}`,
        emptySlot.start,
        emptySlot.end,
        'empty',
        emptyLayer
      );
      
      if (event) {
        const duration = this.calculateDuration(emptySlot.start, emptySlot.end);
        event.setAttribute('data-tooltip', `Créneau vide - ${emptySlot.start} à ${emptySlot.end} (${duration})`);
      }
    });
  }

  /**
   * Créer un événement dans la timeline
   */
  createTimelineEvent(title, startTime, endTime, type, layer) {
    if (!startTime || !endTime) return null;
    
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    
    if (startMinutes === null || endMinutes === null) return null;
    
    const event = document.createElement('div');
    event.className = `timeline-event ${type}`;
    event.textContent = title;
    
    // Positionner l'événement
    const top = (startMinutes / 60) * 60; // 60px par heure
    const height = ((endMinutes - startMinutes) / 60) * 60;
    
    event.style.top = `${top}px`;
    event.style.height = `${Math.max(height, 20)}px`; // Hauteur minimum de 20px
    
    // Ajouter des événements de clic
    event.addEventListener('click', () => {
      this.onEventClick(type, title, startTime, endTime);
    });
    
    layer.appendChild(event);
    return event;
  }

  /**
   * Convertir une heure en minutes depuis minuit
   */
  timeToMinutes(timeStr) {
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    } catch (error) {
      console.error('Erreur de conversion d\'heure:', timeStr);
      return null;
    }
  }

  /**
   * Calculer la durée entre deux heures
   */
  calculateDuration(startTime, endTime) {
    const startMinutes = this.timeToMinutes(startTime);
    const endMinutes = this.timeToMinutes(endTime);
    
    if (startMinutes === null || endMinutes === null) return '';
    
    const durationMinutes = endMinutes - startMinutes;
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h${minutes > 0 ? minutes + 'min' : ''}`;
    } else {
      return `${minutes}min`;
    }
  }

  /**
   * Vider les couches d'événements
   */
  clearEventLayers() {
    const layers = this.container.querySelectorAll('.timeline-event-layer');
    layers.forEach(layer => {
      layer.innerHTML = '';
    });
  }

  /**
   * Afficher l'état vide
   */
  showEmptyState() {
    const timelineContent = this.container.querySelector('.timeline-content');
    if (!timelineContent) return;
    
    timelineContent.innerHTML = `
      <div class="timeline-empty">
        <div class="timeline-empty-icon">📅</div>
        <div class="timeline-empty-text">
          Aucun créneau disponible pour cette date
        </div>
      </div>
    `;
  }

  /**
   * Gérer le clic sur un événement
   */
  onEventClick(type, title, startTime, endTime) {
    console.log('Événement cliqué:', { type, title, startTime, endTime });
    
    // Ici on peut ajouter des actions spécifiques selon le type d'événement
    switch (type) {
      case 'prayer':
        // Action pour les prières
        break;
      case 'slot':
        // Action pour les slots disponibles
        break;
      case 'empty':
        // Action pour les créneaux vides
        break;
    }
  }

  /**
   * Naviguer vers un jour spécifique
   */
  navigateToDay(date) {
    this.displayDayEvents(date);
  }

  /**
   * Naviguer vers le jour précédent
   */
  previousDay() {
    const previousDate = new Date(this.currentDate);
    previousDate.setDate(previousDate.getDate() - 1);
    this.navigateToDay(previousDate);
  }

  /**
   * Naviguer vers le jour suivant
   */
  nextDay() {
    const nextDate = new Date(this.currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    this.navigateToDay(nextDate);
  }

  /**
   * Synchroniser avec la sélection du calendrier
   */
  syncWithCalendar(day, segments) {
    this.segments = segments;
    const selectedDate = new Date();
    selectedDate.setDate(day);
    this.displayDayEvents(selectedDate);
  }
}

// Initialiser la timeline quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
  window.timeline = new Timeline();
}); 