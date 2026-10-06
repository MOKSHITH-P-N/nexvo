import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./CreateProject.css";

function CreateProject() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");

  const [applicationOpenAt, setApplicationOpenAt] = useState("");
  const [applicationCloseAt, setApplicationCloseAt] = useState("");
  const [deadline, setDeadline] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [createdProject, setCreatedProject] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!title.trim()) {
      setError("Project title is required.");
      return;
    }

    if (!description.trim()) {
      setError("Project description is required.");
      return;
    }

    if (
      budgetMin !== "" &&
      budgetMax !== "" &&
      Number(budgetMin) > Number(budgetMax)
    ) {
      setError("Minimum budget cannot be greater than maximum budget.");
      return;
    }

    if (
      applicationOpenAt &&
      applicationCloseAt &&
      new Date(applicationOpenAt) >= new Date(applicationCloseAt)
    ) {
      setError("Application close time must be after open time.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/projects", {
        title: title.trim(),
        description: description.trim(),
        budget_min:
          budgetMin === "" ? null : Number(budgetMin),
        budget_max:
          budgetMax === "" ? null : Number(budgetMax),
        application_open_at:
          applicationOpenAt || null,
        application_close_at:
          applicationCloseAt || null,
        deadline:
          deadline || null,
      });

      console.log(
        "CREATE PROJECT RESPONSE:",
        response.data
      );

      if (
        !response.data?.success ||
        !response.data?.project
      ) {
        throw new Error(
          response.data?.message ||
            "Project creation failed."
        );
      }

      /*
       * IMPORTANT:
       *
       * Do NOT navigate here.
       *
       * The backend has already created the project
       * and returned the AI analysis.
       *
       * Keep the user on this page and show the
       * analysis window.
       */
      setCreatedProject(
        response.data.project
      );
    } catch (error) {
      console.error(
        "CREATE PROJECT ERROR:",
        error
      );

      /*
       * If the token is genuinely invalid,
       * send the user to login.
       */
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login", {
          replace: true,
        });

        return;
      }

      setError(
        error.response?.data?.message ||
          error.message ||
          "Unable to create project. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAnalysis = () => {
    setCreatedProject(null);
  };

  const handleContinue = () => {
    navigate("/client");
  };

  return React.createElement(
    "main",
    {
      className: "create-project-page",
    },

    /*
     * =====================================================
     * HEADER
     * =====================================================
     */

    React.createElement(
      "header",
      {
        className: "create-project-header",
      },

      React.createElement(
        "button",
        {
          type: "button",
          className: "back-button",
          onClick: () =>
            navigate("/client"),
        },
        "← Back to Dashboard"
      )
    ),

    /*
     * =====================================================
     * MAIN CONTENT
     * =====================================================
     */

    React.createElement(
      "section",
      {
        className: "create-project-main",
      },

      /*
       * ---------------------------------------------------
       * INTRO
       * ---------------------------------------------------
       */

      React.createElement(
        "div",
        {
          className: "create-project-intro",
        },

        React.createElement(
          "span",
          {
            className:
              "create-project-eyebrow",
          },
          "CLIENT WORKSPACE"
        ),

        React.createElement(
          "h1",
          null,
          "Create a new project"
        ),

        React.createElement(
          "p",
          null,
          "Tell us what you want to build. NEXVO will analyze your project and identify the skills required to bring it to life."
        )
      ),

      /*
       * ---------------------------------------------------
       * ERROR
       * ---------------------------------------------------
       */

      error &&
        React.createElement(
          "div",
          {
            className:
              "create-project-error",
            role: "alert",
          },
          error
        ),

      /*
       * ===================================================
       * FORM
       * ===================================================
       */

      React.createElement(
        "form",
        {
          className:
            "create-project-form",
          onSubmit: handleSubmit,
        },

        /*
         * -------------------------------------------------
         * PROJECT DETAILS
         * -------------------------------------------------
         */

        React.createElement(
          "div",
          {
            className: "form-section",
          },

          React.createElement(
            "div",
            {
              className:
                "form-section-heading",
            },

            React.createElement(
              "h2",
              null,
              "Project details"
            ),

            React.createElement(
              "p",
              null,
              "Give freelancers enough context to understand the work."
            )
          ),

          /*
           * PROJECT TITLE
           */

          React.createElement(
            "div",
            {
              className: "form-field",
            },

            React.createElement(
              "label",
              {
                htmlFor:
                  "project-title",
              },
              "Project title"
            ),

            React.createElement(
              "input",
              {
                id: "project-title",
                className:
                  "project-input",
                type: "text",
                value: title,
                onChange: (event) =>
                  setTitle(
                    event.target.value
                  ),
                placeholder:
                  "e.g. Build an e-commerce website",
                required: true,
              }
            )
          ),

          /*
           * PROJECT DESCRIPTION
           */

          React.createElement(
            "div",
            {
              className: "form-field",
            },

            React.createElement(
              "label",
              {
                htmlFor:
                  "project-description",
              },
              "Project description"
            ),

            React.createElement(
              "textarea",
              {
                id:
                  "project-description",
                className:
                  "project-textarea",
                value: description,
                onChange: (event) =>
                  setDescription(
                    event.target.value
                  ),
                placeholder:
                  "Describe what you want to build, the main features, users, technical requirements, and expected outcome...",
                rows: 7,
                required: true,
              }
            )
          )
        ),

        /*
         * -------------------------------------------------
         * BUDGET
         * -------------------------------------------------
         */

        React.createElement(
          "div",
          {
            className: "form-section",
          },

          React.createElement(
            "div",
            {
              className:
                "form-section-heading",
            },

            React.createElement(
              "h2",
              null,
              "Budget"
            ),

            React.createElement(
              "p",
              null,
              "Set the expected budget range for this project."
            )
          ),

          React.createElement(
            "div",
            {
              className:
                "form-grid two-columns",
            },

            /*
             * MINIMUM
             */

            React.createElement(
              "div",
              {
                className: "form-field",
              },

              React.createElement(
                "label",
                {
                  htmlFor:
                    "budget-min",
                },
                "Minimum budget"
              ),

              React.createElement(
                "input",
                {
                  id: "budget-min",
                  className:
                    "project-input",
                  type: "number",
                  min: "0",
                  value: budgetMin,
                  onChange: (event) =>
                    setBudgetMin(
                      event.target.value
                    ),
                  placeholder:
                    "₹ 10,000",
                }
              )
            ),

            /*
             * MAXIMUM
             */

            React.createElement(
              "div",
              {
                className: "form-field",
              },

              React.createElement(
                "label",
                {
                  htmlFor:
                    "budget-max",
                },
                "Maximum budget"
              ),

              React.createElement(
                "input",
                {
                  id: "budget-max",
                  className:
                    "project-input",
                  type: "number",
                  min: "0",
                  value: budgetMax,
                  onChange: (event) =>
                    setBudgetMax(
                      event.target.value
                    ),
                  placeholder:
                    "₹ 50,000",
                }
              )
            )
          )
        ),

        /*
         * -------------------------------------------------
         * TIMELINE
         * -------------------------------------------------
         */

        React.createElement(
          "div",
          {
            className: "form-section",
          },

          React.createElement(
            "div",
            {
              className:
                "form-section-heading",
            },

            React.createElement(
              "h2",
              null,
              "Timeline"
            ),

            React.createElement(
              "p",
              null,
              "Tell freelancers when applications open and when the work needs to be completed."
            )
          ),

          React.createElement(
            "div",
            {
              className:
                "form-grid three-columns",
            },

            /*
             * APPLICATION OPEN
             */

            React.createElement(
              "div",
              {
                className: "form-field",
              },

              React.createElement(
                "label",
                {
                  htmlFor:
                    "application-open",
                },
                "Applications open"
              ),

              React.createElement(
                "input",
                {
                  id:
                    "application-open",
                  className:
                    "project-input",
                  type:
                    "datetime-local",
                  value:
                    applicationOpenAt,
                  onChange: (event) =>
                    setApplicationOpenAt(
                      event.target.value
                    ),
                }
              )
            ),

            /*
             * APPLICATION CLOSE
             */

            React.createElement(
              "div",
              {
                className: "form-field",
              },

              React.createElement(
                "label",
                {
                  htmlFor:
                    "application-close",
                },
                "Applications close"
              ),

              React.createElement(
                "input",
                {
                  id:
                    "application-close",
                  className:
                    "project-input",
                  type:
                    "datetime-local",
                  value:
                    applicationCloseAt,
                  onChange: (event) =>
                    setApplicationCloseAt(
                      event.target.value
                    ),
                }
              )
            ),

            /*
             * DEADLINE
             */

            React.createElement(
              "div",
              {
                className: "form-field",
              },

              React.createElement(
                "label",
                {
                  htmlFor:
                    "deadline",
                },
                "Project deadline"
              ),

              React.createElement(
                "input",
                {
                  id: "deadline",
                  className:
                    "project-input",
                  type:
                    "datetime-local",
                  value: deadline,
                  onChange: (event) =>
                    setDeadline(
                      event.target.value
                    ),
                }
              )
            )
          )
        ),

        /*
         * -------------------------------------------------
         * AI NOTE
         * -------------------------------------------------
         */

        React.createElement(
          "div",
          {
            className: "ai-note",
          },

          React.createElement(
            "div",
            {
              className:
                "ai-note-icon",
            },
            "✦"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "strong",
              null,
              "NEXVO AI analysis"
            ),

            React.createElement(
              "p",
              null,
              "After you create the project, NEXVO will analyze the description, identify the relevant technical skills, assign their importance, and estimate project complexity."
            )
          )
        ),

        /*
         * -------------------------------------------------
         * ACTION BUTTONS
         * -------------------------------------------------
         */

        React.createElement(
          "div",
          {
            className:
              "create-project-actions",
          },

          React.createElement(
            "button",
            {
              type: "button",
              className:
                "cancel-button",
              onClick: () =>
                navigate("/client"),
              disabled: loading,
            },
            "Cancel"
          ),

          React.createElement(
            "button",
            {
              type: "submit",
              className:
                "create-project-button",
              disabled: loading,
            },
            loading
              ? "Analyzing project..."
              : "Create project"
          )
        )
      )
    ),

    /*
     * =====================================================
     * AI ANALYSIS WINDOW
     * =====================================================
     */

    createdProject &&
      React.createElement(
        "div",
        {
          className:
            "project-analysis-overlay",
        },

        React.createElement(
          "div",
          {
            className:
              "project-analysis-modal",

            role: "dialog",

            "aria-modal": "true",

            "aria-labelledby":
              "project-analysis-title",
          },

          /*
           * ------------------------------------------------
           * MODAL HEADER
           * ------------------------------------------------
           */

          React.createElement(
            "div",
            {
              className:
                "project-analysis-header",
            },

            React.createElement(
              "div",
              null,

              React.createElement(
                "span",
                {
                  className:
                    "project-analysis-eyebrow",
                },
                "NEXVO AI ANALYSIS"
              ),

              React.createElement(
                "h2",
                {
                  id:
                    "project-analysis-title",
                },
                "Your project is ready"
              ),

              React.createElement(
                "p",
                null,
                "NEXVO analyzed your project and identified the skills needed to complete it."
              )
            ),

            React.createElement(
              "button",
              {
                type: "button",

                className:
                  "project-analysis-close",

                onClick:
                  handleCloseAnalysis,

                "aria-label":
                  "Close project analysis",
              },
              "×"
            )
          ),

          /*
           * ------------------------------------------------
           * PROJECT NAME
           * ------------------------------------------------
           */

          React.createElement(
            "div",
            {
              className:
                "project-analysis-project-name",
            },

            React.createElement(
              "span",
              null,
              "PROJECT"
            ),

            React.createElement(
              "strong",
              null,
              createdProject.title
            )
          ),

          /*
           * ------------------------------------------------
           * COMPLEXITY
           * ------------------------------------------------
           */

          React.createElement(
            "div",
            {
              className:
                "project-analysis-complexity",
            },

            React.createElement(
              "div",
              {
                className:
                  "project-analysis-complexity-number",
              },
              createdProject.complexity
            ),

            React.createElement(
              "div",
              null,

              React.createElement(
                "span",
                {
                  className:
                    "project-analysis-label",
                },
                "Technical complexity"
              ),

              React.createElement(
                "strong",
                null,
                `${createdProject.complexity} / 5`
              ),

              React.createElement(
                "p",
                null,
                createdProject.complexity_reason
              )
            )
          ),

          /*
           * ------------------------------------------------
           * REQUIRED SKILLS
           * ------------------------------------------------
           */

          React.createElement(
            "div",
            {
              className:
                "project-analysis-section",
            },

            React.createElement(
              "h3",
              null,
              "Required skills"
            ),

            React.createElement(
              "p",
              {
                className:
                  "project-analysis-section-description",
              },
              "These skills will be used later when matching your project with freelancers."
            ),

            React.createElement(
              "div",
              {
                className:
                  "project-analysis-skills",
              },

              Array.isArray(
                createdProject.skills
              ) &&
                createdProject.skills.map(
                  (skill, index) =>
                    React.createElement(
                      "div",
                      {
                        className:
                          "project-analysis-skill",

                        key:
                          `${skill.name}-${index}`,
                      },

                      React.createElement(
                        "span",
                        {
                          className:
                            "project-analysis-skill-name",
                        },
                        skill.name
                      ),

                      React.createElement(
                        "span",
                        {
                          className:
                            "project-analysis-weight",
                        },
                        `${Math.round(
                          Number(
                            skill.weight || 0
                          ) * 100
                        )}%`
                      )
                    )
                )
            )
          ),

          /*
           * ------------------------------------------------
           * FOOTER
           * ------------------------------------------------
           */

          React.createElement(
            "div",
            {
              className:
                "project-analysis-footer",
            },

            React.createElement(
              "span",
              null,
              "Project saved successfully"
            ),

            React.createElement(
              "button",
              {
                type: "button",

                className:
                  "project-analysis-continue",

                onClick:
                  handleContinue,
              },
              "Continue to Dashboard"
            )
          )
        )
      )
  );
}

export default CreateProject;