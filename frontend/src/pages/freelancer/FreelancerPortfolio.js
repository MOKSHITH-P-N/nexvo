import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./FreelancerPortfolio.css";

const h = React.createElement;

function FreelancerPortfolio() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    technologies: "",
    github_url: "",
    live_url: "",
    has_deployment: false,
    github_stars: 0,
  });

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadProjects() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/freelancers/portfolio");

      setProjects(response.data.projects || []);
    } catch (err) {
      console.error("Failed to load portfolio projects:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load your portfolio projects."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setForm({
      title: "",
      description: "",
      technologies: "",
      github_url: "",
      live_url: "",
      has_deployment: false,
      github_stars: 0,
    });

    setEditingId(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");
      setError("");

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        technologies: form.technologies.trim(),
        github_url: form.github_url.trim() || null,
        live_url: form.live_url.trim() || null,
        has_deployment: Boolean(form.has_deployment),
        github_stars: Number(form.github_stars) || 0,
      };

      let response;

      if (editingId) {
        response = await api.patch(
          `/freelancers/portfolio/${editingId}`,
          payload
        );

        setMessage("Portfolio project updated successfully.");
      } else {
        response = await api.post(
          "/freelancers/portfolio",
          payload
        );

        setMessage(
          "Portfolio project added successfully. AI complexity analysis completed."
        );
      }

      await loadProjects();
      resetForm();
    } catch (err) {
      console.error("Failed to save portfolio project:", err);

      setError(
        err.response?.data?.message ||
          "Unable to save portfolio project."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEdit(project) {
    setEditingId(project.id);

    setForm({
      title: project.title || "",
      description: project.description || "",
      technologies: project.technologies || "",
      github_url: project.github_url || "",
      live_url: project.live_url || "",
      has_deployment: Boolean(project.has_deployment),
      github_stars: project.github_stars ?? 0,
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this portfolio project?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await api.delete(`/freelancers/portfolio/${id}`);

      setProjects((previous) =>
        previous.filter((project) => project.id !== id)
      );

      if (editingId === id) {
        resetForm();
      }

      setMessage("Portfolio project removed successfully.");
    } catch (err) {
      console.error("Failed to delete portfolio project:", err);

      setError(
        err.response?.data?.message ||
          "Unable to remove portfolio project."
      );
    }
  }

  function getComplexityLabel(value) {
    const labels = {
      1: "Very Simple",
      2: "Basic",
      3: "Moderate",
      4: "Advanced",
      5: "Highly Advanced",
    };

    return labels[value] || "Not analyzed";
  }

  function getComplexityClass(value) {
    if (value >= 5) {
      return "complexity-5";
    }

    if (value >= 4) {
      return "complexity-4";
    }

    if (value >= 3) {
      return "complexity-3";
    }

    if (value >= 2) {
      return "complexity-2";
    }

    return "complexity-1";
  }

  if (loading) {
    return h(
      "div",
      { className: "portfolio-page" },
      h(
        "div",
        { className: "portfolio-container" },
        h(
          "div",
          { className: "portfolio-loading" },
          "Loading your portfolio..."
        )
      )
    );
  }

  return h(
    "div",
    { className: "portfolio-page" },

    h(
      "main",
      { className: "portfolio-container" },

      h(
        "button",
        {
          className: "portfolio-back-button",
          onClick: () => navigate("/freelancer/profile"),
        },
        "← Back to Profile"
      ),

      h(
        "section",
        { className: "portfolio-header" },

        h(
          "span",
          { className: "portfolio-eyebrow" },
          "PROFILE · PORTFOLIO"
        ),

        h(
          "h1",
          null,
          editingId
            ? "Edit your project"
            : "Portfolio"
        ),

        h(
          "p",
          null,
          "Show clients what you have built, the technologies you use, and the work you are proud of."
        )
      ),

      message &&
        h(
          "div",
          { className: "portfolio-message success" },
          message
        ),

      error &&
        h(
          "div",
          { className: "portfolio-message error" },
          error
        ),

      h(
        "section",
        { className: "portfolio-form-card" },

        h(
          "div",
          { className: "form-card-heading" },

          h(
            "span",
            { className: "section-label" },
            editingId ? "EDIT PROJECT" : "ADD PROJECT"
          ),

          h(
            "h2",
            null,
            editingId
              ? "Update portfolio project"
              : "Add a portfolio project"
          ),

          h(
            "p",
            null,
            "NEXVO will automatically analyze the technical complexity of your project."
          )
        ),

        h(
          "form",
          { onSubmit: handleSubmit },

          h(
            "div",
            { className: "form-grid" },

            h(
              "label",
              null,
              "Project Title",

              h("input", {
                type: "text",
                name: "title",
                value: form.title,
                onChange: handleChange,
                placeholder:
                  "e.g. AI Freelancer Recommendation System",
                required: true,
              })
            ),

            h(
              "label",
              null,
              "Technologies",

              h("input", {
                type: "text",
                name: "technologies",
                value: form.technologies,
                onChange: handleChange,
                placeholder:
                  "e.g. React, Node.js, MySQL, Python",
                required: true,
              })
            )
          ),

          h(
            "label",
            { className: "full-width-field" },
            "Project Description",

            h("textarea", {
              name: "description",
              value: form.description,
              onChange: handleChange,
              placeholder:
                "Explain what you built, the problem it solves, your contribution, architecture, important features, etc.",
              rows: 6,
              required: true,
            })
          ),

          h(
            "div",
            { className: "form-grid optional-grid" },

            h(
              "label",
              null,
              "GitHub URL",

              h("input", {
                type: "url",
                name: "github_url",
                value: form.github_url,
                onChange: handleChange,
                placeholder:
                  "https://github.com/username/project",
              })
            ),

            h(
              "label",
              null,
              "Live Project URL",

              h("input", {
                type: "url",
                name: "live_url",
                value: form.live_url,
                onChange: handleChange,
                placeholder:
                  "https://your-project.com",
              })
            ),

            h(
              "label",
              null,
              "GitHub Stars",

              h("input", {
                type: "number",
                name: "github_stars",
                value: form.github_stars,
                onChange: handleChange,
                min: 0,
                placeholder: "0",
              })
            ),

            h(
              "label",
              { className: "checkbox-field" },

              h(
                "span",
                { className: "checkbox-content" },

                h("input", {
                  type: "checkbox",
                  name: "has_deployment",
                  checked: form.has_deployment,
                  onChange: handleChange,
                }),

                h(
                  "span",
                  null,
                  "This project is deployed"
                )
              )
            )
          ),

          h(
            "div",
            { className: "form-actions" },

            editingId &&
              h(
                "button",
                {
                  type: "button",
                  className: "secondary-button",
                  onClick: resetForm,
                  disabled: saving,
                },
                "Cancel"
              ),

            h(
              "button",
              {
                type: "submit",
                className: "primary-button",
                disabled: saving,
              },
              saving
                ? "Analyzing & Saving..."
                : editingId
                ? "Update Project"
                : "Add Project"
            )
          )
        )
      ),

      h(
        "section",
        { className: "portfolio-list-section" },

        h(
          "div",
          { className: "list-heading" },

          h(
            "div",
            null,

            h(
              "span",
              { className: "section-label" },
              "YOUR WORK"
            ),

            h(
              "h2",
              null,
              "Portfolio projects"
            )
          ),

          h(
            "span",
            { className: "entry-count" },
            `${projects.length} ${
              projects.length === 1
                ? "project"
                : "projects"
            }`
          )
        ),

        projects.length === 0
          ? h(
              "div",
              { className: "empty-portfolio" },

              h(
                "div",
                { className: "empty-icon" },
                "🚀"
              ),

              h(
                "h3",
                null,
                "No portfolio projects yet"
              ),

              h(
                "p",
                null,
                "Add projects that demonstrate your technical skills and experience."
              )
            )
          : h(
              "div",
              { className: "portfolio-grid" },

              ...projects.map((project) =>
                h(
                  "article",
                  {
                    className: "portfolio-card",
                    key: project.id,
                  },

                  h(
                    "div",
                    { className: "portfolio-card-top" },

                    h(
                      "div",
                      { className: "portfolio-card-title" },

                      h(
                        "h3",
                        null,
                        project.title
                      ),

                      h(
                        "p",
                        { className: "portfolio-technologies" },
                        project.technologies
                      )
                    ),

                    project.complexity &&
                      h(
                        "div",
                        {
                          className: `complexity-badge ${getComplexityClass(
                            project.complexity
                          )}`,
                        },

                        h(
                          "strong",
                          null,
                          `${project.complexity}/5`
                        ),

                        h(
                          "span",
                          null,
                          getComplexityLabel(
                            project.complexity
                          )
                        )
                      )
                  ),

                  h(
                    "p",
                    { className: "portfolio-description" },
                    project.description
                  ),

                  project.complexity_reason &&
                    h(
                      "div",
                      { className: "ai-analysis" },

                      h(
                        "span",
                        { className: "ai-analysis-label" },
                        "✦ NEXVO AI ANALYSIS"
                      ),

                      h(
                        "p",
                        null,
                        project.complexity_reason
                      )
                    ),

                  h(
                    "div",
                    { className: "portfolio-links" },

                    project.github_url &&
                      h(
                        "a",
                        {
                          href: project.github_url,
                          target: "_blank",
                          rel: "noreferrer",
                        },
                        "GitHub ↗"
                      ),

                    project.live_url &&
                      h(
                        "a",
                        {
                          href: project.live_url,
                          target: "_blank",
                          rel: "noreferrer",
                        },
                        "Live Project ↗"
                      ),

                    project.has_deployment &&
                      h(
                        "span",
                        { className: "deployed-badge" },
                        "● Deployed"
                      ),

                    project.github_stars > 0 &&
                      h(
                        "span",
                        { className: "stars-badge" },
                        `★ ${project.github_stars} stars`
                      )
                  ),

                  h(
                    "div",
                    { className: "portfolio-actions" },

                    h(
                      "button",
                      {
                        type: "button",
                        className: "edit-button",
                        onClick: () =>
                          startEdit(project),
                      },
                      "Edit"
                    ),

                    h(
                      "button",
                      {
                        type: "button",
                        className: "delete-button",
                        onClick: () =>
                          handleDelete(project.id),
                      },
                      "Remove"
                    )
                  )
                )
              )
            )
      )
    )
  );
}

export default FreelancerPortfolio;