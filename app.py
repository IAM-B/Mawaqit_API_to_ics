from flask import Flask
from controllers.main import init_routes
from controllers.error_handlers import init_error_handlers

app = Flask(__name__)
init_routes(app)
init_error_handlers(app)

if __name__ == "__main__":
    print(">> Lancement de l'application Flask...")
    app.run(debug=False)
