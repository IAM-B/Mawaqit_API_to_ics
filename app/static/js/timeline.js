/**
 * Timeline verticale (agenda) pour visualiser les créneaux de prières, slots et empty
 * Inspiré de Google/Apple Calendar avec une grille horaire verticale
 */

console.log('timeline.js chargé');
console.log('Timeline instanciée');

// Constante pour la graduation : 60px par heure
const HOUR_HEIGHT = 60;
const TIMELINE_HEIGHT = 24 * HOUR_HEIGHT; // 1440px pour 24 heures
const HOUR_LABEL_WIDTH = 50;
const EVENT_MARGIN = 4;

class Timeline {
  constructor() {
    this.container = null;
    this.svg = null;
    this.currentDate = new Date();
    this.segments = [];
    this.scope = 'today';
    this.icsDays = [];
    this.tooltip = null;
    this.init();
  }

  /**
   * Initialiser la timeline
   */
  init() {
    this.createTimelineContainer();
    this.createTooltip();
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
      
      // Créer le contenu SVG de la timeline
      const timelineContent = document.createElement('div');
      timelineContent.className = 'timeline-content';
      
      const svgContainer = document.createElement('div');
      svgContainer.className = 'timeline-svg-container';
      
      // Créer l'élément SVG principal
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'timeline-svg');
      svg.setAttribute('viewBox', `0 0 1000 ${TIMELINE_HEIGHT}`);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      
      // Créer la grille horaire SVG
      this.createSVGGrid(svg);
      
      svgContainer.appendChild(svg);
      timelineContent.appendChild(svgContainer);
      timelineContainer.appendChild(timelineHeader);
      timelineContainer.appendChild(timelineContent);
      
      // Remplacer l'ancien conteneur
      defaultSlotsView.parentNode.replaceChild(timelineContainer, defaultSlotsView);
      
