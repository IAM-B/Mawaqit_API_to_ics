# Timeline Verticale (Agenda)

## Vue d'ensemble

La **Timeline Verticale** est une nouvelle fonctionnalité moderne inspirée de Google/Apple Calendar qui remplace l'ancien composant `defaultSlotsView`. Elle offre une visualisation claire et professionnelle des créneaux de prières, de disponibilités (slots) et de créneaux vides (empty) sur une grille horaire verticale.

## Fonctionnalités

### 🎯 Caractéristiques principales

- **Grille horaire verticale** : Affichage des 24 heures de la journée (00:00 → 23:00)
- **Colonne sticky** : Les heures restent visibles lors du défilement
- **Trois couches d'événements** :
  - **Prières** (ligne du haut) - Blocs dorés
  - **Slots/disponibilités** (ligne du milieu) - Blocs verts
  - **Empty slots/créneaux vides** (ligne du bas) - Blocs jaunes
- **Positionnement précis** : Chaque bloc est positionné selon son horaire exact
- **Tooltips informatifs** : Affichage des détails au survol
- **Responsive design** : Adaptation automatique aux différentes tailles d'écran

### 🔄 Synchronisation

La timeline est parfaitement synchronisée avec :
- **Calendrier** : Changement de jour lors de la sélection dans le calendrier
- **Horloge** : Navigation entre les jours via les boutons précédent/suivant
- **Données en temps réel** : Mise à jour automatique selon les données du backend

## Architecture technique

### Frontend

#### Fichiers principaux
- `app/static/js/timeline.js` - Logique principale de la timeline
- `app/static/css/calendar.css` - Styles CSS pour la timeline
- `app/templates/planner.html` - Intégration dans le template

#### Classes JavaScript
```javascript
class Timeline {
  constructor() // Initialisation
  createTimelineContainer() // Création du DOM
  initializeTimeline(segments, scope) // Initialisation avec données
  displayDayEvents(date) // Affichage des événements d'un jour
  displayPrayers(prayerTimes) // Affichage des prières
  displaySlots(slots) // Affichage des slots disponibles
  displayEmptySlots(slots) // Affichage des créneaux vides
  navigateToDay(date) // Navigation vers un jour
  syncWithCalendar(day, segments) // Synchronisation avec le calendrier
}
```

### Backend

#### Enrichissement des données
- `app/modules/time_segmenter.py` - Génération des empty slots
- `app/views/planner_view.py` - Enrichissement des segments

#### Structure des données
```json
{
  "day": 1,
  "date": "01/12/2024",
  "slots": [
    {"start": "06:30", "end": "12:00"},
    {"start": "13:30", "end": "17:00"}
  ],
  "empty_slots": [
    {"start": "00:00", "end": "06:30"},
    {"start": "12:00", "end": "13:30"}
  ],
  "prayer_times": {
    "fajr": "06:30",
    "dohr": "12:00",
    "asr": "15:00",
    "maghreb": "18:30",
    "icha": "20:00"
  }
}
```

## Utilisation

### Intégration automatique

La timeline se remplace automatiquement de l'ancien composant `defaultSlotsView` lors de l'initialisation de la page de planning.

### Initialisation manuelle

```javascript
// Initialiser la timeline
if (window.timeline) {
  window.timeline.initializeTimeline(segments, scope);
}

// Naviguer vers un jour spécifique
window.timeline.navigateToDay(new Date());

// Synchroniser avec le calendrier
window.timeline.syncWithCalendar(day, segments);
```

## Styles CSS

### Variables utilisées
```css
:root {
  --primary: #d4af37; /* Couleur des prières */
  --success: #48bb78; /* Couleur des slots */
  --accent: #f4d03f; /* Couleur des empty slots */
  --form-bg: #1a1a1a; /* Arrière-plan */
  --text-color: #e2e8f0; /* Texte */
  --border-color: #333333; /* Bordures */
}
```

### Classes principales
- `.timeline-container` - Conteneur principal
- `.timeline-grid` - Grille horaire
- `.timeline-event` - Événements individuels
- `.timeline-event.prayer` - Style des prières
- `.timeline-event.slot` - Style des slots
- `.timeline-event.empty` - Style des empty slots

## Responsive Design

### Breakpoints
- **Desktop** : ≥ 768px - Timeline complète
- **Tablet** : 480px - 768px - Timeline adaptée
- **Mobile** : < 480px - Timeline compacte

### Adaptations
- Réduction de la largeur de la colonne des heures
- Ajustement de la taille des événements
- Optimisation de l'espacement

## Tests

### Fichier de test
`test_timeline.html` - Page de test avec données simulées

### Données de test
```javascript
const testSegments = [
  {
    day: 1,
    date: "01/12/2024",
    slots: [
      { start: "06:30", end: "12:00" },
      { start: "13:30", end: "17:00" }
    ],
    empty_slots: [
      { start: "00:00", end: "06:30" },
      { start: "12:00", end: "13:30" }
    ],
    prayer_times: {
      fajr: "06:30",
      dohr: "12:00",
      asr: "15:00",
      maghreb: "18:30",
      icha: "20:00"
    }
  }
];
```

## Améliorations futures

### Fonctionnalités prévues
- [ ] Édition directe des créneaux dans la timeline
- [ ] Glisser-déposer pour modifier les horaires
- [ ] Filtres par type d'événement
- [ ] Export de la timeline en image
- [ ] Mode sombre/clair
- [ ] Animations de transition

### Optimisations techniques
- [ ] Virtualisation pour les grandes quantités de données
- [ ] Cache des données pour améliorer les performances
- [ ] Lazy loading des événements
- [ ] Compression des données

## Support

Pour toute question ou problème concernant la timeline, consultez :
- Les logs de l'application
- La console du navigateur pour les erreurs JavaScript
- Les données réseau pour vérifier les requêtes AJAX 