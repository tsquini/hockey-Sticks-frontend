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
