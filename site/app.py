from os import path, walk, makedirs
import random
import string
from flask import Flask, render_template, request, jsonify
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.utils import secure_filename
import json

app = Flask(__name__)
app.wsgi_app = ProxyFix(
    app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1
)

@app.route("/")
def index():
    return render_template("index.html")
    
@app.route("/battletech", methods=['GET', 'POST'])
def battletech():
    maps = None
    maps = list_maps(game='battletech')
    return render_template('battletech.html', maps=maps)

@app.route("/battletech/save", methods=['POST'])
def battletech_save():
    data = request.json
    return save_map(data, 'battletech')

@app.route("/battletech/load", methods=['GET', 'POST'])
def battletech_load():
    map_name = request.args.get('mapName', 'Default')
    folder_name = request.args.get('mapFolder', 'Default')
    return load_map(file_name=map_name, folder_name=folder_name, game='battletech')

@app.route("/dnd", methods=['GET', 'POST'])
def dnd():
    maps = None
    maps = list_maps(game='dnd')
    return render_template('dnd.html', maps=maps)

@app.route("/dnd/save", methods=['POST'])
def dnd_save():
    data = request.json
    return save_map(data, 'dnd')

@app.route("/dnd/load", methods=['GET', 'POST'])
def dnd_load():
    map_name = request.args.get('mapName', 'Default')
    folder_name = request.args.get('mapFolder', 'Default')
    return load_map(file_name=map_name, folder_name=folder_name, game='dnd')

def list_maps(game):
    folders = {}
    base_path = path.join(path.dirname(__file__), 'static', 'games', game, 'maps')
    for root, dirs, files in walk(base_path):
        dirs.sort()
        if dirs:
            for dir in dirs:
                if dir.__len__ == 0:
                    continue
                folder_path = path.join(root, dir)
                folder_name = path.basename(folder_path)
                folder = folder_name.replace('_', ' ')
                folders[folder] = {}
                for null, null, files in walk(folder_path):
                    if files:
                        files.sort()
                        for file in files:
                            file_path = path.join(base_path, folder_name, file)
                            if file_path.endswith('.json'):
                                with open(file_path, 'r') as f:
                                    data = f.read()
                                    m = json.loads(data)
                                    map_name = m['name']
                                    folders[folder][map_name] = m
    return folders

def save_map(data, game):
    file_name = data.get('name', 'Default').replace(' ', '_')
    folder_name = data.get('folder', 'Default').replace(' ', '_')
    
    if not data:
        return jsonify({"error": True, "message": "No map data provided!"}), 400
    save_path = path.join('static', 'games', game, 'maps', folder_name, file_name + '.json')
    makedirs(path.dirname(save_path), exist_ok=True)
    try:
        with open(save_path, 'w') as f:
            f.write(json.dumps(data))
        return jsonify({"error": False, "message": "Map saved successfully!"}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": True, "message": str(e)}), 500

def load_map(file_name, folder_name, game):
    folder_name = folder_name.replace(' ', '_')
    file_name = file_name.replace(' ', '_')
    file_path = path.join('static', 'games', game, 'maps', folder_name, file_name + '.json')
    try:
        with open(file_path, 'r') as f:
            data = json.dumps(f.read())
        if not data:
            return jsonify({"error": True, "message": "Map not found!"}), 404
        return jsonify({"error": False, "data": json.loads(data)}), 200
    except Exception as e:
        print(e)
        return jsonify({"error": True, "message": str(e)}), 500

if __name__ == '__main__':
      app.run()
