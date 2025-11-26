import { nanoid } from 'nanoid';

/**
 * Simple encryption utilities using Web Crypto API
 * This provides basic protection for localStorage data against casual inspection
 * Note: This is not cryptographically secure for highly sensitive data
 */
const CryptoUtils = {
  // Generate a key from a string
  async getKey(password) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('wais-jurisprudencia-salt'),
        iterations: 1000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  },

  // Encrypt a string
  async encrypt(text, password) {
    try {
      const key = await this.getKey(password);
      const encoder = new TextEncoder();
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(text)
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64
      return btoa(String.fromCharCode(...combined));
    } catch (err) {
      console.error('[CryptoUtils] Encryption failed:', err);
      return null;
    }
  },

  // Decrypt a string
  async decrypt(encryptedText, password) {
    try {
      const key = await this.getKey(password);

      // Decode from base64
      const combined = new Uint8Array(
        atob(encryptedText).split('').map(c => c.charCodeAt(0))
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      return new TextDecoder().decode(decrypted);
    } catch (err) {
      console.error('[CryptoUtils] Decryption failed:', err);
      return null;
    }
  },

  // Check if Web Crypto API is available
  isAvailable() {
    return typeof crypto !== 'undefined' && crypto.subtle;
  }
};

// Encryption password derived from session
// In production, this should be derived from user credentials or a secure key
const getEncryptionKey = () => {
  // Use a combination of fixed and dynamic parts
  const fixedPart = 'wais-mq-key';
  // Add some browser-specific entropy
  const browserPart = navigator.userAgent.slice(0, 20);
  return fixedPart + browserPart;
};

/**
 * Message Queue with localStorage persistence and optional encryption
 * Survives page refreshes and handles offline scenarios
 */
export class MessageQueue {
  constructor(storageKey = 'ws_message_queue', maxSize = 100, options = {}) {
    this.storageKey = storageKey;
    this.maxSize = maxSize;
    this.useEncryption = options.encrypt !== false && CryptoUtils.isAvailable();
    this.encryptionKey = getEncryptionKey();
    this.queue = [];
    this.isInitialized = false;
    this.initPromise = this.initialize();
  }

  /**
   * Initialize the queue (async for encryption support)
   */
  async initialize() {
    this.queue = await this.loadFromStorage();
    this.isInitialized = true;
    return this;
  }

  /**
   * Wait for initialization to complete
   */
  async ready() {
    if (!this.isInitialized) {
      await this.initPromise;
    }
    return this;
  }

  /**
   * Add message to queue
   */
  async enqueue(message) {
    await this.ready();

    const queueItem = {
      id: nanoid(),
      message,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3,
    };

    this.queue.push(queueItem);

    // Prevent queue from growing too large
    if (this.queue.length > this.maxSize) {
      this.queue.shift(); // Remove oldest
      console.warn('[MessageQueue] Queue size exceeded, removing oldest message');
    }

    await this.saveToStorage();
    console.log('[MessageQueue] Message enqueued:', queueItem.id, '| Queue length:', this.queue.length);

    return queueItem.id;
  }

  /**
   * Get next message from queue without removing
   */
  async peek() {
    await this.ready();
    return this.queue[0] || null;
  }

  /**
   * Remove and return first message from queue
   */
  async dequeue() {
    await this.ready();

    if (this.queue.length === 0) return null;

    const item = this.queue.shift();
    await this.saveToStorage();
    console.log('[MessageQueue] Message dequeued:', item.id, '| Remaining:', this.queue.length);

    return item;
  }

  /**
   * Get all messages in queue
   */
  async getAll() {
    await this.ready();
    return [...this.queue];
  }

