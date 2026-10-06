import React from "react";

const h = React.createElement;

function Modal({
  title,
  children,
  onClose,
  actions,
}) {
  return h(
    "div",
    {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background:
          "rgba(30, 35, 28, 0.48)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      },
      onClick: (event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      },
    },

    h(
      "div",
      {
        className:
          "assessment-card",
        style: {
          width: "min(500px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
        },
      },

      h(
        "h2",
        {
          className:
            "assessment-heading",
          style: {
            fontSize: "25px",
            marginBottom: "12px",
          },
        },
        title
      ),

      h(
        "div",
        {
          className:
            "assessment-muted",
          style: {
            lineHeight: 1.6,
          },
        },
        children
      ),

      h(
        "div",
        {
          style: {
            display: "flex",
            justifyContent:
              "flex-end",
            gap: "10px",
            marginTop: "25px",
          },
        },
        actions
      )
    )
  );
}


export function StartAssessmentModal({
  open,
  onClose,
  onConfirm,
  starting,
}) {
  if (!open) {
    return null;
  }

  return h(
    Modal,
    {
      title: "Start assessment?",
      onClose,
      actions: [
        h(
          "button",
          {
            key: "cancel",
            type: "button",
            className:
              "assessment-btn assessment-btn-secondary",
            onClick: onClose,
            disabled: starting,
          },
          "Cancel"
        ),

        h(
          "button",
          {
            key: "start",
            type: "button",
            className:
              "assessment-btn assessment-btn-primary",
            onClick: onConfirm,
            disabled: starting,
          },
          starting
            ? "Starting..."
            : "Start Assessment"
        ),
      ],
    },

    h(
      "div",
      null,

      h(
        "p",
        null,
        "You are about to start a timed technical assessment."
      ),

      h(
        "ul",
        {
          style: {
            paddingLeft: "20px",
          },
        },

        h(
          "li",
          null,
          "20 questions"
        ),

        h(
          "li",
          null,
          "20 minutes"
        ),

        h(
          "li",
          null,
          "Answers are saved as you progress"
        ),

        h(
          "li",
          null,
          "Leaving the assessment environment may be recorded as a violation"
        )
      ),

      h(
        "p",
        null,
        "Make sure you are ready before starting."
      )
    )
  );
}


export function SubmitAssessmentModal({
  open,
  onClose,
  onConfirm,
  submitting,
  unansweredCount,
}) {
  if (!open) {
    return null;
  }

  return h(
    Modal,
    {
      title: "Submit assessment?",
      onClose,
      actions: [
        h(
          "button",
          {
            key: "cancel",
            type: "button",
            className:
              "assessment-btn assessment-btn-secondary",
            onClick: onClose,
            disabled: submitting,
          },
          "Continue Test"
        ),

        h(
          "button",
          {
            key: "submit",
            type: "button",
            className:
              "assessment-btn assessment-btn-primary",
            onClick: onConfirm,
            disabled: submitting,
          },
          submitting
            ? "Submitting..."
            : "Submit Assessment"
        ),
      ],
    },

    h(
      "div",
      null,

      unansweredCount > 0
        ? h(
            "p",
            null,
            `You still have ${unansweredCount} unanswered question${
              unansweredCount === 1
                ? ""
                : "s"
            }.`
          )
        : h(
            "p",
            null,
            "You have answered all questions."
          ),

      h(
        "p",
        null,
        "Once submitted, you cannot change your answers."
      )
    )
  );
}


export function ViolationModal({
  open,
  onClose,
  violationCount,
  message,
}) {
  if (!open) {
    return null;
  }

  return h(
    Modal,
    {
      title: "Assessment warning",
      onClose,
      actions: [
        h(
          "button",
          {
            key: "continue",
            type: "button",
            className:
              "assessment-btn assessment-btn-primary",
            onClick: onClose,
          },
          "Continue"
        ),
      ],
    },

    h(
      "div",
      null,

      h(
        "p",
        null,
        message ||
          "An assessment violation has been recorded."
      ),

      h(
        "p",
        {
          style: {
            fontWeight: 800,
            color: "#A94B45",
          },
        },
        `Violations recorded: ${violationCount}`
      )
    )
  );
}