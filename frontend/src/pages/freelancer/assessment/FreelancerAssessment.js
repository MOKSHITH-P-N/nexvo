import React from "react";
import { useNavigate } from "react-router-dom";

import "./FreelancerAssessment.css";

import useAssessment from "./useAssessment";

import AssessmentHome from "./AssessmentHome";
import AssessmentTest from "./AssessmentTest";
import AssessmentResult from "./AssessmentResult";
import AssessmentExpired from "./AssessmentExpired";
import AssessmentViolation from "./AssessmentViolation";

import {
  SCREENS,
} from "./assessmentConstants";

import {
  StartAssessmentModal,
  SubmitAssessmentModal,
  ViolationModal,
} from "./AssessmentModals";


const h = React.createElement;


export default function FreelancerAssessment() {

  const navigate =
    useNavigate();


  const assessment =
    useAssessment();


  // ==================================================
  // LOADING
  // ==================================================

  if (assessment.loading) {

    return h(
      "div",
      {
        className:
          "assessment-loading",
      },

      h(
        "div",
        {
          className:
            "assessment-loading-content",
        },

        h(
          "div",
          {
            className:
              "assessment-spinner",
          }
        ),

        h(
          "h2",
          {
            className:
              "assessment-heading",
          },
          "Loading Assessments"
        ),

        h(
          "p",
          {
            className:
              "assessment-muted",
          },
          "Please wait while we prepare your assessment area."
        )
      )
    );
  }


  // ==================================================
  // HOME
  // ==================================================

  if (
    assessment.screen ===
    SCREENS.HOME
  ) {

    return h(
      React.Fragment,
      null,

      h(
        AssessmentHome,
        {
          skills:
            assessment.skills,

          selectedSkill:
            assessment.selectedSkill,

          setSelectedSkill:
            assessment.setSelectedSkill,

          requestStart:
            assessment.requestStart,

          starting:
            assessment.starting,

          history:
            assessment.history,

          error:
            assessment.error,

          success:
            assessment.success,
        }
      ),

      h(
        StartAssessmentModal,
        {
          open:
            assessment.showStartModal,

          onClose:
            () =>
              assessment.setShowStartModal(
                false
              ),

          onConfirm:
            assessment.startAssessment,

          starting:
            assessment.starting,
        }
      )
    );
  }


  // ==================================================
  // TEST
  // ==================================================

  if (
    assessment.screen ===
    SCREENS.TEST
  ) {

    return h(
      React.Fragment,
      null,

      h(
        AssessmentTest,
        {
          assessment:
            assessment.assessment,

          questions:
            assessment.questions,

          answers:
            assessment.answers,

          currentQuestion:
            assessment.currentQuestion,

          currentQuestionData:
            assessment.currentQuestionData,

          currentAnswer:
            assessment.currentAnswer,

          remainingSeconds:
            assessment.remainingSeconds,

          formatTime:
            assessment.formatTime,

          answeredCount:
            assessment.answeredCount,

          unansweredCount:
            assessment.unansweredCount,

          progressPercent:
            assessment.progressPercent,

          savingAnswer:
            assessment.savingAnswer,

          submitting:
            assessment.submitting,

          selectAnswer:
            assessment.selectAnswer,

          goToQuestion:
            assessment.goToQuestion,

          previousQuestion:
            assessment.previousQuestion,

          nextQuestion:
            assessment.nextQuestion,

          requestSubmit:
            assessment.requestSubmit,

          exitFullscreen:
            assessment.exitFullscreen,

          error:
            assessment.error,
        }
      ),

      h(
        SubmitAssessmentModal,
        {
          open:
            assessment.showSubmitModal,

          onClose:
            () =>
              assessment.setShowSubmitModal(
                false
              ),

          onConfirm:
            assessment.submitAssessment,

          submitting:
            assessment.submitting,

          unansweredCount:
            assessment.unansweredCount,
        }
      ),

      h(
        ViolationModal,
        {
          open:
            assessment.showViolationModal,

          onClose:
            () =>
              assessment.setShowViolationModal(
                false
              ),

          violationCount:
            assessment.violationCount,

          message:
            assessment.violationMessage,
        }
      )
    );
  }


  // ==================================================
  // RESULT
  // ==================================================

  if (
    assessment.screen ===
    SCREENS.RESULT
  ) {

    return h(
      AssessmentResult,
      {
        result:
          assessment.result,

        returnHome:
          assessment.returnHome,
      }
    );
  }


  // ==================================================
  // EXPIRED
  // ==================================================

  if (
    assessment.screen ===
    SCREENS.EXPIRED
  ) {

    return h(
      AssessmentExpired,
      {
        returnHome:
          assessment.returnHome,
      }
    );
  }


  // ==================================================
  // VIOLATION
  // ==================================================

  if (
    assessment.screen ===
    SCREENS.VIOLATION
  ) {

    return h(
      AssessmentViolation,
      {
        violationCount:
          assessment.violationCount,

        message:
          assessment.violationMessage,

        returnHome:
          assessment.returnHome,
      }
    );
  }


  // ==================================================
  // FALLBACK
  // ==================================================

  return h(
    "div",
    {
      className:
        "assessment-page",
    },

    h(
      "div",
      {
        className:
          "assessment-container",
      },

      h(
        "div",
        {
          className:
            "assessment-card",
          style: {
            textAlign: "center",
          },
        },

        h(
          "h2",
          {
            className:
              "assessment-heading",
          },
          "Assessment"
        ),

        h(
          "p",
          {
            className:
              "assessment-muted",
          },
          "Something unexpected happened."
        ),

        h(
          "button",
          {
            type: "button",
            className:
              "assessment-btn assessment-btn-primary",
            onClick: () =>
              navigate(
                "/freelancer/assessments"
              ),
          },
          "Back to Assessments"
        )
      )
    )
  );
}