const OPENING_SESSION_KEY =
  'timepalette_opening_seen_v1';

export function shouldShowOpening() {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return (
      window.sessionStorage.getItem(
        OPENING_SESSION_KEY
      ) !== 'true'
    );
  } catch {
    return true;
  }
}

export function markOpeningSeen() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(
      OPENING_SESSION_KEY,
      'true'
    );
  } catch {
    // sessionStorage が利用できない環境では
    // 何もしない
  }
}

export function resetOpeningSeen() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.removeItem(
      OPENING_SESSION_KEY
    );
  } catch {
    // Ignore storage errors.
  }
}