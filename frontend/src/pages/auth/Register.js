import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Auth.css";

function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("FREELANCER");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/register", {
        name,
        email,
        password,
        role,
      });

      console.log("REGISTER RESPONSE:", response.data);

      setSuccess(
        "Account created successfully. Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (error) {
      console.error("REGISTER ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return React.createElement(
    "main",
    { className: "auth-page" },

    React.createElement("div", {
      className: "auth-decoration auth-decoration-one",
    }),

    React.createElement("div", {
      className: "auth-decoration auth-decoration-two",
    }),

    React.createElement(
      "section",
      { className: "auth-brand-panel" },

      React.createElement(
        "div",
        { className: "auth-logo" },

        React.createElement(
          "div",
          { className: "auth-logo-mark" },
          "N"
        ),

        "NEXVO"
      ),

      React.createElement(
        "div",
        { className: "auth-brand-content" },

        React.createElement(
          "div",
          { className: "auth-eyebrow" },
          "Start something meaningful."
        ),

        React.createElement(
          "h1",
          null,
          "Build your next ",
          React.createElement("span", null, "chapter.")
        ),

        React.createElement(
          "p",
          null,
          "Join NEXVO and connect with people who can turn skills, ideas, and opportunities into meaningful work."
        )
      )
    ),

    React.createElement(
      "section",
      { className: "auth-form-panel" },

      React.createElement(
        "div",
        { className: "auth-card" },

        React.createElement(
          "h2",
          null,
          "Create your account"
        ),

        React.createElement(
          "p",
          { className: "auth-card-subtitle" },
          "Tell us a little about yourself to get started."
        ),

        error &&
          React.createElement(
            "div",
            {
              className: "auth-error",
              role: "alert",
            },
            error
          ),

        success &&
          React.createElement(
            "div",
            {
              className: "auth-success",
              role: "status",
            },
            success
          ),

        React.createElement(
          "form",
          { onSubmit: handleRegister },

          React.createElement(
            "div",
            { className: "auth-field" },

            React.createElement(
              "label",
              { htmlFor: "name" },
              "Full name"
            ),

            React.createElement("input", {
              id: "name",
              className: "auth-input",
              type: "text",
              value: name,
              onChange: (event) => setName(event.target.value),
              placeholder: "Your name",
              autoComplete: "name",
              required: true,
            })
          ),

          React.createElement(
            "div",
            { className: "auth-field" },

            React.createElement(
              "label",
              { htmlFor: "register-email" },
              "Email"
            ),

            React.createElement("input", {
              id: "register-email",
              className: "auth-input",
              type: "email",
              value: email,
              onChange: (event) => setEmail(event.target.value),
              placeholder: "you@example.com",
              autoComplete: "email",
              required: true,
            })
          ),

          React.createElement(
            "div",
            { className: "auth-field" },

            React.createElement(
              "label",
              { htmlFor: "register-password" },
              "Password"
            ),

            React.createElement(
              "div",
              { className: "auth-input-wrapper" },

              React.createElement("input", {
                id: "register-password",
                className: "auth-input auth-password-input",
                type: showPassword ? "text" : "password",
                value: password,
                onChange: (event) => setPassword(event.target.value),
                placeholder: "Create a password",
                autoComplete: "new-password",
                required: true,
              }),

              React.createElement(
                "button",
                {
                  type: "button",
                  className: "auth-password-toggle",
                  onClick: () => setShowPassword(!showPassword),
                  "aria-label": showPassword
                    ? "Hide password"
                    : "Show password",
                },
                showPassword ? "Hide" : "Show"
              )
            )
          ),

          React.createElement(
            "div",
            { className: "auth-field" },

            React.createElement(
              "label",
              { htmlFor: "confirm-password" },
              "Confirm password"
            ),

            React.createElement(
              "div",
              { className: "auth-input-wrapper" },

              React.createElement("input", {
                id: "confirm-password",
                className: "auth-input auth-password-input",
                type: showConfirmPassword ? "text" : "password",
                value: confirmPassword,
                onChange: (event) =>
                  setConfirmPassword(event.target.value),
                placeholder: "Enter your password again",
                autoComplete: "new-password",
                required: true,
              }),

              React.createElement(
                "button",
                {
                  type: "button",
                  className: "auth-password-toggle",
                  onClick: () =>
                    setShowConfirmPassword(!showConfirmPassword),
                  "aria-label": showConfirmPassword
                    ? "Hide password"
                    : "Show password",
                },
                showConfirmPassword ? "Hide" : "Show"
              )
            )
          ),

          React.createElement(
            "div",
            { className: "auth-field" },

            React.createElement(
              "label",
              null,
              "I want to join as"
            ),

            React.createElement(
              "div",
              { className: "auth-role-options" },

              React.createElement(
                "button",
                {
                  type: "button",
                  className:
                    role === "FREELANCER"
                      ? "auth-role active"
                      : "auth-role",
                  onClick: () => setRole("FREELANCER"),
                },
                React.createElement("strong", null, "Freelancer"),
                React.createElement(
                  "span",
                  null,
                  "Find projects and grow your career"
                )
              ),

              React.createElement(
                "button",
                {
                  type: "button",
                  className:
                    role === "CLIENT"
                      ? "auth-role active"
                      : "auth-role",
                  onClick: () => setRole("CLIENT"),
                },
                React.createElement("strong", null, "Client"),
                React.createElement(
                  "span",
                  null,
                  "Find skilled people for your projects"
                )
              )
            )
          ),

          React.createElement(
            "button",
            {
              type: "submit",
              className: "auth-button",
              disabled: loading,
            },
            loading ? "Creating account..." : "Create account"
          )
        ),

        React.createElement(
          "p",
          { className: "auth-switch" },

          "Already have an account? ",

          React.createElement(
            "button",
            {
              type: "button",
              onClick: () => navigate("/login"),
            },
            "Sign in"
          )
        )
      )
    )
  );
}

export default Register;