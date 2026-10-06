import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api.js";
import "./ProjectCandidates.css";

function ProjectCandidates() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState("");

  const loadCandidates = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        `/applications/project/${id}`
      );

      const data = response.data;

      setProject(data.project || null);

      if (Array.isArray(data.applications)) {
        setCandidates(data.applications);
      } else if (Array.isArray(data.candidates)) {
        setCandidates(data.candidates);
      } else {
        setCandidates([]);
      }
    } catch (err) {
      console.error("Failed to load candidates:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load project candidates."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidates();
  }, [id]);

  const updateCandidateStatus = async (
    applicationId,
    status
  ) => {
    try {
      setActionLoading(applicationId);
      setError("");

      await api.patch(
        `/applications/${applicationId}/status`,
        {
          status: status,
        }
      );

      await loadCandidates();
    } catch (err) {
      console.error(
        "Failed to update candidate status:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to update candidate status."
      );
    } finally {
      setActionLoading(null);
    }
  };

  const getProfile = (candidate) => {
    return (
      candidate.freelancer_profile ||
      candidate.freelancer ||
      candidate.profile ||
      {}
    );
  };

  const getCandidateName = (candidate) => {
    const profile = getProfile(candidate);

    return (
      profile.name ||
      profile.full_name ||
      profile.fullName ||
      candidate.freelancer_name ||
      candidate.name ||
      "Freelancer"
    );
  };

  const getCandidateEmail = (candidate) => {
    const profile = getProfile(candidate);

    return (
      profile.email ||
      candidate.freelancer_email ||
      candidate.email ||
      ""
    );
  };

  const getCandidateBio = (candidate) => {
    const profile = getProfile(candidate);

    return profile.bio || profile.about || "";
  };

  const getCandidateExperience = (candidate) => {
    const profile = getProfile(candidate);

    return (
      profile.years_of_experience ??
      profile.experience_years ??
      profile.yearsExperience ??
      null
    );
  };

  const getCandidateSkills = (candidate) => {
    const profile = getProfile(candidate);

    if (Array.isArray(profile.skills)) {
      return profile.skills;
    }

    if (Array.isArray(candidate.skills)) {
      return candidate.skills;
    }

    return [];
  };

  const formatSkill = (skill) => {
    if (typeof skill === "string") {
      return skill;
    }

    return (
      skill?.name ||
      skill?.skill_name ||
      skill?.title ||
      ""
    );
  };

  const formatDate = (date) => {
    if (!date) {
      return "Not available";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const applicationsClosed =
    project?.application_close_at
      ? new Date() >=
        new Date(project.application_close_at)
      : false;

  const shortlistedCandidate = candidates.find(
    (candidate) =>
      candidate.status === "SHORTLISTED"
  );

  const hiredCandidate = candidates.find(
    (candidate) =>
      candidate.status === "HIRED"
  );

  const appliedCount = candidates.filter(
    (candidate) =>
      candidate.status === "APPLIED"
  ).length;

  const shortlistedCount = candidates.filter(
    (candidate) =>
      candidate.status === "SHORTLISTED"
  ).length;

  const hiredCount = candidates.filter(
    (candidate) =>
      candidate.status === "HIRED"
  ).length;

  /*
   * LOADING SCREEN
   */
  if (loading) {
    return React.createElement(
      "div",
      {
        className: "project-candidates-page",
      },

      React.createElement(
        "aside",
        {
          className: "client-sidebar",
        },

        React.createElement(
          "div",
          {
            className: "sidebar-brand",
          },

          React.createElement(
            "div",
            {
              className: "brand-mark small",
            },
            "N"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "div",
              {
                className: "brand-name",
              },
              "NEXVO"
            ),

            React.createElement(
              "div",
              {
                className: "brand-subtitle",
              },
              "CLIENT"
            )
          )
        ),

        React.createElement(
          "nav",
          {
            className: "sidebar-nav",
          },

          React.createElement(
            "button",
            {
              className: "nav-item",
              onClick: () =>
                navigate("/client"),
            },
            "Dashboard"
          ),

          React.createElement(
            "button",
            {
              className: "nav-item active",
              onClick: () =>
                navigate("/client/projects"),
            },
            "My Projects"
          )
        )
      ),

      React.createElement(
        "main",
        {
          className:
            "project-candidates-main",
        },

        React.createElement(
          "div",
          {
            className:
              "project-candidates-loading",
          },

          React.createElement(
            "div",
            {
              className: "loading-dot",
            }
          ),

          React.createElement(
            "p",
            null,
            "Loading candidates..."
          )
        )
      )
    );
  }

  /*
   * ERROR SCREEN
   */
  if (error && !project) {
    return React.createElement(
      "div",
      {
        className: "project-candidates-page",
      },

      React.createElement(
        "aside",
        {
          className: "client-sidebar",
        },

        React.createElement(
          "div",
          {
            className: "sidebar-brand",
          },

          React.createElement(
            "div",
            {
              className: "brand-mark small",
            },
            "N"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "div",
              {
                className: "brand-name",
              },
              "NEXVO"
            ),

            React.createElement(
              "div",
              {
                className:
                  "brand-subtitle",
              },
              "CLIENT"
            )
          )
        ),

        React.createElement(
          "nav",
          {
            className: "sidebar-nav",
          },

          React.createElement(
            "button",
            {
              className: "nav-item",
              onClick: () =>
                navigate("/client"),
            },
            "Dashboard"
          ),

          React.createElement(
            "button",
            {
              className: "nav-item active",
              onClick: () =>
                navigate("/client/projects"),
            },
            "My Projects"
          )
        )
      ),

      React.createElement(
        "main",
        {
          className:
            "project-candidates-main",
        },

        React.createElement(
          "div",
          {
            className:
              "project-candidates-error",
          },

          React.createElement(
            "h2",
            null,
            "Unable to load candidates"
          ),

          React.createElement(
            "p",
            null,
            error
          ),

          React.createElement(
            "button",
            {
              className:
                "candidate-primary-button",
              onClick: loadCandidates,
            },
            "Try Again"
          )
        )
      )
    );
  }

  /*
   * CANDIDATE CARDS
   */
  const candidateCards = candidates.map(
    (candidate, index) => {
      const profile =
        getProfile(candidate);

      const name =
        getCandidateName(candidate);

      const email =
        getCandidateEmail(candidate);

      const bio =
        getCandidateBio(candidate);

      const experience =
        getCandidateExperience(candidate);

      const skills =
        getCandidateSkills(candidate);

      const canShortlist =
        candidate.status === "APPLIED" &&
        !shortlistedCandidate;

      const canHire =
        candidate.status === "SHORTLISTED";

      const skillElements = skills
        .slice(0, 6)
        .map((skill, skillIndex) => {
          const skillName =
            formatSkill(skill);

          if (!skillName) {
            return null;
          }

          return React.createElement(
            "span",
            {
              key:
                candidate.id +
                "-" +
                skillIndex,
            },
            skillName
          );
        });

      const actionElements = [];

      if (canShortlist) {
        actionElements.push(
          React.createElement(
            "button",
            {
              key: "shortlist",
              className:
                "candidate-primary-button",
              disabled:
                actionLoading ===
                candidate.id,
              onClick: () =>
                updateCandidateStatus(
                  candidate.id,
                  "SHORTLISTED"
                ),
            },
            actionLoading === candidate.id
              ? "Shortlisting..."
              : "Shortlist"
          )
        );
      }

      if (
        candidate.status === "APPLIED" &&
        shortlistedCandidate
      ) {
        actionElements.push(
          React.createElement(
            "span",
            {
              key: "waiting",
              className:
                "candidate-waiting",
            },
            "Awaiting selection"
          )
        );
      }

      if (canHire) {
        actionElements.push(
          React.createElement(
            "button",
            {
              key: "hire",
              className:
                "candidate-primary-button",
              disabled:
                actionLoading ===
                candidate.id,
              onClick: () =>
                updateCandidateStatus(
                  candidate.id,
                  "HIRED"
                ),
            },
            actionLoading === candidate.id
              ? "Hiring..."
              : "Hire"
          )
        );

        actionElements.push(
          React.createElement(
            "button",
            {
              key: "not-accepted",
              className:
                "candidate-secondary-button",
              disabled:
                actionLoading ===
                candidate.id,
              onClick: () =>
                updateCandidateStatus(
                  candidate.id,
                  "NOT_ACCEPTED"
                ),
            },
            "Not Accepted"
          )
        );
      }

      if (
        candidate.status ===
        "NOT_ACCEPTED"
      ) {
        actionElements.push(
          React.createElement(
            "span",
            {
              key: "declined",
              className:
                "candidate-final-status",
            },
            "Selection declined"
          )
        );
      }

      if (
        candidate.status ===
        "REJECTED"
      ) {
        actionElements.push(
          React.createElement(
            "span",
            {
              key: "rejected",
              className:
                "candidate-final-status",
            },
            "Application rejected"
          )
        );
      }

      const githubElement =
        profile.github_url
          ? React.createElement(
              "a",
              {
                className:
                  "candidate-github",
                href:
                  profile.github_url,
                target: "_blank",
                rel: "noreferrer",
              },
              "View GitHub ↗"
            )
          : null;

      return React.createElement(
        "article",
        {
          className: "candidate-card",
          key: candidate.id,
        },

        React.createElement(
          "div",
          {
            className:
              "candidate-card-top",
          },

          React.createElement(
            "div",
            {
              className:
                "candidate-rank",
            },

            React.createElement(
              "span",
              null,
              "RANK"
            ),

            React.createElement(
              "strong",
              null,
              "#" +
                (candidate.rank ||
                  index + 1)
            )
          ),

          React.createElement(
            "div",
            {
              className:
                "candidate-status status-" +
                String(
                  candidate.status ||
                    "APPLIED"
                ).toLowerCase(),
            },
            candidate.status ||
              "APPLIED"
          )
        ),

        React.createElement(
          "div",
          {
            className:
              "candidate-card-body",
          },

          React.createElement(
            "div",
            {
              className:
                "candidate-avatar",
            },
            name.charAt(0).toUpperCase()
          ),

          React.createElement(
            "div",
            {
              className:
                "candidate-info",
            },

            React.createElement(
              "h3",
              null,
              name
            ),

            email
              ? React.createElement(
                  "p",
                  {
                    className:
                      "candidate-email",
                  },
                  email
                )
              : null,

            React.createElement(
              "div",
              {
                className:
                  "candidate-meta",
              },

              experience !== null &&
              experience !== undefined
                ? React.createElement(
                    "span",
                    null,
                    experience +
                      " " +
                      (Number(
                        experience
                      ) === 1
                        ? "year"
                        : "years") +
                      " experience"
                  )
                : null,

              React.createElement(
                "span",
                null,
                "Applied ",
                formatDate(
                  candidate.applied_at
                )
              )
            )
          )
        ),

        bio
          ? React.createElement(
              "p",
              {
                className:
                  "candidate-bio",
              },
              bio
            )
          : null,

        skills.length > 0
          ? React.createElement(
              "div",
              {
                className:
                  "candidate-skills",
              },
              skillElements
            )
          : null,

        React.createElement(
          "div",
          {
            className:
              "candidate-card-footer",
          },

          React.createElement(
            "span",
            {
              className:
                "candidate-application-id",
            },
            "Application #" +
              candidate.id
          ),

          React.createElement(
            "div",
            {
              className:
                "candidate-actions",
            },
            actionElements
          )
        ),

        githubElement
      );
    }
  );

  /*
   * MAIN PAGE
   */
  return React.createElement(
    "div",
    {
      className:
        "project-candidates-page",
    },

    React.createElement(
      "div",
      {
        className:
          "dashboard-grain",
      }
    ),

    React.createElement(
      "aside",
      {
        className:
          "client-sidebar",
      },

      React.createElement(
        "div",
        {
          className:
            "sidebar-brand",
        },

        React.createElement(
          "div",
          {
            className:
              "brand-mark small",
          },
          "N"
        ),

        React.createElement(
          "div",
          null,

          React.createElement(
            "div",
            {
              className:
                "brand-name",
            },
            "NEXVO"
          ),

          React.createElement(
            "div",
            {
              className:
                "brand-subtitle",
            },
            "CLIENT"
          )
        )
      ),

      React.createElement(
        "nav",
        {
          className:
            "sidebar-nav",
        },

        React.createElement(
          "button",
          {
            className:
              "nav-item",
            onClick: () =>
              navigate("/client"),
          },

          React.createElement(
            "span",
            {
              className:
                "nav-icon",
            },
            "⌂"
          ),

          React.createElement(
            "span",
            null,
            "Dashboard"
          )
        ),

        React.createElement(
          "button",
          {
            className:
              "nav-item active",
            onClick: () =>
              navigate(
                "/client/projects"
              ),
          },

          React.createElement(
            "span",
            {
              className:
                "nav-icon",
            },
            "▣"
          ),

          React.createElement(
            "span",
            null,
            "My Projects"
          )
        )
      ),

      React.createElement(
        "div",
        {
          className:
            "sidebar-bottom",
        },

        React.createElement(
          "button",
          {
            className:
              "logout-button",
            onClick: () =>
              navigate("/login"),
          },
          "Logout"
        )
      )
    ),

    React.createElement(
      "main",
      {
        className:
          "project-candidates-main",
      },

      React.createElement(
        "header",
        {
          className:
            "project-candidates-header",
        },

        React.createElement(
          "div",
          null,

          React.createElement(
            "button",
            {
              className:
                "back-button",
              onClick: () =>
                navigate(
                  `/client/projects/${id}`
                ),
            },
            "← Back to Project"
          ),

          React.createElement(
            "p",
            {
              className:
                "eyebrow",
            },
            "CANDIDATE MANAGEMENT"
          ),

          React.createElement(
            "h1",
            null,
            project?.title ||
              "Project Candidates"
          ),

          React.createElement(
            "p",
            {
              className:
                "header-description",
            },
            "Review ranked freelancers and select the best candidate for your project."
          )
        )
      ),

      error
        ? React.createElement(
            "div",
            {
              className:
                "candidate-error-banner",
            },
            error
          )
        : null,

      React.createElement(
        "section",
        {
          className:
            "candidate-stats-grid",
        },

        React.createElement(
          "div",
          {
            className:
              "candidate-stat-card",
          },

          React.createElement(
            "div",
            {
              className:
                "candidate-stat-icon",
            },
            "◎"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "span",
              null,
              "Total Candidates"
            ),

            React.createElement(
              "strong",
              null,
              candidates.length
            )
          )
        ),

        React.createElement(
          "div",
          {
            className:
              "candidate-stat-card",
          },

          React.createElement(
            "div",
            {
              className:
                "candidate-stat-icon",
            },
            "◌"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "span",
              null,
              "Applied"
            ),

            React.createElement(
              "strong",
              null,
              appliedCount
            )
          )
        ),

        React.createElement(
          "div",
          {
            className:
              "candidate-stat-card",
          },

          React.createElement(
            "div",
            {
              className:
                "candidate-stat-icon",
            },
            "★"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "span",
              null,
              "Shortlisted"
            ),

            React.createElement(
              "strong",
              null,
              shortlistedCount
            )
          )
        ),

        React.createElement(
          "div",
          {
            className:
              "candidate-stat-card",
          },

          React.createElement(
            "div",
            {
              className:
                "candidate-stat-icon",
            },
            "✓"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "span",
              null,
              "Hired"
            ),

            React.createElement(
              "strong",
              null,
              hiredCount
            )
          )
        )
      ),

      !applicationsClosed
        ? React.createElement(
            "section",
            {
              className:
                "candidate-locked-card",
            },

            React.createElement(
              "div",
              {
                className:
                  "candidate-locked-icon",
              },
              "◷"
            ),

            React.createElement(
              "div",
              null,

              React.createElement(
                "h2",
                null,
                "Applications are still open"
              ),

              React.createElement(
                "p",
                null,
                "Candidate ranking and shortlisting will become available after applications close."
              ),

              project?.application_close_at
                ? React.createElement(
                    "span",
                    null,
                    "Applications close on ",
                    React.createElement(
                      "strong",
                      null,
                      formatDate(
                        project.application_close_at
                      )
                    )
                  )
                : null
            )
          )
        : null,

      applicationsClosed &&
      hiredCandidate
        ? React.createElement(
            "section",
            {
              className:
                "candidate-hired-banner",
            },

            React.createElement(
              "div",
              {
                className:
                  "candidate-hired-icon",
              },
              "✓"
            ),

            React.createElement(
              "div",
              null,

              React.createElement(
                "span",
                {
                  className:
                    "candidate-hired-label",
                },
                "FREELANCER HIRED"
              ),

              React.createElement(
                "h2",
                null,
                getCandidateName(
                  hiredCandidate
                )
              ),

              React.createElement(
                "p",
                null,
                "This project is currently in progress."
              )
            )
          )
        : null,

      applicationsClosed &&
      !hiredCandidate
        ? React.createElement(
            "section",
            {
              className:
                "candidates-section",
            },

            React.createElement(
              "div",
              {
                className:
                  "candidates-section-heading",
              },

              React.createElement(
                "div",
                null,

                React.createElement(
                  "p",
                  {
                    className:
                      "eyebrow",
                  },
                  "RANKED APPLICATIONS"
                ),

                React.createElement(
                  "h2",
                  null,
                  "Choose your freelancer"
                )
              ),

              shortlistedCandidate
                ? React.createElement(
                    "span",
                    {
                      className:
                        "shortlist-notice",
                    },
                    "One freelancer is currently shortlisted"
                  )
                : null
            ),

            candidates.length === 0
              ? React.createElement(
                  "div",
                  {
                    className:
                      "candidate-empty-card",
                  },

                  React.createElement(
                    "div",
                    {
                      className:
                        "candidate-empty-icon",
                    },
                    "○"
                  ),

                  React.createElement(
                    "h3",
                    null,
                    "No applications yet"
                  ),

                  React.createElement(
                    "p",
                    null,
                    "No freelancers have applied to this project."
                  )
                )
              : React.createElement(
                  "div",
                  {
                    className:
                      "candidate-list",
                  },
                  candidateCards
                )
          )
        : null
    )
  );
}

export default ProjectCandidates;