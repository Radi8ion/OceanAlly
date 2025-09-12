# Optional Redis cache hook; left as stub for now
class Cache:
    def get(self, key: str): return None
    def set(self, key: str, value, ttl: int = 300): pass
