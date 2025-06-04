from flask import render_template

def init_error_handlers(app):

    @app.errorhandler(404)
    def not_found(e):
        return render_template("error.html", error_message="Page non trouvée (404)"), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return render_template("error.html", error_message="Méthode non autorisée (405)", error_code=405), 405

    @app.errorhandler(500)
    def internal_error(e):
        return render_template("error.html", error_message="Erreur interne du serveur (500)"), 500
