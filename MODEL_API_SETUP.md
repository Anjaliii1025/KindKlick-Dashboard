# KindKlick Model API Setup

This project now includes a website-side integration for:

- `text_model.pkl`
- `url_model.pkl`
- `url_features.pkl`

## Files

- Backend API: `model_api/app.py`
- Backend deps: `model_api/requirements.txt`
- Frontend page: `src/pages/dashboard/SafetyScanner.tsx`
- Frontend client: `src/lib/safetyApi.ts`

## Run the API locally

From the project root:

```bash
cd model_api
pip install -r requirements.txt
uvicorn app:app --reload
```

The API will run at:

```text
http://127.0.0.1:8000
```

## Run the website locally

In a separate terminal:

```bash
npm install
npm run dev
```

If needed, create a `.env` file in the project root:

```text
VITE_MODEL_API_BASE_URL=http://127.0.0.1:8000
```

## Endpoints

- `GET /health`
- `POST /analyze/text`
- `POST /analyze/url`

## Deploy on Vercel

This project is prepared so the frontend and Python API can live in the same Vercel project.

- Frontend stays on the main Vite app
- Python API is exposed from `api/index.py`
- Production frontend calls the same origin automatically, so `/api/analyze/text` and `/api/analyze/url` are used without extra config

If you want a custom API host instead, set:

```text
VITE_MODEL_API_BASE_URL=https://your-api-host
```

## Notes

- The website integration is dashboard-only for now.
- The extension code was left untouched.
- If your saved model labels are inverted, update `TEXT_UNSAFE_LABEL` or `URL_PHISHING_LABEL` in `model_api/app.py`.
