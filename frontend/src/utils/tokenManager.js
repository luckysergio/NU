class TokenManager {
  constructor() {
    this.token = null;
    this.user = null;
    this.expiresAt = null;
    this.listeners = [];
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const user = localStorage.getItem('user');
      const expiresAt = localStorage.getItem('expires_at');
      
      if (token) {
        this.token = token;
        this.expiresAt = expiresAt ? new Date(expiresAt) : null;
      }
      
      if (user) {
        try {
          this.user = JSON.parse(user);
        } catch (e) {
          this.user = null;
        }
      }
      
      this.initialized = true;
      this.notifyListeners();
    } catch (error) {
      console.error('Error initializing TokenManager:', error);
      this.initialized = true;
    }
  }

  setToken(token, expiresIn = null) {
    this.token = token;
    localStorage.setItem('access_token', token);
    
    if (expiresIn) {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
      this.expiresAt = expiresAt;
      localStorage.setItem('expires_at', expiresAt.toISOString());
    }
    
    this.notifyListeners();
  }

  getToken() {
    this.initialize();
    return this.token;
  }

  isValid() {
    this.initialize();
    if (!this.token) return false;
    if (!this.expiresAt) return true;
    
    const bufferTime = 30 * 1000; // 30 detik buffer
    return new Date().getTime() + bufferTime < this.expiresAt.getTime();
  }

  setUser(user) {
    this.user = user;
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    this.notifyListeners();
  }

  getUser() {
    this.initialize();
    return this.user;
  }

  clear() {
    this.token = null;
    this.user = null;
    this.expiresAt = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('expires_at');
    localStorage.removeItem('refresh_token');
    this.notifyListeners();
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    const state = this.getState();
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (e) {
        console.error('Error in listener:', e);
      }
    });
  }

  getState() {
    return {
      token: this.token,
      user: this.user,
      expiresAt: this.expiresAt,
      isAuthenticated: this.isValid(),
    };
  }
}

export const tokenManager = new TokenManager();
export default tokenManager;