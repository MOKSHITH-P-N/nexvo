import React from "react";

const h = React.createElement;

export default function AssessmentViolation({
  violationCount,
  message,
  returnHome,
}) {
  return h(
    "div",
    { className: "assessment-page" },

    h(
      "div",
      {
        className: "assessment-container",
        style: {
          maxWidth: "700px",
        },
      },

      h(
        "div",
        {
          className: "assessment-card",
          style: {
            textAlign: "center",
            padding: "50px 30px",
          },
        },

        h(
          "div",
          {
            style: {
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "#FFF1EF",
              color: "#A94B45",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "30px",
              fontWeight: 900,
            },
          },
          "!"
        ),

        h(
          "h1",
          {
            className: "assessment-heading",
            style: {
              fontSize: "32px",
              marginBottom: "12px",
            },
          },
          "Assessment terminated"
        ),

        h(
          "p",
          {
            className: "assessment-muted",
            style: {
              lineHeight: 1.7,
              marginBottom: "22px",
            },
          },
          message ||
            "The assessment was terminated because the maximum number of assessment violations was reached."
        ),

        h(
          "div",
          {
            style: {
              display: "inline-block",
              padding: "10px 18px",
              borderRadius: "10px",
              background: "#FFF1EF",
              color: "#A94B45",
              fontWeight: 800,
              marginBottom: "28px",
            },
          },
          `Violations: ${violationCount}`
        ),

        h(
          "p",
          {
            className: "assessment-muted",
            style: {
              fontSize: "14px",
              lineHeight: 1.6,
              marginBottom: "25px",
            },
          },
          "Please check your assessment history for the next available attempt."
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