# utils/chatbot.py
import csv
import random

CSV_FILE = 'chatbot.csv'

def load_dataset(file_path=CSV_FILE):
    dataset = []
    with open(file_path, mode='r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            dataset.append({
                'question': row['question'].strip().lower(),
                'answer': row['answer'].strip()
            })
    return dataset

FALLBACK_RESPONSES = [
    "OceanAlly can't respond to that now… try asking something else!",
    "Oops! Even the ocean waves are puzzled… ask another question?",
    "I'm still learning! Can you ask that differently?",
    "OceanAlly is floating away to find the answer… try again later!"
]

def get_answer(dataset, user_input):
    user_input = user_input.strip().lower()
    for item in dataset:
        if user_input == item['question']:
            return item['answer']
    return random.choice(FALLBACK_RESPONSES)
