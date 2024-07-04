import os
from flask import Flask
from views import calibrator_blueprint

app = Flask(__name__)

app.register_blueprint(calibrator_blueprint, url_prefix='/api/v1/calibrator')

port = os.environ.get('PORT', 5003)

if __name__ == '__main__':
    from waitress import serve
    serve(app, host="0.0.0.0", port=port)