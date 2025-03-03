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
    chrome.tabs.sendMessage(tab.id, {
      type: "SHOW_TODO_DIALOG",
      data: {
        title: info.selectionText || tab.title,
        link: tab.url,
      },
    });
  } else if (info.menuItemId === "addToProjects") {
    // Save project directly without dialog
    const newProject = {
      id: Date.now().toString(),
      title: tab.title || "Untitled Project",
      link: info.pageUrl,
      noClick: 0,
      created: new Date().toISOString(),
      updated: new Date().toISOString()
    };
    
    chrome.storage.local.get(["projects"], (result) => {
      const projects = result.projects || [];
      projects.push(newProject);
      
      chrome.storage.local.set({ projects }, () => {
        // Send message to refresh projects in dashboard
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, {
              type: "REFRESH_PROJECTS",
            }, () => {
              if (chrome.runtime.lastError) {
                // Ignore errors from tabs that don't have content scripts
              }
            });
          });
        });
        
        // Show notification
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "Project Added",
          message: "Project added successfully!"
        });
      });
    });
  }
});

// Listen for todo save requests from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SAVE_TODO") {
    chrome.storage.local.get(["todos"], (result) => {
      const todos = result.todos || [];
      todos.push(message.todo);

      chrome.storage.local.set({ todos }, () => {
        // Update dashboard if it's open
        chrome.tabs.query({ url: chrome.runtime.getURL("dashboard.html") }, (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {
              type: "REFRESH_TODOS",
            });
          });
        });
        sendResponse({ success: true });
      });
    });
    return true;
  } else if (message.type === "UPDATE_TODO") {
    chrome.storage.local.get(["todos"], (result) => {
      const todos = result.todos.map((todo) => (todo.id === message.todo.id ? message.todo : todo));

      chrome.storage.local.set({ todos }, () => {
        chrome.tabs.query({ url: chrome.runtime.getURL("dashboard.html") }, (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {
              type: "REFRESH_TODOS",
            });
          });
        });
        sendResponse({ success: true });
      });
    });
    return true;
  }
});
