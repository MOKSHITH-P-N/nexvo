import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import api from "../../services/api.js";

import "./ClientProjects.css";


function ClientProjects() {

  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] =
    useState("ALL");


  // ============================================================
  // LOAD PROJECTS
  // ============================================================

  useEffect(() => {

    loadProjects();

  }, []);


  const loadProjects = async () => {

    try {

      setLoading(true);
      setError("");

      const response =
        await api.get("/projects/my");

      setProjects(
        response.data?.projects || []
      );

    } catch (err) {

      console.error(
        "Load client projects error:",
        err
      );

      if (err.response?.status === 401) {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");

        return;
      }

      setError(
        err.response?.data?.message ||
        "Unable to load your projects."
      );

    } finally {

      setLoading(false);

    }

  };


  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");

  };


  // ============================================================
  // STATUS BADGE
  // ============================================================

  const getStatusClass = (status) => {

    switch (status) {

      case "OPEN":
        return "nx-status nx-status-open";

      case "COMPLETED":
        return "nx-status nx-status-completed";

      case "CLOSED":
        return "nx-status nx-status-closed";

      case "CANCELLED":
        return "nx-status nx-status-cancelled";

      default:
        return "nx-status";

    }

  };


  // ============================================================
  // DATE
  // ============================================================

  const formatDate = (value) => {

    if (!value) {
      return "Not set";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not set";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  };


  // ============================================================
  // BUDGET
  // ============================================================

  const formatBudget = (
    minimum,
    maximum
  ) => {

    const min = Number(minimum);
    const max = Number(maximum);

    if (
      Number.isNaN(min) &&
      Number.isNaN(max)
    ) {

      return "Budget not specified";

    }

    if (
      !Number.isNaN(min) &&
      !Number.isNaN(max)
    ) {

      return `₹${min.toLocaleString(
        "en-IN"
      )} - ₹${max.toLocaleString(
        "en-IN"
      )}`;

    }

    if (!Number.isNaN(min)) {

      return `From ₹${min.toLocaleString(
        "en-IN"
      )}`;

    }

    return `Up to ₹${max.toLocaleString(
      "en-IN"
    )}`;

  };


  // ============================================================
  // DESCRIPTION
  // ============================================================

  const truncateDescription = (
    description
  ) => {

    if (!description) {
      return "No description provided.";
    }

    if (description.length <= 180) {
      return description;
    }

    return `${description.substring(
      0,
      180
    )}...`;

  };


  // ============================================================
  // STATISTICS
  // ============================================================

  const stats = useMemo(() => {

    return {

      total: projects.length,

      open: projects.filter(
        project =>
          project.status === "OPEN"
      ).length,

      completed: projects.filter(
        project =>
          project.status === "COMPLETED"
      ).length,

      closed: projects.filter(
        project =>
          project.status === "CLOSED"
      ).length,

    };

  }, [projects]);


  // ============================================================
  // FILTER
  // ============================================================

  const filteredProjects =
    useMemo(() => {

      const searchText =
        search
          .trim()
          .toLowerCase();

      return projects.filter(
        project => {

          const matchesStatus =
            statusFilter === "ALL" ||
            project.status ===
              statusFilter;

          const matchesSearch =
            !searchText ||
            String(
              project.title || ""
            )
              .toLowerCase()
              .includes(searchText) ||
            String(
              project.description || ""
            )
              .toLowerCase()
              .includes(searchText);

          return (
            matchesStatus &&
            matchesSearch
          );

        }
      );

    }, [
      projects,
      search,
      statusFilter,
    ]);


  // ============================================================
  // SELECTED CARD STYLE
  // THIS IS INLINE ON PURPOSE
  // ============================================================

  const getStatCardStyle = (selected) => {

    if (selected) {

      return {

        backgroundColor: "#A9B99D",

        borderColor: "#7F9473",

        color: "#20241D",

        boxShadow:
          "0 10px 25px rgba(93, 112, 82, 0.18)",

      };

    }

    return {

      backgroundColor: "#FEFEFA",

      borderColor: "#DED8CF",

      color: "#4A4A40",

    };

  };


  const getStatTextStyle = (selected) => {

    if (selected) {

      return {
        color: "#20241D",
      };

    }

    return {
      color: "#4A4A40",
    };

  };


  const getStatLabelStyle = (selected) => {

    if (selected) {

      return {
        color: "#20241D",
      };

    }

    return {
      color: "#89877D",
    };

  };


  // ============================================================
  // RENDER
  // ============================================================

  return React.createElement(
    "div",
    {
      className:
        "client-projects-page",
    },

    // ==========================================================
    // SIDEBAR
    // ==========================================================

    React.createElement(
      "aside",
      {
        className:
          "client-projects-sidebar",
      },

      React.createElement(
        "div",
        {
          className:
            "client-projects-brand",
        },

        React.createElement(
          "div",
          {
            className:
              "client-projects-brand-mark",
          },
          "N"
        ),

        React.createElement(
          "div",
          {
            className:
              "client-projects-brand-name",
          },
          "NEXVO"
        )

      ),

      React.createElement(
        "div",
        {
          className:
            "client-projects-sidebar-label",
        },
        "Workspace"
      ),

      React.createElement(
        "button",
        {
          className:
            "client-projects-nav-item",

          onClick: () =>
            navigate("/client"),
        },

        React.createElement(
          "span",
          {
            className:
              "client-projects-nav-icon",
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
            "client-projects-nav-item active",

          onClick: () =>
            navigate(
              "/client/projects"
            ),
        },

        React.createElement(
          "span",
          {
            className:
              "client-projects-nav-icon",
          },
          "▦"
        ),

        React.createElement(
          "span",
          null,
          "My Projects"
        )

      ),

      React.createElement(
        "button",
        {
          className:
            "client-projects-nav-item",

          onClick: () =>
            navigate(
              "/client/projects/create"
            ),
        },

        React.createElement(
          "span",
          {
            className:
              "client-projects-nav-icon",
          },
          "+"
        ),

        React.createElement(
          "span",
          null,
          "Create Project"
        )

      ),

      React.createElement(
        "div",
        {
          className:
            "client-projects-sidebar-spacer",
        }
      ),

      React.createElement(
        "button",
        {
          className:
            "client-projects-nav-item logout",

          onClick: logout,
        },

        React.createElement(
          "span",
          {
            className:
              "client-projects-nav-icon",
          },
          "↪"
        ),

        React.createElement(
          "span",
          null,
          "Logout"
        )

      )

    ),

    // ==========================================================
    // MAIN
    // ==========================================================

    React.createElement(
      "main",
      {
        className:
          "client-projects-main",
      },

      // HEADER
      React.createElement(
        "header",
        {
          className:
            "client-projects-header",
        },

        React.createElement(
          "div",
          {
            className:
              "client-projects-header-copy",
          },

          React.createElement(
            "p",
            {
              className:
                "client-projects-eyebrow",
            },
            "CLIENT WORKSPACE"
          ),

          React.createElement(
            "h1",
            null,
            "My Projects"
          ),

          React.createElement(
            "p",
            {
              className:
                "client-projects-subtitle",
            },
            "Manage your projects, track progress, and find the right talent."
          )

        ),

        React.createElement(
          "button",
          {
            className:
              "client-projects-create-button",

            onClick: () =>
              navigate(
                "/client/projects/create"
              ),
          },

          React.createElement(
            "span",
            {
              className:
                "client-projects-create-icon",
            },
            "+"
          ),

          "Create Project"

        )

      ),

      // BLOBS
      React.createElement(
        "div",
        {
          className:
            "client-projects-blob blob-one",
        }
      ),

      React.createElement(
        "div",
        {
          className:
            "client-projects-blob blob-two",
        }
      ),

      // ========================================================
      // STATUS CARDS
      // ========================================================

      React.createElement(
        "section",
        {
          className:
            "client-projects-stats",
        },

        // TOTAL
        React.createElement(
          "button",
          {
            type: "button",

            className:
              "client-project-stat-card",

            style:
              getStatCardStyle(
                statusFilter === "ALL"
              ),

            onClick: () =>
              setStatusFilter("ALL"),
          },

          React.createElement(
            "div",
            {
              className:
                "client-project-stat-icon",

              style:
                statusFilter === "ALL"
                  ? {
                      backgroundColor:
                        "#8FA383",
                      color:
                        "#20241D",
                    }
                  : {},
            },
            "▦"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "p",
              {
                style:
                  getStatLabelStyle(
                    statusFilter === "ALL"
                  ),
              },
              "Total Projects"
            ),

            React.createElement(
              "strong",
              {
                style:
                  getStatTextStyle(
                    statusFilter === "ALL"
                  ),
              },
              stats.total
            )

          )

        ),

        // OPEN
        React.createElement(
          "button",
          {
            type: "button",

            className:
              "client-project-stat-card",

            style:
              getStatCardStyle(
                statusFilter === "OPEN"
              ),

            onClick: () =>
              setStatusFilter("OPEN"),
          },

          React.createElement(
            "div",
            {
              className:
                "client-project-stat-icon",

              style:
                statusFilter === "OPEN"
                  ? {
                      backgroundColor:
                        "#8FA383",
                      color:
                        "#20241D",
                    }
                  : {},
            },
            "●"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "p",
              {
                style:
                  getStatLabelStyle(
                    statusFilter === "OPEN"
                  ),
              },
              "Open"
            ),

            React.createElement(
              "strong",
              {
                style:
                  getStatTextStyle(
                    statusFilter === "OPEN"
                  ),
              },
              stats.open
            )

          )

        ),

        // COMPLETED
        React.createElement(
          "button",
          {
            type: "button",

            className:
              "client-project-stat-card",

            style:
              getStatCardStyle(
                statusFilter === "COMPLETED"
              ),

            onClick: () =>
              setStatusFilter(
                "COMPLETED"
              ),
          },

          React.createElement(
            "div",
            {
              className:
                "client-project-stat-icon",

              style:
                statusFilter === "COMPLETED"
                  ? {
                      backgroundColor:
                        "#8FA383",
                      color:
                        "#20241D",
                    }
                  : {},
            },
            "✓"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "p",
              {
                style:
                  getStatLabelStyle(
                    statusFilter ===
                      "COMPLETED"
                  ),
              },
              "Completed"
            ),

            React.createElement(
              "strong",
              {
                style:
                  getStatTextStyle(
                    statusFilter ===
                      "COMPLETED"
                  ),
              },
              stats.completed
            )

          )

        ),

        // CLOSED
        React.createElement(
          "button",
          {
            type: "button",

            className:
              "client-project-stat-card",

            style:
              getStatCardStyle(
                statusFilter === "CLOSED"
              ),

            onClick: () =>
              setStatusFilter("CLOSED"),
          },

          React.createElement(
            "div",
            {
              className:
                "client-project-stat-icon",

              style:
                statusFilter === "CLOSED"
                  ? {
                      backgroundColor:
                        "#8FA383",
                      color:
                        "#20241D",
                    }
                  : {},
            },
            "○"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "p",
              {
                style:
                  getStatLabelStyle(
                    statusFilter === "CLOSED"
                  ),
              },
              "Closed"
            ),

            React.createElement(
              "strong",
              {
                style:
                  getStatTextStyle(
                    statusFilter === "CLOSED"
                  ),
              },
              stats.closed
            )

          )

        )

      ),

      // ========================================================
      // SEARCH
      // ========================================================

      React.createElement(
        "section",
        {
          className:
            "client-projects-toolbar",
        },

        React.createElement(
          "div",
          {
            className:
              "client-projects-search-wrapper",
          },

          React.createElement(
            "span",
            {
              className:
                "client-projects-search-icon",
            },
            "⌕"
          ),

          React.createElement(
            "input",
            {
              type: "text",

              value: search,

              placeholder:
                "Search your projects...",

              onChange:
                event =>
                  setSearch(
                    event.target.value
                  ),
            }
          )

        ),

        React.createElement(
          "div",
          {
            className:
              "client-projects-filter-group",
          },

          [
            "ALL",
            "OPEN",
            "COMPLETED",
            "CLOSED",
            "CANCELLED",
          ].map(
            status =>
              React.createElement(
                "button",
                {
                  key: status,

                  className:
                    statusFilter === status
                      ? "client-filter-button active"
                      : "client-filter-button",

                  onClick: () =>
                    setStatusFilter(
                      status
                    ),
                },

                status === "ALL"
                  ? "All"
                  : status
                      .charAt(0)
                      .toUpperCase() +
                    status
                      .slice(1)
                      .toLowerCase()

              )
          )

        )

      ),

      // ========================================================
      // ERROR
      // ========================================================

      error &&
        React.createElement(
          "div",
          {
            className:
              "client-projects-error",
          },

          React.createElement(
            "span",
            null,
            "!"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "strong",
              null,
              "Something went wrong"
            ),

            React.createElement(
              "p",
              null,
              error
            )

          )

        ),

      // ========================================================
      // CONTENT
      // ========================================================

      loading

        ? React.createElement(
            "div",
            {
              className:
                "client-projects-loading",
            },

            React.createElement(
              "div",
              {
                className:
                  "client-projects-spinner",
              }
            ),

            React.createElement(
              "p",
              null,
              "Loading your projects..."
            )

          )

        : filteredProjects.length === 0

        ? React.createElement(
            "section",
            {
              className:
                "client-projects-empty",
            },

            React.createElement(
              "div",
              {
                className:
                  "client-projects-empty-icon",
              },
              "⌕"
            ),

            React.createElement(
              "h2",
              null,
              "No matching projects"
            ),

            React.createElement(
              "p",
              null,
              "Try changing your search or status filter."
            )

          )

        : React.createElement(
            "section",
            {
              className:
                "client-projects-grid",
            },

            filteredProjects.map(
              project =>
                React.createElement(
                  "article",
                  {
                    key: project.id,

                    className:
                      "client-project-card",

                    onClick: () =>
                      navigate(
                        `/client/projects/${project.id}`
                      ),
                  },

                  React.createElement(
                    "div",
                    {
                      className:
                        "client-project-card-top",
                    },

                    React.createElement(
                      "span",
                      {
                        className:
                          getStatusClass(
                            project.status
                          ),
                      },
                      project.status
                    ),

                    React.createElement(
                      "span",
                      {
                        className:
                          "client-project-id",
                      },
                      `#${project.id}`
                    )

                  ),

                  React.createElement(
                    "h2",
                    {
                      className:
                        "client-project-title",
                    },
                    project.title ||
                      "Untitled Project"
                  ),

                  React.createElement(
                    "p",
                    {
                      className:
                        "client-project-description",
                    },
                    truncateDescription(
                      project.description
                    )
                  ),

                  React.createElement(
                    "div",
                    {
                      className:
                        "client-project-divider",
                    }
                  ),

                  React.createElement(
                    "div",
                    {
                      className:
                        "client-project-meta-grid",
                    },

                    React.createElement(
                      "div",
                      {
                        className:
                          "client-project-meta",
                      },

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
                      {
                        className:
                          "client-project-meta",
                      },

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
                        "client-project-dates",
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

                    )

                  ),

                  project.complexity &&
                    React.createElement(
                      "div",
                      {
                        className:
                          "client-project-ai",
                      },

                      React.createElement(
                        "div",
                        {
                          className:
                            "client-project-ai-icon",
                        },
                        "✦"
                      ),

                      React.createElement(
                        "div",
                        null,

                        React.createElement(
                          "span",
                          null,
                          "AI Complexity"
                        ),

                        React.createElement(
                          "strong",
                          null,
                          `${project.complexity}/5`
                        )

                      )

                    ),

                  React.createElement(
                    "div",
                    {
                      className:
                        "client-project-view",
                    },

                    React.createElement(
                      "span",
                      null,
                      "View project"
                    ),

                    React.createElement(
                      "span",
                      {
                        className:
                          "client-project-arrow",
                      },
                      "→"
                    )

                  )

                )
            )

          )

    )

  );

}


export default ClientProjects;