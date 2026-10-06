import React from "react";

const h = React.createElement;

export default function AssessmentTest({
  assessment,
  questions,
  answers,
  currentQuestion,
  currentQuestionData,
  currentAnswer,
  remainingSeconds,
  formatTime,
  answeredCount,
  unansweredCount,
  progressPercent,
  savingAnswer,
  submitting,
  selectAnswer,
  goToQuestion,
  previousQuestion,
  nextQuestion,
  requestSubmit,
  exitFullscreen,
  error,
}) {
  if (!currentQuestionData) {
    return h(
      "div",
      {
        className: "assessment-page",
      },

      h(
        "div",
        {
          className: "assessment-container",
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
            "h2",
            {
              className: "assessment-heading",
            },
            "Preparing your questions..."
          )
        )
      )
    );
  }

  const questionNumber =
    currentQuestion + 1;

  const isLastQuestion =
    currentQuestion ===
    questions.length - 1;

  const timerIsLow =
    remainingSeconds <= 300;

  const options = [
    {
      key: "A",
      text:
        currentQuestionData.option_a ||
        currentQuestionData.options?.A ||
        currentQuestionData.options?.a ||
        "",
    },
    {
      key: "B",
      text:
        currentQuestionData.option_b ||
        currentQuestionData.options?.B ||
        currentQuestionData.options?.b ||
        "",
    },
    {
      key: "C",
      text:
        currentQuestionData.option_c ||
        currentQuestionData.options?.C ||
        currentQuestionData.options?.c ||
        "",
    },
    {
      key: "D",
      text:
        currentQuestionData.option_d ||
        currentQuestionData.options?.D ||
        currentQuestionData.options?.d ||
        "",
    },
  ];

  return h(
    "div",
    {
      className: "assessment-page",
    },

    h(
      "div",
      {
        className: "assessment-container",
        style: {
          paddingTop: "24px",
        },
      },

      // ================================================
      // TOP BAR
      // ================================================

      h(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            marginBottom: "20px",
            flexWrap: "wrap",
          },
        },

        h(
          "div",
          null,

          h(
            "p",
            {
              style: {
                margin: "0 0 4px",
                color: "#5D7052",
                fontSize: "13px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              },
            },
            assessment?.skill_name ||
              assessment?.skill?.name ||
              "Technical Assessment"
          ),

          h(
            "h1",
            {
              className: "assessment-heading",
              style: {
                fontSize: "28px",
              },
            },
            "Technical Assessment"
          )
        ),

        // TIMER
        h(
          "div",
          {
            style: {
              minWidth: "150px",
              textAlign: "center",
              padding: "12px 18px",
              borderRadius: "14px",
              border: timerIsLow
                ? "2px solid #A94B45"
                : "1px solid #DED8CF",
              background: timerIsLow
                ? "#FFF1EF"
                : "#FFFFFF",
            },
          },

          h(
            "div",
            {
              style: {
                fontSize: "12px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: timerIsLow
                  ? "#A94B45"
                  : "#73786F",
                marginBottom: "3px",
              },
            },
            "Time remaining"
          ),

          h(
            "div",
            {
              style: {
                fontSize: "24px",
                fontWeight: 900,
                fontVariantNumeric:
                  "tabular-nums",
                color: timerIsLow
                  ? "#A94B45"
                  : "#2F382C",
              },
            },
            formatTime(
              remainingSeconds
            )
          )
        )
      ),

      // ================================================
      // ERROR
      // ================================================

      error &&
        h(
          "div",
          {
            className:
              "assessment-error",
          },
          error
        ),

      // ================================================
      // PROGRESS
      // ================================================

      h(
        "div",
        {
          className: "assessment-card",
          style: {
            padding: "18px 20px",
            marginBottom: "20px",
          },
        },

        h(
          "div",
          {
            style: {
              display: "flex",
              justifyContent:
                "space-between",
              gap: "12px",
              marginBottom: "10px",
              fontSize: "14px",
              fontWeight: 700,
            },
          },

          h(
            "span",
            null,
            `Question ${questionNumber} of ${questions.length}`
          ),

          h(
            "span",
            {
              className:
                "assessment-muted",
            },
            `${progressPercent}%`
          )
        ),

        h(
          "div",
          {
            style: {
              height: "8px",
              borderRadius: "99px",
              background: "#E8E5DE",
              overflow: "hidden",
            },
          },

          h(
            "div",
            {
              style: {
                width: `${progressPercent}%`,
                height: "100%",
                background: "#5D7052",
                borderRadius: "99px",
                transition:
                  "width 0.2s ease",
              },
            }
          )
        )
      ),

      // ================================================
      // MAIN TEST LAYOUT
      // ================================================

      h(
        "div",
        {
          style: {
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 1fr) 280px",
            gap: "20px",
            alignItems: "start",
          },
        },

        // ==============================================
        // QUESTION CARD
        // ==============================================

        h(
          "div",
          {
            className:
              "assessment-card",
          },

          h(
            "div",
            {
              style: {
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "15px",
                marginBottom: "22px",
              },
            },

            h(
              "span",
              {
                style: {
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  width: "38px",
                  height: "38px",
                  borderRadius: "50%",
                  background: "#EEF2EA",
                  color: "#5D7052",
                  fontWeight: 900,
                },
              },
              questionNumber
            ),

            h(
              "span",
              {
                style: {
                  color: "#73786F",
                  fontSize: "14px",
                  fontWeight: 700,
                },
              },
              "1 mark"
            )
          ),

          // QUESTION
          h(
            "h2",
            {
              className:
                "assessment-heading",
              style: {
                fontSize: "23px",
                lineHeight: 1.45,
                marginBottom: "28px",
              },
            },
            currentQuestionData.question ||
              currentQuestionData.question_text ||
              "Question unavailable"
          ),

          // OPTIONS
          h(
            "div",
            {
              style: {
                display: "grid",
                gap: "12px",
              },
            },

            options.map(
              (option) => {

                const selected =
                  currentAnswer ===
                  option.key;

                return h(
                  "button",
                  {
                    key: option.key,
                    type: "button",
                    onClick: () =>
                      selectAnswer(
                        currentQuestionData.id,
                        option.key
                      ),
                    disabled:
                      savingAnswer ||
                      submitting,

                    style: {
                      width: "100%",
                      display: "flex",
                      alignItems:
                        "flex-start",
                      gap: "14px",
                      padding:
                        "15px 16px",
                      textAlign: "left",
                      borderRadius: "12px",
                      border: selected
                        ? "2px solid #5D7052"
                        : "1px solid #DED8CF",
                      background: selected
                        ? "#EEF2EA"
                        : "#FFFFFF",
                      color: "#2F382C",
                      cursor:
                        savingAnswer ||
                        submitting
                          ? "not-allowed"
                          : "pointer",
                      fontFamily:
                        "Nunito, sans-serif",
                      opacity:
                        savingAnswer ||
                        submitting
                          ? 0.75
                          : 1,
                    },
                  },

                  h(
                    "span",
                    {
                      style: {
                        flexShrink: 0,
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "center",
                        borderRadius:
                          "8px",
                        background:
                          selected
                            ? "#5D7052"
                            : "#F0EEE8",
                        color: selected
                          ? "#FFFFFF"
                          : "#5D7052",
                        fontWeight: 900,
                      },
                    },
                    option.key
                  ),

                  h(
                    "span",
                    {
                      style: {
                        paddingTop: "5px",
                        lineHeight: 1.5,
                        fontWeight:
                          selected
                            ? 800
                            : 600,
                      },
                    },
                    option.text
                  )
                );
              }
            )
          ),

          // SAVE STATUS
          h(
            "div",
            {
              style: {
                minHeight: "24px",
                marginTop: "14px",
                fontSize: "13px",
                color: "#73786F",
              },
            },

            savingAnswer
              ? "Saving answer..."
              : currentAnswer
              ? "Answer saved"
              : "Select one option"
          ),

          // ============================================
          // QUESTION NAVIGATION
          // ============================================

          h(
            "div",
            {
              style: {
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "12px",
                marginTop: "18px",
                paddingTop: "20px",
                borderTop:
                  "1px solid #E8E4DC",
              },
            },

            h(
              "button",
              {
                type: "button",
                className:
                  "assessment-btn assessment-btn-secondary",
                onClick:
                  previousQuestion,
                disabled:
                  currentQuestion ===
                    0 ||
                  submitting,
              },
              "Previous"
            ),

            h(
              "button",
              {
                type: "button",
                className:
                  "assessment-btn assessment-btn-primary",
                onClick:
                  nextQuestion,
                disabled:
                  submitting,
              },
              isLastQuestion
                ? "Review & Submit"
                : "Next"
            )
          )
        ),

        // ==============================================
        // QUESTION NAVIGATOR
        // ==============================================

        h(
          "div",
          {
            className:
              "assessment-card",
            style: {
              padding: "20px",
              position: "sticky",
              top: "20px",
            },
          },

          h(
            "h3",
            {
              className:
                "assessment-heading",
              style: {
                fontSize: "18px",
                marginBottom: "6px",
              },
            },
            "Questions"
          ),

          h(
            "p",
            {
              className:
                "assessment-muted",
              style: {
                fontSize: "13px",
                marginTop: 0,
                marginBottom: "18px",
              },
            },
            `${answeredCount} answered • ${unansweredCount} unanswered`
          ),

          h(
            "div",
            {
              style: {
                display: "grid",
                gridTemplateColumns:
                  "repeat(4, 1fr)",
                gap: "8px",
              },
            },

            questions.map(
              (question, index) => {

                const answered =
                  Boolean(
                    answers[
                      String(
                        question.id
                      )
                    ]
                  );

                const active =
                  index ===
                  currentQuestion;

                return h(
                  "button",
                  {
                    key: question.id,
                    type: "button",
                    onClick: () =>
                      goToQuestion(
                        index
                      ),

                    style: {
                      height: "42px",
                      borderRadius: "9px",
                      border: active
                        ? "2px solid #5D7052"
                        : "1px solid #DED8CF",
                      background: active
                        ? "#5D7052"
                        : answered
                        ? "#EEF2EA"
                        : "#FFFFFF",
                      color: active
                        ? "#FFFFFF"
                        : answered
                        ? "#4D6345"
                        : "#596055",
                      fontWeight: 800,
                      cursor: "pointer",
                    },
                  },
                  index + 1
                );
              }
            )
          ),

          // Legend
          h(
            "div",
            {
              style: {
                marginTop: "20px",
                paddingTop: "16px",
                borderTop:
                  "1px solid #E8E4DC",
                display: "grid",
                gap: "8px",
                fontSize: "12px",
                color: "#73786F",
              },
            },

            h(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                },
              },

              h(
                "span",
                {
                  style: {
                    width: "12px",
                    height: "12px",
                    borderRadius: "3px",
                    background:
                      "#5D7052",
                  },
                }
              ),

              "Current"
            ),

            h(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                },
              },

              h(
                "span",
                {
                  style: {
                    width: "12px",
                    height: "12px",
                    borderRadius: "3px",
                    background:
                      "#EEF2EA",
                    border:
                      "1px solid #C8D7BF",
                  },
                }
              ),

              "Answered"
            ),

            h(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                },
              },

              h(
                "span",
                {
                  style: {
                    width: "12px",
                    height: "12px",
                    borderRadius: "3px",
                    background:
                      "#FFFFFF",
                    border:
                      "1px solid #DED8CF",
                  },
                }
              ),

              "Unanswered"
            )
          ),

          // Submit button
          h(
            "button",
            {
              type: "button",
              className:
                "assessment-btn assessment-btn-primary",
              onClick:
                requestSubmit,
              disabled:
                submitting,
              style: {
                width: "100%",
                marginTop: "20px",
              },
            },
            submitting
              ? "Submitting..."
              : "Submit Assessment"
          )
        )
      ),

      // ================================================
      // MOBILE STYLE OVERRIDE
      // ================================================

      h(
        "style",
        null,
        `
          @media (max-width: 850px) {
            .assessment-test-layout {
              grid-template-columns: 1fr !important;
            }
          }
        `
      )
    )
  );
}