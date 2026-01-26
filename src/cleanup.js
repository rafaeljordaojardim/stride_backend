import jobService from './services/jobService.js';

// Clean up jobs older than 7 days
const daysOld = process.argv[2] ? parseInt(process.argv[2]) : 7;

console.log(`🗑️ Cleaning up jobs older than ${daysOld} days...`);

const deletedCount = jobService.deleteOldJobs(daysOld);

console.log(`✅ Cleanup complete! Deleted ${deletedCount} old jobs.`);
