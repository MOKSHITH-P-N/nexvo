import React, { useEffect, useState } from "react";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import api from "../../services/api";
import "./FreelancerProjectDetails.css";

function FreelancerProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/projects/${id}`
        );

        if (response.data?.success) {
          setProject(response.data.project);
        } else {
          setError(
            "Unable to load this project."
          );
        }
      } catch (err) {
        console.error(
          "Load project details error:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load this project."
        );
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id]);

  const formatBudget = (min, max) => {
    const minimum = Number(min);
    const maximum = Number(max);

    if (
      Number.isNaN(minimum) &&
      Number.isNaN(maximum)
    ) {
      return "Budget not specified";
    }

    if (
      !Number.isNaN(minimum) &&
      !Number.isNaN(maximum)
    ) {
      return `₹${minimum.toLocaleString(
        "en-IN"
      )} - ₹${maximum.toLocaleString(
        "en-IN"
      )}`;
    }

    if (!Number.isNaN(minimum)) {
      return `From ₹${minimum.toLocaleString(
        "en-IN"
      )}`;
    }

    return `Up to ₹${maximum.toLocaleString(
      "en-IN"
    )}`;
  };

  const formatDate = (value) => {
    if (!value) {
      return "Not specified";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not specified";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const handleApply = async () => {
    if (!project) {
      return;
    }

    try {
      setApplying(true);
      setError("");
      setSuccess("");

      const response = await api.post(
        `/applications/${project.id}`
      );

      if (response.data?.success) {
        setSuccess(
          "Application submitted successfully."
        );

        setProject((current) => ({
          ...current,
          application_id:
            response.data.application_id ||
            current.application_id,
          application_status: "APPLIED",
        }));
      } else {
        setError(
          response.data?.message ||
            "Unable to apply."
        );
      }
    } catch (err) {
      console.error(
        "Apply project error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to apply to this project."
      );
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return React.createElement(
      "div",
      {
        className:
          "freelancer-project-details-page",
      },
      React.createElement(
        "div",
        {
          className:
            "project-details-loading",
        },
        "Loading project..."
      )
    );
  }

  if (error && !project) {
    return React.createElement(
      "div",
      {
        className:
          "freelancer-project-details-page",
      },

      React.createElement(
        "button",
        {
          className:
            "project-details-back",
          onClick: () =>
            navigate(
              "/freelancer/projects"
            ),
        },
        "← Back to projects"
      ),

      React.createElement(
        "div",
        {
          className:
            "project-details-error",
        },
        error
      )
    );
  }

  if (!project) {
    return null;
  }

  const skills = Array.isArray(
    project.skills
  )
    ? project.skills
    : [];

  const alreadyApplied =
    project.application_status ===
      "APPLIED" ||
    project.application_status ===
      "SHORTLISTED" ||
    project.application_status ===
      "HIRED";

  return React.createElement(
    "div",
    {
      className:
        "freelancer-project-details-page",
    },

    React.createElement(
      "div",
      {
        className:
          "project-details-container",
      },

      React.createElement(
        "button",
        {
          className:
            "project-details-back",
          onClick: () =>
            navigate(
              "/freelancer/projects"
            ),
        },
        "← Back to projects"
      ),

      React.createElement(
        "div",
        {
          className:
            "project-details-layout",
        },

        React.createElement(
          "main",
          {
            className:
              "project-details-main",
          },

          React.createElement(
            "div",
            {
              className:
                "project-details-status",
            },
            project.status === "OPEN"
              ? "OPEN FOR APPLICATIONS"
              : project.status
          ),

          React.createElement(
            "h1",
            null,
            project.title
          ),

          React.createElement(
            "p",
            {
              className:
                "project-details-intro",
            },
            "Review the complete project requirements before deciding whether to apply."
          ),

          React.createElement(
            "section",
            {
              className:
                "project-details-section",
            },

            React.createElement(
              "span",
              {
                className:
                  "project-details-eyebrow",
              },
              "PROJECT DESCRIPTION"
            ),

            React.createElement(
              "h2",
              null,
              "What the client needs"
            ),

            React.createElement(
              "p",
              {
                className:
                  "project-full-description",
              },
              project.description ||
                "No description provided."
            )
          ),

          React.createElement(
            "section",
            {
              className:
                "project-details-section",
            },

            React.createElement(
              "span",
              {
                className:
                  "project-details-eyebrow",
              },
              "REQUIRED SKILLS"
            ),

            React.createElement(
              "h2",
              null,
              "Skills for this project"
            ),

            React.createElement(
              "div",
              {
                className:
                  "project-details-skills",
              },

              skills.length > 0
                ? skills.map((skill) =>
                    React.createElement(
                      "span",
                      {
                        key: skill.id,
                      },
                      skill.name
                    )
                  )
                : React.createElement(
                    "p",
                    null,
                    "No specific skills listed."
                  )
            )
          ),

          project.complexity
            ? React.createElement(
                "section",
                {
                  className:
                    "project-details-section project-complexity-section",
                },

                React.createElement(
                  "span",
                  {
                    className:
                      "project-details-eyebrow",
                  },
                  "PROJECT COMPLEXITY"
                ),

                React.createElement(
                  "div",
                  {
                    className:
                      "project-complexity-row",
                  },

                  React.createElement(
                    "strong",
                    null,
                    `${project.complexity}/5`
                  ),

                  React.createElement(
                    "span",
                    null,
                    project.complexity_reason ||
                      "Complexity estimated from project requirements."
                  )
                )
              )
            : null
        ),

        React.createElement(
          "aside",
          {
            className:
              "project-details-sidebar",
          },

          React.createElement(
            "div",
            {
              className:
                "project-apply-card",
            },

            React.createElement(
              "span",
              {
                className:
                  "project-details-eyebrow",
              },
              "PROJECT BUDGET"
            ),

            React.createElement(
              "h2",
              null,
              formatBudget(
                project.budget_min,
                project.budget_max
              )
            ),

            React.createElement(
              "div",
              {
                className:
                  "project-info-list",
              },

              React.createElement(
                "div",
                null,

                React.createElement(
                  "span",
                  null,
                  "Applications open"
                ),

                React.createElement(
                  "strong",
                  null,
                  formatDate(
                    project.application_open_at
                  )
                )
              ),

              React.createElement(
                "div",
                null,

                React.createElement(
                  "span",
                  null,
                  "Applications close"
                ),

                React.createElement(
                  "strong",
                  null,
                  formatDate(
                    project.application_close_at
                  )
                )
              ),

              React.createElement(
                "div",
                null,

                React.createElement(
                  "span",
                  null,
                  "Project deadline"
                ),

                React.createElement(
                  "strong",
                  null,
                  formatDate(
                    project.deadline
                  )
                )
              )
            ),

            success
              ? React.createElement(
                  "div",
                  {
                    className:
                      "project-details-success",
                  },
                  success
                )
              : null,

            error
              ? React.createElement(
                  "div",
                  {
                    className:
                      "project-details-error-inline",
                  },
                  error
                )
              : null,

            alreadyApplied
              ? React.createElement(
                  "div",
                  {
                    className:
                      "project-already-applied",
                  },
                  project.application_status ===
                  "SHORTLISTED"
                    ? "You are shortlisted for this project."
                    : project.application_status ===
                      "HIRED"
                    ? "You have been hired for this project."
                    : "You have already applied to this project."
                )
              : React.createElement(
                  "button",
                  {
                    className:
                      "project-apply-button",
                    onClick: handleApply,
                    disabled:
                      applying ||
                      project.status !==
                        "OPEN",
                  },
                  applying
                    ? "Submitting..."
                    : "Apply to this project"
                ),

            React.createElement(
              "p",
              {
                className:
                  "project-apply-note",
              },
              "Your application will be evaluated using your NEXVO profile and project-specific matching."
            )
          )
        )
      )
    )
  );
}

export default FreelancerProjectDetails;