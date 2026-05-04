from __future__ import annotations

import math
import re
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
TEXT_MODEL_PATH = MODELS_DIR / "text_model.pkl"
URL_MODEL_PATH = MODELS_DIR / "url_model.pkl"
URL_FEATURES_PATH = MODELS_DIR / "url_features.pkl"

# Change these only if your saved labels mean something different.
TEXT_UNSAFE_LABEL = 1
URL_PHISHING_LABEL = 1


text_model = joblib.load(TEXT_MODEL_PATH)
url_model = joblib.load(URL_MODEL_PATH)
url_feature_names = joblib.load(URL_FEATURES_PATH)


app = FastAPI(title="KindKlick Model API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://kindklick-parent-hub.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TextRequest(BaseModel):
    text: str


class UrlRequest(BaseModel):
    url: str


def clean_text(text: str) -> str:
    text = str(text).lower()
    text = re.sub(r"http\S+|www\S+", " ", text)
    text = re.sub(r"\S+@\S+", " ", text)
    text = re.sub(r"[^a-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def extract_url_feature_map(url: str) -> dict[str, float]:
    parsed = urlparse(url)
    hostname = parsed.netloc
    path = parsed.path
    query = parsed.query

    suspicious_words = [
        "login",
        "verify",
        "account",
        "secure",
        "update",
        "bank",
        "signin",
        "confirm",
        "password",
        "wallet",
        "payment",
        "bonus",
        "free",
        "claim",
    ]

    suspicious_tlds = [".xyz", ".tk", ".ml", ".ga", ".cf", ".gq"]
    shorteners = [
        "bit.ly",
        "tinyurl.com",
        "t.co",
        "goo.gl",
        "is.gd",
        "buff.ly",
        "ow.ly",
        "rb.gy",
    ]

    safe_length = max(len(url), 1)
    probs = [url.count(char) / safe_length for char in set(url)]

    return {
        "length": len(url),
        "dots": url.count("."),
        "digits": sum(char.isdigit() for char in url),
        "special_chars": len(re.findall(r"[@#&=]", url)),
        "has_ip": int(bool(re.search(r"\d+\.\d+\.\d+\.\d+", hostname))),
        "has_https": int(parsed.scheme == "https" or "https" in url),
        "has_login": int("login" in url.lower()),
        "subdomain_count": max(hostname.count(".") - 1, 0),
        "suspicious_tld": int(any(tld in url for tld in [".xyz", ".tk", ".ml"])),
        "entropy": -sum(p * math.log2(p) for p in probs if p > 0),
        "url_length": len(url),
        "hostname_length": len(hostname),
        "path_length": len(path),
        "query_length": len(query),
        "dot_count": url.count("."),
        "hyphen_count": url.count("-"),
        "slash_count": url.count("/"),
        "digit_count": sum(char.isdigit() for char in url),
        "special_char_count": len(re.findall(r"[@#&=%]", url)),
        "has_at_symbol": int("@" in url),
        "has_double_slash_path": int("//" in path),
        "has_suspicious_tld": int(any(hostname.endswith(tld) for tld in suspicious_tlds)),
        "has_shortener": int(any(short in hostname for short in shorteners)),
        "has_suspicious_word": int(any(word in url for word in suspicious_words)),
    }


def normalize_text_result(prediction: Any) -> str:
    if isinstance(prediction, str):
        normalized = prediction.strip().lower().replace(" ", "_")
        if normalized in {"safe", "ham", "legitimate"}:
            return "safe"
        if normalized in {"fraud", "spam", "phishing", "harmful", "unsafe"}:
            return "unsafe"
        return normalized

    return "unsafe" if prediction == TEXT_UNSAFE_LABEL else "safe"


def normalize_url_result(prediction: Any) -> str:
    if isinstance(prediction, str):
        normalized = prediction.strip().lower().replace(" ", "_")
        if normalized in {"safe", "benign", "legitimate"}:
            return "safe"
        if normalized in {"phishing", "fraud", "unsafe", "malicious"}:
            return "phishing"
        return normalized

    return "phishing" if prediction == URL_PHISHING_LABEL else "safe"


def probability_for_label(model: Any, features: Any, target_label: Any) -> float | None:
    if not hasattr(model, "predict_proba"):
        return None

    probabilities = model.predict_proba(features)[0]
    classes = list(getattr(model, "classes_", []))

    if target_label in classes:
        return float(probabilities[classes.index(target_label)])

    return float(max(probabilities))


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze/text")
def analyze_text(payload: TextRequest) -> dict[str, Any]:
    cleaned = clean_text(payload.text)
    prediction = text_model.predict([cleaned])[0]
    probability = probability_for_label(text_model, [cleaned], TEXT_UNSAFE_LABEL)
    result = normalize_text_result(prediction)

    return {
        "input": payload.text,
        "cleaned_text": cleaned,
        "result": result,
        "confidence": round(probability if probability is not None else 0.0, 4),
        "raw_prediction": str(prediction),
    }


@app.post("/analyze/url")
def analyze_url(payload: UrlRequest) -> dict[str, Any]:
    feature_map = extract_url_feature_map(payload.url)
    feature_row = pd.DataFrame([[feature_map.get(name, 0) for name in url_feature_names]], columns=url_feature_names)
    prediction = url_model.predict(feature_row)[0]
    probability = probability_for_label(url_model, feature_row, URL_PHISHING_LABEL)
    result = normalize_url_result(prediction)

    return {
        "input": payload.url,
        "result": result,
        "confidence": round(probability if probability is not None else 0.0, 4),
        "raw_prediction": str(prediction),
    }
