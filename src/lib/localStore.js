/**
 * Local storage data layer — replaces base44 entity SDK.
 * All data is persisted in localStorage under namespaced keys.
 */

const PREFIX = "riskshield_";

function getKey(entity) {
  return `${PREFIX}${entity}`;
}

function readAll(entity) {
  const raw = localStorage.getItem(getKey(entity));
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

function writeAll(entity, records) {
  localStorage.setItem(getKey(entity), JSON.stringify(records));
}

function genId() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function createRecord(data) {
  return {
    ...data,
    id: genId(),
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
    created_by: getCurrentUser()?.email || "local",
  };
}

// ---------- current user stored separately ----------
const USER_KEY = `${PREFIX}current_user`;

export function getCurrentUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function setCurrentUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function updateCurrentUser(data) {
  const existing = getCurrentUser() || {};
  const updated = { ...existing, ...data };
  setCurrentUser(updated);
  return updated;
}

// ---------- generic entity store ----------
export function makeEntityStore(entity) {
  return {
    list(sortField = "-created_date", limit = 500) {
      let records = readAll(entity);
      const desc = sortField.startsWith("-");
      const field = desc ? sortField.slice(1) : sortField;
      records.sort((a, b) => {
        const va = a[field] ?? "";
        const vb = b[field] ?? "";
        return desc ? (va < vb ? 1 : va > vb ? -1 : 0) : (va < vb ? -1 : va > vb ? 1 : 0);
      });
      return Promise.resolve(records.slice(0, limit));
    },

    filter(query, sortField = "-created_date", limit = 500) {
      let records = readAll(entity);
      records = records.filter(r => {
        return Object.entries(query).every(([k, v]) => r[k] === v);
      });
      const desc = sortField.startsWith("-");
      const field = desc ? sortField.slice(1) : sortField;
      records.sort((a, b) => {
        const va = a[field] ?? "";
        const vb = b[field] ?? "";
        return desc ? (va < vb ? 1 : va > vb ? -1 : 0) : (va < vb ? -1 : va > vb ? 1 : 0);
      });
      return Promise.resolve(records.slice(0, limit));
    },

    get(id) {
      const records = readAll(entity);
      return Promise.resolve(records.find(r => r.id === id) || null);
    },

    create(data) {
      const records = readAll(entity);
      const record = createRecord(data);
      records.push(record);
      writeAll(entity, records);
      return Promise.resolve(record);
    },

    bulkCreate(dataArray) {
      const records = readAll(entity);
      const created = dataArray.map(d => createRecord(d));
      writeAll(entity, [...records, ...created]);
      return Promise.resolve(created);
    },

    update(id, data) {
      const records = readAll(entity);
      const idx = records.findIndex(r => r.id === id);
      if (idx === -1) return Promise.reject(new Error("Record not found"));
      records[idx] = { ...records[idx], ...data, updated_date: new Date().toISOString() };
      writeAll(entity, records);
      return Promise.resolve(records[idx]);
    },

    delete(id) {
      const records = readAll(entity);
      writeAll(entity, records.filter(r => r.id !== id));
      return Promise.resolve();
    },

    subscribe(callback) {
      // no-op for local store; return unsubscribe fn
      return () => {};
    },
  };
}

// ---------- users store (special) ----------
const USERS_KEY = `${PREFIX}users`;

function readUsers() {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) {
    // Seed a default admin user on first run
    const admin = {
      id: "local-admin",
      email: "admin@local",
      full_name: "Local Admin",
      role: "admin",
      notification_email: true,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    localStorage.setItem(USERS_KEY, JSON.stringify([admin]));
    return [admin];
  }
  try { return JSON.parse(raw); } catch { return []; }
}

function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export const userStore = {
  list() {
    return Promise.resolve(readUsers());
  },
  update(id, data) {
    const users = readUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...data, updated_date: new Date().toISOString() };
      writeUsers(users);
      // If updating current user, sync
      const cu = getCurrentUser();
      if (cu && cu.id === id) setCurrentUser({ ...cu, ...data });
    }
    return Promise.resolve(users[idx] || null);
  },
  invite(email, role) {
    const users = readUsers();
    if (users.find(u => u.email === email)) return Promise.resolve();
    const u = {
      id: genId(),
      email,
      full_name: email.split("@")[0],
      role: role || "viewer",
      notification_email: true,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    users.push(u);
    writeUsers(users);
    return Promise.resolve(u);
  },
};

// ---------- auth store ----------
export const authStore = {
  me() {
    let user = getCurrentUser();
    if (!user) {
      // Auto-create a default admin session for standalone mode
      const users = readUsers();
      user = users[0] || { id: "local-admin", email: "admin@local", full_name: "Local Admin", role: "admin" };
      setCurrentUser(user);
    }
    return Promise.resolve(user);
  },
  updateMe(data) {
    const updated = updateCurrentUser(data);
    // Also sync in users store
    const users = readUsers();
    const idx = users.findIndex(u => u.id === updated.id);
    if (idx !== -1) { users[idx] = { ...users[idx], ...data }; writeUsers(users); }
    return Promise.resolve(updated);
  },
  isAuthenticated() {
    return Promise.resolve(true);
  },
  logout() {},
  redirectToLogin() {},
};