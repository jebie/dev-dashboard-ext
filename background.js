chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "addToTodo",
    title: "Add to TODO List",
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
