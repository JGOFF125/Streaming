type RoomError = { code?: unknown; message?: unknown };
function fields(error: unknown): RoomError {
  return error && typeof error === 'object' ? error as RoomError : {};
}

export function isRoomApprovalRequired(error: unknown): boolean {
  const value = fields(error);
  return value.code === '42501'
    && value.message === 'Orbit access has not been granted to this account';
}

/** Map known backend errors to safe, actionable text; never echo raw SQL details. */
export function roomErrorMessage(error: unknown): string {
  if (isRoomApprovalRequired(error)) {
    return 'You are signed in, but this account is not approved for Orbit rooms yet. Ask the Orbit owner to approve it, then check room access again.';
  }
  const { code } = fields(error);
  if (code === '42501') {
    return 'Room permissions need attention on the server. Ask the Orbit owner to check the backend setup.';
  }
  if (code === 'PGRST202' || code === 'PGRST205' || code === '42P01' || code === '42883' || code === '3F000') {
    return 'The room server setup is incomplete. Ask the Orbit owner to check the room database migration.';
  }
  if (code === 'PGRST301' || code === 'PGRST302' || code === 'PGRST303' || code === '28000') {
    return 'Your Orbit session could not be verified. Sign out and sign in again.';
  }
  if (code === '429' || code === 'PGRST003' || (typeof code === 'string' && code.startsWith('53'))) {
    return 'The room server is busy. Please wait briefly and try again.';
  }
  return 'The room request could not be completed. Check your connection and try again. If it continues, ask the Orbit owner to check the backend.';
}
