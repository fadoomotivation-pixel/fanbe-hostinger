
import { staffData } from '@/crm/data/staffData';

const USERS_KEY = 'crm_users';
const DB_VERSION_KEY = 'crm_db_version';
const CURRENT_DB_VERSION = '2.0'; // Updated version for new staff structure
const SALT = 'FANBE_SECURE_SALT_v1';

// --- Hashing Utilities (Simulation) ---
export const hashPassword = (password) => {
  try {
    // Simple base64 encoding with salt for demo purposes
    // In production, use bcrypt or argon2 on server side
    return window.btoa(password + SALT);
  } catch (e) {
    console.error("Hashing failed", e);
    return password;
  }
};

export const decryptPassword = (hash) => {
  try {
    const decoded = window.atob(hash);
    return decoded.replace(SALT, '');
  } catch (e) {
    console.error("Decryption failed", e);
    return "Error decrypting";
  }
};

export const verifyPassword = (inputPassword, storedHash) => {
  return hashPassword(inputPassword) === storedHash;
};

// --- Database Initialization ---
export const initializeUserDatabase = () => {
  const existingVersion = localStorage.getItem(DB_VERSION_KEY);
  const existingUsers = localStorage.getItem(USERS_KEY);
  
  // Force re-initialization if version changed or no users exist
  if (!existingUsers || existingVersion !== CURRENT_DB_VERSION) {
    console.log('Initializing/Updating User Database with hashed credentials...');
    const seededUsers = staffData.map(user => ({
      ...user,
      password: hashPassword(user.password) 
    }));
    localStorage.setItem(USERS_KEY, JSON.stringify(seededUsers));
    localStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
    console.log(`User database updated to version ${CURRENT_DB_VERSION}`);
  }
};

// Force reset database (for admin use)
export const resetUserDatabase = () => {
  console.log('Force resetting user database...');
  localStorage.removeItem(USERS_KEY);
  localStorage.removeItem(DB_VERSION_KEY);
  initializeUserDatabase();
  return true;
};

// --- User Management ---
export const getAllUsers = () => {
  initializeUserDatabase(); 
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
};

export const findUser = (usernameOrEmail) => {
  const users = getAllUsers();
  const search = usernameOrEmail.toLowerCase().trim();
  
  return users.find(u => 
    u.username.toLowerCase() === search || 
    u.email.toLowerCase() === search ||
    u.id.toLowerCase() === search
  );
};

export const updateUserPassword = (userId, newPassword) => {
  const users = getAllUsers();
  const updatedUsers = users.map(u => {
    if (u.id === userId) {
      return { ...u, password: hashPassword(newPassword) };
    }
    return u;
  });
  localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
  return true;
};

// --- Verification Code Management ---
const RESET_CONTEXT_KEY = 'crm_reset_context';

export const generateVerificationCode = (userId) => {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const context = {
    userId,
    code,
    expiresAt: Date.now() + (10 * 60 * 1000), // 10 minutes
    attempts: 0
  };
  localStorage.setItem(RESET_CONTEXT_KEY, JSON.stringify(context));
  return code;
};

export const verifyResetCode = (inputCode) => {
  const contextStr = localStorage.getItem(RESET_CONTEXT_KEY);
  if (!contextStr) return { valid: false, reason: 'Session expired' };
  
  const context = JSON.parse(contextStr);
  
  if (Date.now() > context.expiresAt) {
    return { valid: false, reason: 'Code expired' };
  }
  
  if (context.attempts >= 3) {
    return { valid: false, reason: 'Too many attempts' };
  }
  
  if (context.code !== inputCode) {
    context.attempts += 1;
    localStorage.setItem(RESET_CONTEXT_KEY, JSON.stringify(context));
    return { valid: false, reason: 'Invalid verification code' };
  }
  
  return { valid: true, userId: context.userId };
};

export const clearResetContext = () => {
  localStorage.removeItem(RESET_CONTEXT_KEY);
};
