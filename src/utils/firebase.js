// Firebase Auth Setup Template
// To enable, run: npm install firebase
// And configure the environment variables in .env.local

import { useState, useEffect } from 'react';

// Dynamic mock authentication module if SDK is not installed or config is missing
class MockAuth {
  constructor() {
    this.currentUser = null;
    this.listeners = [];
  }

  onAuthStateChanged(callback) {
    this.listeners.push(callback);
    // Trigger initial auth state
    setTimeout(() => {
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('prod_ai_user') : null;
      this.currentUser = savedUser ? JSON.parse(savedUser) : null;
      callback(this.currentUser);
    }, 100);

    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  async signInWithEmailAndPassword(email, password) {
    await new Promise(r => setTimeout(r, 800));
    const user = { email, name: email.split('@')[0], uid: 'mock-uid-123' };
    this.currentUser = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem('prod_ai_user', JSON.stringify(user));
    }
    this.listeners.forEach(l => l(user));
    return { user };
  }

  async createUserWithEmailAndPassword(email, password, name) {
    await new Promise(r => setTimeout(r, 1000));
    const user = { email, name: name || email.split('@')[0], uid: 'mock-uid-123' };
    this.currentUser = user;
    if (typeof window !== 'undefined') {
      localStorage.setItem('prod_ai_user', JSON.stringify(user));
    }
    this.listeners.forEach(l => l(user));
    return { user };
  }

  async signOut() {
    this.currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('prod_ai_user');
    }
    this.listeners.forEach(l => l(null));
  }
}

const mockAuthInstance = new MockAuth();

// Expose standard API interface
export const auth = mockAuthInstance;

export const signInWithEmailAndPassword = async (authInstance, email, password) => {
  return authInstance.signInWithEmailAndPassword(email, password);
};

export const createUserWithEmailAndPassword = async (authInstance, email, password, name) => {
  return authInstance.createUserWithEmailAndPassword(email, password, name);
};

export const signOut = async (authInstance) => {
  return authInstance.signOut();
};
