from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):

    __tablename__ = "users"

    id = db.Column(
        db.Integer,
        primary_key=True
    )

    name = db.Column(
        db.String(100),
        nullable=False
    )

    email = db.Column(
        db.String(100),
        nullable=False,
        unique=True
    )

    role = db.Column(
        db.String(100),
        nullable=False
    )

    bio = db.Column(
        db.String(300)
    )

    company = db.Column(
        db.String(100)
    )

    website = db.Column(
        db.String(100)
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "bio": self.bio,
            "company": self.company,
            "website": self.website
        }