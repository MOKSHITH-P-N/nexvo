import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./FreelancerProjects.css";

function FreelancerProjects() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedSkill, setSelectedSkill] = useState("");
  const [minBudget, setMinBudget] = useState("");
  const [maxBudget, setMaxBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/projects");

      if (response.data?.success) {
        const openProjects = (response.data.projects || []).filter(
          (project) =>
            project.application_status !== "APPLIED" &&
            project.application_status !== "SHORTLISTED" &&
            project.application_status !== "HIRED"
        );

        setProjects(openProjects);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error("Load projects error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load projects."
      );

      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSkills = async () => {
    try {
      const response = await api.get("/skills");

      if (response.data?.success) {
        setSkills(response.data.skills || []);
      } else {
        setSkills([]);
      }
    } catch (err) {
      console.error("Load skills error:", err);
      setSkills([]);
    }
  };

  useEffect(() => {
    loadProjects();
    loadSkills();
  }, []);

  const handleSearch = async (event) => {
    event.preventDefault();

    try {
      setSearching(true);
      setError("");
      setSuccess("");

      const params = {};

      if (search.trim()) {
        params.search = search.trim();
      }

      if (selectedSkill) {
        params.skills = selectedSkill;
      }

      if (minBudget !== "") {
        params.minBudget = minBudget;
      }

      if (maxBudget !== "") {
        params.maxBudget = maxBudget;
      }

      if (startDate) {
        params.startDate = startDate;
      }

      if (endDate) {
        params.endDate = endDate;
      }

      const response = await api.get(
        "/projects/search",
        {
          params,
        }
      );

      if (response.data?.success) {
        const openProjects = (
          response.data.projects || []
        ).filter(
          (project) =>
            project.application_status !== "APPLIED" &&
            project.application_status !== "SHORTLISTED" &&
            project.application_status !== "HIRED"
        );

        setProjects(openProjects);
      } else {
        setProjects([]);
      }
    } catch (err) {
      console.error("Search projects error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to search projects."
      );

      setProjects([]);
    } finally {
      setSearching(false);
    }
  };

  const handleClearFilters = async () => {
    setSearch("");
    setSelectedSkill("");
    setMinBudget("");
    setMaxBudget("");
    setStartDate("");
    setEndDate("");
    setError("");
    setSuccess("");

    await loadProjects();
  };

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
      )} - ₹${maximum.toLocaleString("en-IN")}`;
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
      month: "short",
      year: "numeric",
    });
  };

  const getSkillNames = (project) => {
    if (!Array.isArray(project.skills)) {
      return [];
    }

    return project.skills
      .map((skill) => skill?.name)
      .filter(Boolean);
  };

  const handleProjectClick = (projectId) => {
    navigate(`/freelancer/projects/${projectId}`);
  };

  return React.createElement(
    "div",
    {
      className: "freelancer-projects-page",
    },

    React.createElement(
      "header",
      {
        className: "projects-page-header",
      },

      React.createElement(
        "div",
        {
          className: "projects-header-copy",
        },

        React.createElement(
          "span",
          {
            className: "projects-eyebrow",
          },
          "NEXVO OPPORTUNITIES"
        ),

        React.createElement(
          "h1",
          null,
          "Find your next project."
        ),

        React.createElement(
          "p",
          null,
          "Explore active opportunities, inspect the full project requirements, and apply only when the work feels right."
        )
      ),

      React.createElement(
        "button",
        {
          className: "projects-back-button",
          onClick: () =>
            navigate("/freelancer"),
        },
        "← Dashboard"
      )
    ),

    React.createElement(
      "form",
      {
        className: "projects-filter-panel",
        onSubmit: handleSearch,
      },

      React.createElement(
        "div",
        {
          className: "projects-filter-title",
        },

        React.createElement(
          "span",
          null,
          "SEARCH"
        ),

        React.createElement(
          "strong",
          null,
          "Narrow down opportunities"
        )
      ),

      React.createElement(
        "div",
        {
          className: "projects-filter-grid",
        },

        React.createElement(
          "div",
          {
            className: "projects-field projects-search-field",
          },

          React.createElement(
            "label",
            null,
            "Search"
          ),

          React.createElement("input", {
            type: "text",
            value: search,
            onChange: (event) =>
              setSearch(event.target.value),
            placeholder:
              "Search projects..."
          })
        ),

        React.createElement(
          "div",
          {
            className: "projects-field",
          },

          React.createElement(
            "label",
            null,
            "Skill"
          ),

          React.createElement(
            "select",
            {
              value: selectedSkill,
              onChange: (event) =>
                setSelectedSkill(
                  event.target.value
                ),
            },

            React.createElement(
              "option",
              {
                value: "",
              },
              "All skills"
            ),

            skills.map((skill) =>
              React.createElement(
                "option",
                {
                  key: skill.id,
                  value: skill.name,
                },
                skill.name
              )
            )
          )
        ),

        React.createElement(
          "div",
          {
            className: "projects-field",
          },

          React.createElement(
            "label",
            null,
            "Minimum budget"
          ),

          React.createElement("input", {
            type: "number",
            min: "0",
            value: minBudget,
            onChange: (event) =>
              setMinBudget(
                event.target.value
              ),
            placeholder: "₹ 0"
          })
        ),

        React.createElement(
          "div",
          {
            className: "projects-field",
          },

          React.createElement(
            "label",
            null,
            "Maximum budget"
          ),

          React.createElement("input", {
            type: "number",
            min: "0",
            value: maxBudget,
            onChange: (event) =>
              setMaxBudget(
                event.target.value
              ),
            placeholder: "₹ 100000"
          })
        ),

        React.createElement(
          "div",
          {
            className: "projects-field",
          },

          React.createElement(
            "label",
            null,
            "Start date"
          ),

          React.createElement("input", {
            type: "date",
            value: startDate,
            onChange: (event) =>
              setStartDate(
                event.target.value
              ),
          })
        ),

        React.createElement(
          "div",
          {
            className: "projects-field",
          },

          React.createElement(
            "label",
            null,
            "End date"
          ),

          React.createElement("input", {
            type: "date",
            value: endDate,
            onChange: (event) =>
              setEndDate(
                event.target.value
              ),
          })
        )
      ),

      React.createElement(
        "div",
        {
          className: "projects-filter-actions",
        },

        React.createElement(
          "button",
          {
            type: "submit",
            className:
              "projects-search-button",
            disabled: searching,
          },
          searching
            ? "Searching..."
            : "Search Opportunities"
        ),

        React.createElement(
          "button",
          {
            type: "button",
            className:
              "projects-clear-button",
            onClick:
              handleClearFilters,
          },
          "Clear"
        )
      )
    ),

    success
      ? React.createElement(
          "div",
          {
            className:
              "projects-success-message",
          },
          success
        )
      : null,

    error
      ? React.createElement(
          "div",
          {
            className:
              "projects-error-message",
          },
          error
        )
      : null,

    React.createElement(
      "div",
      {
        className: "projects-results-heading",
      },

      React.createElement(
        "div",
        null,

        React.createElement(
          "span",
          null,
          "OPEN OPPORTUNITIES"
        ),

        React.createElement(
          "h2",
          null,
          `${projects.length} ${
            projects.length === 1
              ? "project"
              : "projects"
          } available`
        )
      ),

      React.createElement(
        "p",
        null,
        "Click a project to view the complete requirements before applying."
      )
    ),

    loading
      ? React.createElement(
          "div",
          {
            className:
              "projects-loading",
          },
          "Loading opportunities..."
        )

      : projects.length === 0
      ? React.createElement(
          "div",
          {
            className:
              "projects-empty-state",
          },

          React.createElement(
            "div",
            {
              className:
                "projects-empty-icon",
            },
            "⌕"
          ),

          React.createElement(
            "h2",
            null,
            "No open opportunities"
          ),

          React.createElement(
            "p",
            null,
            "Try changing your search or filters. New projects can appear as clients publish them."
          ),

          React.createElement(
            "button",
            {
              className:
                "projects-search-button",
              onClick:
                handleClearFilters,
            },
            "Show all projects"
          )
        )

      : React.createElement(
          "div",
          {
            className:
              "projects-card-grid",
          },

          projects.map((project) => {
            const projectSkills =
              getSkillNames(project);

            return React.createElement(
              "article",
              {
                className:
                  "project-preview-card",
                key: project.id,
                onClick: () =>
                  handleProjectClick(
                    project.id
                  ),
              },

              React.createElement(
                "div",
                {
                  className:
                    "project-card-top",
                },

                React.createElement(
                  "span",
                  {
                    className:
                      "project-card-label",
                  },
                  "OPEN"
                ),

                React.createElement(
                  "span",
                  {
                    className:
                      "project-card-arrow",
                  },
                  "↗"
                )
              ),

              React.createElement(
                "h3",
                null,
                project.title
              ),

              React.createElement(
                "p",
                {
                  className:
                    "project-card-description",
                },
                project.description
                  ? project.description.length >
                    150
                    ? `${project.description.substring(
                        0,
                        150
                      )}...`
                    : project.description
                  : "No description provided."
              ),

              React.createElement(
                "div",
                {
                  className:
                    "project-card-skills",
                },

                projectSkills
                  .slice(0, 4)
                  .map((skill) =>
                    React.createElement(
                      "span",
                      {
                        key: skill,
                      },
                      skill
                    )
                  ),

                projectSkills.length > 4
                  ? React.createElement(
                      "span",
                      {
                        className:
                          "project-more-skills",
                      },
                      `+${
                        projectSkills.length -
                        4
                      }`
                    )
                  : null
              ),

              React.createElement(
                "div",
                {
                  className:
                    "project-card-meta",
                },

                React.createElement(
                  "div",
                  null,

                  React.createElement(
                    "span",
                    null,
                    "Budget"
                  ),

                  React.createElement(
                    "strong",
                    null,
                    formatBudget(
                      project.budget_min,
                      project.budget_max
                    )
                  )
                ),

                React.createElement(
                  "div",
                  null,

                  React.createElement(
                    "span",
                    null,
                    "Deadline"
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

              React.createElement(
                "div",
                {
                  className:
                    "project-card-footer",
                },

                React.createElement(
                  "span",
                  null,
                  "View full project"
                ),

                React.createElement(
                  "span",
                  {
                    className:
                      "project-card-footer-arrow",
                  },
                  "→"
                )
              )
            );
          })
        )
  );
}

export default FreelancerProjects;