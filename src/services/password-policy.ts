export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters.");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must include one uppercase letter.");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must include one lowercase letter.");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must include one number.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertPasswordPolicy(password: string): void {
  const result = validatePassword(password);

  if (!result.valid) {
    throw new Error(result.errors[0]);
  }
}
