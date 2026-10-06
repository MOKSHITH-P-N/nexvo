import React from "react";

const h = React.createElement;

export default function AssessmentResult({
  result,
  returnHome,
}) {
  if (!result) {
    return h(
      "div",
      { className: "assessment-page" },
      h(
        "div",
        { className: "assessment-container" },
        h(
          "div",
          {
            className: "assessment-card",
            style: { textAlign: "center" },
          },
          h(
            "h2",
            { className: "assessment-heading" },
            "Assessment completed"
          ),
          h(
            "p",
            { className: "assessment-muted" },
            "Your assessment result is being processed."
          ),
          h(
            "button",
            {
              className:
                "assessment-btn assessment-btn-primary",
              onClick: returnHome,
            },
            "Back to Assessments"
          )
        )
      )
    );
  }

  const score =
    result.score ??
    result.percentage ??
    0;

  const correct =
    result.correct_answers ??
    result.correct_count ??
    0;

  const total =
    result.total_questions ??
    result.question_count ??
    20;

  const skillName =
    result.skill_name ||
    result.skill?.name ||
    result.assessment_type ||
    "Technical Assessment";

  return h(
    "div",
    { className: "assessment-page" },

    h(
      "div",
      {
        className: "assessment-container",
        style: {
          maxWidth: "850px",
        },
      },

      h(
        "div",
        {
          className: "assessment-card",
          style: {
            textAlign: "center",
            padding: "45px 30px",
          },
        },

        h(
          "div",
          {
            style: {
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "#EEF2EA",
              color: "#5D7052",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "34px",
              fontWeight: 900,
            },
          },
          "✓"
        ),

        h(
          "p",
          {
            style: {
              margin: "0 0 8px",
              color: "#5D7052",
              fontWeight: 800,
              textTransform: "uppercase",
              fontSize: "13px",
              letterSpacing: "0.05em",
            },
          },
          "Assessment Complete"
        ),

        h(
          "h1",
          {
            className: "assessment-heading",
            style: {
              fontSize: "36px",
              marginBottom: "8px",
            },
          },
          skillName
        ),

        h(
          "p",
          {
            className: "assessment-muted",
            style: {
              marginTop: 0,
              marginBottom: "35px",
            },
          },
          "Your assessment has been submitted successfully."
        ),

        h(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              gap: "14px",
              marginBottom: "35px",
            },
          },

          h(
            "div",
            {
              style: {
                padding: "20px",
                background: "#F7F6F1",
                borderRadius: "14px",
              },
            },

            h(
              "div",
              {
                style: {
                  fontSize: "34px",
                  fontWeight: 900,
                  color: "#5D7052",
                },
              },
              `${score}%`
            ),

            h(
              "div",
              {
                className: "assessment-muted",
              },
              "Score"
            )
          ),

          h(
            "div",
            {
              style: {
                padding: "20px",
                background: "#F7F6F1",
                borderRadius: "14px",
              },
            },

            h(
              "div",
              {
                style: {
                  fontSize: "34px",
                  fontWeight: 900,
                  color: "#5D7052",
                },
              },
              correct
            ),

            h(
              "div",
              {
                className: "assessment-muted",
              },
              "Correct"
            )
          ),

          h(
            "div",
            {
              style: {
                padding: "20px",
                background: "#F7F6F1",
                borderRadius: "14px",
              },
            },

            h(
              "div",
              {
                style: {
                  fontSize: "34px",
                  fontWeight: 900,
                  color: "#5D7052",
                },
              },
              total
            ),

            h(
              "div",
              {
                className: "assessment-muted",
              },
              "Questions"
            )
          )
        ),

        h(
          "button",
          {
            className:
              "assessment-btn assessment-btn-primary",
            onClick: returnHome,
          },
          "Back to Assessments"
        )
      )
    )
  );
}