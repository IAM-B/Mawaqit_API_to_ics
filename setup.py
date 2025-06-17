from setuptools import setup, find_packages

setup(
    name="mawaqit-api-to-ics",
    version="0.1.0",
    packages=["app"],
    install_requires=[
        "flask",
        "requests",
        "icalendar",
        "python-dotenv",
    ],
) 