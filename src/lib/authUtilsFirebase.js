// src/lib/authUtilsFirebase.js
import { auth, secondaryAuth, db } from './firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  deleteDoc 
} from 'firebase/firestore';

// ==========================================
// USER MANAGEMENT FUNCTIONS
// ==========================================

/**
 * Initialize Firebase Authentication
 * Called on app startup
 */
export const initializeFirebaseAuth = () => {
  console.log('[Firebase] Authentication initialized');
  return true;
};

/**
 * Login with username/email and password
 */
export const login = async (usernameOrEmail, password) => {
  try {
    console.log(`[Firebase] Login attempt for: ${usernameOrEmail}`);
    
    // Check if input is email or username
    let email = usernameOrEmail;
    
    if (!usernameOrEmail.includes('@')) {
      // It's a username, need to find the email
      const userDoc = await getUserByUsername(usernameOrEmail);
      if (!userDoc) {
        return { success: false, message: 'Username not found' };
      }
      email = userDoc.email;
    }
    
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Get user details from Firestore
    const userDetails = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (!userDetails.exists()) {
      return { success: false, message: 'User data not found' };
    }
    
    const userData = userDetails.data();
    
    // Check if user is active
    if (userData.status !== 'Active') {
      await signOut(auth);
      return { success: false, message: 'Account is suspended. Contact admin.' };
    }
    
    // Update last login
    await updateDoc(doc(db, 'users', userCredential.user.uid), {
      lastLogin: new Date().toISOString()
    });
    
    console.log(`[Firebase] Login successful for ${userData.name}`);
    
    return {
      success: true,
      user: {
        id: userCredential.user.uid,
        username: userData.username,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        permissions: userData.permissions || [],
        lastLogin: new Date().toISOString()
      },
      role: userData.role
    };
    
  } catch (error) {
    console.error('[Firebase] Login error:', error);
    
    if (error.code === 'auth/user-not-found') {
      return { success: false, message: 'User not found' };
    }
    if (error.code === 'auth/wrong-password') {
      return { success: false, message: 'Incorrect password' };
    }
    if (error.code === 'auth/invalid-email') {
      return { success: false, message: 'Invalid email format' };
    }
    if (error.code === 'auth/too-many-requests') {
      return { success: false, message: 'Too many attempts. Try again later.' };
    }
    
    return { success: false, message: 'Login failed. Please try again.' };
  }
};

/**
 * Logout current user
 */
