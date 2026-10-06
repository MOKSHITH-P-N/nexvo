import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import "./FreelancerDashboard.css";

function FreelancerDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const userName = user.name || "Freelancer";

  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    shortlisted: 0,
    hired: 0,
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const response = await api.get("/applications/my");

      const applicationData =
        response.data?.applications || [];

      setApplications(applicationData);

      const total = applicationData.length;

      const pending = applicationData.filter(
        (application) =>
          application.application_status === "APPLIED"
      ).length;

      const shortlisted = applicationData.filter(
        (application) =>
          application.application_status === "SHORTLISTED"
      ).length;

      const hired = applicationData.filter(
        (application) =>
          application.application_status === "HIRED"
      ).length;

      setStats({
        total,
        pending,
        shortlisted,
        hired,
      });
    } catch (error) {
      console.error(
        "Failed to load freelancer dashboard:",
        error
      );

      setApplications([]);

      setStats({
        total: 0,
        pending: 0,
        shortlisted: 0,
        hired: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Not available";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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

  const getStatusClass = (status) => {
    switch (status) {
      case "HIRED":
        return "status-hired";

      case "SHORTLISTED":
        return "status-shortlisted";

      case "REJECTED":
      case "NOT_ACCEPTED":
        return "status-rejected";

      case "CANCELLED":
        return "status-cancelled";

      default:
        return "status-applied";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "HIRED":
        return "Hired";

      case "SHORTLISTED":
        return "Shortlisted";

      case "REJECTED":
        return "Rejected";

      case "NOT_ACCEPTED":
        return "Not Accepted";

      case "CANCELLED":
        return "Cancelled";

      case "APPLIED":
        return "Applied";

      default:
        return status || "Applied";
    }
  };

  const recentApplications =
    applications.slice(0, 4);

  return React.createElement(
    "div",
    {
      className: "freelancer-dashboard",
    },

    /* =====================================================
       SIDEBAR
       ===================================================== */

    React.createElement(
      "aside",
      {
        className: "freelancer-sidebar",
      },

      React.createElement(
        "div",
        {
          className: "freelancer-sidebar-top",
        },

        /* Logo */

        React.createElement(
          "div",
          {
            className:
              "freelancer-sidebar-logo",
          },

          React.createElement(
            "div",
            {
              className:
                "freelancer-logo-mark",
            },
            "N"
          ),

          React.createElement(
            "div",
            {
              className:
                "freelancer-logo-text",
            },

            React.createElement(
              "strong",
              null,
              "NEXVO"
            ),

            React.createElement(
              "span",
              null,
              "Freelancer"
            )
          )
        ),

        /* Navigation */

        React.createElement(
          "nav",
          {
            className: "freelancer-nav",
          },

          /* Browse Projects */

          React.createElement(
            "button",
            {
              className:
                "freelancer-nav-item",

              onClick: () =>
                navigate(
                  "/freelancer/projects"
                ),
            },

            React.createElement(
              "span",
              {
                className:
                  "freelancer-nav-icon",
              },
              "⌕"
            ),

            React.createElement(
              "span",
              null,
              "Browse Projects"
            )
          ),

          /* Profile */

          React.createElement(
            "button",
            {
              className:
                "freelancer-nav-item",

              onClick: () =>
                navigate(
                  "/freelancer/profile"
                ),
            },

            React.createElement(
              "span",
              {
                className:
                  "freelancer-nav-icon",
              },
              "◯"
            ),

            React.createElement(
              "span",
              null,
              "Profile"
            )
          ),

          /* Assessments */

          React.createElement(
            "button",
            {
              className:
                "freelancer-nav-item",

              onClick: () =>
                navigate(
                  "/freelancer/assessments"
                ),
            },

            React.createElement(
              "span",
              {
                className:
                  "freelancer-nav-icon",
              },
              "✦"
            ),

            React.createElement(
              "span",
              null,
              "Assessments"
            )
          )
        )
      ),

      /* Sidebar bottom */

      React.createElement(
        "div",
        {
          className:
            "freelancer-sidebar-bottom",
        },

        React.createElement(
          "div",
          {
            className:
              "freelancer-sidebar-profile",
          },

          React.createElement(
            "div",
            {
              className:
                "freelancer-sidebar-avatar",
            },
            userName
              .charAt(0)
              .toUpperCase()
          ),

          React.createElement(
            "div",
            {
              className:
                "freelancer-sidebar-user",
            },

            React.createElement(
              "strong",
              null,
              userName
            ),

            React.createElement(
              "span",
              null,
              "Freelancer"
            )
          )
        ),

        React.createElement(
          "button",
          {
            className:
              "freelancer-logout-button",

            onClick: handleLogout,
          },

          React.createElement(
            "span",
            {
              className:
                "freelancer-nav-icon",
            },
            "↪"
          ),

          React.createElement(
            "span",
            null,
            "Logout"
          )
        )
      )
    ),

    /* =====================================================
       MAIN
       ===================================================== */

    React.createElement(
      "main",
      {
        className:
          "freelancer-dashboard-main",
      },

      /* Header */

      React.createElement(
        "header",
        {
          className:
            "freelancer-dashboard-header",
        },

        React.createElement(
          "div",
          {
            className:
              "freelancer-header-copy",
          },

          React.createElement(
            "p",
            {
              className:
                "freelancer-header-eyebrow",
            },
            "FREELANCER SPACE"
          ),

          React.createElement(
            "h1",
            null,
            `Welcome back, ${userName}`
          ),

          React.createElement(
            "p",
            {
              className:
                "freelancer-header-description",
            },
            "Keep your profile strong, discover meaningful work, and track your opportunities."
          )
        )
      ),

      /* =================================================
         Welcome card
         ================================================= */

      React.createElement(
        "section",
        {
          className:
            "freelancer-welcome-card",
        },

        React.createElement(
          "div",
          {
            className:
              "freelancer-welcome-content",
          },

          React.createElement(
            "span",
            {
              className:
                "freelancer-welcome-label",
            },
            "YOUR NEXT CHAPTER"
          ),

          React.createElement(
            "h2",
            null,
            "Build your profile. Find better work."
          ),

          React.createElement(
            "p",
            null,
            "Your skills, experience, education, portfolio and assessments come together to create your NEXVO profile."
          )
        ),

        React.createElement(
          "div",
          {
            className:
              "freelancer-welcome-orbit",
          },

          React.createElement(
            "div",
            {
              className:
                "freelancer-orbit-inner",
            },
            "N"
          )
        )
      ),

      /* =================================================
         Stats
         ================================================= */

      React.createElement(
        "section",
        {
          className:
            "freelancer-stats-grid",
        },

        /* Applications */

        React.createElement(
          "article",
          {
            className:
              "freelancer-stat-card stat-card-green",
          },

          React.createElement(
            "div",
            {
              className:
                "freelancer-stat-icon",
            },
            "▤"
          ),

          React.createElement(
            "div",
            {
              className:
                "freelancer-stat-content",
            },

            React.createElement(
              "span",
              null,
              "Applications"
            ),

            React.createElement(
              "strong",
              null,
              loading ? "..." : stats.total
            ),

            React.createElement(
              "small",
              null,
              "Total submitted"
            )
          )
        ),

        /* Pending */

        React.createElement(
          "article",
          {
            className:
              "freelancer-stat-card stat-card-sand",
          },

          React.createElement(
            "div",
            {
              className:
                "freelancer-stat-icon",
            },
            "◷"
          ),

          React.createElement(
            "div",
            {
              className:
                "freelancer-stat-content",
            },

            React.createElement(
              "span",
              null,
              "Pending"
            ),

            React.createElement(
              "strong",
              null,
              loading
                ? "..."
                : stats.pending
            ),

            React.createElement(
              "small",
              null,
              "Awaiting review"
            )
          )
        ),

        /* Shortlisted */

        React.createElement(
          "article",
          {
            className:
              "freelancer-stat-card stat-card-clay",
          },

          React.createElement(
            "div",
            {
              className:
                "freelancer-stat-icon",
            },
            "✦"
          ),

          React.createElement(
            "div",
            {
              className:
                "freelancer-stat-content",
            },

            React.createElement(
              "span",
              null,
              "Shortlisted"
            ),

            React.createElement(
              "strong",
              null,
              loading
                ? "..."
                : stats.shortlisted
            ),

            React.createElement(
              "small",
              null,
              "Positive responses"
            )
          )
        ),

        /* Hired */

        React.createElement(
          "article",
          {
            className:
              "freelancer-stat-card stat-card-stone",
          },

          React.createElement(
            "div",
            {
              className:
                "freelancer-stat-icon",
            },
            "✓"
          ),

          React.createElement(
            "div",
            {
              className:
                "freelancer-stat-content",
            },

            React.createElement(
              "span",
              null,
              "Hired"
            ),

            React.createElement(
              "strong",
              null,
              loading
                ? "..."
                : stats.hired
            ),

            React.createElement(
              "small",
              null,
              "Successful outcomes"
            )
          )
        )
      ),

      /* =================================================
         Main grid
         ================================================= */

      React.createElement(
        "div",
        {
          className:
            "freelancer-dashboard-grid",
        },

        /* Applications */

        React.createElement(
          "section",
          {
            className:
              "freelancer-panel freelancer-applications-panel",
          },

          React.createElement(
            "div",
            {
              className:
                "freelancer-panel-header",
            },

            React.createElement(
              "div",
              null,

              React.createElement(
                "p",
                {
                  className:
                    "freelancer-panel-eyebrow",
                },
                "YOUR ACTIVITY"
              ),

              React.createElement(
                "h2",
                null,
                "My Applications"
              )
            ),

            React.createElement(
              "button",
              {
                className:
                  "freelancer-panel-link",

                onClick: () =>
                  navigate(
                    "/freelancer/applications"
                  ),
              },
              "View all →"
            )
          ),

          loading
            ? React.createElement(
                "div",
                {
                  className:
                    "freelancer-dashboard-loading",
                },
                "Loading applications..."
              )

            : recentApplications.length === 0

            ? React.createElement(
                "div",
                {
                  className:
                    "freelancer-empty-state",
                },

                React.createElement(
                  "div",
                  {
                    className:
                      "freelancer-empty-icon",
                  },
                  "▤"
                ),

                React.createElement(
                  "h3",
                  null,
                  "No applications yet"
                ),

                React.createElement(
                  "p",
                  null,
                  "Browse projects and send your first application when you find the right opportunity."
                ),

                React.createElement(
                  "button",
                  {
                    className:
                      "freelancer-primary-button",

                    onClick: () =>
                      navigate(
                        "/freelancer/projects"
                      ),
                  },
                  "Browse Projects"
                )
              )

            : React.createElement(
                "div",
                {
                  className:
                    "freelancer-application-list",
                },

                recentApplications.map(
                  (application) =>
                    React.createElement(
                      "button",
                      {
                        className:
                          "freelancer-application-item",

                        key: application.id,

                        onClick: () =>
                          navigate(
                            "/freelancer/applications"
                          ),
                      },

                      React.createElement(
                        "div",
                        {
                          className:
                            "freelancer-application-info",
                        },

                        React.createElement(
                          "span",
                          {
                            className:
                              "freelancer-application-number",
                          },
                          `Application #${application.id}`
                        ),

                        React.createElement(
                          "h3",
                          null,
                          application.title ||
                            "Project"
                        ),

                        React.createElement(
                          "p",
                          null,
                          formatBudget(
                            application.budget_min,
                            application.budget_max
                          )
                        )
                      ),

                      React.createElement(
                        "div",
                        {
                          className:
                            "freelancer-application-right",
                        },

                        React.createElement(
                          "span",
                          {
                            className: `freelancer-status ${getStatusClass(
                              application.application_status
                            )}`,
                          },
                          getStatusLabel(
                            application.application_status
                          )
                        ),

                        React.createElement(
                          "small",
                          null,
                          formatDate(
                            application.applied_at
                          )
                        )
                      )
                    )
                )
              )
        ),

        /* =================================================
           Profile
           ================================================= */

        React.createElement(
          "section",
          {
            className:
              "freelancer-panel freelancer-profile-panel",
          },

          React.createElement(
            "div",
            {
              className:
                "freelancer-panel-header",
            },

            React.createElement(
              "div",
              null,

              React.createElement(
                "p",
                {
                  className:
                    "freelancer-panel-eyebrow",
                },
                "YOUR PRESENCE"
              ),

              React.createElement(
                "h2",
                null,
                "My Profile"
              )
            ),

            React.createElement(
              "button",
              {
                className:
                  "freelancer-panel-link",

                onClick: () =>
                  navigate(
                    "/freelancer/profile"
                  ),
              },
              "Open profile →"
            )
          ),

          React.createElement(
            "div",
            {
              className:
                "freelancer-profile-card",
            },

            React.createElement(
              "div",
              {
                className:
                  "freelancer-profile-avatar",
              },
              userName
                .charAt(0)
                .toUpperCase()
            ),

            React.createElement(
              "div",
              {
                className:
                  "freelancer-profile-main",
              },

              React.createElement(
                "h3",
                null,
                userName
              ),

              React.createElement(
                "p",
                null,
                "Freelancer profile"
              )
            ),

            React.createElement(
              "div",
              {
                className:
                  "freelancer-profile-details",
              },

              React.createElement(
                "div",
                null,

                React.createElement(
                  "span",
                  null,
                  "Profile sections"
                ),

                React.createElement(
                  "strong",
                  null,
                  "Skills · Education · Experience"
                )
              ),

              React.createElement(
                "div",
                null,

                React.createElement(
                  "span",
                  null,
                  "Portfolio"
                ),

                React.createElement(
                  "strong",
                  null,
                  "Projects & work"
                )
              ),

              React.createElement(
                "div",
                null,

                React.createElement(
                  "span",
                  null,
                  "Assessments"
                ),

                React.createElement(
                  "strong",
                  null,
                  "Verified ability"
                )
              )
            ),

            React.createElement(
              "button",
              {
                className:
                  "freelancer-secondary-button",

                onClick: () =>
                  navigate(
                    "/freelancer/profile"
                  ),
              },
              "Manage Profile"
            )
          )
        )
      ),

      /* =================================================
         Bottom discovery strip
         ================================================= */

      React.createElement(
        "section",
        {
          className:
            "freelancer-discovery-strip",
        },

        React.createElement(
          "div",
          {
            className:
              "freelancer-discovery-copy",
          },

          React.createElement(
            "span",
            null,
            "READY FOR WHAT'S NEXT?"
          ),

          React.createElement(
            "h2",
            null,
            "Explore work that fits your skills."
          ),

          React.createElement(
            "p",
            null,
            "Use Browse Projects in the sidebar to search active opportunities, filter by skills, and find your next application."
          )
        ),

        React.createElement(
          "button",
          {
            className:
              "freelancer-primary-button discovery-button",

            onClick: () =>
              navigate(
                "/freelancer/projects"
              ),
          },
          "Browse Projects →"
        )
      )
    )
  );
}

export default FreelancerDashboard;