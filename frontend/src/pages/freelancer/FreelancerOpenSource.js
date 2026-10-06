import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

import "./FreelancerOpenSource.css";

const e = React.createElement;

function FreelancerOpenSource() {
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    project_name: "",
    repository_url: "",
    contributions_count: "",
    description: "",
  });

  useEffect(() => {
    loadOpenSource();
  }, []);

  async function loadOpenSource() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/freelancers/open-source"
      );

      setProjects(
        response.data.open_source || []
      );
    } catch (err) {
      console.error(
        "Load open-source error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load open-source contributions."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm({
      project_name: "",
      repository_url: "",
      contributions_count: "",
      description: "",
    });

    setEditingId(null);
  }

  function startEdit(project) {
    setMessage("");
    setError("");

    setEditingId(project.id);

    setForm({
      project_name: project.project_name || "",
      repository_url:
        project.repository_url || "",
      contributions_count:
        project.contributions_count !== null &&
        project.contributions_count !== undefined
          ? String(project.contributions_count)
          : "",
      description:
        project.description || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!form.project_name.trim()) {
      setError("Project name is required.");
      return;
    }

    if (!form.repository_url.trim()) {
      setError("Repository URL is required.");
      return;
    }

    const contributionValue =
      form.contributions_count === ""
        ? 0
        : Number(form.contributions_count);

    if (
      !Number.isInteger(contributionValue) ||
      contributionValue < 0
    ) {
      setError(
        "Contributions count must be a non-negative integer."
      );
      return;
    }

    if (contributionValue > 20) {
      setError(
        "Contributions count cannot exceed 20."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        project_name:
          form.project_name.trim(),

        repository_url:
          form.repository_url.trim(),

        contributions_count:
          contributionValue,

        description:
          form.description.trim() || null,
      };

      if (editingId) {
        const response = await api.patch(
          `/freelancers/open-source/${editingId}`,
          payload
        );

        setMessage(
          response.data.message ||
            "Open-source contribution updated successfully."
        );
      } else {
        const response = await api.post(
          "/freelancers/open-source",
          payload
        );

        setMessage(
          response.data.message ||
            "Open-source contribution added successfully."
        );
      }

      resetForm();

      await loadOpenSource();
    } catch (err) {
      console.error(
        "Save open-source error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to save open-source contribution."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(projectId) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this open-source contribution?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      const response = await api.delete(
        `/freelancers/open-source/${projectId}`
      );

      setMessage(
        response.data.message ||
          "Open-source contribution deleted successfully."
      );

      if (editingId === projectId) {
        resetForm();
      }

      await loadOpenSource();
    } catch (err) {
      console.error(
        "Delete open-source error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete open-source contribution."
      );
    }
  }

  function renderProjectCard(project) {
    return e(
      "div",
      {
        className: "opensource-card",
        key: project.id,
      },

      e(
        "div",
        {
          className: "opensource-card-top",
        },

        e(
          "div",
          {
            className: "opensource-main",
          },

          e(
            "h3",
            null,
            project.project_name
          ),

          e(
            "a",
            {
              href: project.repository_url,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "opensource-repository",
            },
            "View Repository ↗"
          )
        )
      ),

      e(
        "div",
        {
          className: "opensource-details",
        },

        e(
          "div",
          {
            className: "opensource-detail",
          },

          e(
            "span",
            {
              className:
                "opensource-detail-label",
            },
            "Contributions"
          ),

          e(
            "span",
            {
              className:
                "opensource-detail-value",
            },
            String(
              project.contributions_count ?? 0
            )
          )
        )
      ),

      project.description
        ? e(
            "p",
            {
              className:
                "opensource-description",
            },
            project.description
          )
        : null,

      e(
        "div",
        {
          className: "opensource-actions",
        },

        e(
          "button",
          {
            type: "button",
            className:
              "opensource-edit-button",
            onClick: () =>
              startEdit(project),
          },
          "Edit"
        ),

        e(
          "button",
          {
            type: "button",
            className:
              "opensource-delete-button",
            onClick: () =>
              handleDelete(project.id),
          },
          "Remove"
        )
      )
    );
  }

  if (loading) {
    return e(
      "div",
      {
        className:
          "freelancer-opensource-page",
      },

      e(
        "div",
        {
          className:
            "opensource-loading",
        },
        "Loading open-source contributions..."
      )
    );
  }

  return e(
    "div",
    {
      className:
        "freelancer-opensource-page",
    },

    e(
      "div",
      {
        className:
          "opensource-header",
      },

      e(
        "button",
        {
          type: "button",
          className:
            "opensource-back-button",
          onClick: () =>
            navigate("/freelancer/profile"),
        },
        "← Back to Profile"
      ),

      e(
        "div",
        {
          className:
            "opensource-heading",
        },

        e(
          "p",
          {
            className:
              "opensource-eyebrow",
          },
          "FREELANCER PROFILE"
        ),

        e(
          "h1",
          null,
          "Open Source"
        ),

        e(
          "p",
          {
            className:
              "opensource-subtitle",
          },
          "Showcase your contributions to open-source projects and communities."
        )
      )
    ),

    message
      ? e(
          "div",
          {
            className:
              "opensource-message success",
          },
          message
        )
      : null,

    error
      ? e(
          "div",
          {
            className:
              "opensource-message error",
          },
          error
        )
      : null,

    e(
      "div",
      {
        className:
          "opensource-content",
      },

      e(
        "section",
        {
          className:
            "opensource-form-card",
        },

        e(
          "div",
          {
            className:
              "opensource-form-heading",
          },

          e(
            "div",
            null,

            e(
              "p",
              {
                className:
                  "opensource-form-eyebrow",
              },
              editingId
                ? "EDIT CONTRIBUTION"
                : "ADD CONTRIBUTION"
            ),

            e(
              "h2",
              null,
              editingId
                ? "Update your contribution"
                : "Add an open-source contribution"
            )
          )
        ),

        e(
          "form",
          {
            className:
              "opensource-form",
            onSubmit: handleSubmit,
          },

          e(
            "div",
            {
              className:
                "opensource-form-row",
            },

            e(
              "div",
              {
                className:
                  "opensource-field",
              },

              e(
                "label",
                {
                  htmlFor:
                    "project_name",
                },
                "Project Name"
              ),

              e("input", {
                id: "project_name",
                name: "project_name",
                type: "text",
                value:
                  form.project_name,
                onChange:
                  handleChange,
                placeholder:
                  "e.g. React",
              })
            ),

            e(
              "div",
              {
                className:
                  "opensource-field",
              },

              e(
                "label",
                {
                  htmlFor:
                    "repository_url",
                },
                "Repository URL"
              ),

              e("input", {
                id:
                  "repository_url",
                name:
                  "repository_url",
                type: "url",
                value:
                  form.repository_url,
                onChange:
                  handleChange,
                placeholder:
                  "https://github.com/username/project",
              })
            )
          ),

          e(
            "div",
            {
              className:
                "opensource-form-row",
            },

            e(
              "div",
              {
                className:
                  "opensource-field",
              },

              e(
                "label",
                {
                  htmlFor:
                    "contributions_count",
                },
                "Contributions Count"
              ),

              e("input", {
                id:
                  "contributions_count",
                name:
                  "contributions_count",
                type: "number",
                min: "0",
                max: "20",
                step: "1",
                value:
                  form.contributions_count,
                onChange:
                  handleChange,
                placeholder:
                  "e.g. 8",
              })
            )
          ),

          e(
            "div",
            {
              className:
                "opensource-field opensource-description-field",
            },

            e(
              "label",
              {
                htmlFor:
                  "description",
              },
              "Description"
            ),

            e("textarea", {
              id:
                "description",
              name:
                "description",
              value:
                form.description,
              onChange:
                handleChange,
              placeholder:
                "Describe your contributions, pull requests, features, fixes, or other work...",
              rows: 5,
            })
          ),

          e(
            "div",
            {
              className:
                "opensource-form-note",
            },
            "Add the number of meaningful contributions you made to this repository."
          ),

          e(
            "div",
            {
              className:
                "opensource-form-actions",
            },

            editingId
              ? e(
                  "button",
                  {
                    type: "button",
                    className:
                      "opensource-cancel-button",
                    onClick:
                      resetForm,
                  },
                  "Cancel"
                )
              : null,

            e(
              "button",
              {
                type: "submit",
                className:
                  "opensource-save-button",
                disabled:
                  saving,
              },
              saving
                ? "Saving..."
                : editingId
                ? "Update Contribution"
                : "Add Contribution"
            )
          )
        )
      ),

      e(
        "section",
        {
          className:
            "opensource-list-section",
        },

        e(
          "div",
          {
            className:
              "opensource-list-heading",
          },

          e(
            "div",
            null,

            e(
              "p",
              {
                className:
                  "opensource-form-eyebrow",
              },
              "YOUR OPEN-SOURCE WORK"
            ),

            e(
              "h2",
              null,
              projects.length
                ? "Open-source contributions"
                : "No contributions yet"
            )
          ),

          projects.length
            ? e(
                "span",
                {
                  className:
                    "opensource-count",
                },
                `${projects.length} ${
                  projects.length === 1
                    ? "project"
                    : "projects"
                }`
              )
            : null
        ),

        projects.length === 0
          ? e(
              "div",
              {
                className:
                  "opensource-empty-state",
              },

              e(
                "div",
                {
                  className:
                    "opensource-empty-icon",
                },
                "✦"
              ),

              e(
                "h3",
                null,
                "Build your open-source profile"
              ),

              e(
                "p",
                null,
                "Add your open-source contributions to show your experience working with real developer communities."
              )
            )
          : e(
              "div",
              {
                className:
                  "opensource-list",
              },
              projects.map(
                renderProjectCard
              )
            )
      )
    )
  );
}

export default FreelancerOpenSource;