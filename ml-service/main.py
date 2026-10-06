from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

from predictor import predict_candidate_score


app = FastAPI(
    title="NEXVO ML Service",
    version="1.0.0"
)


class CandidateInput(BaseModel):
    candidate_id: Optional[str] = None
    role_type: str
    years_experience: float
    project_score: float
    certifications_count: int
    certifications_capped: int
    education_level: str
    education_score: float
    dynamic_test_score: float
    github_activity_score: float
    communication_score: float
    internship_months: float
    hackathon_wins: int
    open_source_contributions: int
    others_composite_score: float


@app.get("/")
def root():
    return {
        "service": "NEXVO ML Service",
        "status": "running"
    }


@app.post("/predict")
def predict(candidate: CandidateInput):
    try:
        candidate_data = candidate.model_dump()

        score = predict_candidate_score(candidate_data)

        return {
            "candidate_id": candidate.candidate_id,
            "model_score": score
        }

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(error)}"
        )