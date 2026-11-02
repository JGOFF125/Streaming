export type LocalRoom = { code: string; createdAt: number };
const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
// This is only a visual prototype, NOT an authenticated or secret invitation code
export function createLocalRoom(random: () => number = Math.random): LocalRoom {
  const code = Array.from({ length: 6 }, () => alphabet[Math.floor(random() * alphabet.length)]).join('');
  return { code, createdAt: Date.now() };
}
export function normalizeRoomCode(input: string): string | null {
  const value = input.trim().toUpperCase();
  return /^[A-HJ-NP-Z2-9]{6}$/.test(value) ? value : null;
}

/** Remote invitations use 12 random characters; retain six-character local demo helpers. */
export function normalizeInvitationCode(input: string): string | null {
  const value = input.replace(/[\s-]/g, '').toUpperCase();
  return /^[A-HJ-NP-Z2-9]{12}$/.test(value) ? value : null;
}
