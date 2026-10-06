import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./FreelancerCertificates.css";

const e = React.createElement;

function FreelancerCertificates() {
  const navigate = useNavigate();

  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    certificate_name: "",
    issuing_organization: "",
    certificate_url: "",
    issued_at: "",
  });

  useEffect(() => {
    loadCertificates();
  }, []);

  async function loadCertificates() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/freelancers/certificates");

      setCertificates(response.data.certificates || []);
    } catch (err) {
      console.error("Load certificates error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to load certificates."
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
      certificate_name: "",
      issuing_organization: "",
      certificate_url: "",
      issued_at: "",
    });

    setEditingId(null);
  }

  function startEdit(certificate) {
    setMessage("");
    setError("");

    setEditingId(certificate.id);

    setForm({
      certificate_name: certificate.certificate_name || "",
      issuing_organization:
        certificate.issuing_organization || "",
      certificate_url: certificate.certificate_url || "",
      issued_at: certificate.issued_at
        ? String(certificate.issued_at).slice(0, 10)
        : "",
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

    if (!form.certificate_name.trim()) {
      setError("Certificate name is required.");
      return;
    }

    if (!form.issuing_organization.trim()) {
      setError("Issuing organization is required.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        certificate_name: form.certificate_name.trim(),
        issuing_organization:
          form.issuing_organization.trim(),
        certificate_url:
          form.certificate_url.trim() || null,
        issued_at: form.issued_at || null,
      };

      if (editingId) {
        const response = await api.patch(
          `/freelancers/certificates/${editingId}`,
          payload
        );

        setMessage(
          response.data.message ||
            "Certificate updated successfully."
        );
      } else {
        const response = await api.post(
          "/freelancers/certificates",
          payload
        );

        setMessage(
          response.data.message ||
            "Certificate added successfully."
        );
      }

      resetForm();
      await loadCertificates();
    } catch (err) {
      console.error("Save certificate error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to save certificate."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(certificateId) {
    const confirmed = window.confirm(
      "Are you sure you want to remove this certificate?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      const response = await api.delete(
        `/freelancers/certificates/${certificateId}`
      );

      setMessage(
        response.data.message ||
          "Certificate deleted successfully."
      );

      if (editingId === certificateId) {
        resetForm();
      }

      await loadCertificates();
    } catch (err) {
      console.error("Delete certificate error:", err);

      setError(
        err.response?.data?.message ||
          "Failed to delete certificate."
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

 

  function renderCertificateCard(certificate) {
    
    return e(
      "div",
      {
        className: "certificate-card",
        key: certificate.id,
      },

      e(
        "div",
        { className: "certificate-card-top" },

        e(
          "div",
          { className: "certificate-main" },

          e(
            "h3",
            null,
            certificate.certificate_name
          ),

          e(
            "p",
            { className: "certificate-organization" },
            certificate.issuing_organization
          )
        ),

       
      ),

      e(
        "div",
        { className: "certificate-details" },

        e(
          "div",
          { className: "certificate-detail" },

          e(
            "span",
            { className: "certificate-detail-label" },
            "Issued"
          ),

          e(
            "span",
            { className: "certificate-detail-value" },
            formatDate(certificate.issued_at)
          )
        ),

        certificate.certificate_url
          ? e(
              "div",
              { className: "certificate-detail" },

              e(
                "span",
                { className: "certificate-detail-label" },
                "Certificate"
              ),

              e(
                "a",
                {
                  href: certificate.certificate_url,
                  target: "_blank",
                  rel: "noopener noreferrer",
                  className: "certificate-link",
                },
                "View Certificate ↗"
              )
            )
          : null
      ),

      e(
        "div",
        { className: "certificate-actions" },

        e(
          "button",
          {
            type: "button",
            className: "certificate-edit-button",
            onClick: () => startEdit(certificate),
          },
          "Edit"
        ),

        e(
          "button",
          {
            type: "button",
            className: "certificate-delete-button",
            onClick: () =>
              handleDelete(certificate.id),
          },
          "Remove"
        )
      )
    );
  }

  if (loading) {
    return e(
      "div",
      { className: "freelancer-certificates-page" },

      e(
        "div",
        { className: "certificates-loading" },
        "Loading certificates..."
      )
    );
  }

  return e(
    "div",
    { className: "freelancer-certificates-page" },

    e(
      "div",
      { className: "certificates-header" },

      e(
        "button",
        {
          type: "button",
          className: "certificates-back-button",
          onClick: () => navigate("/freelancer/profile"),
        },
        "← Back to Profile"
      ),

      e(
        "div",
        { className: "certificates-heading" },

        e(
          "p",
          { className: "certificates-eyebrow" },
          "FREELANCER PROFILE"
        ),

        e(
          "h1",
          null,
          "Certificates"
        ),

        e(
          "p",
          { className: "certificates-subtitle" },
          "Showcase your professional certifications and credentials."
        )
      )
    ),

    message
      ? e(
          "div",
          { className: "certificates-message success" },
          message
        )
      : null,

    error
      ? e(
          "div",
          { className: "certificates-message error" },
          error
        )
      : null,

    e(
      "div",
      { className: "certificates-content" },

      e(
        "section",
        { className: "certificate-form-card" },

        e(
          "div",
          { className: "certificate-form-heading" },

          e(
            "div",
            null,

            e(
              "p",
              { className: "certificate-form-eyebrow" },
              editingId ? "EDIT CERTIFICATE" : "ADD CERTIFICATE"
            ),

            e(
              "h2",
              null,
              editingId
                ? "Update your certificate"
                : "Add a certificate"
            )
          )
        ),

        e(
          "form",
          {
            className: "certificate-form",
            onSubmit: handleSubmit,
          },

          e(
            "div",
            { className: "certificate-form-row" },

            e(
              "div",
              { className: "certificate-field" },

              e(
                "label",
                { htmlFor: "certificate_name" },
                "Certificate Name"
              ),

              e("input", {
                id: "certificate_name",
                name: "certificate_name",
                type: "text",
                value: form.certificate_name,
                onChange: handleChange,
                placeholder: "e.g. AWS Certified Cloud Practitioner",
              })
            ),

            e(
              "div",
              { className: "certificate-field" },

              e(
                "label",
                { htmlFor: "issuing_organization" },
                "Issuing Organization"
              ),

              e("input", {
                id: "issuing_organization",
                name: "issuing_organization",
                type: "text",
                value: form.issuing_organization,
                onChange: handleChange,
                placeholder: "e.g. Amazon Web Services",
              })
            )
          ),

          e(
            "div",
            { className: "certificate-form-row" },

            e(
              "div",
              { className: "certificate-field" },

              e(
                "label",
                { htmlFor: "issued_at" },
                "Issued Date"
              ),

              e("input", {
                id: "issued_at",
                name: "issued_at",
                type: "date",
                value: form.issued_at,
                onChange: handleChange,
              })
            ),

            e(
              "div",
              { className: "certificate-field" },

              e(
                "label",
                { htmlFor: "certificate_url" },
                "Certificate URL"
              ),

              e("input", {
                id: "certificate_url",
                name: "certificate_url",
                type: "url",
                value: form.certificate_url,
                onChange: handleChange,
                placeholder: "https://...",
              })
            )
          ),

         

          e(
            "div",
            { className: "certificate-form-actions" },

            editingId
              ? e(
                  "button",
                  {
                    type: "button",
                    className: "certificate-cancel-button",
                    onClick: resetForm,
                  },
                  "Cancel"
                )
              : null,

            e(
              "button",
              {
                type: "submit",
                className: "certificate-save-button",
                disabled: saving,
              },
              saving
                ? "Saving..."
                : editingId
                ? "Update Certificate"
                : "Add Certificate"
            )
          )
        )
      ),

      e(
        "section",
        { className: "certificates-list-section" },

        e(
          "div",
          { className: "certificates-list-heading" },

          e(
            "div",
            null,

            e(
              "p",
              { className: "certificate-form-eyebrow" },
              "YOUR CERTIFICATES"
            ),

            e(
              "h2",
              null,
              certificates.length
                ? "Professional credentials"
                : "No certificates yet"
            )
          ),

          certificates.length
            ? e(
                "span",
                { className: "certificate-count" },
                `${certificates.length} ${
                  certificates.length === 1
                    ? "certificate"
                    : "certificates"
                }`
              )
            : null
        ),

        certificates.length === 0
          ? e(
              "div",
              { className: "certificates-empty-state" },

              e(
                "div",
                { className: "certificates-empty-icon" },
                "✦"
              ),

              e(
                "h3",
                null,
                "Build your credibility"
              ),

              e(
                "p",
                null,
                "Add your professional certifications to strengthen your freelancer profile."
              )
            )
          : e(
              "div",
              { className: "certificates-list" },
              certificates.map(renderCertificateCard)
            )
      )
    )
  );
}

export default FreelancerCertificates;