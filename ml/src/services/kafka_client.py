import json
from typing import Iterable, Optional
from kafka import KafkaConsumer, KafkaProducer

class KafkaClient:
    def __init__(self, brokers: str):
        self.brokers = brokers

    def consumer(self, topic: str, group_id: str):
        return KafkaConsumer(
            topic,
            group_id=group_id,
            bootstrap_servers=self.brokers.split(","),
            auto_offset_reset="earliest",
            enable_auto_commit=True,
            value_deserializer=lambda v: json.loads(v.decode("utf-8")),
        )

    def producer(self):
        return KafkaProducer(
            bootstrap_servers=self.brokers.split(","),
            value_serializer=lambda v: json.dumps(v).encode("utf-8")
        )

    @staticmethod
    def iter_messages(consumer) -> Iterable[dict]:
        for msg in consumer:
            yield msg.value
