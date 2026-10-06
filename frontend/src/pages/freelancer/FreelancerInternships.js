import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

import "./FreelancerInternships.css";

const e = React.createElement;

function FreelancerInternships() {
  const navigate = useNavigate();

  const [internships, setInternships] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    company_name: "",
    role: "",
    start_date: "",
    end_date: "",
    description: "",
  });

  useEffect(() => {
    loadInternships();
  }, []);

  async function loadInternships() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/freelancers/internships");

      setInternships(response.data.internships || []);
    } catch (err) {
      console.error("Load internships error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load internships."
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
      company_name: "",
      role: "",
      start_date: "",
      end_date: "",
      description: "",
    });

    setEditingId(null);
  }

  function startEdit(internship) {
    setMessage("");
    setError("");

    setEditingId(internship.id);

    setForm({
      company_name: internship.company_name || "",
      role: internship.role || "",
      start_date: internship.start_date
        ? String(internship.start_date).slice(0, 10)
        : "",
      end_date: internship.end_date
        ? String(internship.end_date).slice(0, 10)
        : "",
      description: internship.description || "",
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

    if (!form.company_name.trim()) {
      setError("Company name is required.");
      return;
    }

    if (!form.role.trim()) {
      setError("Role is required.");
      return;
    }

    if (!form.start_date) {
      setError("Start date is required.");
      return;
    }

    if (!form.end_date) {
      setError("End date is required.");
      return;
    }

    if (new Date(form.end_date) < new Date(form.start_date)) {
      setError("End date cannot be before start date.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        company_name: form.company_name.trim(),
        role: form.role.trim(),
        start_date: form.start_date,
        end_date: form.end_date,
        description: form.description.trim() || null,
      };

      if (editingId) {
        const response = await api.patch(
          `/freelancers/internships/${editingId}`,
          payload
        );

        setMessage(
          response.data.message ||
            "Internship updated successfully."
        );
      } else {
        const response = await api.post(
          "/freelancers/internships",
          payload
        );

        setMessage(
          response.data.message ||
            "Internship added successfully."
        );
      }

      resetForm();

      await loadInternships();
    } catch (err) {
      console.error("Save internship error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to save internship."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(internshipId) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this internship?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      const response = await api.delete(
        `/freelancers/internships/${internshipId}`
      );

      setMessage(
        response.data.message ||
          "Internship deleted successfully."
      );

      if (editingId === internshipId) {
        resetForm();
      }

      await loadInternships();
    } catch (err) {
      console.error("Delete internship error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to delete internship."
      );
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return "Not specified";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return String(dateValue);
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }

  function renderInternshipCard(internship) {
    return e(
      "div",
      {
        className: "internship-card",
        key: internship.id,
      },

      e(
        "div",
        {
          className: "internship-card-top",
        },

        e(
          "div",
          {
            className: "internship-main",
          },

          e(
            "h3",
            null,
            internship.role
          ),

          e(
            "p",
            {
              className: "internship-company",
            },
            internship.company_name
          )
        )
      ),

      e(
        "div",
        {
          className: "internship-details",
        },

        e(
          "div",
          {
            className: "internship-detail",
          },

          e(
            "span",
            {
              className: "internship-detail-label",
            },
            "Duration"
          ),

          e(
            "span",
            {
              className: "internship-detail-value",
            },
            `${formatDate(
              internship.start_date
            )} - ${formatDate(
              internship.end_date
            )}`
          )
        )
      ),

      internship.description
        ? e(
            "p",
            {
              className: "internship-description",
            },
            internship.description
          )
        : null,

      e(
        "div",
        {
          className: "internship-actions",
        },

        e(
          "button",
          {
            type: "button",
            className: "internship-edit-button",
            onClick: () => startEdit(internship),
          },
          "Edit"
        ),

        e(
          "button",
          {
            type: "button",
            className: "internship-delete-button",
            onClick: () =>
              handleDelete(internship.id),
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
        className: "freelancer-internships-page",
      },

      e(
        "div",
        {
          className: "internships-loading",
        },
        "Loading internships..."
      )
    );
  }

  return e(
    "div",
    {
      className: "freelancer-internships-page",
    },

    e(
      "div",
      {
        className: "internships-header",
      },

      e(
        "button",
        {
          type: "button",
          className: "internships-back-button",
          onClick: () =>
            navigate("/freelancer/profile"),
        },
        "← Back to Profile"
      ),

      e(
        "div",
        {
          className: "internships-heading",
        },

        e(
          "p",
          {
            className: "internships-eyebrow",
          },
          "FREELANCER PROFILE"
        ),

        e(
          "h1",
          null,
          "Internships"
        ),

        e(
          "p",
          {
            className: "internships-subtitle",
          },
          "Showcase your practical experience through internships and industry exposure."
        )
      )
    ),

    message
      ? e(
          "div",
          {
            className:
              "internships-message success",
          },
          message
        )
      : null,

    error
      ? e(
          "div",
          {
            className:
              "internships-message error",
          },
          error
        )
      : null,

    e(
      "div",
      {
        className: "internships-content",
      },

      e(
        "section",
        {
          className: "internship-form-card",
        },

        e(
          "div",
          {
            className:
              "internship-form-heading",
          },

          e(
            "div",
            null,

            e(
              "p",
              {
                className:
                  "internship-form-eyebrow",
              },
              editingId
                ? "EDIT INTERNSHIP"
                : "ADD INTERNSHIP"
            ),

            e(
              "h2",
              null,
              editingId
                ? "Update your internship"
                : "Add an internship"
            )
          )
        ),

        e(
          "form",
          {
            className: "internship-form",
            onSubmit: handleSubmit,
          },

          e(
            "div",
            {
              className:
                "internship-form-row",
            },

            e(
              "div",
              {
                className:
                  "internship-field",
              },

              e(
                "label",
                {
                  htmlFor: "company_name",
                },
                "Company Name"
              ),

              e("input", {
                id: "company_name",
                name: "company_name",
                type: "text",
                value: form.company_name,
                onChange: handleChange,
                placeholder:
                  "e.g. Infosys",
              })
            ),

            e(
              "div",
              {
                className:
                  "internship-field",
              },

              e(
                "label",
                {
                  htmlFor: "role",
                },
                "Role"
              ),

              e("input", {
                id: "role",
                name: "role",
                type: "text",
                value: form.role,
                onChange: handleChange,
                placeholder:
                  "e.g. Software Developer Intern",
              })
            )
          ),

          e(
            "div",
            {
              className:
                "internship-form-row",
            },

            e(
              "div",
              {
                className:
                  "internship-field",
              },

              e(
                "label",
                {
                  htmlFor: "start_date",
                },
                "Start Date"
              ),

              e("input", {
                id: "start_date",
                name: "start_date",
                type: "date",
                value: form.start_date,
                onChange: handleChange,
              })
            ),

            e(
              "div",
              {
                className:
                  "internship-field",
              },

              e(
                "label",
                {
                  htmlFor: "end_date",
                },
                "End Date"
              ),

              e("input", {
                id: "end_date",
                name: "end_date",
                type: "date",
                value: form.end_date,
                onChange: handleChange,
              })
            )
          ),

          e(
            "div",
            {
              className:
                "internship-field internship-description-field",
            },

            e(
              "label",
              {
                htmlFor: "description",
              },
              "Description"
            ),

            e("textarea", {
              id: "description",
              name: "description",
              value: form.description,
              onChange: handleChange,
              placeholder:
                "Describe your work, responsibilities, or achievements...",
              rows: 5,
            })
          ),

          e(
            "div",
            {
              className:
                "internship-form-actions",
            },

            editingId
              ? e(
                  "button",
                  {
                    type: "button",
                    className:
                      "internship-cancel-button",
                    onClick: resetForm,
                  },
                  "Cancel"
                )
              : null,

            e(
              "button",
              {
                type: "submit",
                className:
                  "internship-save-button",
                disabled: saving,
              },
              saving
                ? "Saving..."
                : editingId
                ? "Update Internship"
                : "Add Internship"
            )
          )
        )
      ),

      e(
        "section",
        {
          className:
            "internships-list-section",
        },

        e(
          "div",
          {
            className:
              "internships-list-heading",
          },

          e(
            "div",
            null,

            e(
              "p",
              {
                className:
                  "internship-form-eyebrow",
              },
              "YOUR INTERNSHIPS"
            ),

            e(
              "h2",
              null,
              internships.length
                ? "Industry experience"
                : "No internships yet"
            )
          ),

          internships.length
            ? e(
                "span",
                {
                  className:
                    "internship-count",
                },
                `${internships.length} ${
                  internships.length === 1
                    ? "internship"
                    : "internships"
                }`
              )
            : null
        ),

        internships.length === 0
          ? e(
              "div",
              {
                className:
                  "internships-empty-state",
              },

              e(
                "div",
                {
                  className:
                    "internships-empty-icon",
                },
                "✦"
              ),

              e(
                "h3",
                null,
                "Build your experience"
              ),

              e(
                "p",
                null,
                "Add your internships to showcase your practical industry exposure."
              )
            )
          : e(
              "div",
              {
                className:
                  "internships-list",
              },
              internships.map(
                renderInternshipCard
              )
            )
      )
    )
  );
}

export default FreelancerInternships;