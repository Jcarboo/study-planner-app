from flask_login import UserMixin
from bson.objectid import ObjectId
from extensions import mongo  # now safe!

class User(UserMixin):
    def __init__(self, user_doc):
        self.id = str(user_doc["_id"])
        self.username = user_doc["username"]
        self.email = user_doc["email"]

    @staticmethod
    def get(user_id):
        user_doc = mongo.db.users.find_one({"_id": ObjectId(user_id)})
        return User(user_doc) if user_doc else None
