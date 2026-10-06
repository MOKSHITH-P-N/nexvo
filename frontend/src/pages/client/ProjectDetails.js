import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import api from '../../services/api';

import './ProjectDetails.css';

/* =========================================================
   PROJECT DETAILS PAGE
   ========================================================= */

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    /* =========================================================
       FETCH PROJECT
       ========================================================= */

    useEffect(() => {
        const fetchProject = async () => {
            try {
                setLoading(true);
                setError('');

                const response = await api.get(`/projects/${id}`);

                const projectData =
                    response.data?.project || response.data;

                setProject(projectData);
            } catch (err) {
                console.error('Error fetching project:', err);

                setError(
                    err.response?.data?.message ||
                    'Failed to load project details.'
                );
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProject();
        }
    }, [id]);

    /* =========================================================
       LOADING
       ========================================================= */

    if (loading) {
        return React.createElement(
            'div',
            {
                className: 'project-details-loading'
            },
            'Loading project details...'
        );
    }

    /* =========================================================
       ERROR
       ========================================================= */

    if (error) {
        return React.createElement(
            'div',
            {
                className: 'project-details-page'
            },

            React.createElement(
                'div',
                {
                    className: 'project-details-error'
                },

                React.createElement(
                    'p',
                    null,
                    error
                ),

                React.createElement(
                    'button',
                    {
                        type: 'button',
                        onClick: () => navigate(-1)
                    },
                    'Go Back'
                )
            )
        );
    }

    /* =========================================================
       PROJECT NOT FOUND
       ========================================================= */

    if (!project) {
        return React.createElement(
            'div',
            {
                className: 'project-details-page'
            },

            React.createElement(
                'div',
                {
                    className: 'project-details-error'
                },

                React.createElement(
                    'p',
                    null,
                    'Project not found.'
                ),

                React.createElement(
                    'button',
                    {
                        type: 'button',
                        onClick: () => navigate(-1)
                    },
                    'Go Back'
                )
            )
        );
    }

    /* =========================================================
       HELPERS
       ========================================================= */

    const formatDate = (date) => {
        if (!date) {
            return 'Not specified';
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return 'Not specified';
        }

        return parsedDate.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (date) => {
        if (!date) {
            return 'Not specified';
        }

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return 'Not specified';
        }

        return parsedDate.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatBudget = (amount) => {
        if (
            amount === null ||
            amount === undefined ||
            amount === ''
        ) {
            return 'Not specified';
        }

        const number = Number(amount);

        if (Number.isNaN(number)) {
            return amount;
        }

        return `₹${number.toLocaleString('en-IN')}`;
    };

    const getStatusClass = (status) => {
        if (!status) {
            return 'status-default';
        }

        return `status-${String(status).toLowerCase()}`;
    };

    /* =========================================================
       PROJECT ACTIONS
       ========================================================= */

    const handleHireFreelancer = () => {
        navigate(`/client/projects/${project.id}/candidates`);
    };

    const handleCancelProject = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to cancel this project? This action cannot be undone.'
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(true);
            setError('');

            await api.patch(`/projects/${project.id}/cancel`);

            setProject((previousProject) => ({
                ...previousProject,
                status: 'CANCELLED'
            }));
        } catch (err) {
            console.error('Error cancelling project:', err);

            setError(
                err.response?.data?.message ||
                'Failed to cancel the project.'
            );
        } finally {
            setActionLoading(false);
        }
    };

    /* =========================================================
       SKILLS
       ========================================================= */

    const skills = Array.isArray(project.skills)
        ? project.skills
        : [];

    const getSkillName = (skill) => {
        if (typeof skill === 'string') {
            return skill;
        }

        if (!skill || typeof skill !== 'object') {
            return '';
        }

        return (
            skill.name ||
            skill.skill_name ||
            skill.skillName ||
            skill.title ||
            ''
        );
    };

    const getSkillWeight = (skill) => {
        if (!skill || typeof skill !== 'object') {
            return null;
        }

        if (
            skill.weight === null ||
            skill.weight === undefined ||
            skill.weight === ''
        ) {
            return null;
        }

        return skill.weight;
    };

    /* =========================================================
       PROJECT DATA
       ========================================================= */

    const status = project.status || 'UNKNOWN';

    const budgetMin = formatBudget(project.budget_min);
    const budgetMax = formatBudget(project.budget_max);

    let budgetText = 'Not specified';

    if (
        budgetMin !== 'Not specified' &&
        budgetMax !== 'Not specified'
    ) {
        budgetText = `${budgetMin} - ${budgetMax}`;
    } else if (budgetMin !== 'Not specified') {
        budgetText = budgetMin;
    } else if (budgetMax !== 'Not specified') {
        budgetText = budgetMax;
    }

    /* =========================================================
       ACTION VISIBILITY
       ========================================================= */

    const canHire =
        status === 'OPEN';

    const canCancel =
        status === 'OPEN' ||
        status === 'IN_PROGRESS';

    /* =========================================================
       HEADER
       ========================================================= */

    const actionButtons = [];

    if (canHire) {
        actionButtons.push(
            React.createElement(
                'button',
                {
                    key: 'hire',
                    type: 'button',
                    className: 'project-hire-button',
                    onClick: handleHireFreelancer,
                    disabled: actionLoading
                },
                'Hire Freelancer'
            )
        );
    }

    if (canCancel) {
        actionButtons.push(
            React.createElement(
                'button',
                {
                    key: 'cancel',
                    type: 'button',
                    className: 'project-cancel-button',
                    onClick: handleCancelProject,
                    disabled: actionLoading
                },
                actionLoading
                    ? 'Cancelling...'
                    : 'Cancel Project'
            )
        );
    }

    const header = React.createElement(
        'div',
        {
            className: 'project-details-header'
        },

        React.createElement(
            'button',
            {
                type: 'button',
                className: 'project-back-button',
                onClick: () => navigate(-1)
            },
            '← Back'
        ),

        React.createElement(
            'div',
            {
                className: 'project-details-actions'
            },
            actionButtons
        )
    );

    /* =========================================================
       INTRO
       ========================================================= */

    const intro = React.createElement(
        'div',
        {
            className: 'project-details-intro'
        },

        React.createElement(
            'div',
            {
                className: 'project-details-status-row'
            },

            React.createElement(
                'span',
                {
                    className: `project-status ${getStatusClass(status)}`
                },
                status
            )
        ),

        React.createElement(
            'h1',
            {
                className: 'project-details-title'
            },
            project.title || 'Untitled Project'
        ),

        React.createElement(
            'div',
            {
                className: 'project-description'
            },
            project.description ||
                'No project description available.'
        )
    );

    /* =========================================================
       INFO CARDS
       ========================================================= */

    const infoGrid = React.createElement(
        'div',
        {
            className: 'project-info-grid'
        },

        React.createElement(
            'div',
            {
                className: 'project-info-card'
            },

            React.createElement(
                'div',
                {
                    className: 'project-info-label'
                },
                'Budget'
            ),

            React.createElement(
                'div',
                {
                    className: 'project-info-value'
                },
                budgetText
            )
        ),

        React.createElement(
            'div',
            {
                className: 'project-info-card'
            },

            React.createElement(
                'div',
                {
                    className: 'project-info-label'
                },
                'Application Opens'
            ),

            React.createElement(
                'div',
                {
                    className: 'project-info-value'
                },
                formatDateTime(project.application_open_at)
            )
        ),

        React.createElement(
            'div',
            {
                className: 'project-info-card'
            },

            React.createElement(
                'div',
                {
                    className: 'project-info-label'
                },
                'Application Closes'
            ),

            React.createElement(
                'div',
                {
                    className: 'project-info-value'
                },
                formatDateTime(project.application_close_at)
            )
        ),

        React.createElement(
            'div',
            {
                className: 'project-info-card'
            },

            React.createElement(
                'div',
                {
                    className: 'project-info-label'
                },
                'Deadline'
            ),

            React.createElement(
                'div',
                {
                    className: 'project-info-value'
                },
                formatDate(project.deadline)
            )
        )
    );

    /* =========================================================
       REQUIRED SKILLS
       ========================================================= */

    const skillElements = skills
        .map((skill, index) => {
            const name = getSkillName(skill);

            if (!name) {
                return null;
            }

            const weight = getSkillWeight(skill);

            return React.createElement(
                'div',
                {
                    className: 'project-skill-item',
                    key: skill.id || `${name}-${index}`
                },

                React.createElement(
                    'span',
                    {
                        className: 'project-skill-name'
                    },
                    name
                ),

                weight !== null
                    ? React.createElement(
                          'span',
                          {
                              className: 'project-skill-weight'
                          },
                          `${weight}%`
                      )
                    : null
            );
        })
        .filter(Boolean);

    const skillsSection = React.createElement(
        'section',
        {
            className: 'project-skills-section'
        },

        React.createElement(
            'div',
            {
                className: 'project-section-header'
            },

            React.createElement(
                'h2',
                null,
                'Required Skills'
            ),

            React.createElement(
                'span',
                {
                    className: 'project-section-count'
                },
                `${skillElements.length} ${
                    skillElements.length === 1
                        ? 'skill'
                        : 'skills'
                }`
            )
        ),

        skillElements.length > 0
            ? React.createElement(
                  'div',
                  {
                      className: 'project-skills-list'
                  },
                  skillElements
              )
            : React.createElement(
                  'div',
                  {
                      className: 'project-no-skills'
                  },
                  'No required skills available for this project.'
              )
    );

    /* =========================================================
       AI ANALYSIS
       ========================================================= */

    const aiSection = React.createElement(
        'section',
        {
            className: 'project-ai-section'
        },

        React.createElement(
            'div',
            {
                className: 'project-section-header'
            },

            React.createElement(
                'h2',
                null,
                'AI Project Analysis'
            )
        ),

        React.createElement(
            'div',
            {
                className: 'project-ai-content'
            },

            React.createElement(
                'div',
                {
                    className: 'project-ai-card'
                },

                React.createElement(
                    'div',
                    {
                        className: 'project-ai-label'
                    },
                    'Complexity'
                ),

                React.createElement(
                    'div',
                    {
                        className: 'project-ai-value'
                    },

                    project.complexity !== null &&
                    project.complexity !== undefined
                        ? `${project.complexity}/5`
                        : 'Not available'
                )
            ),

            React.createElement(
                'div',
                {
                    className:
                        'project-ai-card project-ai-reason'
                },

                React.createElement(
                    'div',
                    {
                        className: 'project-ai-label'
                    },
                    'AI Analysis'
                ),

                React.createElement(
                    'div',
                    {
                        className:
                            'project-ai-description'
                    },

                    project.complexity_reason ||
                        'No AI analysis available for this project.'
                )
            )
        )
    );

    /* =========================================================
       MAIN PAGE
       ========================================================= */

    return React.createElement(
        'div',
        {
            className: 'project-details-page'
        },

        React.createElement(
            'div',
            {
                className: 'project-details-container'
            },

            header,
            intro,
            infoGrid,
            skillsSection,
            aiSection
        )
    );
};

export default ProjectDetails;