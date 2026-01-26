import { v4 as uuidv4 } from 'uuid';
import db from '../database/db.js';

class JobService {
  createJob(systemName, imagePath) {
    const jobId = uuidv4();
    const now = Date.now();
    
    const stmt = db.prepare(`
      INSERT INTO jobs (id, system_name, status, created_at, updated_at, image_path)
      VALUES (?, ?, 'pending', ?, ?, ?)
    `);
    
    stmt.run(jobId, systemName, now, now, imagePath);
    
    console.log(`✅ Created job: ${jobId}`);
    return jobId;
  }

  getJob(jobId) {
    const stmt = db.prepare(`
      SELECT id, system_name, status, created_at, updated_at, 
             image_path, result_data, error_message
      FROM jobs WHERE id = ?
    `);
    
    const job = stmt.get(jobId);
    
    if (job && job.result_data) {
      try {
        job.result_data = JSON.parse(job.result_data);
      } catch (e) {
        console.error('Error parsing result_data:', e);
      }
    }
    
    return job;
  }

  updateJobStatus(jobId, status, data = {}) {
    const now = Date.now();
    const updates = ['status = ?', 'updated_at = ?'];
    const params = [status, now];
    
    if (data.result_data) {
      updates.push('result_data = ?');
      params.push(JSON.stringify(data.result_data));
    }
    
    if (data.error_message) {
      updates.push('error_message = ?');
      params.push(data.error_message);
    }
    
    params.push(jobId);
    
    const stmt = db.prepare(`
      UPDATE jobs 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);
    
    stmt.run(...params);
    console.log(`📝 Updated job ${jobId} to status: ${status}`);
  }

  getAllJobs(limit = 50) {
    const stmt = db.prepare(`
      SELECT id, system_name, status, created_at, updated_at
      FROM jobs
      ORDER BY created_at DESC
      LIMIT ?
    `);
    
    return stmt.all(limit);
  }

  deleteOldJobs(daysOld = 7) {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);
    const stmt = db.prepare(`
      DELETE FROM jobs 
      WHERE created_at < ? AND status IN ('completed', 'failed')
    `);
    
    const result = stmt.run(cutoffTime);
    console.log(`🗑️ Deleted ${result.changes} old jobs`);
    return result.changes;
  }
}

export default new JobService();
