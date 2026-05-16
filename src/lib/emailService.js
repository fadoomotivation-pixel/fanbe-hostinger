
// Simulated EmailJS Integration

const EMAIL_LOGS_KEY = 'crm_email_logs';
const NOTIFICATION_SETTINGS_KEY = 'crm_notification_settings';

// Default Settings
const defaultSettings = {
  triggers: {
    leadAssignment: true,
    leadStatusChange: true,
    leadReassignment: true,
    siteVisitScheduled: true,
    bookingConfirmation: true,
    employeeSuspension: true,
    dailyDigest: true,
    weeklyReport: true,
    passwordReset: true,
    employeeCredentials: true // Added
  },
  frequency: 'immediate'
};

export const getNotificationSettings = () => {
  const settings = localStorage.getItem(NOTIFICATION_SETTINGS_KEY);
  return settings ? JSON.parse(settings) : defaultSettings;
};

export const saveNotificationSettings = (settings) => {
  localStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings));
};

export const getEmailLogs = () => {
  const logs = localStorage.getItem(EMAIL_LOGS_KEY);
  return logs ? JSON.parse(logs) : [];
};

export const logEmailAttempt = (data) => {
  const logs = getEmailLogs();
  const newLog = {
    id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    ...data
  };
  // Keep last 100 emails
  const updatedLogs = [newLog, ...logs].slice(0, 100);
  localStorage.setItem(EMAIL_LOGS_KEY, JSON.stringify(updatedLogs));
  return newLog;
};

export const sendEmail = async ({ recipientEmail, subject, templateName, templateParams }) => {
  console.log(`[Email Service] Sending '${templateName}' to ${recipientEmail}...`);
  
  let content = "Default Email Content";

  // --- Template Logic ---
  if (templateName === 'leadAssignment') {
    content = `
      Hello ${templateParams.employeeName},
      You have been assigned ${templateParams.count} new lead(s).
      Source: ${templateParams.leadSource}
    `;
  } else if (templateName === 'passwordResetCode') {
    content = `
      Hello ${templateParams.name},
      
      You have requested to reset your password.
      Your verification code is: ${templateParams.code}
      
      This code will expire in 10 minutes.
      If you did not request this, please ignore this email.
    `;
  } else if (templateName === 'passwordResetSuccess') {
    content = `
      Hello ${templateParams.name},
      
      Your password has been successfully reset.
      You can now login with your new credentials.
    `;
  } else if (templateName === 'employeeCredentials') {
    content = `
      Hello ${templateParams.name},
      
      Welcome to Fanbe Developer CRM!
      
      Here are your login credentials:
      Username: ${templateParams.username}
      Password: ${templateParams.password}
      
      Login URL: https://fanbegroup.com/crm/login
      
      Please login and change your password immediately for security.
      
      Best regards,
      Fanbe Admin Team
    `;
  }

  const settings = getNotificationSettings();
  if (settings.triggers && settings.triggers[templateName] === false) {
    console.log(`[Email Service] Skipped: ${templateName} is disabled.`);
    return { success: false, status: 'Skipped' };
  }

  // Simulate Network Delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  const result = {
    recipient: recipientEmail,
    subject,
    template: templateName,
    status: 'Sent',
    contentPreview: content.substring(0, 150) + '...'
  };

  logEmailAttempt(result);
  console.log(`[Email Service] Email Sent Successfully:`, result);
  return { success: true, message: 'Email sent successfully via simulated service.' };
};
