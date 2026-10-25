import os
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger("labellens.db")

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DB_JSON_PATH = os.path.join(DATA_DIR, "db.json")

COLLECTIONS = [
    "users",
    "products",
    "scans",
    "analyses",
    "comparisons",
    "saved_products",
    "feedback",
    "notifications",
    "audit_logs"
]

class DatabaseManager:
    def __init__(self):
        self.mongo_client = None
        self.mongo_db = None
        self.is_mongo = False
        self.mongo_uri = None
        self.local_data: Dict[str, List[Dict[str, Any]]] = {c: [] for c in COLLECTIONS}
        self.init_storage()

    def init_storage(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        self.mongo_uri = os.getenv("MONGODB_URI", None)

        if self.mongo_uri and self.mongo_uri.strip().lower() not in ("none", "local", "null", ""):
            try:
                from pymongo import MongoClient
                client = MongoClient(self.mongo_uri, serverSelectionTimeoutMS=2000)
                client.server_info()
                self.mongo_client = client
                self.mongo_db = client.get_default_database() or client["labellens"]
                self.is_mongo = True
                print(f"[DatabaseManager] Connected successfully to MongoDB at {self.mongo_uri}")
                return
            except Exception as e:
                print(f"[DatabaseManager] Configured MONGODB_URI failed ({e}). Falling back to local storage.")

        # Try local default MongoDB
        try:
            from pymongo import MongoClient
            client = MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=600)
            client.server_info()
            self.mongo_client = client
            self.mongo_db = client["labellens"]
            self.is_mongo = True
            print("[DatabaseManager] Connected to local MongoDB instance on port 27017.")
            return
        except Exception:
            pass

        # Robust persistent JSON document storage
        self.is_mongo = False
        print(f"[DatabaseManager] MongoDB service not running. Seamlessly using persistent JSON storage at: {DB_JSON_PATH}")
        self.load_local_db()

    def get_status(self) -> Dict[str, Any]:
        return {
            "mode": "MongoDB" if self.is_mongo else "Persistent JSON Storage",
            "is_mongo": self.is_mongo,
            "storage_path": DB_JSON_PATH if not self.is_mongo else self.mongo_uri,
            "counts": {c: self.count(c) for c in COLLECTIONS}
        }

    def load_local_db(self):
        if os.path.exists(DB_JSON_PATH):
            try:
                with open(DB_JSON_PATH, "r", encoding="utf-8") as f:
                    self.local_data = json.load(f)
                    for c in COLLECTIONS:
                        if c not in self.local_data:
                            self.local_data[c] = []
            except Exception as ex:
                print(f"[DatabaseManager] Error reading {DB_JSON_PATH}: {ex}")
                self.local_data = {c: [] for c in COLLECTIONS}
        else:
            self.local_data = {c: [] for c in COLLECTIONS}
            self.save_local_db()

    def save_local_db(self):
        try:
            with open(DB_JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(self.local_data, f, indent=2, default=str)
        except Exception as ex:
            print(f"[DatabaseManager] Error saving local DB: {ex}")

    def find_one(self, collection_name: str, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if self.is_mongo:
            doc = self.mongo_db[collection_name].find_one(query)
            if doc and "_id" in doc:
                doc["_id"] = str(doc["_id"])
            return doc
        items = self.local_data.get(collection_name, [])
        for item in items:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                return dict(item)
        return None

    def find(self, collection_name: str, query: Optional[Dict[str, Any]] = None, limit: int = 100) -> List[Dict[str, Any]]:
        if self.is_mongo:
            cursor = self.mongo_db[collection_name].find(query or {}).limit(limit)
            result = []
            for doc in cursor:
                if "_id" in doc:
                    doc["_id"] = str(doc["_id"])
                result.append(doc)
            return result
        items = self.local_data.get(collection_name, [])
        if not query:
            return [dict(i) for i in items[:limit]]
        result = []
        for item in items:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                result.append(dict(item))
            if len(result) >= limit:
                break
        return result

    def insert_one(self, collection_name: str, doc: Dict[str, Any]) -> Dict[str, Any]:
        if "id" not in doc:
            import uuid
            doc["id"] = str(uuid.uuid4())
        if "created_at" not in doc:
            doc["created_at"] = datetime.now(timezone.utc).isoformat()

        if self.is_mongo:
            res = self.mongo_db[collection_name].insert_one(dict(doc))
            doc["_id"] = str(res.inserted_id)
            return doc

        if collection_name not in self.local_data:
            self.local_data[collection_name] = []
        existing_idx = next((i for i, x in enumerate(self.local_data[collection_name]) if x.get("id") == doc["id"]), None)
        if existing_idx is not None:
            self.local_data[collection_name][existing_idx] = dict(doc)
        else:
            self.local_data[collection_name].append(dict(doc))
        self.save_local_db()
        return doc

    def update_one(self, collection_name: str, query: Dict[str, Any], update: Dict[str, Any]) -> bool:
        if self.is_mongo:
            res = self.mongo_db[collection_name].update_one(query, {"$set": update})
            return res.matched_count > 0

        items = self.local_data.get(collection_name, [])
        for item in items:
            match = True
            for k, v in query.items():
                if item.get(k) != v:
                    match = False
                    break
            if match:
                item.update(update)
                self.save_local_db()
                return True
        return False

    def delete_one(self, collection_name: str, query: Dict[str, Any]) -> bool:
        if self.is_mongo:
            res = self.mongo_db[collection_name].delete_one(query)
            return res.deleted_count > 0

        items = self.local_data.get(collection_name, [])
        initial_len = len(items)
        self.local_data[collection_name] = [
            item for item in items if not all(item.get(k) == v for k, v in query.items())
        ]
        if len(self.local_data[collection_name]) < initial_len:
            self.save_local_db()
            return True
        return False

    def count(self, collection_name: str, query: Optional[Dict[str, Any]] = None) -> int:
        if self.is_mongo:
            return self.mongo_db[collection_name].count_documents(query or {})
        if not query:
            return len(self.local_data.get(collection_name, []))
        return len(self.find(collection_name, query))

db = DatabaseManager()
