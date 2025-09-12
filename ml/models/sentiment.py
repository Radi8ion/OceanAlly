from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

class SentimentService:
    def __init__(self):
        self._analyzer = SentimentIntensityAnalyzer()

    def score(self, text: str) -> dict:
        return self._analyzer.polarity_scores(text)
