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

Installation
There are multiple ways to install and deploy the Mawaqi API depending on your preferences and requirements.

Using Source Code and Running Python:

Clone the repository from GitHub.
Ensure you have Python installed on your system (version 3.8 or higher).
Navigate to the project directory.
Create virtual environment python -m  venv env or python3 -m  venv env.
Activate the virtual environment source env/bin/activate.
Install dependencies using pip: pip install -r requirements.txt or pip3 install -r requirements.txt.
Run the API using the following command: uvicorn main:app --host 0.0.0.0 --port 8000.
The API will be accessible at http://localhost:8000.
Using Docker to Build Image:

Ensure you have Docker installed on your system.
Clone the repository from GitHub.
Navigate to the project directory.
Build the Docker image using the provided Dockerfile: docker build -t mawaqi-api ..
Run the Docker container: docker run -d --name mawaqit-api -p 8000:80 mawaqi-api.
The API will be accessible at http://localhost:8000.
Choose the installation method that best suits your environment and preferences.

API Documentation:

You can find the API documentation at the path /docs relative to your API's base URL. It's an OpenAPI documentation generated automatically from FastAPI.

## Extra Features

A complementary script `mawaqit_to_ics.py` has been added to convert prayer times into `.ics` calendar files.  
This allows users to export daily, monthly, or full-year prayer schedules for a given mosque and import them into calendar applications like Google Calendar or Outlook.

Each prayer time is padded with customizable intervals (e.g., 15 minutes before and 35 minutes after) to reflect preparation and completion time, and the exact prayer time is included in the event title for better visibility.

## License

[MIT](https://github.com/mrsofiane/mawaqit-api/blob/main/LICENSE.md)
