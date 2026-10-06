import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      console.log("LOGIN RESPONSE:", response.data);

      localStorage.setItem("token", response.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(response.data.user)
      );

      const role = response.data.user?.role;

      if (role === "CLIENT") {
        navigate("/client");
      } else if (role === "FREELANCER") {
        navigate("/freelancer");
      }
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setError(
        error.response?.data?.message ||
          "Login failed. Please check your credentials."
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
          "Work, naturally."
        ),

        React.createElement(
          "h1",
          null,
          "Where great work ",
          React.createElement("span", null, "finds its way.")
        ),

        React.createElement(
          "p",
          null,
          "Connect with the right people, build meaningful projects, and move ideas from possibility to reality."
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
          "Welcome back"
        ),

        React.createElement(
          "p",
          { className: "auth-card-subtitle" },
          "Sign in to continue your NEXVO journey."
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

        React.createElement(
          "form",
          { onSubmit: handleLogin },

          React.createElement(
            "div",
            { className: "auth-field" },

            React.createElement(
              "label",
              { htmlFor: "email" },
              "Email"
            ),

            React.createElement("input", {
              id: "email",
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
              { htmlFor: "password" },
              "Password"
            ),

            React.createElement(
              "div",
              { className: "auth-input-wrapper" },

              React.createElement("input", {
                id: "password",
                className: "auth-input auth-password-input",
                type: showPassword ? "text" : "password",
                value: password,
                onChange: (event) => setPassword(event.target.value),
                placeholder: "Enter your password",
                autoComplete: "current-password",
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
            "button",
            {
              type: "submit",
              className: "auth-button",
              disabled: loading,
            },
            loading ? "Signing in..." : "Sign in"
          )
        ),

        React.createElement(
          "p",
          { className: "auth-switch" },
          "New to NEXVO? ",

          React.createElement(
            "button",
            {
              type: "button",
              onClick: () => navigate("/register"),
            },
            "Create an account"
          )
        )
      )
    )
  );
}

export default Login;