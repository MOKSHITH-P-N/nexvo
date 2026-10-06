import {
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../../../services/api";

import {
  QUESTION_COUNT,
  ASSESSMENT_DURATION_MINUTES,
  MAX_VIOLATIONS,
  SCREENS,
} from "./assessmentConstants";


export default function useAssessment() {

  // ==================================================
  // STATE
  // ==================================================

  const [screen, setScreen] = useState(
    SCREENS.HOME
  );

  const [skills, setSkills] = useState([]);

  const [selectedSkill, setSelectedSkill] =
    useState("");

  const [assessment, setAssessment] =
    useState(null);

  const [questions, setQuestions] =
    useState([]);

  const [answers, setAnswers] =
    useState({});

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [remainingSeconds, setRemainingSeconds] =
    useState(0);

  const [history, setHistory] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [starting, setStarting] =
    useState(false);

  const [savingAnswer, setSavingAnswer] =
    useState(false);

  const [submitting, setSubmitting] =
    useState(false);

  const [result, setResult] =
    useState(null);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [showStartModal, setShowStartModal] =
    useState(false);

  const [showSubmitModal, setShowSubmitModal] =
    useState(false);

  const [violationCount, setViolationCount] =
    useState(0);

  const [violationMessage, setViolationMessage] =
    useState("");

  const [showViolationModal, setShowViolationModal] =
    useState(false);

  const [assessmentTerminated, setAssessmentTerminated] =
    useState(false);


  // ==================================================
  // REFS
  // ==================================================

  const lastViolationTimeRef =
    useRef(0);

  const violationInProgressRef =
    useRef(false);

  const assessmentRef =
    useRef(null);

  const questionsRef =
    useRef([]);

  const answersRef =
    useRef({});

  const submittingRef =
    useRef(false);

  const expiryReturnTimerRef =
    useRef(null);


  // ==================================================
  // LOAD HOME DATA
  // ==================================================

  useEffect(() => {

    loadHomeData();

  }, []);


  async function loadHomeData() {

    try {

      setLoading(true);
      setError("");

      const [
        skillsResponse,
        historyResponse,
      ] = await Promise.all([
        api.get("/freelancers/skills"),
        api.get("/assessments"),
      ]);


      setSkills(
        skillsResponse.data?.skills || []
      );


      setHistory(
        historyResponse.data?.assessments || []
      );


    } catch (err) {

      console.error(
        "Assessment home loading error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Unable to load assessments."
      );

    } finally {

      setLoading(false);

    }
  }


  // ==================================================
  // KEEP REFS IN SYNC
  // ==================================================

  useEffect(() => {

    assessmentRef.current =
      assessment;

  }, [assessment]);


  useEffect(() => {

    questionsRef.current =
      questions;

  }, [questions]);


  useEffect(() => {

    answersRef.current =
      answers;

  }, [answers]);


  // ==================================================
  // CLEANUP EXPIRY REDIRECT
  // ==================================================

  useEffect(() => {

    return () => {

      if (
        expiryReturnTimerRef.current
      ) {

        clearTimeout(
          expiryReturnTimerRef.current
        );

        expiryReturnTimerRef.current =
          null;
      }

    };

  }, []);


  // ==================================================
  // TIMER
  // ==================================================

  useEffect(() => {

  if (
    screen !== SCREENS.TEST ||
    !assessment?.expires_at
  ) {
    return;
  }

  const expiresAt =
    new Date(
      assessment.expires_at
    ).getTime();

  if (!Number.isFinite(expiresAt)) {
    console.error(
      "Invalid assessment expiry time:",
      assessment.expires_at
    );
    return;
  }

  function updateTimer() {

    const millisecondsLeft =
      expiresAt - Date.now();

    const seconds =
      Math.max(
        0,
        Math.ceil(
          millisecondsLeft / 1000
        )
      );

    setRemainingSeconds(
      seconds
    );

    if (
      millisecondsLeft <= 0 &&
      !submittingRef.current
    ) {
      handleTimeExpired();
    }
  }

  updateTimer();

  // Update countdown frequently
  const interval =
    setInterval(
      updateTimer,
      250
    );

  // Exact expiry trigger
  const millisecondsUntilExpiry =
    Math.max(
      0,
      expiresAt - Date.now()
    );

  const expiryTimeout =
    setTimeout(
      () => {

        if (
          !submittingRef.current
        ) {

          setRemainingSeconds(
            0
          );

          handleTimeExpired();
        }

      },
      millisecondsUntilExpiry
    );

  return () => {

    clearInterval(
      interval
    );

    clearTimeout(
      expiryTimeout
    );

  };

}, [
  screen,
  assessment?.expires_at,
]);


  // ==================================================
  // SECURITY LISTENERS
  // ==================================================

  useEffect(() => {

    if (
      screen !== SCREENS.TEST
    ) {

      return;
    }


    document.documentElement
      .requestFullscreen?.()
      .catch(() => {
        // Browser may block fullscreen.
      });


    function handleSecurityEvent(
      violationType
    ) {

      if (
        submittingRef.current ||
        assessmentTerminated
      ) {

        return;
      }


      const now =
        Date.now();


      if (
        now -
          lastViolationTimeRef.current <
        1200
      ) {

        return;
      }


      if (
        violationInProgressRef.current
      ) {

        return;
      }


      lastViolationTimeRef.current =
        now;


      recordViolation(
        violationType
      );
    }


    function handleVisibilityChange() {

      if (
        document.visibilityState ===
        "hidden"
      ) {

        handleSecurityEvent(
          "TAB_SWITCH"
        );
      }
    }


    function handleWindowBlur() {

      handleSecurityEvent(
        "BROWSER_BLUR"
      );
    }


    function handleFullscreenChange() {

      if (
        !document.fullscreenElement &&
        !submittingRef.current
      ) {

        handleSecurityEvent(
          "FULLSCREEN_EXIT"
        );
      }
    }


    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );


    window.addEventListener(
      "blur",
      handleWindowBlur
    );


    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );


    return () => {

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );


      window.removeEventListener(
        "blur",
        handleWindowBlur
      );


      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );

    };

  }, [
    screen,
    assessmentTerminated,
  ]);


  // ==================================================
  // START ASSESSMENT
  // ==================================================

  function requestStart() {

    setError("");
    setSuccess("");


    if (!selectedSkill) {

      setError(
        "Please select a skill first."
      );

      return;
    }


    setShowStartModal(
      true
    );
  }


  async function startAssessment() {

    try {

      setStarting(true);
      setError("");
      setShowStartModal(false);


      // ----------------------------------------------
      // FULLSCREEN
      // ----------------------------------------------

      if (
        document.documentElement
          .requestFullscreen
      ) {

        try {

          await document.documentElement
            .requestFullscreen();

        } catch (fullscreenError) {

          console.warn(
            "Fullscreen request was blocked:",
            fullscreenError
          );
        }
      }


      // ----------------------------------------------
      // START API
      // ----------------------------------------------

      const response =
        await api.post(
          "/assessments/start",
          {
            skill_id:
              Number(selectedSkill),

            assessment_type:
              "TECHNICAL",

            question_count:
              QUESTION_COUNT,
          }
        );


      const data =
        response.data;


      const assessmentData =
        data.assessment;


      const questionData =
        data.questions || [];


      if (
        questionData.length !==
        QUESTION_COUNT
      ) {

        throw new Error(
          `Assessment did not contain exactly ${QUESTION_COUNT} questions.`
        );
      }


      const savedAnswers =
        data.answers || {};


      // ----------------------------------------------
      // SET STATE
      // ----------------------------------------------

      setAssessment(
        assessmentData
      );


      setQuestions(
        questionData
      );


      setAnswers(
        savedAnswers
      );


      setCurrentQuestion(
        0
      );


      setRemainingSeconds(
        calculateRemainingSeconds(
          assessmentData.expires_at
        )
      );


      setViolationCount(
        0
      );


      setAssessmentTerminated(
        false
      );


      setViolationMessage(
        ""
      );


      setResult(
        null
      );


      questionsRef.current =
        questionData;


      answersRef.current =
        savedAnswers;


      assessmentRef.current =
        assessmentData;


      setScreen(
        SCREENS.TEST
      );


    } catch (err) {

      console.error(
        "Start assessment error:",
        err
      );


      const responseData =
        err.response?.data;


      setError(
        responseData?.message ||
        err.message ||
        "Failed to start assessment."
      );


    } finally {

      setStarting(false);

    }
  }


  // ==================================================
  // TIMER HELPERS
  // ==================================================

  function calculateRemainingSeconds(
    expiresAt
  ) {

    if (!expiresAt) {

      return 0;
    }


    return Math.max(
      0,
      Math.floor(
        (
          new Date(
            expiresAt
          ).getTime() -
          Date.now()
        ) / 1000
      )
    );
  }


  function formatTime(
    totalSeconds
  ) {

    const safeSeconds =
      Math.max(
        0,
        Number(totalSeconds) || 0
      );


    const minutes =
      Math.floor(
        safeSeconds / 60
      );


    const seconds =
      safeSeconds % 60;


    return (
      String(minutes).padStart(2, "0") +
      ":" +
      String(seconds).padStart(2, "0")
    );
  }


  // ==================================================
  // SAVE ANSWER
  // ==================================================

  async function selectAnswer(
    questionId,
    answer
  ) {

    if (
      !assessment ||
      submittingRef.current ||
      assessmentTerminated
    ) {

      return;
    }


    const normalizedQuestionId =
      String(questionId);


    const normalizedAnswer =
      String(answer)
        .trim()
        .toUpperCase();


    if (
      !["A", "B", "C", "D"].includes(
        normalizedAnswer
      )
    ) {

      return;
    }


    const updatedAnswers = {
      ...answersRef.current,
      [normalizedQuestionId]:
        normalizedAnswer,
    };


    setAnswers(
      updatedAnswers
    );


    answersRef.current =
      updatedAnswers;


    try {

      setSavingAnswer(true);


      await api.put(
        `/assessments/${assessment.id}/answers`,
        {
          question_id:
            Number(
              normalizedQuestionId
            ),

          answer:
            normalizedAnswer,
        }
      );


    } catch (err) {

      console.error(
        "Save answer error:",
        err
      );


      if (
        err.response?.status ===
          409 &&
        String(
          err.response?.data?.message ||
          ""
        )
          .toLowerCase()
          .includes("expired")
      ) {

        await handleTimeExpired();

        return;
      }


      setError(
        err.response?.data?.message ||
        "Failed to save your answer."
      );


    } finally {

      setSavingAnswer(false);

    }
  }


  // ==================================================
  // NAVIGATION
  // ==================================================

  function goToQuestion(
    index
  ) {

    if (
      index < 0 ||
      index >= questions.length
    ) {

      return;
    }


    setCurrentQuestion(
      index
    );
  }


  function nextQuestion() {

    if (
      currentQuestion <
      questions.length - 1
    ) {

      setCurrentQuestion(
        currentQuestion + 1
      );


      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

    } else {

      requestSubmit();
    }
  }


  function previousQuestion() {

    if (
      currentQuestion > 0
    ) {

      setCurrentQuestion(
        currentQuestion - 1
      );


      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }


  // ==================================================
  // RECORD VIOLATION
  // ==================================================

  async function recordViolation(
    violationType
  ) {

    if (
      !assessment ||
      violationInProgressRef.current ||
      submittingRef.current
    ) {

      return;
    }


    try {

      violationInProgressRef.current =
        true;


      const response =
        await api.post(
          `/assessments/${assessment.id}/violations`,
          {
            violation_type:
              violationType,
          }
        );


      const data =
        response.data;


      const count =
        Number(
          data.violation_count ||
          0
        );


      setViolationCount(
        count
      );


      setViolationMessage(
        data.message ||
        "Assessment violation recorded."
      );


      if (
        data.status ===
        "VIOLATION"
      ) {

        setAssessmentTerminated(
          true
        );


        setShowViolationModal(
          true
        );


        submittingRef.current =
          true;


        setScreen(
          SCREENS.VIOLATION
        );


        exitFullscreen();

        return;
      }


      setShowViolationModal(
        true
      );


    } catch (err) {

      console.error(
        "Record violation error:",
        err
      );


      setError(
        err.response?.data?.message ||
        "Failed to record assessment violation."
      );


    } finally {

      violationInProgressRef.current =
        false;
    }
  }


  // ==================================================
  // EXIT FULLSCREEN
  // ==================================================

  function exitFullscreen() {

    if (
      document.fullscreenElement &&
      document.exitFullscreen
    ) {

      document
        .exitFullscreen()
        .catch(() => {});
    }
  }


  // ==================================================
  // TIME EXPIRED
  // ==================================================

  async function handleTimeExpired() {

  if (
    submittingRef.current ||
    !assessment
  ) {
    return;
  }

  submittingRef.current =
    true;

  setSubmitting(
    true
  );

  setRemainingSeconds(
    0
  );

  setError("");

  try {

    console.log(
      `Assessment ${assessment.id} expired. Automatically submitting saved answers...`
    );

    const response =
      await api.post(
        `/assessments/${assessment.id}/submit`
      );

    const resultData =
      response.data?.result ||
      response.data;

    console.log(
      "Automatic expiry submission successful:",
      resultData
    );

    setResult(
      resultData
    );

    exitFullscreen();

    setScreen(
      SCREENS.EXPIRED
    );

    if (
      expiryReturnTimerRef.current
    ) {

      clearTimeout(
        expiryReturnTimerRef.current
      );
    }

    expiryReturnTimerRef.current =
      setTimeout(
        () => {

          expiryReturnTimerRef.current =
            null;

          returnHome();

        },
        5000
      );

    await refreshHistory();

  } catch (err) {

    console.error(
      "Automatic expiry submission error:",
      err
    );

    exitFullscreen();

    setError(
      err.response?.data?.message ||
      "Assessment time expired, but automatic submission failed."
    );

    setScreen(
      SCREENS.EXPIRED
    );

    if (
      expiryReturnTimerRef.current
    ) {

      clearTimeout(
        expiryReturnTimerRef.current
      );
    }

    expiryReturnTimerRef.current =
      setTimeout(
        () => {

          expiryReturnTimerRef.current =
            null;

          returnHome();

        },
        5000
      );

  } finally {

    submittingRef.current =
      false;

    setSubmitting(
      false
    );
  }
}


  // ==================================================
  // SUBMIT
  // ==================================================

  function requestSubmit() {

    setShowSubmitModal(
      true
    );
  }


  async function submitAssessment() {

    if (
      !assessment ||
      submittingRef.current
    ) {

      return;
    }


    try {

      submittingRef.current =
        true;


      setSubmitting(
        true
      );


      setShowSubmitModal(
        false
      );


      const response =
        await api.post(
          `/assessments/${assessment.id}/submit`
        );


      const resultData =
        response.data?.result ||
        response.data;


      setResult(
        resultData
      );


      setScreen(
        SCREENS.RESULT
      );


      exitFullscreen();


      await refreshHistory();


    } catch (err) {

      console.error(
        "Submit assessment error:",
        err
      );


      if (
        err.response?.status ===
        409
      ) {

        const message =
          err.response?.data?.message ||
          "Assessment can no longer be submitted.";


        setError(
          message
        );


        if (
          message
            .toLowerCase()
            .includes("expired")
        ) {

          exitFullscreen();


          setScreen(
            SCREENS.EXPIRED
          );


          if (
            expiryReturnTimerRef.current
          ) {

            clearTimeout(
              expiryReturnTimerRef.current
            );
          }


          expiryReturnTimerRef.current =
            setTimeout(
              () => {

                expiryReturnTimerRef.current =
                  null;

                returnHome();

              },
              5000
            );
        }

      } else {

        setError(
          err.response?.data?.message ||
          "Failed to submit assessment."
        );
      }


    } finally {

      submittingRef.current =
        false;


      setSubmitting(
        false
      );
    }
  }


  // ==================================================
  // HISTORY
  // ==================================================

  async function refreshHistory() {

    try {

      const response =
        await api.get(
          "/assessments"
        );


      setHistory(
        response.data?.assessments ||
        []
      );


    } catch (err) {

      console.error(
        "Refresh assessment history error:",
        err
      );
    }
  }


  // ==================================================
  // RETURN HOME
  // ==================================================

  function returnHome() {

    exitFullscreen();


    if (
      expiryReturnTimerRef.current
    ) {

      clearTimeout(
        expiryReturnTimerRef.current
      );


      expiryReturnTimerRef.current =
        null;
    }


    setScreen(
      SCREENS.HOME
    );


    setAssessment(
      null
    );


    setQuestions(
      []
    );


    setAnswers(
      {}
    );


    setCurrentQuestion(
      0
    );


    setRemainingSeconds(
      0
    );


    setResult(
      null
    );


    setViolationCount(
      0
    );


    setViolationMessage(
      ""
    );


    setAssessmentTerminated(
      false
    );


    setShowViolationModal(
      false
    );


    setShowSubmitModal(
      false
    );


    setError(
      ""
    );


    setSuccess(
      ""
    );


    submittingRef.current =
      false;


    answersRef.current =
      {};


    questionsRef.current =
      [];


    assessmentRef.current =
      null;


    refreshHistory();
  }


  // ==================================================
  // DERIVED VALUES
  // ==================================================

  const answeredCount =
    questions.filter(
      (question) =>
        Boolean(
          answers[
            String(question.id)
          ]
        )
    ).length;


  const unansweredCount =
    Math.max(
      0,
      questions.length -
      answeredCount
    );


  const currentQuestionData =
    questions[currentQuestion] ||
    null;


  const currentAnswer =
    currentQuestionData
      ? answers[
          String(
            currentQuestionData.id
          )
        ] || ""
      : "";


  const progressPercent =
    questions.length > 0
      ? Math.round(
          (
            (currentQuestion + 1) /
            questions.length
          ) * 100
        )
      : 0;


  // ==================================================
  // RETURN EVERYTHING NEEDED BY COMPONENTS
  // ==================================================

  return {

    // Screen
    screen,
    setScreen,

    // Skills
    skills,
    selectedSkill,
    setSelectedSkill,

    // Assessment
    assessment,
    questions,
    answers,

    // Question
    currentQuestion,
    currentQuestionData,
    currentAnswer,

    // Timer
    remainingSeconds,
    formatTime,

    // Progress
    answeredCount,
    unansweredCount,
    progressPercent,

    // History
    history,

    // Loading states
    loading,
    starting,
    savingAnswer,
    submitting,

    // Result
    result,

    // Messages
    error,
    setError,
    success,
    setSuccess,

    // Modals
    showStartModal,
    setShowStartModal,

    showSubmitModal,
    setShowSubmitModal,

    showViolationModal,
    setShowViolationModal,

    // Violations
    violationCount,
    violationMessage,
    assessmentTerminated,

    // Actions
    requestStart,
    startAssessment,

    selectAnswer,

    goToQuestion,
    nextQuestion,
    previousQuestion,

    requestSubmit,
    submitAssessment,

    handleTimeExpired,

    refreshHistory,

    returnHome,

    exitFullscreen,

    // Constants
    QUESTION_COUNT,
    ASSESSMENT_DURATION_MINUTES,
    MAX_VIOLATIONS,
  };
}