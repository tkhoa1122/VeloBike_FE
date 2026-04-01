/**
 * Giải payload JWT (không verify chữ ký) — chỉ để lấy user id khi store chưa hydrate.
 * BE VeloBike: TokenService embed { id: userId }.
 */
export function decodeUserIdFromJwt(accessToken: string | null | undefined): string {
  if (!accessToken) return '';
  try {
    const parts = accessToken.split('.');
    if (parts.length < 2) return '';
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad) base64 += '='.repeat(4 - pad);
    const json =
      typeof atob !== 'undefined'
        ? atob(base64)
        : ''; // Hermes có atob
    if (!json) return '';
    const payload = JSON.parse(json) as Record<string, unknown>;
    return String(payload.id ?? payload.sub ?? payload.userId ?? payload._id ?? '');
  } catch {
    return '';
  }
}
