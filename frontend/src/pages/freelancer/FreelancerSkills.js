import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./FreelancerSkills.css";

const h = React.createElement;

function FreelancerSkills() {
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadSkills();
  }, []);

  async function loadSkills() {
    try {
      setLoading(true);
      setError("");

      const [currentResponse, canonicalResponse] =
        await Promise.all([
          api.get("/freelancers/skills"),
          api.get("/skills"),
        ]);

      setSkills(
        currentResponse.data.skills || []
      );

      setAvailableSkills(
        canonicalResponse.data.skills || []
      );
    } catch (err) {
      console.error(
        "Failed to load skills:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to load your skills."
      );
    } finally {
      setLoading(false);
    }
  }

    async function addSkill(skillId) {
  try {
    setAdding(skillId);
    setMessage("");
    setError("");

    await api.post(
      "/freelancers/skills",
      {
        skill_ids: [skillId],
      }
    );

    // Reload the complete skill list
    const response = await api.get("/freelancers/skills");

    setSkills(response.data.skills || []);

    setMessage("Skill added successfully.");
  } catch (err) {
    console.error(
      "Failed to add skill:",
      err
    );

    setError(
      err.response?.data?.message ||
        "Unable to add this skill."
    );
  } finally {
    setAdding(null);
  }
}  

 async function deleteSkill(skillId) {
  try {
    setDeleting(skillId);
    setMessage("");
    setError("");

    await api.delete(
      `/freelancers/skills/${skillId}`
    );

    // Reload the complete skill list
    const response = await api.get("/freelancers/skills");

    setSkills(response.data.skills || []);

    setMessage("Skill removed.");
  } catch (err) {
    console.error(
      "Failed to delete skill:",
      err
    );

    setError(
      err.response?.data?.message ||
        "Unable to remove this skill."
    );
  } finally {
    setDeleting(null);
  }
}

  const selectedIds = new Set(
    skills.map((skill) => Number(skill.id))
  );

  /*
   * IMPORTANT:
   *
   * Do not display the available skill catalogue
   * until the user actually searches.
   *
   * Once the user types something, show only the
   * first 8 matching skills.
   */
  const filteredAvailableSkills =
    search.trim() === ""
      ? []
      : availableSkills
          .filter(
            (skill) =>
              !selectedIds.has(Number(skill.id))
          )
          .filter((skill) =>
            skill.name
              .toLowerCase()
              .includes(
                search.trim().toLowerCase()
              )
          )
          .slice(0, 8);

  if (loading) {
    return h(
      "div",
      {
        className:
          "freelancer-skills-page",
      },

      h(
        "div",
        {
          className: "skills-loading",
        },

        h(
          "div",
          {
            className:
              "skills-loading-leaf",
          }
        ),

        h(
          "p",
          null,
          "Loading your skills..."
        )
      )
    );
  }

  return h(
    "div",
    {
      className:
        "freelancer-skills-page",
    },

    /* Decorative elements */

    h("div", {
      className:
        "skills-decoration skills-decoration-one",
    }),

    h("div", {
      className:
        "skills-decoration skills-decoration-two",
    }),

    h(
      "main",
      {
        className: "skills-container",
      },

      /* Back button */

      h(
        "button",
        {
          className:
            "skills-back-button",
          onClick: () =>
            navigate(
              "/freelancer/profile"
            ),
        },
        "← Back to Profile"
      ),

      /* Header */

      h(
        "header",
        {
          className: "skills-header",
        },

        h(
          "div",
          {
            className:
              "skills-header-copy",
          },

          h(
            "span",
            {
              className:
                "skills-eyebrow",
            },
            "PROFILE · SKILLS"
          ),

          h(
            "h1",
            null,
            "Your skills,",
            h("br"),
            h(
              "span",
              null,
              "your toolkit."
            )
          ),

          h(
            "p",
            null,
            "Add the technologies and abilities you want clients to discover when they view your profile."
          )
        ),

        h(
          "div",
          {
            className:
              "skills-count-card",
          },

          h(
            "strong",
            null,
            skills.length
          ),

          h(
            "span",
            null,
            skills.length === 1
              ? "Skill added"
              : "Skills added"
          )
        )
      ),

      /* Messages */

      message &&
        h(
          "div",
          {
            className:
              "skills-message",
          },
          message
        ),

      error &&
        h(
          "div",
          {
            className:
              "skills-error",
          },
          error
        ),

      /* =========================
         YOUR SKILLS
      ========================= */

      h(
        "section",
        {
          className:
            "skills-main-card",
        },

        h(
          "div",
          {
            className:
              "skills-card-heading",
          },

          h(
            "div",
            null,

            h(
              "span",
              {
                className:
                  "skills-section-label",
              },
              "YOUR SKILLS"
            ),

            h(
              "h2",
              null,
              "What can you do?"
            )
          ),

          h(
            "p",
            null,
            "Your selected skills become part of your freelancer profile."
          )
        ),

        skills.length === 0
          ? h(
              "div",
              {
                className:
                  "skills-empty-state",
              },

              h(
                "div",
                {
                  className:
                    "skills-empty-icon",
                },
                "✦"
              ),

              h(
                "h3",
                null,
                "Your toolkit is waiting."
              ),

              h(
                "p",
                null,
                "Start adding skills below so clients can understand what you bring to their projects."
              )
            )
          : h(
              "div",
              {
                className:
                  "selected-skills-list",
              },

              ...skills.map(
                (skill) =>
                  h(
                    "div",
                    {
                      className:
                        "selected-skill-row",
                      key: skill.id,
                    },

                    h(
                      "div",
                      {
                        className:
                          "selected-skill-left",
                      },

                      h(
                        "div",
                        {
                          className:
                            "selected-skill-icon",
                        },
                        "✓"
                      ),

                      h(
                        "span",
                        null,
                        skill.name
                      )
                    ),

                    h(
                      "button",
                      {
                        className:
                          "remove-skill-button",

                        onClick: () =>
                          deleteSkill(
                            skill.id
                          ),

                        disabled:
                          deleting ===
                          skill.id,
                      },

                      deleting === skill.id
                        ? "Removing..."
                        : "Remove"
                    )
                  )
              )
            )
      ),

      /* =========================
         ADD SKILLS
      ========================= */

      h(
        "section",
        {
          className:
            "add-skills-card",
        },

        h(
          "div",
          {
            className:
              "add-skills-heading",
          },

          h(
            "div",
            null,

            h(
              "span",
              {
                className:
                  "skills-section-label",
              },
              "ADD A SKILL"
            ),

            h(
              "h2",
              null,
              "Grow your toolkit"
            )
          ),

          h(
            "p",
            null,
            "Search for a skill and add it to your profile."
          )
        ),

        /* SEARCH */

        h(
          "div",
          {
            className:
              "skills-search-wrapper",
          },

          h(
            "span",
            {
              className:
                "skills-search-icon",
            },
            "⌕"
          ),

          h("input", {
            type: "text",

            value: search,

            onChange: (event) =>
              setSearch(
                event.target.value
              ),

            placeholder:
              "Search skills...",

            className:
              "skills-search-input",
          }),

          search &&
            h(
              "button",
              {
                className:
                  "clear-search-button",

                onClick: () =>
                  setSearch(""),

                type: "button",
              },
              "×"
            )
        ),

        /* SEARCH RESULTS */

        search.trim() === ""
          ? h(
              "div",
              {
                className:
                  "search-skills-hint",
              },

              h(
                "span",
                {
                  className:
                    "search-hint-icon",
                },
                "⌕"
              ),

              h(
                "p",
                null,
                "Start typing to find a skill."
              )
            )

          : filteredAvailableSkills.length ===
            0
          ? h(
              "div",
              {
                className:
                  "no-skills-found",
              },

              "No matching skills found."
            )

          : h(
              "div",
              {
                className:
                  "available-skills-results",
              },

              ...filteredAvailableSkills.map(
                (skill) =>
                  h(
                    "div",
                    {
                      className:
                        "available-skill-result",
                      key: skill.id,
                    },

                    h(
                      "span",
                      {
                        className:
                          "available-skill-name",
                      },
                      skill.name
                    ),

                    h(
                      "button",
                      {
                        className:
                          "available-skill-add-button",

                        onClick: () =>
                          addSkill(
                            skill.id
                          ),

                        disabled:
                          adding ===
                          skill.id,

                        type: "button",
                      },

                      adding === skill.id
                        ? "Adding..."
                        : "+ Add"
                    )
                  )
              )
            )
      )
    )
  );
}

export default FreelancerSkills;