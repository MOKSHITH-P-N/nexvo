from predictor import predict_candidate_score


candidate = {
    "candidate_id": "C9001",
    "role_type": "Junior/Fresher",
    "years_experience": 0.7,
    "project_score": 82.5,
    "certifications_count": 7,
    "certifications_capped": 7,
    "education_level": "MCA",
    "education_score": 85,
    "dynamic_test_score": 93.2,
    "github_activity_score": 81.5,
    "communication_score": 75.4,
    "internship_months": 5,
    "hackathon_wins": 3,
    "open_source_contributions": 20,
    "others_composite_score": 82.1
}


score = predict_candidate_score(candidate)

print("Predicted candidate score:", score)