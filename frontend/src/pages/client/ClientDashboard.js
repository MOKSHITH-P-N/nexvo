import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import api from "../../services/api.js";

import "./ClientDashboard.css";


function ClientDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  // ============================================================
  // LOAD USER + PROJECTS
  // ============================================================

  useEffect(() => {
    const storedUser =
      localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }

    loadProjects();
  }, []);


  // ============================================================
  // LOAD PROJECTS
  // ============================================================

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError("");

      const response =
        await api.get("/projects/my");

      setProjects(
        response.data.projects || []
      );

    } catch (err) {
      console.error(
        "Load projects error:",
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
  // STATUS
  // ============================================================

  const getStatusClass = (status) => {
    if (status === "OPEN") {
      return "status-open";
    }

    if (status === "COMPLETED") {
      return "status-completed";
    }

    if (status === "CLOSED") {
      return "status-closed";
    }

    if (status === "CANCELLED") {
      return "status-cancelled";
    }

    return "";
  };


  // ============================================================
  // DATE
  // ============================================================

  const formatDate = (date) => {
    if (!date) {
      return "Not set";
    }

    const parsedDate =
      new Date(date);

    if (
      Number.isNaN(
        parsedDate.getTime()
      )
    ) {
      return "Not set";
    }

    return parsedDate.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );
  };


  // ============================================================
  // STATS
  // ============================================================

  const openProjects =
    projects.filter(
      (project) =>
        project.status === "OPEN"
    ).length;

  const completedProjects =
    projects.filter(
      (project) =>
        project.status === "COMPLETED"
    ).length;

  const totalProjects =
    projects.length;


  // ============================================================
  // RENDER
  // ============================================================

  return React.createElement(
    "div",
    {
      className: "client-dashboard"
    },

    React.createElement("div", {
      className: "dashboard-grain"
    }),


    // ========================================================
    // SIDEBAR
    // ========================================================

    React.createElement(
      "aside",
      {
        className: "client-sidebar"
      },

      React.createElement(
        "div",
        {
          className: "sidebar-brand"
        },

        React.createElement(
          "div",
          {
            className: "brand-mark small"
          },

          React.createElement(
            "span",
            null
          )
        ),

        React.createElement(
          "div",
          null,

          React.createElement(
            "div",
            {
              className: "brand-name"
            },
            "NEXVO"
          ),

          React.createElement(
            "div",
            {
              className: "brand-subtitle"
            },
            "Client workspace"
          )
        )
      ),


      React.createElement(
        "nav",
        {
          className: "sidebar-nav"
        },

        React.createElement(
          "button",
          {
            type: "button",
            className:
              "nav-item active"
          },

          React.createElement(
            "span",
            null,
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
            type: "button",
            className: "nav-item",

            onClick: () =>
              navigate(
                "/client/projects"
              )
          },

          React.createElement(
            "span",
            null,
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
          className: "sidebar-bottom"
        },

        React.createElement(
          "div",
          {
            className: "sidebar-user"
          },

          React.createElement(
            "div",
            {
              className: "user-avatar"
            },

            user?.name
              ? user.name
                  .charAt(0)
                  .toUpperCase()
              : "C"
          ),

          React.createElement(
            "div",
            {
              className:
                "sidebar-user-info"
            },

            React.createElement(
              "strong",
              null,
              user?.name ||
                "Client"
            ),

            React.createElement(
              "span",
              null,
              "CLIENT"
            )
          )
        ),

        React.createElement(
          "button",
          {
            type: "button",
            className:
              "logout-button",
            onClick: logout
          },
          "Log out"
        )
      )
    ),


    // ========================================================
    // MAIN
    // ========================================================

    React.createElement(
      "main",
      {
        className: "client-main"
      },

      // HEADER
      React.createElement(
        "header",
        {
          className:
            "dashboard-header"
        },

        React.createElement(
          "div",
          null,

          React.createElement(
            "p",
            {
              className: "eyebrow"
            },
            "CLIENT DASHBOARD"
          ),

          React.createElement(
            "h1",
            null,
            `Welcome back, ${
              user?.name?.split(" ")[0] ||
              "there"
            }`
          ),

          React.createElement(
            "p",
            {
              className:
                "header-description"
            },
            "Manage your projects and find the right people to bring them to life."
          )
        ),

        React.createElement(
          "button",
          {
            type: "button",
            className:
              "create-project-button",

            onClick: () =>
              navigate(
                "/client/projects/create"
              )
          },

          React.createElement(
            "span",
            null,
            "+"
          ),

          " Create Project"
        )
      ),


      // ======================================================
      // STATS
      // ======================================================

      React.createElement(
        "section",
        {
          className: "stats-grid"
        },

        React.createElement(
          "div",
          {
            className: "stat-card"
          },

          React.createElement(
            "div",
            {
              className:
                "stat-icon moss"
            },
            "▣"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "span",
              {
                className:
                  "stat-label"
              },
              "Total projects"
            ),

            React.createElement(
              "strong",
              null,
              totalProjects
            )
          )
        ),

        React.createElement(
          "div",
          {
            className: "stat-card"
          },

          React.createElement(
            "div",
            {
              className:
                "stat-icon green"
            },
            "↗"
          ),

          React.createElement(
            "div",
            null,

            React.createElement(
              "span",
              {
                className:
                  "stat-label"
              },
              "Open projects"
            ),

            React.createElement(
              "strong",
              null,
              openProjects
            )
          )
        ),

        React.createElement(
          "div",
          {
            className: "stat-card"
          },

          React.createElement(
            "div",
            {
              className:
                "stat-icon clay"
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
                  "stat-label"
              },
              "Completed"
            ),

            React.createElement(
              "strong",
              null,
              completedProjects
            )
          )
        )
      ),


      // ======================================================
      // PROJECTS
      // ======================================================

      React.createElement(
        "section",
        {
          className:
            "projects-section"
        },

        React.createElement(
          "div",
          {
            className:
              "section-heading"
          },

          React.createElement(
            "div",
            null,

            React.createElement(
              "p",
              {
                className: "eyebrow"
              },
              "YOUR WORKSPACE"
            ),

            React.createElement(
              "h2",
              null,
              "Your Projects"
            )
          ),

          projects.length > 0
            ? React.createElement(
                "button",
                {
                  type: "button",
                  className:
                    "text-button",

                  onClick: () =>
                    navigate(
                      "/client/projects"
                    )
                },
                "View all →"
              )
            : null
        ),


        // LOADING
        loading
          ? React.createElement(
              "div",
              {
                className:
                  "state-card"
              },

              React.createElement(
                "div",
                {
                  className:
                    "loading-dot"
                }
              ),

              React.createElement(
                "p",
                null,
                "Loading your projects..."
              )
            )


        // ERROR
        : error
          ? React.createElement(
              "div",
              {
                className:
                  "state-card error-state"
              },

              React.createElement(
                "p",
                null,
                error
              ),

              React.createElement(
                "button",
                {
                  type: "button",
                  className:
                    "retry-button",

                  onClick:
                    loadProjects
                },
                "Try again"
              )
            )


        // EMPTY
        : projects.length === 0
          ? React.createElement(
              "div",
              {
                className:
                  "empty-projects"
              },

              React.createElement(
                "div",
                {
                  className:
                    "empty-icon"
                },
                "✦"
              ),

              React.createElement(
                "h3",
                null,
                "Your first project starts here."
              ),

              React.createElement(
                "p",
                null,
                "Create a project and let NEXVO help you find the right freelancer."
              ),

              React.createElement(
                "button",
                {
                  type: "button",
                  className:
                    "create-project-button",

                  onClick: () =>
                    navigate(
                      "/client/projects/create"
                    )
                },
                "+ Create your first project"
              )
            )


        // PROJECT GRID
        : React.createElement(
            "div",
            {
              className:
                "project-grid"
            },

            projects
              .slice(0, 6)
              .map((project) =>
                React.createElement(
                  "article",
                  {
                    className:
                      "project-card",

                    key: project.id,

                    onClick: () =>
                      navigate(
                        `/client/projects/${project.id}`
                      )
                  },

                  React.createElement(
                    "div",
                    {
                      className:
                        "project-card-top"
                    },

                    React.createElement(
                      "span",
                      {
                        className:
                          `project-status ${
                            getStatusClass(
                              project.status
                            )
                          }`
                      },
                      project.status
                    ),

                    React.createElement(
                      "span",
                      {
                        className:
                          "project-id"
                      },
                      `#${project.id}`
                    )
                  ),

                  // IMPORTANT:
                  // Separate dashboard title class
                  React.createElement(
                    "h3",
                    {
                      className:
                        "client-project-title"
                    },
                    project.title ||
                      "Untitled Project"
                  ),

                  // IMPORTANT:
                  // This no longer uses project-description.
                  // Therefore ProjectDetails.css cannot affect it.
                  React.createElement(
                    "p",
                    {
                      className:
                        "client-project-description"
                    },
                    project.description ||
                      "No description available."
                  ),

                  React.createElement(
                    "div",
                    {
                      className:
                        "project-meta"
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

                        project.budget_min != null &&
                        project.budget_max != null

                          ? `₹${Number(
                              project.budget_min
                            ).toLocaleString(
                              "en-IN"
                            )} – ₹${Number(
                              project.budget_max
                            ).toLocaleString(
                              "en-IN"
                            )}`

                          : "Not specified"
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
                        "project-card-footer"
                    },

                    React.createElement(
                      "span",
                      null,

                      project.complexity
                        ? `Complexity ${project.complexity}/5`
                        : "Project"
                    ),

                    React.createElement(
                      "span",
                      {
                        className:
                          "arrow"
                      },
                      "→"
                    )
                  )
                )
              )
          )
      )
    )
  );
}


export default ClientDashboard;