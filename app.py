"""
Main application entry point for Mawaqit to ICS converter.
This module initializes the Flask application and handles configuration loading.
"""

from flask import Flask
from app.controllers.main import init_routes
from app.controllers.error_handlers import init_error_handlers
import os

def create_app(config_name='development'):
    """
    Application factory pattern for Flask.
    Creates and configures the Flask application instance.
    
    Args:
        config_name (str): The configuration to use ('development' or 'production')
    
    Returns:
        Flask: Configured Flask application instance
    """
    app = Flask(__name__,
                template_folder='app/templates',  # Custom template directory
                static_folder='app/static')       # Custom static files directory
    
    # Load configuration based on environment
    if config_name == 'production':
        app.config.from_object('config.production')
    else:
        app.config.from_object('config.development')
    
    # Initialize routes and error handlers
    init_routes(app)
    init_error_handlers(app)
    
    return app

if __name__ == "__main__":
    # Parse command line arguments for environment selection
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--env', default='development', 
                       choices=['development', 'production'],
                       help='Select the application environment')
    args = parser.parse_args()
    
    # Create and run the application
    app = create_app(args.env)
    print(f">> Starting Flask application in {args.env} mode...")
    app.run(debug=app.config['DEBUG'])
