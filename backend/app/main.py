from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers.routes import router as api_router

app = FastAPI(title="Resume Analyzer API", version="0.1.0")

# Adjust origins as needed for your frontend dev server
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}