export const logout = async () => {
  try {
    await signOut(auth);
    console.log('[Firebase] User logged out');
    return { success: true };
  } catch (error) {
    console.error('[Firebase] Logout error:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Get user by username
 */
const getUserByUsername = async (username) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return querySnapshot.docs[0].data();
  } catch (error) {
    console.error('[Firebase] Error finding user:', error);
    return null;
  }
};

/**
 * Add new user (Admin only)
 * Creates user in Firebase Auth and Firestore
 * Note: Creating a new user will temporarily sign them in,
 * so we sign them out immediately to restore admin session
 */
export const addUser = async (userData) => {
  try {
    console.log('[Firebase] Creating user:', userData.username);

    // Check if username already exists
    const existingUser = await getUserByUsername(userData.username);
    if (existingUser) {
      console.error('[Firebase] Username already exists:', userData.username);
      return { success: false, message: 'Username already exists' };
    }

    // Store current admin user reference for createdBy field
    const adminUser = auth.currentUser;
    console.log('[Firebase] Current admin:', adminUser?.email);

    // Step 1: Create Firebase Auth user using the SECONDARY auth instance.
    // This prevents the primary auth from switching to the new user,
    // so the admin stays logged in.
    console.log('[Firebase] Step 1: Creating Auth user via secondary app...');
    const userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      userData.email,
      userData.password
    );
    console.log('[Firebase] Auth user created:', userCredential.user.uid);

    // Step 2: Create Firestore document (admin is still authenticated on primary auth)
    console.log('[Firebase] Step 2: Creating Firestore document...');
    const permissions = getDefaultPermissions(userData.role);

    const userDoc = {
      id: userCredential.user.uid,
      username: userData.username.toLowerCase(),
      name: userData.name,
      email: userData.email.toLowerCase(),
      role: userData.role,
      phone: userData.phone || '',
      department: userData.department || 'Sales',
      joiningDate: new Date().toISOString(),
      status: 'Active',
      permissions: permissions,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=0F3A5F&color=fff`,
      metrics: {
        totalLeads: 0,
        totalCalls: 0,
        connectedCalls: 0,
        siteVisits: 0,
        bookings: 0,
        conversionRate: 0,
        revenue: 0
      },
      settings: {
        notifications: true,
        emailAlerts: false,
        whatsappAlerts: true,
        darkMode: false
      },
      createdAt: new Date().toISOString(),
      createdBy: adminUser?.uid || 'system'
    };

    await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);
    console.log('[Firebase] Firestore document created successfully');

    // Step 3: Sign out the new user from the secondary auth instance
    console.log('[Firebase] Step 3: Signing out new user from secondary auth...');
    await signOut(secondaryAuth);
    console.log('[Firebase] New user signed out from secondary auth');
    console.log('[Firebase] Admin session preserved on primary auth');

    return {
      success: true,
      user: userDoc,
      plainPassword: userData.password,
      userId: userCredential.user.uid,
      requiresReauth: false
    };

  } catch (error) {
    console.error('[Firebase] Error creating user:', error);
    console.error('[Firebase] Error code:', error.code);
    console.error('[Firebase] Error message:', error.message);

    // Clean up secondary auth in case of partial failure
    try { await signOut(secondaryAuth); } catch (_) {}

    if (error.code === 'auth/email-already-in-use') {
      return { success: false, message: 'Email already in use' };
    }
    if (error.code === 'auth/invalid-email') {
      return { success: false, message: 'Invalid email format' };
    }
    if (error.code === 'auth/weak-password') {
      return { success: false, message: 'Password too weak (min 6 characters)' };
    }
    if (error.code === 'permission-denied') {
      return { success: false, message: 'Permission denied. Check Firestore rules.' };
    }

    return { success: false, message: error.message || 'Failed to create user' };
  }
};

/**
 * Get all users (Admin only)
 */
export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const querySnapshot = await getDocs(usersRef);
    
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    
    return users;
  } catch (error) {
    console.error('[Firebase] Error getting users:', error);
    return [];
  }
};

/**
 * Update user details
 */
export const updateUser = async (userId, updates) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // Don't allow updating sensitive fields
    const { password, email, ...safeUpdates } = updates;
    
    await updateDoc(userRef, {
      ...safeUpdates,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true };
  } catch (error) {
    console.error('[Firebase] Error updating user:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Delete user
 */
export const deleteUser = async (userId) => {
  try {
    // Delete from Firestore
    await deleteDoc(doc(db, 'users', userId));
    
    // Note: Can't delete from Firebase Auth without admin SDK
    // In production, use Cloud Functions for this
    
    return { success: true };
  } catch (error) {
    console.error('[Firebase] Error deleting user:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Toggle user status (Active/Suspended)
 */
export const toggleUserStatus = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return { success: false, message: 'User not found' };
    }
    
    const currentStatus = userDoc.data().status;
    const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    
    await updateDoc(userRef, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    
    return { success: true, status: newStatus };
  } catch (error) {
    console.error('[Firebase] Error toggling status:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Reset password
 */
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: 'Password reset email sent' };
  } catch (error) {
    console.error('[Firebase] Error sending password reset:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Get default permissions for role
 */
const getDefaultPermissions = (role) => {
  const permissions = {
    super_admin: ['all'],
    manager: ['manage_team', 'assign_leads', 'view_reports', 'manage_properties'],
    sales_executive: ['manage_leads', 'schedule_visits', 'create_bookings', 'make_calls'],
    telecaller: ['call_leads', 'update_status', 'schedule_appointments']
  };
  return permissions[role] || [];
};

/**
 * Generate random secure password
 */
export const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/**
 * Get current user from Firebase Auth
 */
export const getCurrentUser = () => {
  return auth.currentUser;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return auth.currentUser !== null;
};

/**
 * Get user details from Firestore by userId
 */
export const getUserDetails = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      return null;
    }
    
    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error('[Firebase] Error getting user details:', error);
    return null;
  }
};

// ==========================================
// MIGRATION FUNCTIONS (For localStorage → Firebase)
// ==========================================

/**
 * Migrate users from localStorage to Firebase
 * Run this once to transfer existing users
 */
export const migrateUsersToFirebase = async () => {
  try {
    console.log('[Firebase] Starting user migration...');
    
    // Get users from localStorage
    const localUsers = JSON.parse(localStorage.getItem('crm_users') || '[]');
    
    if (localUsers.length === 0) {
      console.log('[Firebase] No users to migrate');
      return { success: true, message: 'No users to migrate' };
    }
    
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };
    
    for (const user of localUsers) {
      try {
        // Generate a temporary password for migration
        const tempPassword = generateRandomPassword();
        
        // Create user
        const result = await addUser({
          username: user.username,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || '',
          department: user.department || 'Sales',
          password: tempPassword
        });
        
        if (result.success) {
          results.success++;
          console.log(`[Firebase] Migrated: ${user.username} (Password: ${tempPassword})`);
        } else {
          results.failed++;
          results.errors.push(`${user.username}: ${result.message}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`${user.username}: ${error.message}`);
      }
    }
    
    console.log('[Firebase] Migration complete:', results);
    return { success: true, ...results };
    
  } catch (error) {
    console.error('[Firebase] Migration error:', error);
    return { success: false, message: error.message };
  }
};
