import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./FreelancerExperience.css";

const h = React.createElement;

function FreelancerExperience() {
  const navigate = useNavigate();

  const [experiences, setExperiences] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    company_name: "",
    job_title: "",
    start_date: "",
    end_date: "",
    is_current: false,
    description: "",
  });

  useEffect(() => {
    loadExperience();
  }, []);

  async function loadExperience() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(
        "/freelancers/experience"
      );

      setExperiences(
        Array.isArray(response.data?.experience)
          ? response.data.experience
          : []
      );
    } catch (err) {
      console.error(
        "Failed to load experience:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load experience information."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      company_name: "",
      job_title: "",
      start_date: "",
      end_date: "",
      is_current: false,
      description: "",
    });
  }

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    if (
      name === "is_current" &&
      checked
    ) {
      setForm((previous) => ({
        ...previous,
        is_current: true,
        end_date: "",
      }));
    }
  }

  function openAddForm() {
    setMessage("");
    setError("");

    resetForm();

    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(experience) {
    setMessage("");
    setError("");

    setForm({
      company_name:
        experience.company_name || "",

      job_title:
        experience.job_title || "",

      start_date:
        experience.start_date
          ? String(
              experience.start_date
            ).slice(0, 10)
          : "",

      end_date:
        experience.end_date
          ? String(
              experience.end_date
            ).slice(0, 10)
          : "",

      is_current:
        Boolean(experience.is_current),

      description:
        experience.description || "",
    });

    setEditingId(experience.id);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);

    resetForm();

    setMessage("");
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!form.company_name.trim()) {
      setError("Please enter the company name.");
      return;
    }

    if (!form.job_title.trim()) {
      setError("Please enter your job title.");
      return;
    }

    if (!form.start_date) {
      setError("Please enter the start date.");
      return;
    }

    if (
      !form.is_current &&
      !form.end_date
    ) {
      setError(
        "Please enter the end date or select that you currently work here."
      );
      return;
    }

    if (
      !form.is_current &&
      form.end_date &&
      new Date(form.end_date) <
        new Date(form.start_date)
    ) {
      setError(
        "End date cannot be earlier than start date."
      );
      return;
    }

    try {
      setSaving(true);

      const payload = {
        company_name:
          form.company_name.trim(),

        job_title:
          form.job_title.trim(),

        start_date:
          form.start_date,

        end_date:
          form.is_current
            ? null
            : form.end_date,

        is_current:
          Boolean(form.is_current),

        description:
          form.description.trim() || null,
      };

      if (editingId) {
        await api.patch(
          `/freelancers/experience/${editingId}`,
          payload
        );

        setMessage(
          "Experience updated successfully."
        );
      } else {
        await api.post(
          "/freelancers/experience",
          payload
        );

        setMessage(
          "Experience added successfully."
        );
      }

      setShowForm(false);
      setEditingId(null);
      resetForm();

      await loadExperience();
    } catch (err) {
      console.error(
        "Failed to save experience:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to save experience information."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(experienceId) {
    if (!experienceId) {
      setError("Experience record ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove this experience?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(experienceId);
      setMessage("");
      setError("");

      const response = await api.delete(
        `/freelancers/experience/${experienceId}`
      );

      setMessage(
        response.data?.message ||
          "Experience deleted successfully."
      );

      await loadExperience();
    } catch (err) {
      console.error(
        "Failed to delete experience:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Failed to remove experience."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(date) {
    if (!date) return "";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return parsed.toLocaleDateString(
      "en-US",
      {
        month: "short",
        year: "numeric",
      }
    );
  }

  function renderExperienceCard(experience) {
    return h(
      "div",
      {
        key: experience.id,
        className:
          "experience-record-card",
      },

      h(
        "div",
        {
          className:
            "experience-record-top",
        },

        h(
          "div",
          {
            className:
              "experience-record-icon",
          },
          "💼"
        ),

        h(
          "div",
          {
            className:
              "experience-record-heading",
          },

          h(
            "div",
            {
              className:
                "experience-record-job",
            },
            experience.job_title
          ),

          h(
            "h3",
            {
              className:
                "experience-record-company",
            },
            experience.company_name
          )
        )
      ),

      h(
        "div",
        {
          className:
            "experience-record-details",
        },

        h(
          "div",
          {
            className:
              "experience-detail-item",
          },

          h(
            "span",
            {
              className:
                "experience-detail-label",
            },
            "Duration"
          ),

          h(
            "span",
            {
              className:
                "experience-detail-value",
            },

            `${formatDate(
              experience.start_date
            )} - ${
              experience.is_current
                ? "Present"
                : formatDate(
                    experience.end_date
                  )
            }`
          )
        ),

        h(
          "div",
          {
            className:
              "experience-detail-item",
          },

          h(
            "span",
            {
              className:
                "experience-detail-label",
            },
            "Status"
          ),

          h(
            "span",
            {
              className:
                "experience-detail-value",
            },

            experience.is_current
              ? "Currently working"
              : "Previous experience"
          )
        )
      ),

      experience.description &&
        h(
          "div",
          {
            className:
              "experience-description",
          },

          h(
            "span",
            {
              className:
                "experience-detail-label",
            },
            "Description"
          ),

          h(
            "p",
            null,
            experience.description
          )
        ),

      h(
        "div",
        {
          className:
            "experience-record-actions",
        },

        h(
          "button",
          {
            type: "button",
            className:
              "experience-edit-button",
            onClick: () =>
              openEditForm(
                experience
              ),
            disabled:
              deletingId ===
              experience.id,
          },
          "Edit"
        ),

        h(
          "button",
          {
            type: "button",
            className:
              "experience-delete-button",
            onClick: () =>
              handleDelete(
                experience.id
              ),
            disabled:
              deletingId ===
              experience.id,
          },

          deletingId === experience.id
            ? "Removing..."
            : "Remove"
        )
      )
    );
  }

  function renderForm() {
    return h(
      "form",
      {
        className:
          "experience-form",
        onSubmit: handleSubmit,
      },

      h(
        "div",
        {
          className:
            "experience-form-heading",
        },

        h(
          "div",
          {
            className:
              "experience-form-icon",
          },
          "💼"
        ),

        h(
          "div",
          null,

          h(
            "h2",
            null,

            editingId
              ? "Edit Experience"
              : "Add Experience"
          ),

          h(
            "p",
            null,

            editingId
              ? "Update your professional experience."
              : "Add your professional experience to your freelancer profile."
          )
        )
      ),

      h(
        "div",
        {
          className:
            "experience-form-grid",
        },

        h(
          "div",
          {
            className:
              "experience-field",
          },

          h(
            "label",
            {
              htmlFor:
                "company_name",
            },
            "Company Name"
          ),

          h("input", {
            id: "company_name",
            name: "company_name",
            type: "text",
            value:
              form.company_name,
            onChange:
              handleChange,
            placeholder:
              "e.g. Infosys",
          })
        ),

        h(
          "div",
          {
            className:
              "experience-field",
          },

          h(
            "label",
            {
              htmlFor:
                "job_title",
            },
            "Job Title"
          ),

          h("input", {
            id: "job_title",
            name: "job_title",
            type: "text",
            value:
              form.job_title,
            onChange:
              handleChange,
            placeholder:
              "e.g. Software Developer",
          })
        ),

        h(
          "div",
          {
            className:
              "experience-field",
          },

          h(
            "label",
            {
              htmlFor:
                "start_date",
            },
            "Start Date"
          ),

          h("input", {
            id: "start_date",
            name: "start_date",
            type: "date",
            value:
              form.start_date,
            onChange:
              handleChange,
          })
        ),

        h(
          "div",
          {
            className:
              "experience-field",
          },

          h(
            "label",
            {
              htmlFor:
                "end_date",
            },
            "End Date"
          ),

          h("input", {
            id: "end_date",
            name: "end_date",
            type: "date",
            value:
              form.end_date,
            onChange:
              handleChange,
            disabled:
              form.is_current,
          })
        ),

        h(
          "div",
          {
            className:
              "experience-current-field",
          },

          h(
            "label",
            {
              className:
                "experience-checkbox-label",
            },

            h("input", {
              type: "checkbox",
              name: "is_current",
              checked:
                form.is_current,
              onChange:
                handleChange,
            }),

            h(
              "span",
              null,
              "I currently work here"
            )
          )
        ),

        h(
          "div",
          {
            className:
              "experience-field experience-field-full",
          },

          h(
            "label",
            {
              htmlFor:
                "description",
            },
            "Description"
          ),

          h(
            "textarea",
            {
              id: "description",
              name: "description",
              value:
                form.description,
              onChange:
                handleChange,
              placeholder:
                "Describe your responsibilities, achievements, technologies used, and key contributions...",
              rows: 5,
            }
          )
        )
      ),

      h(
        "div",
        {
          className:
            "experience-form-actions",
        },

        h(
          "button",
          {
            type: "button",
            className:
              "experience-cancel-button",
            onClick:
              cancelForm,
            disabled: saving,
          },
          "Cancel"
        ),

        h(
          "button",
          {
            type: "submit",
            className:
              "experience-save-button",
            disabled: saving,
          },

          saving
            ? "Saving..."
            : editingId
            ? "Update Experience"
            : "Save Experience"
        )
      )
    );
  }

  return h(
    "div",
    {
      className:
        "freelancer-experience-page",
    },

    h(
      "button",
      {
        type: "button",
        className:
          "experience-back-button",
        onClick: () =>
          navigate(
            "/freelancer/profile"
          ),
      },
      "← Back to Profile"
    ),

    h(
      "div",
      {
        className:
          "experience-header",
      },

      h(
        "div",
        {
          className:
            "experience-header-copy",
        },

        h(
          "span",
          {
            className:
              "experience-eyebrow",
          },
          "PROFESSIONAL BACKGROUND"
        ),

        h(
          "h1",
          null,
          "Experience"
        ),

        h(
          "p",
          null,
          "Show clients the professional experience behind your skills."
        )
      )
    ),

    message &&
      h(
        "div",
        {
          className:
            "experience-message",
        },
        message
      ),

    error &&
      h(
        "div",
        {
          className:
            "experience-error",
        },
        error
      ),

    loading
      ? h(
          "div",
          {
            className:
              "experience-loading",
          },

          h(
            "div",
            {
              className:
                "experience-loading-icon",
            },
            "💼"
          ),

          h(
            "p",
            null,
            "Loading your experience..."
          )
        )

      : h(
          "main",
          {
            className:
              "experience-main-card",
          },

          showForm
            ? renderForm()

            : experiences.length === 0
            ? h(
                "div",
                {
                  className:
                    "experience-empty-state",
                },

                h(
                  "div",
                  {
                    className:
                      "experience-empty-icon",
                  },
                  "💼"
                ),

                h(
                  "h2",
                  null,
                  "No experience added yet"
                ),

                h(
                  "p",
                  null,
                  "Add your professional experience to strengthen your freelancer profile."
                ),

                h(
                  "button",
                  {
                    type: "button",
                    className:
                      "experience-add-button",
                    onClick:
                      openAddForm,
                  },
                  "+ Add Experience"
                )
              )

            : h(
                "div",
                {
                  className:
                    "experience-list",
                },

                experiences.map(
                  renderExperienceCard
                ),

                h(
                  "button",
                  {
                    type: "button",
                    className:
                      "experience-add-button experience-add-another",
                    onClick:
                      openAddForm,
                  },
                  "+ Add Experience"
                )
              )
        )
  );
}

export default FreelancerExperience;