import React from "react";

const h = React.createElement;

export default function AssessmentHome({
  skills,
  selectedSkill,
  setSelectedSkill,
  requestStart,
  starting,
  history,
  error,
  success,
}) {
  return h(
    "div",
    { className: "assessment-page" },

    h(
      "div",
      { className: "assessment-container" },

      // Header
      h(
        "div",
        {
          style: {
            marginBottom: "32px",
          },
        },

        h(
          "p",
          {
            style: {
              margin: "0 0 8px",
              color: "#5D7052",
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontSize: "13px",
            },
          },
          "NEXVO Assessments"
        ),

        h(
          "h1",
          {
            className: "assessment-heading",
            style: {
              fontSize: "38px",
              marginBottom: "10px",
            },
          },
          "Test your skills"
        ),

        h(
          "p",
          {
            className: "assessment-muted",
            style: {
              margin: 0,
              fontSize: "16px",
              maxWidth: "650px",
              lineHeight: 1.6,
            },
          },
          "Take a technical assessment to demonstrate your knowledge and strengthen your freelancer profile."
        )
      ),

      // Error
      error &&
        h(
          "div",
          {
            className: "assessment-error",
          },
          error
        ),

      // Success
      success &&
        h(
          "div",
          {
            className: "assessment-success",
          },
          success
        ),

      // Start assessment card
      h(
        "div",
        {
          className: "assessment-card",
          style: {
            marginBottom: "30px",
          },
        },

        h(
          "h2",
          {
            className: "assessment-heading",
            style: {
              fontSize: "25px",
              marginBottom: "8px",
            },
          },
          "Start a new assessment"
        ),

        h(
          "p",
          {
            className: "assessment-muted",
            style: {
              marginTop: 0,
              marginBottom: "24px",
              lineHeight: 1.6,
            },
          },
          "Choose a skill and complete a timed technical assessment."
        ),

        h(
          "label",
          {
            style: {
              display: "block",
              fontWeight: 700,
              marginBottom: "8px",
            },
          },
          "Select skill"
        ),

        h(
          "select",
          {
            value: selectedSkill,
            onChange: (event) =>
              setSelectedSkill(
                event.target.value
              ),
            disabled: starting,
            style: {
              width: "100%",
              maxWidth: "500px",
              padding: "13px 14px",
              borderRadius: "10px",
              border: "1px solid #DED8CF",
              background: "#FDFCF8",
              color: "#2F382C",
              fontFamily: "Nunito, sans-serif",
              fontSize: "15px",
              outline: "none",
            },
          },

          h(
            "option",
            {
              value: "",
            },
            "Choose a skill"
          ),

          skills.map(
            (skill) =>
              h(
                "option",
                {
                  key: skill.id,
                  value: skill.id,
                },
                skill.name
              )
          )
        ),

        h(
          "div",
          {
            style: {
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginTop: "24px",
              alignItems: "center",
            },
          },

          h(
            "button",
            {
              type: "button",
              className:
                "assessment-btn assessment-btn-primary",
              onClick: requestStart,
              disabled:
                starting ||
                !selectedSkill,
            },

            starting
              ? "Starting..."
              : "Start Assessment"
          ),

          h(
            "div",
            {
              className: "assessment-muted",
              style: {
                fontSize: "14px",
              },
            },
            "20 questions • 20 minutes"
          )
        )
      ),

      // Assessment information
      h(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
            marginBottom: "36px",
          },
        },

        h(
          "div",
          {
            className: "assessment-card",
            style: {
              padding: "20px",
            },
          },

          h(
            "div",
            {
              style: {
                fontSize: "26px",
                fontWeight: 800,
                color: "#5D7052",
                marginBottom: "5px",
              },
            },
            "20"
          ),

          h(
            "div",
            {
              className: "assessment-muted",
            },
            "Questions"
          )
        ),

        h(
          "div",
          {
            className: "assessment-card",
            style: {
              padding: "20px",
            },
          },

          h(
            "div",
            {
              style: {
                fontSize: "26px",
                fontWeight: 800,
                color: "#5D7052",
                marginBottom: "5px",
              },
            },
            "20 min"
          ),

          h(
            "div",
            {
              className: "assessment-muted",
            },
            "Time limit"
          )
        ),

        h(
          "div",
          {
            className: "assessment-card",
            style: {
              padding: "20px",
            },
          },

          h(
            "div",
            {
              style: {
                fontSize: "26px",
                fontWeight: 800,
                color: "#5D7052",
                marginBottom: "5px",
              },
            },
            "1"
          ),

          h(
            "div",
            {
              className: "assessment-muted",
            },
            "Mark per question"
          )
        )
      ),

      // History
      h(
        "div",
        {
          style: {
            marginBottom: "20px",
          },
        },

        h(
          "h2",
          {
            className: "assessment-heading",
            style: {
              fontSize: "28px",
              marginBottom: "6px",
            },
          },
          "Assessment history"
        ),

        h(
          "p",
          {
            className: "assessment-muted",
            style: {
              marginTop: 0,
            },
          },
          "Your previous assessment attempts appear here."
        )
      ),

      history.length === 0
        ? h(
            "div",
            {
              className: "assessment-card",
            },

            h(
              "p",
              {
                className:
                  "assessment-muted",
                style: {
                  margin: 0,
                  textAlign: "center",
                },
              },
              "No assessment attempts yet."
            )
          )
        : h(
            "div",
            {
              style: {
                display: "grid",
                gap: "14px",
              },
            },

            history.map(
              (item) =>
                h(
                  "div",
                  {
                    key: item.id,
                    className:
                      "assessment-card",
                    style: {
                      padding: "20px",
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems:
                        "center",
                      gap: "20px",
                      flexWrap: "wrap",
                    },
                  },

                  h(
                    "div",
                    null,

                    h(
                      "div",
                      {
                        style: {
                          fontWeight: 800,
                          fontSize: "17px",
                          marginBottom: "5px",
                        },
                      },
                      item.skill_name ||
                        item.skill?.name ||
                        item.assessment_type ||
                        "Technical Assessment"
                    ),

                    h(
                      "div",
                      {
                        className:
                          "assessment-muted",
                        style: {
                          fontSize: "14px",
                        },
                      },
                      item.completed_at
                        ? new Date(
                            item.completed_at
                          ).toLocaleString()
                        : item.started_at
                        ? new Date(
                            item.started_at
                          ).toLocaleString()
                        : "Date unavailable"
                    )
                  ),

                  h(
                    "div",
                    {
                      style: {
                        textAlign: "right",
                      },
                    },

                    h(
                      "div",
                      {
                        style: {
                          fontWeight: 800,
                          color: "#5D7052",
                        },
                      },
                      item.score !==
                        null &&
                      item.score !==
                        undefined
                        ? `${item.score}%`
                        : item.status ||
                          "N/A"
                    ),

                    h(
                      "div",
                      {
                        className:
                          "assessment-muted",
                        style: {
                          fontSize: "13px",
                          marginTop: "3px",
                        },
                      },
                      item.status || ""
                    )
                  )
                )
            )
          )
    )
  );
}