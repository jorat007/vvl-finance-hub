/**
 * Maps raw database/API error messages to user-friendly messages.
 * Prevents information leakage of internal schema details.
 */
export function getUserFriendlyError(error: unknown): string {
  const message = (error as any)?.message?.toLowerCase() || '';

  // User management - duplicate mobile/email
  if (message.includes('already been registered') || message.includes('already exists')) {
    return 'This mobile number is already registered. Please use a different mobile number.';
  }
  if (message.includes('duplicate') && message.includes('mobile')) {
    return 'This mobile number is already registered. Please use a different mobile number.';
  }
  if (message.includes('duplicate')) {
    return 'A record with this information already exists.';
  }
  if (message.includes('violates not-null constraint')) {
    return 'A required field is missing. Please fill in all required fields.';
  }
  if (message.includes('check constraint')) {
    return 'One of the values provided is invalid. Please review your input.';
  }
  if (message.includes('foreign key')) {
    return 'This record references data that does not exist or was removed.';
  }
  if (message.includes('row-level security')) {
    return 'You do not have permission to perform this action.';
  }
  if (message.includes('jwt') || message.includes('token')) {
    return 'Your session has expired. Please log in again.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  return 'An unexpected error occurred. Please try again or contact support.';
}
