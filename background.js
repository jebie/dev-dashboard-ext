chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "personalizedData",
    title: "Personalized Data",
    contexts: ["page", "selection"],
  });

  chrome.contextMenus.create({
    id: "addToTodo",
    title: "Add TODO",
    parentId: "personalizedData",
    contexts: ["page", "selection"],
  });

  chrome.contextMenus.create({
    id: "addToProjects",
    title: "Add Project",
    parentId: "personalizedData",
    contexts: ["page", "selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addToTodo") {
    chrome.tabs.sendMessage(
      tab.id,
      {
        type: "SHOW_TODO_DIALOG",
        data: {
          title: info.selectionText || tab.title,
          link: tab.url,
        },
      },
      () => {
        if (chrome.runtime.lastError) {
          console.log("Could not send message to tab: ", chrome.runtime.lastError.message);
        }
      }
    );
  } else if (info.menuItemId === "addToProjects") {
    // Save project directly without dialog
    const newProject = {
      id: Date.now().toString(),
      title: tab.title || "Untitled Project",
      link: info.pageUrl || tab.url,
      noClick: 0,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
    };

    // Initialize IndexedDB with the correct version
    const dbPromise = indexedDB.open("devDashboardDB", 2);

    dbPromise.onerror = function (event) {
      console.error("Error adding project to IndexedDB:", event.target.error);
      chrome.tabs.sendMessage(tab.id, {
        type: "SHOW_TOAST",
        message: "Failed to add project. Please try again.",
      });
    };

    dbPromise.onsuccess = function (event) {
      const db = event.target.result;
      const transaction = db.transaction(["projects"], "readwrite");
      const projectsStore = transaction.objectStore("projects");

      // Add the new project
      const addRequest = projectsStore.add(newProject);

      addRequest.onsuccess = function () {
        // Show success toast
        chrome.tabs.sendMessage(tab.id, {
          type: "SHOW_TOAST",
          message: "Project added successfully",
        });

        // Send message to refresh projects in dashboard
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {
              type: "REFRESH_PROJECTS",
            });
          });
        });
      };

      addRequest.onerror = function (event) {
        console.error("Error adding project:", event.target.error);
        chrome.tabs.sendMessage(tab.id, {
          type: "SHOW_TOAST",
          message: "Failed to add project. Please try again.",
        });
      };
    };
  }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "CHECK_TODO_EXISTS") {
    checkTodoExists(message.data.link)
      .then((todo) => {
        sendResponse({ todo });
      })
      .catch((error) => {
        console.error("Error checking if todo exists:", error);
        sendResponse({ error: error.message });
      });
    return true; // Keep the message channel open for the async response
  }

  if (message.type === "SAVE_TODO") {
    saveTodo(message.data)
      .then((result) => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("Error saving todo:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep the message channel open for the async response
  }

  if (message.type === "OPEN_DASHBOARD_WITH_TODO") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("dashboard.html") + "?todoId=" + message.todoId,
    });
    sendResponse({ success: true });
    return false;
  }
});

/**
 * Check if a todo with the given link exists
 * @param {string} link - The link to check
 * @returns {Promise<Object|null>} The todo object if found, null otherwise
 */
async function checkTodoExists(link) {
  return new Promise((resolve, reject) => {
    const dbPromise = indexedDB.open("devDashboardDB", 2);

    dbPromise.onerror = (event) => {
      reject(new Error("Database error: " + event.target.error));
    };

    dbPromise.onsuccess = (event) => {
      const db = event.target.result;
      try {
        const transaction = db.transaction(["todos"], "readonly");
        const todosStore = transaction.objectStore("todos");
        const linkIndex = todosStore.index("link");
        const request = linkIndex.get(link);

        request.onsuccess = () => {
          resolve(request.result || null);
        };

        request.onerror = (event) => {
          reject(new Error("Error checking for existing todo: " + event.target.error));
        };
      } catch (error) {
        reject(error);
      }
    };
  });
}

/**
 * Save a new todo
 * @param {Object} todoData - The todo data
 * @returns {Promise<Object>} The saved todo
 */
async function saveTodo(todoData) {
  return new Promise((resolve, reject) => {
    const dbPromise = indexedDB.open("devDashboardDB", 2);

    dbPromise.onerror = (event) => {
      reject(new Error("Database error: " + event.target.error));
    };

    dbPromise.onsuccess = (event) => {
      const db = event.target.result;
      try {
        const transaction = db.transaction(["todos"], "readwrite");
        const todosStore = transaction.objectStore("todos");

        const newTodo = {
          id: Date.now().toString(),
          title: todoData.title,
          description: todoData.description || "",
          link: todoData.link || "",
          priority: todoData.priority,
          status: todoData.priority, // Set status to match priority
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          deadline: todoData.deadline || null,
          tagIds: [],
          taskHistory: [], // Initialize empty task history
        };

        // Add startTask if startImmediately is true
        if (todoData.startImmediately) {
          // Set startTask as a string (ISO date)
          newTodo.startTask = new Date().toISOString();
        } else {
          newTodo.startTask = null;
        }

        const request = todosStore.add(newTodo);

        request.onsuccess = () => {
          // Notify dashboard to refresh todos
          chrome.tabs.query({ url: chrome.runtime.getURL("dashboard.html") }, (tabs) => {
            tabs.forEach((tab) => {
              chrome.tabs.sendMessage(tab.id, {
                type: "REFRESH_TODOS",
              });
            });
          });

          resolve(newTodo);
        };

        request.onerror = (event) => {
          reject(new Error("Error saving todo: " + event.target.error));
        };
      } catch (error) {
        reject(error);
      }
    };
  });
}
