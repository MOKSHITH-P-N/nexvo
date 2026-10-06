const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const skillRoutes = require('./routes/skillRoutes');
const freelancerRoutes = require('./routes/freelancerRoutes');
const assessmentRoutes = require('./routes/assessmentRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const educationLevelRoutes = require('./routes/educationLevelRoutes');

const {
    startProjectStatusScheduler
} = require('./services/projectStatusService');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/freelancers', freelancerRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/education-levels', educationLevelRoutes);

startProjectStatusScheduler();

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'NEXVO backend is running'
    });
});

module.exports = app;