import logging
from logging.config import dictConfig

def setup_logging(level: str = "INFO"):
    dictConfig({
        "version": 1,
        "formatters": {"default": {"format": "%(asctime)s %(levelname)s [%(name)s] %(message)s"}},
        "handlers": {
            "console": {"class": "logging.StreamHandler", "formatter": "default", "level": level}
        },
        "root": {"level": level, "handlers": ["console"]},
    })
