# Planning\_sync

**Planning\_sync** is a local tool to generate a personalized schedule synchronized with prayer times from your local mosque.

This app connects to the [Mawaqit API](https://mawaqit.net), fetches the prayer times of your chosen mosque, calculates the free time segments between prayers, and helps you plan your daily, monthly, or yearly routine accordingly.

It also generates an `.ics` calendar file that you can import into your favorite calendar app (Google Calendar, Proton Calendar, etc).

---

## 📦 Features

* 🌍 Select your mosque
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

### 3. Set up and run Planning\_sync

In a new terminal:

```bash
make install
make run
```

Then open your browser at: [http://localhost:5000](http://localhost:5000)

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

