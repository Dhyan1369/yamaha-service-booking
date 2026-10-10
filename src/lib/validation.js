/**
 * Validation helpers for Bike Service Booking application
 */

// Validate email format
export const validateEmail = (emailStr, isOptional = false) => {
  const clean = (emailStr || '').trim();
  if (!clean) {
    if (isOptional) return { valid: true, message: '' };
    return { valid: false, message: 'Email address is required' };
  }

  // Standard RFC 5322 regex for email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    return { valid: false, message: 'Please enter a valid email address (e.g. kamal@gmail.com)' };
  }
  return { valid: true, message: '' };
};

// Validate Sri Lankan Phone Number (10 digits starting with 0)
export const validatePhone = (phoneStr) => {
  const clean = (phoneStr || '').trim().replace(/[\s-]/g, '');
  if (!clean) return { valid: false, message: 'Phone number is required' };

  const phoneRegex = /^0\d{9}$/;
  if (!phoneRegex.test(clean)) {
    return { valid: false, message: 'Phone number must be exactly 10 digits starting with 0 (e.g. 0771234567)' };
  }
  return { valid: true, message: '' };
};

// Validate Sri Lankan NIC (National ID Card Number)
export const validateNIC = (nicStr) => {
  const clean = (nicStr || '').trim();
  if (!clean) return { valid: false, message: 'NIC ID Card Number is required' };

  // Format 1: 12-digit New NIC (e.g. 199512345678)
  if (/^\d{12}$/.test(clean)) {
    return { valid: true, message: '' };
  }

  // Format 2: 9 digits followed by 'V' or 'X' (e.g. 951234567V)
  if (/^\d{9}[vVxX]$/.test(clean)) {
    return { valid: true, message: '' };
  }

  if (clean.length > 12) {
    return { valid: false, message: 'NIC number cannot exceed 12 characters' };
  }

  if (/^\d+$/.test(clean) && clean.length < 12) {
    return { 
      valid: false, 
      message: 'If NIC is fewer than 12 digits, it must be 9 digits ending with letter "V" (e.g. 951234567V)' 
    };
  }

  return { 
    valid: false, 
    message: 'Invalid NIC format. Must be 9 digits + "V" (e.g. 951234567V) or 12 digits (e.g. 199512345678)' 
  };
};

// Validate Password
export const validatePassword = (passwordStr) => {
  if (!passwordStr || passwordStr.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters long' };
  }
  return { valid: true, message: '' };
};

export const validateBookingData = ({ name, phone, bikeModel, vehicleNo, serviceType, mileage }) => {
  const errors = {};
  if (!name?.trim()) errors.name = 'Customer name is required';
  if (!bikeModel?.trim()) errors.bikeModel = 'Bike model is required';
  if (!vehicleNo?.trim()) errors.vehicleNo = 'Vehicle plate number is required';
  if (!['Free Service', 'Full Service', 'Normal Service'].includes(serviceType)) {
    errors.serviceType = 'Please select a valid service type';
  }

  const phoneCheck = validatePhone(phone);
  if (!phoneCheck.valid) errors.phone = phoneCheck.message;

  if (mileage !== undefined && mileage !== null && String(mileage).trim() !== '') {
    const num = Number(mileage);
    if (isNaN(num) || num < 0) {
      errors.mileage = 'Mileage cannot be negative';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
};

/**
 * bookingSchema – thin wrapper that makes validateBookingData behave like
 * a Zod schema (safeParse API) so bookingService can call it uniformly.
 */
export const bookingSchema = {
  safeParse(data) {
    const result = validateBookingData(data);
    if (result.valid) {
      return { success: true, data };
    }
    return { success: false, error: result.errors };
  },
};
