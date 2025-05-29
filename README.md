# Mawaqit Api

[![GitHub Repo stars](https://img.shields.io/github/stars/mrsofiane/mawaqit-api?style=flat)](https://github.com/mrsofiane/mawaqit-api/stargazers)
![GitHub Tag](https://img.shields.io/github/v/tag/mrsofiane/mawaqit-api)
![GitHub License](https://img.shields.io/github/license/mrsofiane/mawaqit-api)
![GitHub Actions Workflow Status](https://img.shields.io/github/actions/workflow/status/mrsofiane/mawaqit-api/python-app.yml)
[![GitHub release](https://img.shields.io/github/release/mrsofiane/mawaqit-api.svg)](https://github.com/mrsofiane/mawaqit-api/releases)

Mawaqi Api is a Rest Api for [mawaqit.net](https://mawaqit.net) using FastApi framework,
the mawaqit.net website gives you the prayer times for more than 8000 mosques around the world,
the idea behind this api is to create an api web app that uses the mawaqit website as data source
to fetch prayer times and return them in json with the minimum information needed,
the current website is using php so it's returning the whole html every get request.

## Documentation

Find the installation and usage documentation [here](https://mrsofiane.me/mawaqit-api).

## Extra Features

A complementary script `mawaqit_to_ics.py` has been added to convert prayer times into `.ics` calendar files.  
This allows users to export daily, monthly, or full-year prayer schedules for a given mosque and import them into calendar applications like Google Calendar or Outlook.

Each prayer time is padded with customizable intervals (e.g., 15 minutes before and 35 minutes after) to reflect preparation and completion time, and the exact prayer time is included in the event title for better visibility.

## License

[MIT](https://github.com/mrsofiane/mawaqit-api/blob/main/LICENSE.md)
