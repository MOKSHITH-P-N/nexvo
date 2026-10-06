import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/auth/Login.js";
import Register from "./pages/auth/Register.js";

// -------------------------
// Client pages
// -------------------------
import ClientDashboard from "./pages/client/ClientDashboard.js";
import ClientProjects from "./pages/client/ClientProjects.js";
import CreateProject from "./pages/client/CreateProject.js";
import ProjectDetails from "./pages/client/ProjectDetails.js";
import ProjectCandidates from "./pages/client/ProjectCandidates.js";

// -------------------------
// Freelancer pages
// -------------------------
import FreelancerDashboard from "./pages/freelancer/FreelancerDashboard.js";
import FreelancerProfile from "./pages/freelancer/FreelancerProfile.js";
import FreelancerSkills from "./pages/freelancer/FreelancerSkills.js";
import FreelancerEducation from "./pages/freelancer/FreelancerEducation.js";
import FreelancerExperience from "./pages/freelancer/FreelancerExperience.js";
import FreelancerCertificates from "./pages/freelancer/FreelancerCertificates.js";
import FreelancerInternships from "./pages/freelancer/FreelancerInternships.js";
import FreelancerOpenSource from "./pages/freelancer/FreelancerOpenSource.js";
import FreelancerHackathons from "./pages/freelancer/FreelancerHackathons.js";
import FreelancerPortfolio from "./pages/freelancer/FreelancerPortfolio.js";
import FreelancerAssessment from "./pages/freelancer/assessment/FreelancerAssessment";
import FreelancerProjects from "./pages/freelancer/FreelancerProjects.js";
import FreelancerProjectDetails from "./pages/freelancer/FreelancerProjectDetails.js";


function App() {
  return React.createElement(
    BrowserRouter,
    null,

    React.createElement(
      Routes,
      null,

      // =====================================================
      // AUTHENTICATION
      // =====================================================

      React.createElement(Route, {
        path: "/login",
        element: React.createElement(Login),
      }),

      React.createElement(Route, {
        path: "/register",
        element: React.createElement(Register),
      }),


      // =====================================================
      // CLIENT
      // =====================================================

      // Client Dashboard
      React.createElement(Route, {
        path: "/client",
        element: React.createElement(ClientDashboard),
      }),

      // My Projects
      React.createElement(Route, {
        path: "/client/projects",
        element: React.createElement(ClientProjects),
      }),

      // Create Project
      React.createElement(Route, {
        path: "/client/projects/create",
        element: React.createElement(CreateProject),
      }),

      // Project Candidates
      React.createElement(Route, {
        path: "/client/projects/:id/candidates",
        element: React.createElement(ProjectCandidates),
      }),

      // Project Details
      React.createElement(Route, {
        path: "/client/projects/:id",
        element: React.createElement(ProjectDetails),
      }),


      // =====================================================
      // FREELANCER
      // =====================================================

      // Freelancer Dashboard
      React.createElement(Route, {
        path: "/freelancer",
        element: React.createElement(FreelancerDashboard),
      }),

      // Freelancer Profile
      React.createElement(Route, {
        path: "/freelancer/profile",
        element: React.createElement(FreelancerProfile),
      }),

      // Skills
      React.createElement(Route, {
        path: "/freelancer/profile/skills",
        element: React.createElement(FreelancerSkills),
      }),

      // Education
      React.createElement(Route, {
        path: "/freelancer/profile/education",
        element: React.createElement(FreelancerEducation),
      }),

      // Experience
      React.createElement(Route, {
        path: "/freelancer/profile/experience",
        element: React.createElement(FreelancerExperience),
      }),

      // Certificates
      React.createElement(Route, {
        path: "/freelancer/profile/certificates",
        element: React.createElement(FreelancerCertificates),
      }),

      // Internships
      React.createElement(Route, {
        path: "/freelancer/profile/internships",
        element: React.createElement(FreelancerInternships),
      }),

      // Open Source
      React.createElement(Route, {
        path: "/freelancer/profile/open-source",
        element: React.createElement(FreelancerOpenSource),
      }),

      // Hackathons
      React.createElement(Route, {
        path: "/freelancer/profile/hackathons",
        element: React.createElement(FreelancerHackathons),
      }),

      // Portfolio
      React.createElement(Route, {
        path: "/freelancer/profile/portfolio",
        element: React.createElement(FreelancerPortfolio),
      }),

      // Assessments
      React.createElement(Route, {
        path: "/freelancer/assessments",
        element: React.createElement(FreelancerAssessment),
      }),

      // Freelancer Projects
      React.createElement(Route, {
        path: "/freelancer/projects",
        element: React.createElement(FreelancerProjects),
      }),

      // Freelancer Project Details
      React.createElement(Route, {
        path: "/freelancer/projects/:id",
        element: React.createElement(FreelancerProjectDetails),
      }),


      // =====================================================
      // DEFAULT
      // =====================================================

      React.createElement(Route, {
        path: "/",
        element: React.createElement(Navigate, {
          to: "/login",
          replace: true,
        }),
      }),

      // =====================================================
      // UNKNOWN ROUTES
      // =====================================================

      React.createElement(Route, {
        path: "*",
        element: React.createElement(Navigate, {
          to: "/login",
          replace: true,
        }),
      })
    )
  );
}

export default App;