const https = require('https');

const token = process.env.SUPABASE_ACCESS_TOKEN;
const devRef = process.env.DEV_PROJECT_REF;
const prodRef = process.env.PROD_PROJECT_REF;

async function getAuthConfig(projectRef) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${projectRef}/config/auth`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(data));
        } else {
            reject(new Error(`Failed to fetch config: ${res.statusCode} ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function updateAuthConfig(projectRef, config) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${projectRef}/config/auth`,
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
         if (res.statusCode >= 200 && res.statusCode < 300) {
             resolve(res.statusCode);
         } else {
             reject(new Error(`Failed to update config: ${res.statusCode} ${data}`));
         }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(config));
    req.end();
  });
}

(async () => {
  try {
      console.log("Fetching Dev Email Config...");
      const devConfig = await getAuthConfig(devRef);
      
      // Extract only email template fields to avoid overwriting unrelated auth settings
      const templateConfig = {
        external_email_enabled: devConfig.external_email_enabled,
        mailer_secure_email_change_enabled: devConfig.mailer_secure_email_change_enabled,
        mailer_subjects_confirmation: devConfig.mailer_subjects_confirmation,
        mailer_templates_confirmation_content: devConfig.mailer_templates_confirmation_content,
        mailer_subjects_recovery: devConfig.mailer_subjects_recovery,
        mailer_templates_recovery_content: devConfig.mailer_templates_recovery_content,
        mailer_subjects_invite: devConfig.mailer_subjects_invite,
        mailer_templates_invite_content: devConfig.mailer_templates_invite_content,
        mailer_subjects_email_change: devConfig.mailer_subjects_email_change,
        mailer_templates_email_change_content: devConfig.mailer_templates_email_change_content,
        mailer_subjects_magic_link: devConfig.mailer_subjects_magic_link,
        mailer_templates_magic_link_content: devConfig.mailer_templates_magic_link_content,
      };

      console.log("Applying Email Templates to Prod...");
      const status = await updateAuthConfig(prodRef, templateConfig);
      console.log(`Update finished with status: ${status}`);
  } catch (error) {
      console.error("Script failed:", error.message);
      process.exit(1);
  }
})();