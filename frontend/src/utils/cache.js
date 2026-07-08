export const clearLocalStorage = () => {
  try {
    localStorage.clear();
    return true;
  } catch (error) {
    return false;
  }
};

export const clearSessionStorage = () => {
  try {
    sessionStorage.clear();
    return true;
  } catch (error) {
    return false;
  }
};

export const clearCookies = () => {
  try {
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    return true;
  } catch (error) {
    return false;
  }
};

export const clearBrowserCache = async () => {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const clearIndexedDB = async () => {
  try {
    if ('indexedDB' in window && indexedDB.databases) {
      const dbs = await indexedDB.databases();
      await Promise.all(dbs.map(db => {
        return new Promise((resolve) => {
          const request = indexedDB.deleteDatabase(db.name);
          request.onsuccess = () => resolve();
          request.onerror = () => resolve();
          request.onblocked = () => resolve();
        });
      }));
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const unregisterServiceWorkers = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
};

export const clearAllCaches = async () => {
  try {
    clearLocalStorage();
    clearSessionStorage();
    clearCookies();

    await Promise.all([
      clearBrowserCache(),
      clearIndexedDB(),
      unregisterServiceWorkers(),
    ]);

    return true;
  } catch (error) {
    return false;
  }
};

export const clearCacheAndReload = async () => {
  await clearAllCaches();
  window.location.href = '/login';
};