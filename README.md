# Planning\_sync

**Planning\_sync** is a local tool to generate a personalized schedule synchronized with prayer times from your local mosque.

This app connects to the [Mawaqit API](https://mawaqit.net), fetches the prayer times of your chosen mosque, calculates the free time segments between prayers, and helps you plan your daily, monthly, or yearly routine accordingly.

It also generates an `.ics` calendar file that you can import into your favorite calendar app (Google Calendar, Proton Calendar, etc).

---

## 📦 Features

* 🌍 Select your mosque by ID from Mawaqit
* 🕒 Choose scope: daily, monthly, or yearly prayer times
* 📅 Get calculated free time slots between prayers
* 📤 Export the schedule as `.ics` file
* 📁 Local web interface via Flask

---

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/IAM-B/Mawaqit_API_to_ics
cd Mawaqit_API_to_ics
```

### 2. Launch Mawaqit API (in parallel)

⚠️ This app requires the `Mawaqit_API` service to be running locally.

From the root project folder:

```bash
cd Mawaqit_API
make install
make run
```

This starts the local FastAPI server on `http://localhost:8000`.

### 3. Set up and run Planning\_sync

In a new terminal:

```bash
cd Planning_sync
make install
make run
```

Then open your browser at: [http://localhost:5000](http://localhost:5000)

---

## 🛠 Project Structure

```
MAWAQIT_API_TO_ICS/
├── Mawaqit_API/           # Local FastAPI service
└── Planning_sync/         # Schedule generator with UI
```

```
Planning_sync/
├── app.py                 # Flask backend
├── requirements.txt
├── Makefile
│
├── templates/
│   ├── index.html
│   └── planner.html
├── static/
│   └── styles.css
│
├── modules/
│   ├── mawaqit_api.py
│   ├── time_segmenter.py
│   └── ics_generator.py
└── data/
    └── mosques.json
```

---

## 🧩 Roadmap

* Add recurring tasks to free slots
* Support monthly and yearly ICS generation from UI
* Make ICS file downloadable from interface
* Mobile interface optimization
* Docker setup

---

## 📖 License

MIT License – © 2025

