import fs from 'fs';
import DiagramAnalyzer from './diagramAnalyzer.js';
import ThreatAnalyzer from './threatAnalyzer.js';
import jobService from './jobService.js';

class JobProcessor {
  constructor() {
    this.processing = new Set();
  }

  async processJob(jobId, systemName, imagePath) {
    // Prevent duplicate processing
    if (this.processing.has(jobId)) {
      console.log(`⚠️ Job ${jobId} is already being processed`);
      return;
    }

    this.processing.add(jobId);
    console.log(`🚀 Starting background processing for job: ${jobId}`);

    try {
      // Update status to processing
      jobService.updateJobStatus(jobId, 'processing');

      // Step 1: Analyze diagram
      const diagramAnalyzer = new DiagramAnalyzer();
      const architecture = await diagramAnalyzer.analyzeDiagram(imagePath);

      // Step 2: Analyze threats
      const threatAnalyzer = new ThreatAnalyzer();
      const report = await threatAnalyzer.analyzeThreats(systemName, architecture);

      // Convert image to base64 for storage
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(imagePath);
      const imageDataUrl = `data:${mimeType};base64,${base64Image}`;

      // Prepare result data
      const resultData = {
        ...report,
        diagram_image: imageDataUrl
      };

      // Update job with results
      jobService.updateJobStatus(jobId, 'completed', { result_data: resultData });

      // Cleanup uploaded file
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }

      console.log(`✅ Job ${jobId} completed successfully`);

    } catch (error) {
      console.error(`❌ Job ${jobId} failed:`, error);
      
      // Update job with error
      jobService.updateJobStatus(jobId, 'failed', {
        error_message: error.message || 'Analysis failed'
      });

      // Cleanup uploaded file on error
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } finally {
      this.processing.delete(jobId);
    }
  }

  getMimeType(filePath) {
    const ext = filePath.split('.').pop().toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif'
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  // Start processing a job in the background
  startJob(jobId, systemName, imagePath) {
    // Run in background without awaiting
    this.processJob(jobId, systemName, imagePath).catch(err => {
      console.error(`Unhandled error in job ${jobId}:`, err);
    });
  }
}

export default new JobProcessor();
