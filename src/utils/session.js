export function saveTeamSession(team) {
  localStorage.setItem('hs_team', JSON.stringify(team));
}

export function getTeamSession() {
  try {
    return JSON.parse(localStorage.getItem('hs_team'));
  } catch {
    return null;
  }
}

export function clearTeamSession() {
  localStorage.removeItem('hs_team');
}

export function getSessionId() {
  let sid = localStorage.getItem('hs_session_id');
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('hs_session_id', sid);
  }
  return sid;
}