      this.container = timelineContainer;
      this.svg = svg;
    }
  }

  createSVGGrid(svg) {
    console.log('🔧 Création de la grille SVG');
    console.log(`📏 Dimensions: HOUR_HEIGHT=${HOUR_HEIGHT}px, TIMELINE_HEIGHT=${TIMELINE_HEIGHT}px`);
    
    // Créer le groupe pour la grille
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    gridGroup.setAttribute('class', 'timeline-grid');
    
    // Créer les lignes horizontales pour chaque heure
    for (let hour = 0; hour <= 24; hour++) {
      const y = hour * HOUR_HEIGHT;
      
      // Ligne horizontale
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', HOUR_LABEL_WIDTH);
      line.setAttribute('y1', y);
      line.setAttribute('x2', '100%');
      line.setAttribute('y2', y);
      line.setAttribute('class', 'timeline-hour-line');
      
      // Texte de l'heure (seulement pour les heures 0-23)
      if (hour < 24) {
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', HOUR_LABEL_WIDTH - 10);
        text.setAttribute('y', y + HOUR_HEIGHT / 2);
        text.textContent = `${hour.toString().padStart(2, '0')}:00`;
        text.setAttribute('class', 'timeline-hour-text');
        
        gridGroup.appendChild(text);
      }
      
      gridGroup.appendChild(line);
      
      console.log(`🕐 Heure ${hour.toString().padStart(2, '0')}:00 → y=${y}px`);
    }
    
    // Ligne verticale pour séparer les labels des événements
    const verticalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    verticalLine.setAttribute('x1', HOUR_LABEL_WIDTH);
    verticalLine.setAttribute('y1', 0);
    verticalLine.setAttribute('x2', HOUR_LABEL_WIDTH);
    verticalLine.setAttribute('y2', TIMELINE_HEIGHT);
    verticalLine.setAttribute('class', 'timeline-hour-line');
    
    gridGroup.appendChild(verticalLine);
    svg.appendChild(gridGroup);
    
    console.log('✅ Grille SVG créée avec succès');
  }

  createTooltip() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'timeline-tooltip';
    this.tooltip.style.position = 'absolute';
    this.tooltip.style.zIndex = '1000';
    this.tooltip.style.pointerEvents = 'none';
    document.body.appendChild(this.tooltip);
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
    
    // Vider les événements existants
    this.clearEvents();
    
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
        const startTime = time;
        const endTime = this.calculatePrayerEndTime(time);
        
        this.createSVGEvent(
          prayerNames[prayer],
          startTime,
          endTime,
          'prayer',
          'prayer'
        );
      }
    });
  }

  /**
   * Afficher les slots
   */
  displaySlots(slots) {
    if (!slots || !Array.isArray(slots)) {
      console.log('⚠️ Aucun slot à afficher ou format invalide');
      return;
    }
    
    console.log('🕐 Traitement des slots:', slots);
    console.log('📊 Structure du premier slot:', JSON.stringify(slots[0], null, 2));
    
    slots.forEach((slot, index) => {
      console.log(`  [${index + 1}] Slot:`, slot);
      
      // Vérifier les propriétés disponibles
      const startTime = slot.start_time || slot.start || slot.startTime;
      const endTime = slot.end_time || slot.end || slot.endTime;
      const title = slot.title || slot.summary || `Slot ${index + 1}`;
      
      if (startTime && endTime) {
        console.log(`    ✅ Création événement: ${title} (${startTime}-${endTime})`);
        this.createSVGEvent(title, startTime, endTime, 'slot', 'slot');
      } else {
        console.warn(`    ⚠️ Slot ${index + 1} sans horaires valides:`, { startTime, endTime });
      }
    });
  }

  /**
   * Afficher les empty slots
   */
  displayEmptySlots(slots) {
    if (!slots || !Array.isArray(slots)) {
      console.log('⚠️ Aucun créneau vide à afficher ou format invalide');
      return;
    }
    
    console.log('🕳️ Traitement des créneaux vides:', slots);
    
    slots.forEach((slot, index) => {
      console.log(`  [${index + 1}] Empty slot:`, slot);
      
      // Vérifier si c'est un créneau vide (différentes propriétés possibles)
      const isEmpty = slot.is_empty || slot.isEmpty || slot.empty || slot.available === false || slot.status === 'empty';
      
      // Si aucune propriété spécifique, on peut aussi vérifier s'il y a des événements dans ce créneau
      const hasEvents = slot.events && slot.events.length > 0;
      const isActuallyEmpty = isEmpty || (!hasEvents && slot.available !== true);
      
      if (isActuallyEmpty) {
        // Vérifier les propriétés disponibles
        const startTime = slot.start_time || slot.start || slot.startTime;
        const endTime = slot.end_time || slot.end || slot.endTime;
        const title = slot.title || slot.summary || 'Créneau libre';
        
        if (startTime && endTime) {
          console.log(`    ✅ Création événement vide: ${title} (${startTime}-${endTime})`);
          this.createSVGEvent(title, startTime, endTime, 'empty', 'empty');
        } else {
          console.warn(`    ⚠️ Empty slot ${index + 1} sans horaires valides:`, { startTime, endTime });
        }
      } else {
        console.log(`    ℹ️ Slot ${index + 1} n'est pas vide (${isEmpty}, hasEvents: ${hasEvents})`);
      }
    });
  }

  /**
   * Créer un événement SVG avec calculs précis
   */
  createSVGEvent(title, startTime, endTime, type, className) {
    console.log(`🔧 Création événement SVG: ${title} (${startTime}-${endTime})`);
    
    // Vérifications de sécurité
    if (!startTime || !endTime) {
      console.error(`❌ Impossible de créer l'événement "${title}": horaires manquants`, { startTime, endTime });
      return;
    }
    
    if (!this.svg) {
      console.error('❌ SVG non initialisé');
      return;
    }
    
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    
    // Vérifier que les minutes sont valides
    if (startMin === 0 && startTime !== '00:00') {
      console.error(`❌ Heure de début invalide pour "${title}": ${startTime}`);
      return;
    }
    
    if (endMin === 0 && endTime !== '00:00') {
      console.error(`❌ Heure de fin invalide pour "${title}": ${endTime}`);
      return;
    }
    
    // Calculs précis de position
    const y = (startMin / 60) * HOUR_HEIGHT;
    const height = Math.max((endMin - startMin) / 60 * HOUR_HEIGHT, 20);
    
    console.log(`  📐 Calculs: startMin=${startMin}, endMin=${endMin}`);
    console.log(`  📏 Position: y=${y}px, height=${height}px`);
    
    // Vérifier que la position est dans les limites
    if (y < 0 || y > TIMELINE_HEIGHT) {
      console.warn(`⚠️ Position hors limites pour "${title}": y=${y}px (limite: 0-${TIMELINE_HEIGHT}px)`);
    }
    
    // Créer le rectangle SVG
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', HOUR_LABEL_WIDTH + EVENT_MARGIN);
    rect.setAttribute('y', y);
    rect.setAttribute('width', 1000 - HOUR_LABEL_WIDTH - (EVENT_MARGIN * 2));
    rect.setAttribute('height', height);
    rect.setAttribute('rx', 4);
    rect.setAttribute('ry', 4);
    rect.setAttribute('class', `timeline-event ${className}`);
    
    // Créer le texte SVG
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', HOUR_LABEL_WIDTH + EVENT_MARGIN + 10);
    text.setAttribute('y', y + height / 2);
    text.textContent = title;
    text.setAttribute('class', 'timeline-event-text');
    
    // Ajouter les événements
    rect.addEventListener('mouseenter', (e) => this.showTooltip(e, title, startTime, endTime));
    rect.addEventListener('mouseleave', () => this.hideTooltip());
    rect.addEventListener('click', () => this.onEventClick(type, title, startTime, endTime));
    
    // Ajouter au SVG
    this.svg.appendChild(rect);
    this.svg.appendChild(text);
    
    console.log(`  ✅ Événement SVG créé et ajouté`);
  }

  /**
   * Calculer l'heure de fin d'une prière (35 minutes par défaut)
   */
  calculatePrayerEndTime(startTime) {
    const startMin = timeToMinutes(startTime);
    const endMin = startMin + 35; // 35 minutes de durée
    return minutesToTime(endMin);
  }

  /**
   * Afficher le tooltip
   */
  showTooltip(event, title, startTime, endTime) {
    if (this.tooltip) {
      this.tooltip.textContent = `${title} - ${startTime} à ${endTime}`;
      this.tooltip.style.left = (event.clientX + 10) + 'px';
      this.tooltip.style.top = (event.clientY - 30) + 'px';
      this.tooltip.classList.add('show');
    }
  }

  /**
   * Masquer le tooltip
   */
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.classList.remove('show');
    }
  }

  /**
   * Vider tous les événements
   */
  clearEvents() {
    // Supprimer tous les éléments SVG sauf la grille
    const elementsToRemove = [];
    for (let i = 0; i < this.svg.children.length; i++) {
      const child = this.svg.children[i];
      if (child.getAttribute('class') !== 'timeline-grid') {
        elementsToRemove.push(child);
      }
    }
    
    elementsToRemove.forEach(element => element.remove());
  }

  /**
   * Afficher l'état vide
   */
  showEmptyState() {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', '50%');
    text.setAttribute('y', '50%');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('fill', 'var(--text-muted)');
    text.setAttribute('font-size', '16px');
    text.textContent = 'Aucun événement pour ce jour';
    
    this.svg.appendChild(text);
  }

  /**
   * Gérer le clic sur un événement
   */
  onEventClick(type, title, startTime, endTime) {
    console.log(`🖱️ Clic sur événement: ${type} - ${title} (${startTime}-${endTime})`);
    
    // Ici vous pouvez ajouter la logique pour gérer les clics
    // Par exemple, ouvrir un modal, naviguer vers une page, etc.
  }

  /**
   * Navigation entre les jours
   */
  navigateToDay(date) {
    this.displayDayEvents(date);
  }

  previousDay() {
    const prevDate = new Date(this.currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    this.navigateToDay(prevDate);
  }

  nextDay() {
    const nextDate = new Date(this.currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    this.navigateToDay(nextDate);
  }

  /**
   * Synchroniser avec le calendrier
   */
  syncWithCalendar(day, segments) {
    this.segments = segments;
    this.displayDayEvents(day);
  }

  /**
   * Charger et afficher les données ICS
   */
  async loadAndDisplayTimelineICS(masjid_id, year, month) {
    try {
      console.log('🔄 Chargement des données ICS pour la timeline');
      
      const response = await fetch(`/api/ics/${masjid_id}/${year}/${month}/json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📊 Données ICS reçues:', data);
      
      this.icsDays = data.days || [];
      
      if (this.icsDays.length > 0) {
        // Afficher le premier jour par défaut
        this.displayICSForDay(0);
      } else {
        console.log('⚠️ Aucun jour trouvé dans les données ICS');
        this.showEmptyState();
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement des données ICS:', error);
      this.showEmptyState();
    }
  }

  /**
   * Afficher un jour ICS dans la timeline
   */
  displayICSForDay(dayIndex) {
    console.log('=== 🕐 TIMELINE SVG DEBUG START ===');
    console.log('displayICSForDay appelé pour index', dayIndex);
    
    if (!this.icsDays || this.icsDays.length === 0) {
      console.log('❌ Aucune donnée ICS disponible');
      return;
    }
    
    const dayData = this.icsDays[dayIndex];
    if (!dayData) {
      console.log('❌ Aucune donnée pour le jour', dayIndex);
      return;
    }
    
    this.clearEvents();

    console.log('📅 Date affichée :', dayData.date);
    console.log('📊 Données reçues :', {
      prayers: dayData.prayers?.length || 0,
      slots: dayData.slots?.length || 0,
      empty: dayData.empty?.length || 0
    });

    // Afficher chaque prière
    if (dayData.prayers && dayData.prayers.length > 0) {
      console.log('🕌 Traitement des prières :');
      dayData.prayers.forEach((prayer, index) => {
        console.log(`  [${index + 1}] ${prayer.summary}: ${prayer.start} - ${prayer.end}`);
        
        // Extraire l'heure exacte de la prière depuis le summary
        const prayerTimeMatch = prayer.summary.match(/\((\d{2}:\d{2})\)/);
        let displayStart = prayer.start;
        let displayEnd = prayer.end;
        
        if (prayerTimeMatch) {
          const prayerTime = prayerTimeMatch[1];
          console.log(`    🎯 Heure exacte de la prière: ${prayerTime}`);
          
          // Utiliser l'heure exacte de la prière pour le positionnement
          displayStart = prayerTime;
          // Calculer la fin basée sur une durée standard de 35 minutes
          const prayerStartMin = timeToMinutes(prayerTime);
          const prayerEndMin = prayerStartMin + 35; // 35 minutes de durée
          displayEnd = minutesToTime(prayerEndMin);
          
          console.log(`    📏 Ajustement: heure_prière=${prayerTime}, durée=35min, fin=${displayEnd}`);
        }
        
        this.createSVGEvent(prayer.summary, displayStart, displayEnd, 'prayer', 'prayer');
        console.log(`    🎯 Élément SVG créé et ajouté`);
      });
    } else {
      console.log('⚠️ Aucune prière à afficher');
    }

    // Afficher chaque slot
    if (dayData.slots && dayData.slots.length > 0) {
      console.log('🕐 Traitement des slots :');
      dayData.slots.forEach((slot, index) => {
        console.log(`  [${index + 1}] ${slot.summary}: ${slot.start} - ${slot.end}`);
        this.createSVGEvent(slot.summary, slot.start, slot.end, 'slot', 'slot');
      });
    } else {
      console.log('⚠️ Aucun slot à afficher');
    }

    // Afficher chaque empty
    if (dayData.empty && dayData.empty.length > 0) {
      console.log('🕳️ Traitement des créneaux vides :');
      dayData.empty.forEach((empty, index) => {
        console.log(`  [${index + 1}] ${empty.summary}: ${empty.start} - ${empty.end}`);
        this.createSVGEvent(empty.summary, empty.start, empty.end, 'empty', 'empty');
      });
    } else {
      console.log('⚠️ Aucun créneau vide à afficher');
    }

    // Mettre à jour la date affichée
    this.currentDate = new Date(dayData.date);
    this.updateTimelineDate();
    
    console.log('=== 🕐 TIMELINE SVG DEBUG END ===');
  }
}

// Fonctions utilitaires
function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') {
    console.warn(`⚠️ timeToMinutes reçu une valeur invalide:`, timeStr);
    return 0;
  }
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Initialiser la timeline quand le DOM est prêt
document.addEventListener('DOMContentLoaded', function() {
  window.timeline = new Timeline();
  window.timeline.init();
}); 