  /**
   * Get queue length
   */
  size() {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty() {
    return this.queue.length === 0;
  }

  /**
   * Increment retry count for a message
   */
  async incrementRetry(messageId) {
    await this.ready();

    const item = this.queue.find(i => i.id === messageId);
    if (item) {
      item.retries++;
      await this.saveToStorage();

      // Remove if max retries exceeded
      if (item.retries >= item.maxRetries) {
        console.error('[MessageQueue] Max retries exceeded for message:', messageId);
        await this.remove(messageId);
        return false; // Signal to give up
      }
      return true; // Can retry
    }
    return false;
  }

  /**
   * Remove specific message by ID
   */
  async remove(messageId) {
    await this.ready();

    const initialLength = this.queue.length;
    this.queue = this.queue.filter(item => item.id !== messageId);

    if (this.queue.length < initialLength) {
      await this.saveToStorage();
      console.log('[MessageQueue] Message removed:', messageId);
      return true;
    }
    return false;
  }

  /**
   * Clear entire queue
   */
  async clear() {
    this.queue = [];
    await this.saveToStorage();
    console.log('[MessageQueue] Queue cleared');
  }

  /**
   * Load queue from localStorage
   */
  async loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) return [];

      let parsed;

      // Try to decrypt if encryption is enabled
      if (this.useEncryption) {
        try {
          const decrypted = await CryptoUtils.decrypt(stored, this.encryptionKey);
          if (decrypted) {
            parsed = JSON.parse(decrypted);
          } else {
            // Fallback: try parsing as plain JSON (for migration)
            parsed = JSON.parse(stored);
          }
        } catch {
          // Fallback: try parsing as plain JSON (for migration from unencrypted)
          try {
            parsed = JSON.parse(stored);
            // If successful, re-save encrypted
            console.log('[MessageQueue] Migrating unencrypted data to encrypted storage');
          } catch {
            console.error('[MessageQueue] Failed to parse stored data');
            return [];
          }
        }
      } else {
        parsed = JSON.parse(stored);
      }

      // Clean up stale messages (older than 24 hours)
      const now = Date.now();
      const fresh = parsed.filter(item => {
        const age = now - item.timestamp;
        const isStale = age > 24 * 60 * 60 * 1000;
        if (isStale) {
          console.warn('[MessageQueue] Removing stale message:', item.id, 'age:', Math.round(age / 1000 / 60), 'min');
        }
        return !isStale;
      });

      console.log('[MessageQueue] Loaded from storage:', fresh.length, 'messages');
      return fresh;
    } catch (error) {
      console.error('[MessageQueue] Failed to load from storage:', error);
      return [];
    }
  }

  /**
   * Save queue to localStorage
   */
  async saveToStorage() {
    try {
      let dataToStore;

      if (this.useEncryption) {
        const encrypted = await CryptoUtils.encrypt(
          JSON.stringify(this.queue),
          this.encryptionKey
        );
        if (encrypted) {
          dataToStore = encrypted;
        } else {
          // Fallback to unencrypted if encryption fails
          console.warn('[MessageQueue] Encryption failed, saving unencrypted');
          dataToStore = JSON.stringify(this.queue);
        }
      } else {
        dataToStore = JSON.stringify(this.queue);
      }

      localStorage.setItem(this.storageKey, dataToStore);
    } catch (error) {
      console.error('[MessageQueue] Failed to save to storage:', error);

      // If quota exceeded, clear oldest messages
      if (error.name === 'QuotaExceededError') {
        console.warn('[MessageQueue] Storage quota exceeded, clearing old messages');
        this.queue = this.queue.slice(-10); // Keep only last 10
        try {
          const dataToStore = this.useEncryption
            ? await CryptoUtils.encrypt(JSON.stringify(this.queue), this.encryptionKey)
            : JSON.stringify(this.queue);
          localStorage.setItem(this.storageKey, dataToStore || JSON.stringify(this.queue));
        } catch (e) {
          console.error('[MessageQueue] Still failed after clearing:', e);
        }
      }
    }
  }

  /**
   * Securely clear all data (for logout)
   */
  async secureDelete() {
    this.queue = [];
    localStorage.removeItem(this.storageKey);
    console.log('[MessageQueue] Securely deleted all data');
  }
}

export default MessageQueue;
