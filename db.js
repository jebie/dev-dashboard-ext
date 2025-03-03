/**
 * IndexedDB Database Module
 * Handles all database operations for the extension
 */

// Database name and version
const DB_NAME = "devDashboardDB";
const DB_VERSION = 2;

// Store names
const STORES = {
  TODOS: "todos",
  PROJECTS: "projects",
  TAGS: "tags",
  PROFILE: "profile",
};

/**
 * Initialize the database
 * @returns {Promise} A promise that resolves when the database is ready
 */
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB error:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      const db = event.target.result;
      console.log("IndexedDB connected successfully");
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.TODOS)) {
        const todoStore = db.createObjectStore(STORES.TODOS, { keyPath: "id" });
        todoStore.createIndex("priority", "priority", { unique: false });
        todoStore.createIndex("deadline", "deadline", { unique: false });
        todoStore.createIndex("status", "status", { unique: false });
        todoStore.createIndex("link", "link", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
        const projectStore = db.createObjectStore(STORES.PROJECTS, {
          keyPath: "id",
        });
        projectStore.createIndex("created", "created", { unique: false });
        projectStore.createIndex("updated", "updated", { unique: false });
        projectStore.createIndex("noClick", "noClick", { unique: false });
        projectStore.createIndex("link", "link", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.TAGS)) {
        const tagStore = db.createObjectStore(STORES.TAGS, { keyPath: "id" });
        tagStore.createIndex("name", "name", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.PROFILE)) {
        db.createObjectStore(STORES.PROFILE, { keyPath: "id" });
      }
    };
  });
}

/**
 * Get a database connection
 * @returns {Promise} A promise that resolves with the database connection
 */
function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Error opening database:", event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
}

/**
 * Get all items from a store
 * @param {string} storeName - The name of the store
 * @returns {Promise} A promise that resolves with the items
 */
function getAll(storeName) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        console.error(`Error getting items from ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get an item by ID
 * @param {string} storeName - The name of the store
 * @param {string} id - The ID of the item
 * @returns {Promise} A promise that resolves with the item
 */
function getById(storeName, id) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        console.error(`Error getting item from ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Add an item to a store
 * @param {string} storeName - The name of the store
 * @param {Object} item - The item to add
 * @returns {Promise} A promise that resolves when the item is added
 */
function add(storeName, item) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => {
        resolve(item);
      };

      request.onerror = (event) => {
        console.error(`Error adding item to ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Update an item in a store
 * @param {string} storeName - The name of the store
 * @param {Object} item - The item to update
 * @returns {Promise} A promise that resolves when the item is updated
 */
function update(storeName, item) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => {
        resolve(item);
      };

      request.onerror = (event) => {
        console.error(`Error updating item in ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Delete an item from a store
 * @param {string} storeName - The name of the store
 * @param {string} id - The ID of the item to delete
 * @returns {Promise} A promise that resolves when the item is deleted
 */
function remove(storeName, id) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve(id);
      };

      request.onerror = (event) => {
        console.error(`Error deleting item from ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Clear all items from a store
 * @param {string} storeName - The name of the store
 * @returns {Promise} A promise that resolves when the store is cleared
 */
function clear(storeName) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await getDB();
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error(`Error clearing ${storeName}:`, event.target.error);
        reject(event.target.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Migrate data from chrome.storage.local to IndexedDB
 * @returns {Promise<boolean>} - True if migration was successful
 */
async function migrateFromChromeStorage() {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(null, async (result) => {
        if (chrome.runtime.lastError) {
          console.error("Error getting data from chrome.storage.local:", chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }

        const db = await getDB();

        // Migrate todos
        if (result.todos && Array.isArray(result.todos)) {
          const todosTx = db.transaction("todos", "readwrite");
          const todosStore = todosTx.objectStore("todos");

          for (const todo of result.todos) {
            todosStore.add(todo);
          }

          await new Promise((txResolve, txReject) => {
            todosTx.oncomplete = () => txResolve();
            todosTx.onerror = (e) => txReject(e.target.error);
          });

          console.log(`Migrated ${result.todos.length} todos to IndexedDB`);
        }

        // Migrate projects
        if (result.projects && Array.isArray(result.projects)) {
          const projectsTx = db.transaction("projects", "readwrite");
          const projectsStore = projectsTx.objectStore("projects");

          for (const project of result.projects) {
            projectsStore.add(project);
          }

          await new Promise((txResolve, txReject) => {
            projectsTx.oncomplete = () => txResolve();
            projectsTx.onerror = (e) => txReject(e.target.error);
          });

          console.log(`Migrated ${result.projects.length} projects to IndexedDB`);
        }

        // Migrate tags
        if (result.tags && Array.isArray(result.tags)) {
          const tagsTx = db.transaction("tags", "readwrite");
          const tagsStore = tagsTx.objectStore("tags");

          for (const tag of result.tags) {
            tagsStore.add(tag);
          }

          await new Promise((txResolve, txReject) => {
            tagsTx.oncomplete = () => txResolve();
            tagsTx.onerror = (e) => txReject(e.target.error);
          });

          console.log(`Migrated ${result.tags.length} tags to IndexedDB`);
        }

        // Migrate profile data
        if (result.profile) {
          const profileTx = db.transaction("profile", "readwrite");
          const profileStore = profileTx.objectStore("profile");

          profileStore.add(result.profile);

          await new Promise((txResolve, txReject) => {
            profileTx.oncomplete = () => txResolve();
            profileTx.onerror = (e) => txReject(e.target.error);
          });

          console.log(`Migrated profile data to IndexedDB`);
        }

        // Set a flag in chrome.storage.local to indicate migration is complete
        chrome.storage.local.set({ migrationComplete: true }, () => {
          if (chrome.runtime.lastError) {
            console.error("Error setting migration flag:", chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          console.log("Migration from chrome.storage.local to IndexedDB complete");
          resolve(true);
        });
      });
    } catch (error) {
      console.error("Migration failed:", error);
      reject(error);
    }
  });
}

// Export the database functions
window.db = {
  init: initDB,
  migrate: migrateFromChromeStorage,
  todos: {
    getAll: () => getAll(STORES.TODOS),
    getById: (id) => getById(STORES.TODOS, id),
    add: (todo) => add(STORES.TODOS, todo),
    update: (todo) => update(STORES.TODOS, todo),
    remove: (id) => remove(STORES.TODOS, id),
    clear: () => clear(STORES.TODOS),
  },
  projects: {
    getAll: () => getAll(STORES.PROJECTS),
    getById: (id) => getById(STORES.PROJECTS, id),
    add: (project) => add(STORES.PROJECTS, project),
    update: (project) => update(STORES.PROJECTS, project),
    remove: (id) => remove(STORES.PROJECTS, id),
    clear: () => clear(STORES.PROJECTS),
  },
  tags: {
    getAll: () => getAll(STORES.TAGS),
    getById: (id) => getById(STORES.TAGS, id),
    add: (tag) => add(STORES.TAGS, tag),
    update: (tag) => update(STORES.TAGS, tag),
    remove: (id) => remove(STORES.TAGS, id),
    clear: () => clear(STORES.TAGS),
  },
  profile: {
    get: () => getById(STORES.PROFILE, "user"),
    update: (profile) => update(STORES.PROFILE, { id: "user", ...profile }),
  },
};
