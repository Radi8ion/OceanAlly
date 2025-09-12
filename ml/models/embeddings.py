from sentence_transformers import SentenceTransformer

def load_embedding_model(name: str = "paraphrase-multilingual-MiniLM-L12-v2"):
    return SentenceTransformer(name)
