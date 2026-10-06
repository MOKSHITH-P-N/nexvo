import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./FreelancerHackathons.css";

const h = React.createElement;

function FreelancerHackathons() {
  const navigate = useNavigate();

  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    hackathon_name: "",
    position: "",
    won: false,
    event_date: "",
    description: "",
  });

  useEffect(() => {
    loadHackathons();
  }, []);

  async function loadHackathons() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/freelancers/hackathons");

      setHackathons(response.data.hackathons || []);
    } catch (err) {
      console.error("Failed to load hackathons:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load your hackathons."
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
      hackathon_name: "",
      position: "",
      won: false,
      event_date: "",
      description: "",
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
        hackathon_name: form.hackathon_name.trim(),
        position: form.position.trim() || null,
        won: Boolean(form.won),
        event_date: form.event_date,
        description: form.description.trim() || null,
      };

      let response;

      if (editingId) {
        response = await api.patch(
          `/freelancers/hackathons/${editingId}`,
          payload
        );

        setMessage("Hackathon updated successfully.");
      } else {
        response = await api.post(
          "/freelancers/hackathons",
          payload
        );

        setMessage("Hackathon added successfully.");
      }

      await loadHackathons();
      resetForm();
    } catch (err) {
      console.error("Failed to save hackathon:", err);

      setError(
        err.response?.data?.message ||
          "Unable to save hackathon."
      );
    } finally {
      setSaving(false);
    }
  }

  function startEdit(hackathon) {
    setEditingId(hackathon.id);

    setForm({
      hackathon_name: hackathon.hackathon_name || "",
      position: hackathon.position || "",
      won: Boolean(hackathon.won),
      event_date: hackathon.event_date
        ? String(hackathon.event_date).slice(0, 10)
        : "",
      description: hackathon.description || "",
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
      "Are you sure you want to remove this hackathon?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await api.delete(`/freelancers/hackathons/${id}`);

      setHackathons((previous) =>
        previous.filter((item) => item.id !== id)
      );

      if (editingId === id) {
        resetForm();
      }

      setMessage("Hackathon removed successfully.");
    } catch (err) {
      console.error("Failed to delete hackathon:", err);

      setError(
        err.response?.data?.message ||
          "Unable to remove hackathon."
      );
    }
  }

  if (loading) {
    return h(
      "div",
      { className: "hackathons-page" },
      h(
        "div",
        { className: "hackathons-container" },
        h(
          "div",
          { className: "hackathons-loading" },
          "Loading your hackathons..."
        )
      )
    );
  }

  return h(
    "div",
    { className: "hackathons-page" },

    h(
      "main",
      { className: "hackathons-container" },

      h(
        "button",
        {
          className: "hackathons-back-button",
          onClick: () => navigate("/freelancer/profile"),
        },
        "← Back to Profile"
      ),

      h(
        "section",
        { className: "hackathons-header" },

        h(
          "span",
          { className: "hackathons-eyebrow" },
          "PROFILE · HACKATHONS"
        ),

        h(
          "h1",
          null,
          editingId ? "Edit your hackathon" : "Hackathons"
        ),

        h(
          "p",
          null,
          "Showcase competitions, teamwork, problem-solving, and achievements."
        )
      ),

      message &&
        h(
          "div",
          { className: "hackathons-message success" },
          message
        ),

      error &&
        h(
          "div",
          { className: "hackathons-message error" },
          error
        ),

      h(
        "section",
        { className: "hackathon-form-card" },

        h(
          "div",
          { className: "form-card-heading" },

          h(
            "div",
            null,

            h(
              "span",
              { className: "section-label" },
              editingId ? "EDIT ENTRY" : "ADD ENTRY"
            ),

            h(
              "h2",
              null,
              editingId
                ? "Update hackathon"
                : "Add a hackathon"
            )
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
              "Hackathon Name",
              h("input", {
                type: "text",
                name: "hackathon_name",
                value: form.hackathon_name,
                onChange: handleChange,
                placeholder: "e.g. Smart India Hackathon",
                required: true,
              })
            ),

            h(
              "label",
              null,
              "Position / Rank",
              h("input", {
                type: "text",
                name: "position",
                value: form.position,
                onChange: handleChange,
                placeholder: "e.g. Finalist, 1st Place, Top 10",
              })
            ),

            h(
              "label",
              null,
              "Event Date",
              h("input", {
                type: "date",
                name: "event_date",
                value: form.event_date,
                onChange: handleChange,
                required: true,
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
                  name: "won",
                  checked: form.won,
                  onChange: handleChange,
                }),

                h(
                  "span",
                  null,
                  "We won this hackathon"
                )
              )
            )
          ),

          h(
            "label",
            { className: "full-width-field" },
            "Description",

            h("textarea", {
              name: "description",
              value: form.description,
              onChange: handleChange,
              placeholder:
                "Describe what you built, your role, technologies used, or the achievement.",
              rows: 5,
            })
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
                ? "Saving..."
                : editingId
                ? "Update Hackathon"
                : "Add Hackathon"
            )
          )
        )
      ),

      h(
        "section",
        { className: "hackathons-list-section" },

        h(
          "div",
          { className: "list-heading" },

          h(
            "div",
            null,

            h(
              "span",
              { className: "section-label" },
              "YOUR ACHIEVEMENTS"
            ),

            h(
              "h2",
              null,
              "Hackathon history"
            )
          ),

          h(
            "span",
            { className: "entry-count" },
            `${hackathons.length} ${
              hackathons.length === 1
                ? "hackathon"
                : "hackathons"
            }`
          )
        ),

        hackathons.length === 0
          ? h(
              "div",
              { className: "empty-hackathons" },

              h(
                "div",
                { className: "empty-icon" },
                "⚔️"
              ),

              h(
                "h3",
                null,
                "No hackathons added yet"
              ),

              h(
                "p",
                null,
                "Add competitions and achievements that show how you solve problems under pressure."
              )
            )
          : h(
              "div",
              { className: "hackathons-grid" },

              ...hackathons.map((hackathon) =>
                h(
                  "article",
                  {
                    className: "hackathon-card",
                    key: hackathon.id,
                  },

                  h(
                    "div",
                    { className: "hackathon-card-top" },

                    h(
                      "div",
                      null,

                      h(
                        "h3",
                        null,
                        hackathon.hackathon_name
                      ),

                      hackathon.position &&
                        h(
                          "p",
                          { className: "hackathon-position" },
                          hackathon.position
                        )
                    ),

                    hackathon.won &&
                      h(
                        "span",
                        { className: "won-badge" },
                        "🏆 Winner"
                      )
                  ),

                  h(
                    "div",
                    { className: "hackathon-meta" },

                    h(
                      "span",
                      null,
                      `📅 ${new Date(
                        hackathon.event_date
                      ).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}`
                    )
                  ),

                  hackathon.description &&
                    h(
                      "p",
                      { className: "hackathon-description" },
                      hackathon.description
                    ),

                  h(
                    "div",
                    { className: "hackathon-actions" },

                    h(
                      "button",
                      {
                        type: "button",
                        className: "edit-button",
                        onClick: () =>
                          startEdit(hackathon),
                      },
                      "Edit"
                    ),

                    h(
                      "button",
                      {
                        type: "button",
                        className: "delete-button",
                        onClick: () =>
                          handleDelete(hackathon.id),
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

export default FreelancerHackathons;