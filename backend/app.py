from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)

API_URL = "https://jsonplaceholder.typicode.com/users"

# Load users initially from API
users = requests.get(API_URL).json()

@app.route("/")
def home():
    return {
        "message": "User Management API Running",
        "users_endpoint": "/users"
    }


# GET ALL USERS
@app.route("/users", methods=["GET"])
def get_users():
    return jsonify(users)


# GET SINGLE USER
@app.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):

    user = next(
        (u for u in users if u["id"] == user_id),
        None
    )

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    return jsonify(user)


# CREATE USER
@app.route("/users", methods=["POST"])
def create_user():

    data = request.get_json()

    new_user = {
        "id": max([u["id"] for u in users]) + 1,
        "name": data.get("name"),
        "email": data.get("email"),
        "role": data.get("role", "Developer"),
        "company": {
            "name": data.get("company", "")
        },
        "website": data.get("website", "")
    }

    users.append(new_user)

    return jsonify(new_user), 201


# UPDATE USER
@app.route("/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):

    user = next(
        (u for u in users if u["id"] == user_id),
        None
    )

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    data = request.get_json()

    user["name"] = data.get(
        "name",
        user["name"]
    )

    user["email"] = data.get(
        "email",
        user["email"]
    )

    user["website"] = data.get(
        "website",
        user["website"]
    )

    user["role"] = data.get(
        "role",
        user.get("role", "")
    )

    if "company" in data:
        user["company"] = {
            "name": data["company"]
        }

    return jsonify(user)


# DELETE USER
@app.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):

    global users

    user = next(
        (u for u in users if u["id"] == user_id),
        None
    )

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    users = [
        u for u in users
        if u["id"] != user_id
    ]

    return jsonify({
        "message": "User deleted successfully"
    })


if __name__ == "__main__":
    app.run(debug=True)