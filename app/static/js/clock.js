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
   * Convertit une heure en minutes depuis minuit
   * @param {string} time - Format HH:MM
   * @returns {number} Minutes depuis minuit
   */
  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return (hours * 60) + minutes;
  }

  /**
   * Convertit des minutes en angle
   * @param {number} minutes - Minutes depuis minuit
   * @returns {number} Angle en degrés
   */
  minutesToAngle(minutes) {
    return (minutes * 360) / (24 * 60);
  }

  /**
   * Crée un élément SVG pour un événement
   */
  createEventElement(event, type) {
    const startMinutes = this.timeToMinutes(event.start);
    const endMinutes = this.timeToMinutes(event.end);
    
    const startAngle = this.minutesToAngle(startMinutes);
    const endAngle = this.minutesToAngle(endMinutes);
    
    const radius = type === 'prayer' ? 120 : 100;
    const centerX = 150;
    const centerY = 150;
    
    // Calcul des points de début et fin
    const startX = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const startY = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const endX = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const endY = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);
    
    // Création du chemin SVG
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    
    // Calcul de la différence d'angle
    let angleDiff = endMinutes - startMinutes;
    if (angleDiff < 0) {
      angleDiff += 24 * 60;
    }
    
    const largeArcFlag = angleDiff > 12 * 60 ? 1 : 0;
    const d = `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;
    
    path.setAttribute("d", d);
    path.setAttribute("class", `clock-arc ${type}`);
    
    // Ajout du label
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

    // Ajout de l'infobulle pour les prières
    if (type === 'prayer') {
      // Création du groupe pour l'infobulle
      const tooltipGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      tooltipGroup.setAttribute("class", "tooltip-group");
      tooltipGroup.style.display = "none"; // Caché par défaut

      // Création du rectangle de fond
      const tooltipRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      tooltipRect.setAttribute("class", "tooltip-rect");
      tooltipRect.setAttribute("rx", "5");
      tooltipRect.setAttribute("ry", "5");

      // Création du texte de l'infobulle
      const tooltipText = document.createElementNS("http://www.w3.org/2000/svg", "text");
      tooltipText.setAttribute("class", "tooltip-text");
      tooltipText.textContent = `${event.content}\nHeure: ${event.start}`;

      // Ajout des éléments à l'infobulle
      tooltipGroup.appendChild(tooltipRect);
      tooltipGroup.appendChild(tooltipText);

      // Positionnement de l'infobulle
      const tooltipX = labelX;
      const tooltipY = labelY - 40;
      tooltipGroup.setAttribute("transform", `translate(${tooltipX}, ${tooltipY})`);

      // Ajout des événements de survol
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
   * Formate la date pour l'affichage
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
    return this.scope === 'month' ? `Jour ${data.day}` : 
           this.scope === 'year' ? `Mois ${data.month}` : 'Aujourd\'hui';
  }

  /**
   * Met à jour la liste des créneaux disponibles
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
      
      slotItem.appendChild(slotTime);
      slotsList.appendChild(slotItem);

      // Ajout des événements pour la synchronisation
      slotItem.addEventListener('mouseover', () => {
        // Ici, on pourra ajouter la logique pour mettre en surbrillance l'arc correspondant
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
   * Met à jour l'affichage de l'horloge
   */
  updateClock() {
    this.container.innerHTML = '';
    
    // Création du conteneur SVG avec un viewBox plus grand
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "-50 -50 400 400"); // Ajusté pour avoir plus d'espace
    svg.setAttribute("class", "clock-svg");
    this.container.appendChild(svg);

    // Création du cadran
    const clockFace = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    clockFace.setAttribute("cx", "150");
    clockFace.setAttribute("cy", "150");
    clockFace.setAttribute("r", "150");
    clockFace.setAttribute("class", "clock-face");
    svg.appendChild(clockFace);

    // Ajout des graduations des heures
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

      // Ajout des labels des heures
      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      const labelX = 150 + 130 * Math.cos((angle - 90) * Math.PI / 180);
      const labelY = 150 + 130 * Math.sin((angle - 90) * Math.PI / 180);
      label.setAttribute("x", labelX);
      label.setAttribute("y", labelY);
      label.setAttribute("class", "hour-label");
      label.textContent = hour;
      svg.appendChild(label);
    }

    // Ajout des graduations des minutes
    for (let minute = 0; minute < 60; minute++) {
      if (minute % 5 === 0) continue; // On saute les minutes qui sont des heures
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

    // Affichage des événements
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

    // Mise à jour de la date
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
      dateElement.textContent = this.formatDate(currentData);
    }

    // Mise à jour du fuseau horaire
    const timezoneElement = document.getElementById('timezone');
    if (timezoneElement) {
      timezoneElement.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }

    // Mise à jour des créneaux disponibles
    this.updateAvailableSlots(currentData);
  }

  /**
   * Obtient les données actuelles
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
   * Initialise l'horloge
   */
  init() {
    this.updateClock();
  }

  /**
   * Navigue entre les jours/mois
   * @param {number} direction - Direction de navigation (-1 pour précédent, 1 pour suivant)
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

// Export de la classe
window.Clock = Clock;
