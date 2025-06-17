"""
Mawaqit API to ICS converter application.
This package contains the main application code for converting Mawaqit prayer times to ICS calendar files.
"""

from flask import Flask

def create_app(test_config=None):
    """Create and configure the Flask application."""
    app = Flask(__name__, instance_relative_config=True)
    
    # Default configuration
    app.config.from_mapping(
        ICS_CALENDAR_NAME="Prayer Times",
        ICS_CALENDAR_DESCRIPTION="Prayer times from Mawaqit",
        STATIC_FOLDER='static'  # Relative path to the app folder
    )
    
    if test_config is None:
        # Load instance configuration if it exists
        app.config.from_pyfile('config.py', silent=True)
    else:
        # Load test configuration
        app.config.from_mapping(test_config)
    
    # Register blueprint
    from app.controllers.main import main_bp
    app.register_blueprint(main_bp)
    
    return app