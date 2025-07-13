"""
Main application entry point for Mawaqit to ICS converter.
This module initializes the Flask application and handles configuration loading.
"""

from flask import Flask

from app.controllers.error_handlers import init_error_handlers
from app.controllers.main import init_routes
from config import get_config


def create_app(config_name=None, config_overrides=None):
    """
    Application factory pattern for Flask.
    Creates and configures the Flask application instance.

    Args:
        config_name (str): The configuration to use ('development', 'production', or 'testing')
        config_overrides (dict): Optional configuration overrides to apply after loading the base config

    Returns:
        Flask: Configured Flask application instance
    """
    app = Flask(__name__, template_folder="app/templates", static_folder="app/static")

    # Load configuration
    config = get_config(config_name)
    app.config.from_object(config)

    # Apply configuration overrides if provided
    if config_overrides:
        app.config.update(config_overrides)

    # Initialize routes and error handlers
    init_routes(app)
    init_error_handlers(app)

    return app


if __name__ == "__main__":
    # Parse command line arguments for environment selection
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--env",
        default=None,
        choices=["development", "production", "testing"],
        help="Select the application environment",
    )
    args = parser.parse_args()

    # Create and run the application
    app = create_app(args.env)
    print(f">> Starting Flask application in {args.env} mode...")
    app.run(host="0.0.0.0", port=5000, debug=app.config["DEBUG"])
