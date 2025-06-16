from config import Config

class TestingConfig(Config):
    DEBUG = False
    TESTING = True
    LOG_LEVEL = 'DEBUG'
    DATABASE_URI = 'sqlite:///:memory:'
    MOSQUE_DATA_DIR = 'tests/data/mosques_by_country'
    ICS_OUTPUT_DIR = 'tests/data/ics'
