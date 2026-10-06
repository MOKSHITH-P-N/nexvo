import React from "react";

const h = React.createElement;

export default function AssessmentExpired({
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
              fontSize: "34px",
              marginBottom: "10px",
            },
          },
          "Time's up"
        ),

        h(
          "p",
          {
            className: "assessment-muted",
            style: {
              lineHeight: 1.7,
              maxWidth: "520px",
              margin:
                "0 auto 28px",
            },
          },
          "Your assessment time has expired. Your recorded responses have been submitted and the assessment has been ended."
        ),

        h(
          "p",
          {
            style: {
              color: "#73786F",
              fontSize: "14px",
              marginBottom: "24px",
            },
          },
          "Returning to assessments..."
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