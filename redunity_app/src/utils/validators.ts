/**
 * Form validation utilities
 */

export const validatePhoneNumber = (phone: string): { valid: boolean; error?: string } => {
  if (!phone || phone.trim() === '') {
    return { valid: false, error: 'Phone number is required' };
  }
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length < 10) {
    return { valid: false, error: 'Phone number must be at least 10 digits' };
  }
  
  if (cleaned.length > 13) {
    return { valid: false, error: 'Phone number is too long' };
  }
  
  // Matches 03xx-xxxxxxx, +923xx-xxxxxxx, 923xx-xxxxxxx, or 3xxxxxxxxx
  const pakistanPhoneRegex = /^(?:92|0)?3\d{9}$/;
  if (!pakistanPhoneRegex.test(cleaned)) {
    return { valid: false, error: 'Please enter a valid Pakistan phone number (e.g., 03001234567)' };
  }
  
  return { valid: true };
};

export const validateName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Name is required' };
  }
  
  if (name.trim().length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters' };
  }
  
  if (name.trim().length > 50) {
    return { valid: false, error: 'Name must be less than 50 characters' };
  }
  
  if (!/^[a-zA-Z\s]+$/.test(name.trim())) {
    return { valid: false, error: 'Name should only contain letters' };
  }
  
  return { valid: true };
};

export const validateBloodGroup = (bloodGroup: string): { valid: boolean; error?: string } => {
  const validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  
  if (!bloodGroup) {
    return { valid: false, error: 'Blood group is required' };
  }
  
  if (!validGroups.includes(bloodGroup)) {
    return { valid: false, error: 'Please select a valid blood group' };
  }
  
  return { valid: true };
};

export const validateCity = (city: string): { valid: boolean; error?: string } => {
  if (!city || city.trim() === '') {
    return { valid: false, error: 'City is required' };
  }
  
  if (city.trim().length < 2) {
    return { valid: false, error: 'City name must be at least 2 characters' };
  }
  
  return { valid: true };
};

export const validateRedUnityId = (redunityId: string): { valid: boolean; error?: string } => {
  if (!redunityId || redunityId.trim() === '') {
    return { valid: false, error: 'RedUnity ID is required' };
  }
  
  if (redunityId.trim().length < 3) {
    return { valid: false, error: 'RedUnity ID must be at least 3 characters' };
  }
  
  if (redunityId.trim().length > 20) {
    return { valid: false, error: 'RedUnity ID must be less than 20 characters' };
  }
  
  if (!/^[a-zA-Z0-9]+$/.test(redunityId.trim())) {
    return { valid: false, error: 'RedUnity ID should only contain letters and numbers' };
  }
  
  return { valid: true };
};

export const validateOTP = (otp: string): { valid: boolean; error?: string } => {
  if (!otp || otp.trim() === '') {
    return { valid: false, error: 'OTP is required' };
  }
  
  if (!/^\d{6}$/.test(otp.trim())) {
    return { valid: false, error: 'OTP must be 6 digits' };
  }
  
  return { valid: true };
};

export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  
  return { valid: true };
};

export const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (!password || password.trim() === '') {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }
  
  return { valid: true };
};

export const validateRequired = (value: string, fieldName: string): { valid: boolean; error?: string } => {
  if (!value || value.trim() === '') {
    return { valid: false, error: `${fieldName} is required` };
  }
  
  return { valid: true };
};