"""
Main application entry point for Mawaqit to ICS converter.
This module initializes the Flask application and handles configuration loading.
"""

from flask import Flask
from app.controllers.main import init_routes
from app.controllers.error_handlers import init_error_handlers
from config import get_config
import os

def create_app(config_name=None):
    """
    Application factory pattern for Flask.
    Creates and configures the Flask application instance.
    
    Args:
        config_name (str): The configuration to use ('development', 'production', or 'testing')
    
    Returns:
        Flask: Configured Flask application instance
    """
    app = Flask(__name__,
                template_folder='app/templates',
                static_folder='app/static')
    
    # Load configuration
    config = get_config(config_name)
    app.config.from_object(config)
    
    # Initialize routes and error handlers
    init_routes(app)
    init_error_handlers(app)
    
    return app

if __name__ == "__main__":
    # Parse command line arguments for environment selection
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--env', default=None, 
                       choices=['development', 'production', 'testing'],
                       help='Select the application environment')
    args = parser.parse_args()
    
    # Create and run the application
    app = create_app(args.env)
    print(f">> Starting Flask application in {args.env} mode...")
    app.run(host='0.0.0.0', port=5000, debug=app.config['DEBUG'])
