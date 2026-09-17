/**
 * Phone number formatting utilities for Pakistan
 */

export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle different formats
  if (cleaned.length === 10) {
    // Format: 03001234567 -> 0300-1234567
    return cleaned.replace(/(\d{4})(\d{7})/, '$1-$2');
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    // Format: 03001234567 -> 0300-1234567
    return cleaned.replace(/(\d{4})(\d{7})/, '$1-$2');
  } else if (cleaned.length === 12 && cleaned.startsWith('92')) {
    // Format: 923001234567 -> +92-300-1234567
    return `+${cleaned.replace(/(\d{2})(\d{3})(\d{7})/, '$1-$2-$3')}`;
  } else if (cleaned.length === 13 && cleaned.startsWith('92')) {
    // Format: 923001234567 -> +92-300-1234567
    return `+${cleaned.substring(0, 2)}-${cleaned.substring(2, 5)}-${cleaned.substring(5)}`;
  }
  
  return phone; // Return original if no match
};

export const normalizePhoneNumber = (phone: string): string => {
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Convert to standard format: 3001234567 (10 digits, no leading 0 or 92)
  if (cleaned.length === 10) {
    return cleaned; // Already in correct format
  } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return cleaned.substring(1); // Remove leading 0
  } else if (cleaned.length === 12 && cleaned.startsWith('92')) {
    return cleaned.substring(2); // Remove 92 prefix
  } else if (cleaned.length === 13 && cleaned.startsWith('92')) {
    return cleaned.substring(2); // Remove 92 prefix
  }
  
  return cleaned;
};

export const getPhoneVariants = (phone: string): string[] => {
  const normalized = normalizePhoneNumber(phone);
  const variants = [
    phone, // Original
    normalized, // Normalized (10 digits)
    `0${normalized}`, // With leading 0
    `92${normalized}`, // With 92 prefix
    `+92${normalized}`, // With +92 prefix
    phone.replace(/\D/g, ''), // Just digits from original
  ];
  
  // Remove duplicates and filter empty strings
  return Array.from(new Set(variants.filter(Boolean)));
};

export const generateRedUnityId = (name: string): string => {
  // Generate a RedUnity ID based on name
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const randomString = Math.random().toString(36).substring(2, 6);
  return `${cleanName}${randomString}`;
};

export const parseDate = (date: any): Date | null => {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (typeof date?.toDate === 'function') return date.toDate();
  if (typeof date?.seconds === 'number') return new Date(date.seconds * 1000);
  if (typeof date === 'string' || typeof date === 'number') {
    const d = new Date(date);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

export const formatDate = (date: any): string => {
  const d = parseDate(date);
  if (!d) return 'Recently';
  return d.toLocaleDateString('en-PK', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatRelativeTime = (date: any): string => {
  const d = parseDate(date);
  if (!d) return 'recently';
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  if (diffMs < 0) return 'Just now';

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatDate(d);
};