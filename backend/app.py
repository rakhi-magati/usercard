from flask import Flask, jsonify, request
from flask_cors import CORS

from models import db, User

app = Flask(__name__)
CORS(app)

app.config[
    "SQLALCHEMY_DATABASE_URI"
] = "sqlite:///database.db"

app.config[
    "SQLALCHEMY_TRACK_MODIFICATIONS"
] = False

db.init_app(app)

with app.app_context():
    db.create_all()


@app.route("/")
def home():
    return {
        "message":
        "User Management API Running"
    }


# GET ALL USERS
@app.route("/users", methods=["GET"])
def get_users():

    users = User.query.all()

    return jsonify(
        [u.to_dict() for u in users]
    )


# GET USER BY ID
@app.route("/users/<int:user_id>", methods=["GET"])
def get_user(user_id):

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    return jsonify(user.to_dict())


# CREATE USER
@app.route("/users", methods=["POST"])
def create_user():

    data = request.get_json()

    if not data.get("name"):
        return jsonify({
            "error": "Name required"
        }), 400

    if not data.get("email"):
        return jsonify({
            "error": "Email required"
        }), 400

    if not data.get("role"):
        return jsonify({
            "error": "Role required"
        }), 400

    user = User(
        name=data["name"],
        email=data["email"],
        role=data["role"],
        bio=data.get("bio", ""),
        company=data.get("company", ""),
        website=data.get("website", "")
    )

    db.session.add(user)
    db.session.commit()

    return jsonify(
        user.to_dict()
    ), 201


# UPDATE USER
@app.route("/users/<int:user_id>", methods=["PUT"])
def update_user(user_id):

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    data = request.get_json()

    user.name = data.get(
        "name",
        user.name
    )

    user.email = data.get(
        "email",
        user.email
    )

    user.role = data.get(
        "role",
        user.role
    )

    user.bio = data.get(
        "bio",
        user.bio
    )

    user.company = data.get(
        "company",
        user.company
    )

    user.website = data.get(
        "website",
        user.website
    )

    db.session.commit()

    return jsonify(
        user.to_dict()
    )


# DELETE USER
@app.route("/users/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "error": "User not found"
        }), 404

    db.session.delete(user)
    db.session.commit()

    return jsonify({
        "message":
        "User deleted successfully"
    })


if __name__ == "__main__":
    app.run(debug=True)