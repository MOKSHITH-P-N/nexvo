import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./FreelancerProfile.css";

const h = React.createElement;

function FreelancerProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    bio: "",
    years_experience: "",
    github_url: "",
  });

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const sections = [
    {
      key: "skills",
      title: "Skills",
      description: "Show clients what technologies you work with.",
      icon: "⚡",
    },
    {
      key: "education",
      title: "Education",
      description: "Add your academic background and qualifications.",
      icon: "🎓",
    },
    {
      key: "experience",
      title: "Experience",
      description: "Add your professional work experience.",
      icon: "💼",
    },
    {
      key: "portfolio",
      title: "Portfolio",
      description: "Showcase your projects and technical work.",
      icon: "🚀",
    },
    {
      key: "certificates",
      title: "Certificates",
      description: "Add certificates and professional credentials.",
      icon: "🏆",
    },
    {
      key: "internships",
      title: "Internships",
      description: "Add your internship experience.",
      icon: "🧑‍💻",
    },
    {
      key: "hackathons",
      title: "Hackathons",
      description: "Showcase hackathons and achievements.",
      icon: "⚔️",
    },
    {
      key: "opensource",
      title: "Open Source",
      description: "Add your open-source contributions.",
      icon: "🌐",
    },
  ];

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      setLoading(true);

      const response = await api.get("/freelancers/profile");

      const data = response.data.profile || response.data;

      setProfile(data);

      setForm({
        bio: data?.bio || "",
        years_experience:
          data?.years_experience !== undefined &&
          data?.years_experience !== null
            ? data.years_experience
            : "",
        github_url: data?.github_url || "",
      });
    } catch (error) {
      if (error.response?.status === 404) {
        setProfile(null);
      } else {
        console.error("Failed to load freelancer profile:", error);
      }
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

  async function saveProfile(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage("");

      const payload = {
        bio: form.bio,
        years_experience:
          form.years_experience === ""
            ? null
            : Number(form.years_experience),
        github_url: form.github_url,
      };

      let response;

      if (profile) {
        response = await api.patch(
          "/freelancers/profile",
          payload
        );
      } else {
        response = await api.post(
          "/freelancers/profile",
          payload
        );
      }

      const updatedProfile =
        response.data.profile || response.data;

      setProfile(updatedProfile);

      setForm({
        bio: updatedProfile?.bio || "",
        years_experience:
          updatedProfile?.years_experience !== undefined &&
          updatedProfile?.years_experience !== null
            ? updatedProfile.years_experience
            : "",
        github_url: updatedProfile?.github_url || "",
      });

      setMessage("Profile updated successfully.");
      setModal(null);
    } catch (error) {
      console.error("Failed to save profile:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to update your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  function openSection(sectionKey) {
  if (sectionKey === "skills") {
    navigate("/freelancer/profile/skills");
    return;
  }

  if (sectionKey === "education") {
    navigate("/freelancer/profile/education");
    return;
  }
   if (sectionKey === "experience") {
    navigate("/freelancer/profile/experience");
    return;
  }
  if (sectionKey === "certificates") {
    navigate("/freelancer/profile/certificates");
    return;
  }
  if (sectionKey === "internships") {
  navigate("/freelancer/profile/internships");
  return;
}
if (sectionKey === "opensource") {
  navigate("/freelancer/profile/open-source");
  return;
}
if (sectionKey === "hackathons") {
  navigate("/freelancer/profile/hackathons");
  return;
}
if (sectionKey === "portfolio") {
  navigate("/freelancer/profile/portfolio");
  return;
}
  setMessage("");
  setModal(sectionKey);
}

  if (loading) {
    return h(
      "div",
      { className: "freelancer-profile-page" },
      h(
        "div",
        { className: "profile-loading" },
        h("div", { className: "loading-leaf" }),
        h("p", null, "Loading your profile...")
      )
    );
  }

  return h(
    "div",
    { className: "freelancer-profile-page" },

    h("div", {
      className:
        "profile-decoration profile-decoration-one",
    }),

    h("div", {
      className:
        "profile-decoration profile-decoration-two",
    }),

    h(
      "main",
      { className: "profile-container" },

      h(
        "section",
        { className: "profile-hero" },

        h(
          "div",
          { className: "profile-hero-copy" },

          h(
            "span",
            { className: "profile-eyebrow" },
            "Freelancer Profile"
          ),

          h(
            "h1",
            null,
            "Build a profile",
            h("br"),
            h("span", null, "clients remember.")
          ),

          h(
            "p",
            null,
            "Tell clients what you know, what you have built, and what makes your work valuable."
          )
        ),

        h(
          "div",
          { className: "profile-avatar-card" },

          h(
            "div",
            { className: "profile-avatar" },
            (user.name || "F")
              .charAt(0)
              .toUpperCase()
          ),

          h(
            "div",
            { className: "profile-avatar-info" },

            h(
              "h2",
              null,
              user.name ||
                profile?.name ||
                "Freelancer"
            ),

            h(
              "p",
              null,
              user.email ||
                profile?.email ||
                "Your email"
            )
          )
        )
      ),

      message &&
        h(
          "div",
          { className: "profile-message" },
          message
        ),

      h(
        "section",
        { className: "profile-overview-card" },

        h(
          "div",
          { className: "overview-top" },

          h(
            "div",
            null,

            h(
              "span",
              { className: "section-label" },
              "ABOUT YOU"
            ),

            h(
              "h2",
              null,
              "Your professional snapshot"
            )
          ),

          h(
            "button",
            {
              className: "primary-pill-button",
              onClick: () => {
                setMessage("");
                setModal("profile");
              },
            },
            "Edit Profile"
          )
        ),

        h(
          "div",
          { className: "overview-grid" },

          h(
            "div",
            {
              className:
                "overview-item overview-bio",
            },

            h(
              "span",
              { className: "overview-label" },
              "BIO"
            ),

            h(
              "p",
              null,
              profile?.bio ||
                "Add a short introduction about yourself, your strengths, and the kind of work you enjoy."
            )
          ),

          h(
            "div",
            { className: "overview-item" },

            h(
              "span",
              { className: "overview-label" },
              "EXPERIENCE"
            ),

            h(
              "strong",
              null,
              profile?.years_experience !== null &&
                profile?.years_experience !== undefined
                ? `${profile.years_experience} ${
                    Number(
                      profile.years_experience
                    ) === 1
                      ? "year"
                      : "years"
                  }`
                : "Not added"
            )
          ),

          h(
            "div",
            { className: "overview-item" },

            h(
              "span",
              { className: "overview-label" },
              "GITHUB"
            ),

            profile?.github_url
              ? h(
                  "a",
                  {
                    href: profile.github_url,
                    target: "_blank",
                    rel: "noreferrer",
                    className: "github-link",
                  },
                  "View GitHub ↗"
                )
              : h(
                  "strong",
                  null,
                  "Not added"
                )
          )
        )
      ),

      h(
        "section",
        { className: "profile-sections" },

        h(
          "div",
          { className: "sections-heading" },

          h(
            "div",
            null,

            h(
              "span",
              { className: "section-label" },
              "YOUR PROFILE"
            ),

            h(
              "h2",
              null,
              "Complete your story"
            )
          ),

          h(
            "p",
            null,
            "A complete profile helps clients understand your experience and strengths."
          )
        ),

        h(
          "div",
          { className: "profile-section-grid" },

          ...sections.map((section) =>
            h(
              "button",
              {
                key: section.key,
                className: "profile-section-card",
                onClick: () =>
                  openSection(section.key),
              },

              h(
                "div",
                { className: "section-card-icon" },
                section.icon
              ),

              h(
                "div",
                {
                  className:
                    "section-card-content",
                },

                h(
                  "div",
                  {
                    className:
                      "section-card-title-row",
                  },

                  h(
                    "h3",
                    null,
                    section.title
                  ),

                  h(
                    "span",
                    {
                      className:
                        "section-card-arrow",
                    },
                    "↗"
                  )
                ),

                h(
                  "p",
                  null,
                  section.description
                )
              ),

              h(
                "span",
                {
                  className:
                    "section-card-action",
                },
                section.key === "skills"
                  ? "Manage Skills"
                  : "Add details"
              )
            )
          )
        )
      )
    ),

    modal &&
      h(
        "div",
        {
          className:
            "profile-modal-backdrop",
          onClick: () => {
            if (!saving) {
              setModal(null);
            }
          },
        },

        h(
          "div",
          {
            className: "profile-modal",
            onClick: (event) =>
              event.stopPropagation(),
          },

          h(
            "button",
            {
              className: "modal-close",
              onClick: () => {
                if (!saving) {
                  setModal(null);
                }
              },
              disabled: saving,
            },
            "×"
          ),

          modal === "profile" &&
            h(
              React.Fragment,
              null,

              h(
                "span",
                {
                  className:
                    "profile-eyebrow",
                },
                "PROFILE DETAILS"
              ),

              h(
                "h2",
                null,
                "Tell clients about yourself"
              ),

              h(
                "p",
                {
                  className:
                    "modal-description",
                },
                "Keep this clear, honest, and focused on what you can offer."
              ),

              h(
                "form",
                {
                  onSubmit: saveProfile,
                },

                h(
                  "label",
                  null,
                  "Bio",

                  h("textarea", {
                    name: "bio",
                    value: form.bio,
                    onChange: handleChange,
                    placeholder:
                      "Tell clients about your experience, strengths and interests...",
                    rows: 5,
                  })
                ),

                h(
                  "label",
                  null,
                  "Years of experience",

                  h("input", {
                    type: "number",
                    min: 0,
                    max: 60,
                    name: "years_experience",
                    value:
                      form.years_experience,
                    onChange: handleChange,
                    placeholder: "e.g. 2",
                  })
                ),

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
                      "https://github.com/username",
                  })
                ),

                h(
                  "div",
                  { className: "modal-actions" },

                  h(
                    "button",
                    {
                      type: "button",
                      className:
                        "secondary-pill-button",
                      onClick: () =>
                        setModal(null),
                      disabled: saving,
                    },
                    "Cancel"
                  ),

                  h(
                    "button",
                    {
                      type: "submit",
                      className:
                        "primary-pill-button",
                      disabled: saving,
                    },
                    saving
                      ? "Saving..."
                      : "Save Profile"
                  )
                )
              )
            ),

          modal !== "profile" &&
            h(
              React.Fragment,
              null,

              h(
                "span",
                {
                  className:
                    "profile-eyebrow",
                },
                "COMING NEXT"
              ),

              h(
                "h2",
                null,
                sections.find(
                  (item) =>
                    item.key === modal
                )?.title ||
                  "Profile Section"
              ),

              h(
                "p",
                {
                  className:
                    "modal-description",
                },
                "This section is ready to be connected to its dedicated profile feature."
              ),

              h(
                "div",
                {
                  className:
                    "coming-soon-box",
                },
                "More profile tools are coming here."
              ),

              h(
                "button",
                {
                  className:
                    "primary-pill-button modal-full-button",
                  onClick: () =>
                    setModal(null),
                },
                "Close"
              )
            )
        )
      )
  );
}

export default FreelancerProfile;