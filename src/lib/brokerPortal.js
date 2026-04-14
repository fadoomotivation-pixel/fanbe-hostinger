const BROKER_SESSION_KEY = 'fanbe_broker_portal_session';

const VALID_BROKER_USERS = [
  {
    username: 'broker001',
    password: 'Fanbe@123',
    name: 'Broker Demo User',
    brokerId: 'FB-BR-001'
  }
];

export const brokerLogin = (username, password) => {
  const normalizedUsername = username.trim().toLowerCase();
  const match = VALID_BROKER_USERS.find(
    (user) => user.username.toLowerCase() === normalizedUsername && user.password === password
  );

  if (!match) {
    return { success: false, message: 'Invalid broker credentials.' };
  }

  const session = {
    username: match.username,
    name: match.name,
    brokerId: match.brokerId,
    loginAt: new Date().toISOString()
  };

  sessionStorage.setItem(BROKER_SESSION_KEY, JSON.stringify(session));
  return { success: true, user: session };
};

export const getBrokerSession = () => {
  const raw = sessionStorage.getItem(BROKER_SESSION_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    sessionStorage.removeItem(BROKER_SESSION_KEY);
    return null;
  }
};

export const brokerLogout = () => {
  sessionStorage.removeItem(BROKER_SESSION_KEY);
};

export const isBrokerAuthenticated = () => Boolean(getBrokerSession());
