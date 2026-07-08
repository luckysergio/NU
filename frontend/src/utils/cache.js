export const clearLocalStorage = () => {
  try {
    localStorage.clear();
    console.log('✅ localStorage cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing localStorage:', error);
    return false;
  }
};

export const clearSessionStorage = () => {
  try {
    sessionStorage.clear();
    console.log('✅ sessionStorage cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing sessionStorage:', error);
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
    console.log('✅ Cookies cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing cookies:', error);
    return false;
  }
};

export const clearBrowserCache = async () => {
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('✅ Browser cache cleared');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error clearing browser cache:', error);
    return false;
  }
};

export const clearIndexedDB = async () => {
  try {
    if ('indexedDB' in window && indexedDB.databases) {
      const dbs = await indexedDB.databases();
      await Promise.all(dbs.map(db => {
        return new Promise((resolve, reject) => {
          const request = indexedDB.deleteDatabase(db.name);
          request.onsuccess = () => resolve();
          request.onerror = () => reject();
          request.onblocked = () => resolve();
        });
      }));
      console.log('✅ IndexedDB cleared');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error clearing IndexedDB:', error);
    return false;
  }
};

export const unregisterServiceWorkers = async () => {
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      console.log('✅ Service workers unregistered');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Error unregistering service workers:', error);
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

    console.log('🎉 All caches cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing all caches:', error);
    return false;
  }
};

export const clearCacheAndReload = async () => {
  await clearAllCaches();
  window.location.href = '/login';
};