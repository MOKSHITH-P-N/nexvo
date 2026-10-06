import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./FreelancerEducation.css";

const h = React.createElement;

const EDUCATION_LEVELS = [
  { id: 1, name: "High School" },
  { id: 2, name: "B.Sc CS" },
  { id: 3, name: "BCA" },
  { id: 4, name: "B.Tech IT" },
  { id: 5, name: "B.Tech CSE" },
  { id: 6, name: "MCA" },
  { id: 7, name: "MBA Tech" },
  { id: 8, name: "M.Tech" },
  { id: 9, name: "PhD" },
];

function FreelancerEducation() {
  const navigate = useNavigate();

  const [education, setEducation] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    education_level_id: "",
    institution: "",
    field_of_study: "",
    start_year: "",
    end_year: "",
  });

  useEffect(() => {
    loadEducation();
  }, []);

  async function loadEducation() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/freelancers/education");

      const educationData = response.data?.education || [];

      if (Array.isArray(educationData) && educationData.length > 0) {
        const item = educationData[0];

        setEducation(item);

        setForm({
          education_level_id: item.education_level_id
            ? String(item.education_level_id)
            : "",
          institution: item.institution || "",
          field_of_study: item.field_of_study || "",
          start_year: item.start_year
            ? String(item.start_year)
            : "",
          end_year: item.end_year
            ? String(item.end_year)
            : "",
        });
      } else {
        setEducation(null);
        resetForm();
      }
    } catch (err) {
      console.error("Failed to load education:", err);

      setError(
        err?.response?.data?.message ||
          "Unable to load education information."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      education_level_id: "",
      institution: "",
      field_of_study: "",
      start_year: "",
      end_year: "",
    });
  }

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function openAddForm() {
    setMessage("");
    setError("");
    resetForm();

    setEditing(false);
    setShowForm(true);
  }

  function openEditForm() {
    if (!education) return;

    setMessage("");
    setError("");

    setForm({
      education_level_id: education.education_level_id
        ? String(education.education_level_id)
        : "",
      institution: education.institution || "",
      field_of_study: education.field_of_study || "",
      start_year: education.start_year
        ? String(education.start_year)
        : "",
      end_year: education.end_year
        ? String(education.end_year)
        : "",
    });

    setEditing(true);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditing(false);
    setMessage("");
    setError("");

    if (education) {
      setForm({
        education_level_id: education.education_level_id
          ? String(education.education_level_id)
          : "",
        institution: education.institution || "",
        field_of_study: education.field_of_study || "",
        start_year: education.start_year
          ? String(education.start_year)
          : "",
        end_year: education.end_year
          ? String(education.end_year)
          : "",
      });
    } else {
      resetForm();
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!form.education_level_id) {
      setError("Please select your education level.");
      return;
    }

    if (!form.institution.trim()) {
      setError("Please enter your institution.");
      return;
    }

    if (!form.field_of_study.trim()) {
      setError("Please enter your field of study.");
      return;
    }

    if (!form.start_year) {
      setError("Please enter your start year.");
      return;
    }

    if (!form.end_year) {
      setError("Please enter your end year.");
      return;
    }

    if (Number(form.end_year) < Number(form.start_year)) {
      setError("End year cannot be before start year.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        education_level_id: Number(form.education_level_id),
        institution: form.institution.trim(),
        field_of_study: form.field_of_study.trim(),
        start_year: Number(form.start_year),
        end_year: Number(form.end_year),
      };

      if (editing) {
        if (!education?.id) {
          setError("Education record ID is missing.");
          return;
        }

        await api.patch(
          `/freelancers/education/${education.id}`,
          payload
        );

        setMessage("Education updated successfully.");
      } else {
        /*
         * Only one education record is allowed.
         */
        if (education) {
          setError(
            "You already have an education record. Edit or remove it first."
          );
          return;
        }

        await api.post(
          "/freelancers/education",
          payload
        );

        setMessage("Education added successfully.");
      }

      setShowForm(false);
      setEditing(false);

      await loadEducation();
    } catch (err) {
      console.error("Failed to save education:", err);

      setError(
        err?.response?.data?.message ||
          "Failed to save education information."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!education?.id) {
      setError("Education record ID is missing.");
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove your education?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setMessage("");
      setError("");

      console.log(
        "Deleting education ID:",
        education.id
      );

      const response = await api.delete(
        `/freelancers/education/${education.id}`
      );

      console.log(
        "Delete education response:",
        response.data
      );

      setMessage(
        response.data?.message ||
          "Education deleted successfully."
      );

      setShowForm(false);
      setEditing(false);

      resetForm();

      /*
       * Reload from backend so the UI reflects the
       * actual database state.
       */
      await loadEducation();
    } catch (err) {
      console.error(
        "Failed to delete education:",
        err
      );

      console.error(
        "Delete response:",
        err?.response?.data
      );

      setError(
        err?.response?.data?.message ||
          "Failed to remove education information."
      );
    } finally {
      setDeleting(false);
    }
  }

  function getEducationLevelName(levelId) {
    const level = EDUCATION_LEVELS.find(
      (item) => Number(item.id) === Number(levelId)
    );

    return level?.name || "Education";
  }

  function renderEducationCard() {
    if (!education) {
      return null;
    }

    return h(
      "div",
      {
        className: "education-record-card",
      },

      h(
        "div",
        {
          className: "education-record-top",
        },

        h(
          "div",
          {
            className: "education-record-icon",
          },
          "🎓"
        ),

        h(
          "div",
          {
            className: "education-record-heading",
          },

          h(
            "div",
            {
              className: "education-record-level",
            },
            getEducationLevelName(
              education.education_level_id
            )
          ),

          h(
            "h3",
            {
              className:
                "education-record-institution",
            },
            education.institution
          )
        )
      ),

      h(
        "div",
        {
          className: "education-record-details",
        },

        h(
          "div",
          {
            className: "education-detail-item",
          },

          h(
            "span",
            {
              className:
                "education-detail-label",
            },
            "Field of Study"
          ),

          h(
            "span",
            {
              className:
                "education-detail-value",
            },
            education.field_of_study
          )
        ),

        h(
          "div",
          {
            className: "education-detail-item",
          },

          h(
            "span",
            {
              className:
                "education-detail-label",
            },
            "Duration"
          ),

          h(
            "span",
            {
              className:
                "education-detail-value",
            },
            `${education.start_year} - ${education.end_year}`
          )
        )
      ),

      h(
        "div",
        {
          className:
            "education-record-actions",
        },

        h(
          "button",
          {
            type: "button",
            className:
              "education-edit-button",
            onClick: openEditForm,
            disabled: deleting,
          },
          "Edit"
        ),

        h(
          "button",
          {
            type: "button",
            className:
              "education-delete-button",
            onClick: handleDelete,
            disabled: deleting,
          },
          deleting ? "Removing..." : "Remove"
        )
      )
    );
  }

  function renderForm() {
    return h(
      "form",
      {
        className: "education-form",
        onSubmit: handleSubmit,
      },

      h(
        "div",
        {
          className:
            "education-form-heading",
        },

        h(
          "div",
          {
            className:
              "education-form-icon",
          },
          "🎓"
        ),

        h(
          "div",
          null,

          h(
            "h2",
            null,
            editing
              ? "Edit Education"
              : "Add Education"
          ),

          h(
            "p",
            null,
            editing
              ? "Update your academic information."
              : "Add your highest academic qualification."
          )
        )
      ),

      h(
        "div",
        {
          className:
            "education-form-grid",
        },

        h(
          "div",
          {
            className:
              "education-field education-field-full",
          },

          h(
            "label",
            {
              htmlFor:
                "education_level_id",
            },
            "Education Level"
          ),

          h(
            "select",
            {
              id: "education_level_id",
              name:
                "education_level_id",
              value:
                form.education_level_id,
              onChange:
                handleChange,
            },

            h(
              "option",
              {
                value: "",
              },
              "Select education level"
            ),

            EDUCATION_LEVELS.map(
              (level) =>
                h(
                  "option",
                  {
                    key: level.id,
                    value: level.id,
                  },
                  level.name
                )
            )
          )
        ),

        h(
          "div",
          {
            className:
              "education-field",
          },

          h(
            "label",
            {
              htmlFor:
                "institution",
            },
            "Institution"
          ),

          h("input", {
            id: "institution",
            name: "institution",
            type: "text",
            value:
              form.institution,
            onChange:
              handleChange,
            placeholder:
              "e.g. RNS Institute of Technology",
          })
        ),

        h(
          "div",
          {
            className:
              "education-field",
          },

          h(
            "label",
            {
              htmlFor:
                "field_of_study",
            },
            "Field of Study"
          ),

          h("input", {
            id:
              "field_of_study",
            name:
              "field_of_study",
            type: "text",
            value:
              form.field_of_study,
            onChange:
              handleChange,
            placeholder:
              "e.g. Computer Science and Engineering",
          })
        ),

        h(
          "div",
          {
            className:
              "education-field",
          },

          h(
            "label",
            {
              htmlFor:
                "start_year",
            },
            "Start Year"
          ),

          h("input", {
            id: "start_year",
            name: "start_year",
            type: "number",
            min: "1950",
            max: "2100",
            value:
              form.start_year,
            onChange:
              handleChange,
            placeholder:
              "e.g. 2022",
          })
        ),

        h(
          "div",
          {
            className:
              "education-field",
          },

          h(
            "label",
            {
              htmlFor:
                "end_year",
            },
            "End Year"
          ),

          h("input", {
            id: "end_year",
            name: "end_year",
            type: "number",
            min: "1950",
            max: "2100",
            value:
              form.end_year,
            onChange:
              handleChange,
            placeholder:
              "e.g. 2026",
          })
        )
      ),

      h(
        "div",
        {
          className:
            "education-form-actions",
        },

        h(
          "button",
          {
            type: "button",
            className:
              "education-cancel-button",
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
              "education-save-button",
            disabled: saving,
          },
          saving
            ? "Saving..."
            : editing
            ? "Update Education"
            : "Save Education"
        )
      )
    );
  }

  return h(
    "div",
    {
      className:
        "freelancer-education-page",
    },

    h(
      "button",
      {
        type: "button",
        className:
          "education-back-button",
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
          "education-header",
      },

      h(
        "div",
        {
          className:
            "education-header-copy",
        },

        h(
          "span",
          {
            className:
              "education-eyebrow",
          },
          "ACADEMIC BACKGROUND"
        ),

        h(
          "h1",
          null,
          "Education"
        ),

        h(
          "p",
          null,
          "Show clients the academic foundation behind your expertise."
        )
      )
    ),

    message &&
      h(
        "div",
        {
          className:
            "education-message",
        },
        message
      ),

    error &&
      h(
        "div",
        {
          className:
            "education-error",
        },
        error
      ),

    loading
      ? h(
          "div",
          {
            className:
              "education-loading",
          },

          h(
            "div",
            {
              className:
                "education-loading-icon",
            },
            "🎓"
          ),

          h(
            "p",
            null,
            "Loading your education..."
          )
        )

      : h(
          "main",
          {
            className:
              "education-main-card",
          },

          !education && !showForm
            ? h(
                "div",
                {
                  className:
                    "education-empty-state",
                },

                h(
                  "div",
                  {
                    className:
                      "education-empty-icon",
                  },
                  "🎓"
                ),

                h(
                  "h2",
                  null,
                  "No education added yet"
                ),

                h(
                  "p",
                  null,
                  "Add your highest academic qualification to strengthen your freelancer profile."
                ),

                h(
                  "button",
                  {
                    type: "button",
                    className:
                      "education-add-button",
                    onClick:
                      openAddForm,
                  },
                  "+ Add Education"
                )
              )

            : showForm
            ? renderForm()
            : renderEducationCard()
        )
  );
}

export default FreelancerEducation;