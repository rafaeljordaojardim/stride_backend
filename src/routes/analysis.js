import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import jobService from '../services/jobService.js';
import jobProcessor from '../services/jobProcessor.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'diagram-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// POST /api/analysis/analyze
router.post('/analyze', upload.single('diagram'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { systemName } = req.body;
    if (!systemName) {
      return res.status(400).json({ error: 'System name is required' });
    }

    console.log(`🔐 Creating analysis job for: ${systemName}`);
    console.log(`📊 Image: ${req.file.filename}`);

    const imagePath = req.file.path;

    // Create job in database
    const jobId = jobService.createJob(systemName, imagePath);

    // Start background processing
    jobProcessor.startJob(jobId, systemName, imagePath);

    // Return job ID immediately
    res.json({
      success: true,
      jobId: jobId,
      message: 'Analysis job created successfully'
    });

  } catch (error) {
    console.error('Error creating analysis job:', error);
    
    // Cleanup file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create analysis job'
    });
  }
});

// GET /api/analysis/job/:jobId
router.get('/job/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = jobService.getJob(jobId);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Format response based on job status
    const response = {
      success: true,
      jobId: job.id,
      status: job.status,
      systemName: job.system_name,
      createdAt: new Date(job.created_at).toISOString(),
      updatedAt: new Date(job.updated_at).toISOString()
    };

    if (job.status === 'completed' && job.result_data) {
      response.data = job.result_data;
    } else if (job.status === 'failed' && job.error_message) {
      response.error = job.error_message;
    }

    res.json(response);

  } catch (error) {
    console.error('Error fetching job status:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch job status'
    });
  }
});

// GET /api/analysis/jobs (list all jobs)
router.get('/jobs', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const jobs = jobService.getAllJobs(limit);

    res.json({
      success: true,
      jobs: jobs.map(job => ({
        jobId: job.id,
        systemName: job.system_name,
        status: job.status,
        createdAt: new Date(job.created_at).toISOString(),
        updatedAt: new Date(job.updated_at).toISOString()
      }))
    });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch jobs'
    });
  }
});

// GET /api/analysis/status
router.get('/status', (req, res) => {
  res.json({
    status: 'operational',
    message: 'Analysis service is ready',
    timestamp: new Date().toISOString()
  });
});

export default router;
