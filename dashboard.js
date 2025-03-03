document.addEventListener("DOMContentLoaded", async function () {
  try {
    // Initialize IndexedDB
    if (!window.db || typeof window.db.init !== "function") {
      console.error("Database not properly initialized. Make sure db.js is loaded before dashboard.js");
      showToast("Error initializing database. Please refresh the page.");
      return;
    }

    await db.init();

    // Check if migration has been completed
    chrome.storage.local.get(["migrationComplete"], async (result) => {
      if (!result.migrationComplete) {
        try {
          // Show migration message
          showToast("Migrating data to new storage format...");

          // Perform migration
          await db.migrate();

          showToast("Data migration completed successfully!");
        } catch (error) {
          console.error("Migration failed:", error);
          showToast("Data migration failed. Some features may not work correctly.");
        }
      }

      // Initialize the dashboard
      loadTodos();

      // Set up event listeners
      setupEventListeners();

      // Start age counter for tasks
      startAgeCounter();

      // Load profile data
      loadProfile();

      // Initialize the task timer
      initTaskTimer();
    });
  } catch (error) {
    console.error("Error initializing application:", error);
    showToast("Error initializing application. Please refresh the page.");
  }
});

// Initialize dashboard components
async function initDashboard() {
  // Load todos
  loadTodos();

  // Set up event listeners
  setupEventListeners();

  // Start age counter for tasks
  startAgeCounter();
}

// Set up all event listeners for the dashboard
function setupEventListeners() {
  // Listen for refresh events from context menu additions
  window.addEventListener("refreshTodos", () => {
    loadTodos();
  });

  // Profile edit handlers
  const editProfileBtn = document.getElementById("editProfile");
  const editProfileDialog = document.getElementById("editProfileDialog");
  const saveProfileBtn = document.getElementById("saveProfile");
  const cancelProfileBtn = document.getElementById("cancelProfile");

  if (!editProfileBtn || !editProfileDialog || !saveProfileBtn || !cancelProfileBtn) {
    console.error("Required profile elements not found");
    return;
  }

  editProfileBtn.addEventListener("click", () => {
    // Auto-fill existing data
    chrome.storage.sync.get(["userName", "birthdate"], (result) => {
      if (result.userName) {
        document.getElementById("nameInput").value = result.userName;
      }
      if (result.birthdate) {
        document.getElementById("birthdateInput").value = result.birthdate;
      }
    });
    editProfileDialog.showModal();
  });

  cancelProfileBtn.addEventListener("click", () => {
    editProfileDialog.close();
  });

  // Close modal when clicking outside
  editProfileDialog.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("dialog-backdrop")) {
      editProfileDialog.close();
    }
  });

  saveProfileBtn.addEventListener("click", () => {
    const name = document.getElementById("nameInput").value;
    const birthdate = document.getElementById("birthdateInput").value;

    if (!birthdate) {
      showToast("Please enter your birthdate!");
      return;
    }

    chrome.storage.sync.set(
      {
        userName: name,
        birthdate: birthdate,
      },
      () => {
        document.getElementById("userName").textContent = name;
        document.getElementById("birthdate").textContent = new Date(birthdate).toLocaleDateString();
        startAgeCounter(new Date(birthdate));
        editProfileDialog.close();
        showToast("Profile updated successfully!");
      }
    );
  });

  // Todo handlers
  document.getElementById("addTodo").addEventListener("click", () => {
    resetTodoForm();
    // Reset dialog title
    document.querySelector("#todoFormDialog h2").textContent = "Add New Task";
    // Reset save button text
    document.getElementById("saveTodo").textContent = "Save Task";
    // Clear any existing todo ID
    document.getElementById("todoFormDialog").dataset.todoId = "";
    document.getElementById("todoFormDialog").showModal();
  });

  // Search button handler
  const searchButton = document.getElementById("searchTodo");
  if (searchButton) {
    searchButton.addEventListener("click", toggleSearchForm);
  }

  document.getElementById("saveTodo").addEventListener("click", () => {
    const todoId = document.getElementById("todoFormDialog").dataset.todoId;
    if (todoId) {
      // If todoId exists, we're updating an existing todo
      updateTodo(todoId);
    } else {
      // Otherwise, we're creating a new todo
      saveTodo();
    }
  });

  document.getElementById("cancelTodo").addEventListener("click", () => {
    document.getElementById("todoFormDialog").close();
  });

  // Close modal when clicking outside
  document.getElementById("todoFormDialog").addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("dialog-backdrop")) {
      document.getElementById("todoFormDialog").close();
    }
  });

  // Add close event listener to reset form
  document.getElementById("todoFormDialog").addEventListener("close", () => {
    resetTodoForm();
  });

  // Task History Dialog handlers
  const taskHistoryDialog = document.getElementById("taskHistoryDialog");
  const closeTaskHistoryBtn = document.getElementById("closeTaskHistory");

  if (taskHistoryDialog && closeTaskHistoryBtn) {
    closeTaskHistoryBtn.addEventListener("click", () => {
      taskHistoryDialog.close();
    });

    // Close modal when clicking outside
    taskHistoryDialog.addEventListener("mousedown", (e) => {
      if (e.target.classList.contains("dialog-backdrop")) {
        taskHistoryDialog.close();
      }
    });
  }

  // Search functionality
  const searchTodoBtn = document.getElementById("searchTodo");
  const todoSearchForm = document.getElementById("todoSearchForm");
  const performSearchBtn = document.getElementById("performSearch");
  const resetSearchBtn = document.getElementById("resetSearch");

  if (performSearchBtn) {
    performSearchBtn.addEventListener("click", () => {
      const searchTitle = document.getElementById("searchTitle").value;
      const searchTag = document.getElementById("searchTag").value;

      currentSearchTitle = searchTitle;
      currentSearchTag = searchTag;

      loadTodos({ title: searchTitle, tagId: searchTag });
    });
  }

  if (resetSearchBtn) {
    resetSearchBtn.addEventListener("click", () => {
      document.getElementById("searchTitle").value = "";
      document.getElementById("searchTag").value = "";

      currentSearchTitle = "";
      currentSearchTag = "";

      loadTodos();
    });
  }
}

// Load user profile data
async function loadProfile() {
  try {
    // Try to get profile from IndexedDB first
    const profile = await db.profile.get();

    // If no profile in IndexedDB, check chrome.storage.sync as fallback
    if (!profile) {
      return new Promise((resolve) => {
        chrome.storage.sync.get(["userName", "birthdate"], (result) => {
          if (result.userName) {
            document.getElementById("userName").textContent = result.userName;
          }

          if (result.birthdate) {
            document.getElementById("birthdate").textContent = new Date(result.birthdate).toLocaleDateString();
            startAgeCounter(result.birthdate);
          }
          resolve();
        });
      });
    } else {
      // Use profile from IndexedDB
      if (profile.name) {
        document.getElementById("userName").textContent = profile.name;
      }

      if (profile.birthdate) {
        document.getElementById("birthdate").textContent = new Date(profile.birthdate).toLocaleDateString();
        startAgeCounter(profile.birthdate);
      }
      return Promise.resolve();
    }
  } catch (error) {
    console.error("Error loading profile:", error);
    return Promise.resolve();
  }
}

// Initialize search functionality
initSearch();

/**
 * Initialize the task timer functionality
 */
function initTaskTimer() {
  console.log("Initializing task timers...");

  // Get all active tasks from the database
  db.todos
    .getAll()
    .then((todos) => {
      console.log("Retrieved todos for timer initialization:", todos);

      // Filter for todos with active timers
      const activeTodos = todos.filter((todo) => isTaskStarted(todo.startTask));
      console.log("Active todos with timers:", activeTodos);

      // Start timers for all active todos
      activeTodos.forEach((todo) => {
        console.log("Starting timer for todo:", todo.id, todo.title);
        startDurationTimer(todo.id, todo.startTask, todo.taskHistory || []);

        // Also update the UI if the element exists
        const todoElement = document.querySelector(`[data-id="${todo.id}"]`);
        if (todoElement) {
          // Mark the element as having an active timer
          todoElement.setAttribute("data-timer-active", "true");
        }
      });
    })
    .catch((error) => {
      console.error("Error initializing task timers:", error);
    });
}

// Global variables for search
let currentSearchTitle = "";
let currentSearchTag = "";

async function loadTodos(searchParams = {}) {
  try {
    console.log("Loading todos with search params:", searchParams);

    // Get todos and tags from IndexedDB
    const todos = await db.todos.getAll();
    const tags = await db.tags.getAll();

    console.log("Retrieved todos:", todos);
    console.log("Retrieved tags:", tags);

    const todoList = document.getElementById("todoList");
    todoList.innerHTML = "";

    // Filter todos based on search parameters
    let filteredTodos = todos;

    // Filter by title if search title is provided
    if (searchParams.title) {
      const searchTerm = searchParams.title.toLowerCase();
      console.log("Filtering by title:", searchTerm);
      filteredTodos = filteredTodos.filter((todo) => todo.title && todo.title.toLowerCase().includes(searchTerm));
      console.log("Todos after title filter:", filteredTodos);
    }

    // Filter by tag if search tag is provided
    if (searchParams.tagId) {
      console.log("Filtering by tag ID:", searchParams.tagId);
      filteredTodos = filteredTodos.filter((todo) => todo.tagIds && Array.isArray(todo.tagIds) && todo.tagIds.includes(searchParams.tagId));
      console.log("Todos after tag filter:", filteredTodos);
    }

    if (filteredTodos.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "flex flex-col items-center justify-center h-[200px] text-muted-foreground";

      // Show different message based on whether we're searching or not
      if (searchParams.title || searchParams.tagId) {
        emptyState.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-4 opacity-50">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <p class="text-lg font-medium">No tasks match your search</p>
          <p class="text-sm text-gray-500">Try different search terms or reset the search</p>
        `;
      } else {
        emptyState.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-4 opacity-50">
            <path d="M8 6h13"/>
            <path d="M8 12h13"/>
            <path d="M8 18h13"/>
            <path d="M3 6h.01"/>
            <path d="M3 12h.01"/>
            <path d="M3 18h.01"/>
          </svg>
          <p class="text-lg font-medium">No tasks yet</p>
          <p class="text-sm text-gray-500">Add a task to get started</p>
        `;
      }

      todoList.appendChild(emptyState);
      return;
    }

    // Sort todos by priority and deadline
    filteredTodos.sort((a, b) => {
      const priorityOrder = { URGENT: 0, NORMAL: 1, PENDING: 2, DONE: 3 };

      // First sort by priority
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then sort by deadline, handling null or invalid dates
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1; // Null deadlines come last
      if (!b.deadline) return -1;

      const dateA = new Date(a.deadline);
      const dateB = new Date(b.deadline);

      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;

      return dateA - dateB;
    });

    filteredTodos.forEach((todo) => {
      const todoElement = createTodoElement(todo);
      todoList.appendChild(todoElement);
    });

    // Initialize task timers after todos are loaded
    initTaskTimer();
  } catch (error) {
    console.error("Error loading todos:", error);
    showToast("Error loading todos. Please try again.");
  }
}

function createTodoElement(todo) {
  const div = document.createElement("div");
  div.className = `todo-item ${todo.status.toLowerCase()}`;
  div.setAttribute("data-id", todo.id);
  div.id = `todo-${todo.id}`;

  // Set data-timer-active attribute if task is started
  if (isTaskStarted(todo.startTask)) {
    div.setAttribute("data-timer-active", "true");
  }

  // Move the now declaration to the top since we need it in multiple places
  const now = new Date();

  // Handle null or invalid deadline
  let deadlineDisplay = "No deadline";
  let deadlineDate = null;

  if (todo.deadline) {
    deadlineDate = new Date(todo.deadline);
    if (!isNaN(deadlineDate.getTime())) {
      deadlineDisplay = deadlineDate.toLocaleDateString();
    }
  }

  // Check if task has history
  const hasHistory = todo.taskHistory && todo.taskHistory.length > 0;

  // Calculate accumulated time
  const accumulatedTime = calculateTaskDuration(todo.startTask, todo.taskHistory);

  div.innerHTML = `
    <div class="todo-details">
      <h2>${todo.title}</h2>
      <div class="flex items-center gap-2">
        <p class="text-sm text-gray-600">Priority: ${todo.priority}</p>
        <p class="text-sm text-gray-600">Deadline: ${deadlineDisplay}</p>
        <a href="#" class="link-icon ${todo.link ? "" : "hidden"}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
      ${todo.description ? `<p class="text-sm text-gray-500 mt-2 description">${todo.description}</p>` : ""}
      <div class="mt-2 flex gap-2 items-center flex-wrap">
        <div class="inline-flex">
          <button class="${isTaskStarted(todo.startTask) ? "button-destructive" : "button-outline"} start-task-btn" data-id="${todo.id}">
            ${
              isTaskStarted(todo.startTask)
                ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>`
                : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>`
            }
            ${isTaskStarted(todo.startTask) ? "Stop Task" : "Start Task"}
            <span class="task-duration" data-id="${todo.id}">${accumulatedTime || "00:00:00"}</span>
          </button>
          ${
            hasHistory
              ? `<button class="button-outline start-time-history" data-id="${todo.id}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                  History
                </button>`
              : ""
          }
        </div>

        <div class="todo-tags flex gap-2 items-center flex-wrap">
          ${renderTodoTags(todo)}
          <button class="icon-button add-tags" title="Add Tags" data-id="${todo.id}">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tags"><path d="m15 5 6.3 6.3a2.4 2.4 0 0 1 0 3.4L17 19"/><path d="M9.586 5.586A2 2 0 0 0 8.172 5H3a1 1 0 0 0-1 1v5.172a2 2 0 0 0 .586 1.414L8.29 18.29a2.426 2.426 0 0 0 3.42 0l3.58-3.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="6.5" cy="9.5" r=".5" fill="currentColor"/></svg>
          </button>
        </div>
      </div>
    </div>
    <div class="todo-actions flex items-start gap-2">
      <select class="todo-status input h-10" data-id="${todo.id}">
        <option value="URGENT" ${todo.status === "URGENT" ? "selected" : ""}>Urgent</option>
        <option value="NORMAL" ${todo.status === "NORMAL" ? "selected" : ""}>Normal</option>
        <option value="PENDING" ${todo.status === "PENDING" ? "selected" : ""}>Pending</option>
        <option value="DONE" ${todo.status === "DONE" ? "selected" : ""}>Done</option>
      </select>
      <button class="button-secondary" data-id="${todo.id}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          <path d="m15 5 4 4"/>
        </svg>
        Edit
      </button>
      <button class="button-destructive delete-task-btn" data-id="${todo.id}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"/>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
        Delete
      </button>
    </div>
    `;

  if (deadlineDate < now && todo.status !== "DONE") {
    div.classList.add("overdue");
  }

  div.querySelector(".todo-status").addEventListener("change", (e) => {
    updateTodoStatus(todo.id, e.target.value);
  });

  // Add event listeners for edit and delete buttons
  div.querySelector(".button-secondary").addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (button) {
      editTodo(button.dataset.id);
    }
  });

  div.querySelector(".delete-task-btn").addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (button) {
      deleteTodo(button.dataset.id);
    }
  });

  // Add event listener for start/stop task button
  div.querySelector(".start-task-btn").addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (button) {
      toggleTaskTimer(button.dataset.id);
    }
  });

  // Add event listener for history button if it exists
  const historyButton = div.querySelector(".start-time-history");
  if (historyButton) {
    historyButton.addEventListener("click", (e) => {
      const button = e.target.closest("button");
      if (button) {
        showTaskHistory(button.dataset.id);
      }
    });
  }

  if (todo.link) {
    const linkIcon = div.querySelector(".link-icon");
    linkIcon.href = todo.link;
    linkIcon.addEventListener("click", (e) => {
      e.preventDefault();
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.update(tabs[0].id, { url: todo.link });
      });
    });
  }

  // Add timer update if task is started
  if (isTaskStarted(todo.startTask)) {
    startDurationTimer(todo.id, todo.startTask, todo.taskHistory || []);
  }

  // Add event listener for add tags button
  div.querySelector(".add-tags").addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (button) {
      const todoId = button.dataset.id;
      const tagsDialog = document.getElementById("tagsDialog");
      loadTags(todoId);
      tagsDialog.showModal();
    }
  });

  return div;
}

function resetTodoForm() {
  const form = document.getElementById("todoFormDialog");
  const inputs = form.querySelectorAll("input, textarea, select");
  inputs.forEach((input) => {
    if (input.type === "datetime-local") {
      input.value = new Date().toISOString().slice(0, 16);
    } else if (input.type === "checkbox") {
      input.checked = false;
    } else {
      input.value = "";
    }
  });

  // Reset priority to default
  const priority = document.getElementById("todoPriority");
  if (priority) {
    priority.value = "NORMAL";
  }

  // Clear the todo ID
  form.dataset.todoId = "";

  // Reset dialog title and save button text
  const dialogTitle = form.querySelector("h2");
  if (dialogTitle) {
    dialogTitle.textContent = "Add New Task";
  }

  const saveButton = document.getElementById("saveTodo");
  if (saveButton) {
    saveButton.textContent = "Save Task";
  }
}

async function saveTodo() {
  console.log("Creating new todo");

  const todoTitle = document.getElementById("todoTitle").value.trim();
  const todoDescription = document.getElementById("todoDescription").value.trim();
  const todoLink = document.getElementById("todoLink").value.trim();
  const todoPriority = document.getElementById("todoPriority").value;
  const todoDeadlineInput = document.getElementById("todoDeadline").value;

  // Format deadline properly or set to null if not provided
  const todoDeadline = todoDeadlineInput ? new Date(todoDeadlineInput).toISOString() : null;

  if (!todoTitle) {
    showToast("Please enter a title for the task");
    return;
  }

  if (!todoPriority) {
    showToast("Please select a priority for the task");
    return;
  }

  const newTodo = {
    id: Date.now().toString(),
    title: todoTitle,
    description: todoDescription,
    link: todoLink,
    priority: todoPriority,
    deadline: todoDeadline,
    status: todoPriority,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    tagIds: [],
  };

  console.log("New todo object:", newTodo);

  try {
    // Add the new todo to IndexedDB
    await db.todos.add(newTodo);

    // Reset form and close dialog
    resetTodoForm();
    document.getElementById("todoFormDialog").close();

    // Reload todos
    loadTodos();

    showToast("Task added successfully");
  } catch (error) {
    console.error("Error saving todo:", error);
    showToast("Error saving todo. Please try again.");
  }
}

async function deleteTodo(id) {
  if (confirm("Are you sure you want to delete this task?")) {
    try {
      // Delete the todo from IndexedDB
      await db.todos.remove(id);

      // Reload todos
      loadTodos();

      showToast("Task deleted successfully");
    } catch (error) {
      console.error("Error deleting todo:", error);
      showToast("Error deleting todo. Please try again.");
    }
  }
}

async function updateTodoStatus(id, newStatus) {
  try {
    // Get the todo from IndexedDB
    const todo = await db.todos.getById(id);

    if (!todo) {
      showToast("Task not found");
      return;
    }

    // Update the todo status
    todo.status = newStatus;
    todo.updated = new Date().toISOString();

    // Update the todo in IndexedDB
    await db.todos.update(todo);

    // Update the todo item class to reflect the new status
    const todoElement = document.querySelector(`[data-id="${id}"]`);
    if (todoElement) {
      // Remove all status classes
      todoElement.classList.remove("urgent", "normal", "pending", "done");
      // Add the new status class
      todoElement.classList.add(newStatus.toLowerCase());
    }

    showToast("Task status updated successfully");
  } catch (error) {
    console.error("Error updating todo status:", error);
    showToast("Error updating todo status. Please try again.");
  }
}

async function startAgeCounter(birthDate) {
  try {
    let birthDateObj;

    if (birthDate) {
      // Use the provided birthDate
      birthDateObj = new Date(birthDate);
    } else {
      // Get the profile from IndexedDB
      const profile = await db.profile.get();

      if (!profile || !profile.birthdate) {
        document.getElementById("userAge").textContent = "0.00000000";
        document.getElementById("birthdate").textContent = "No birthdate set";
        return;
      }

      birthDateObj = new Date(profile.birthdate);
    }

    function updateCounter() {
      const now = new Date();
      const ageInMilliseconds = now - birthDateObj;
      const ageInYears = ageInMilliseconds / (1000 * 60 * 60 * 24 * 365.25);
      document.getElementById("userAge").textContent = ageInYears.toFixed(8);
      document.getElementById("birthdate").textContent = `Born on ${birthDateObj.toLocaleDateString()}`;
    }

    updateCounter();
    setInterval(updateCounter, 100);
  } catch (error) {
    console.error("Error starting age counter:", error);
  }
}

async function editTodo(id) {
  try {
    // Get the todo from IndexedDB
    const todo = await db.todos.getById(id);

    if (!todo) {
      showToast("Task not found");
      return;
    }

    console.log("Editing todo:", todo);

    // Populate the form with todo data
    document.getElementById("todoTitle").value = todo.title || "";
    document.getElementById("todoDescription").value = todo.description || "";
    document.getElementById("todoLink").value = todo.link || "";
    document.getElementById("todoPriority").value = todo.priority || "NORMAL";

    // Format deadline for datetime-local input
    if (todo.deadline) {
      // Convert ISO string to local datetime format (YYYY-MM-DDTHH:MM)
      const deadlineDate = new Date(todo.deadline);
      const formattedDeadline = deadlineDate.toISOString().slice(0, 16);
      document.getElementById("todoDeadline").value = formattedDeadline;
    } else {
      document.getElementById("todoDeadline").value = "";
    }

    // Store the todo ID for updating
    document.getElementById("todoFormDialog").dataset.todoId = todo.id;

    // Update dialog title
    document.querySelector("#todoFormDialog h2").textContent = "Edit Task";

    // Update save button text
    document.getElementById("saveTodo").textContent = "Update Task";

    // Show the dialog
    document.getElementById("todoFormDialog").showModal();
  } catch (error) {
    console.error("Error editing todo:", error);
    showToast("Error editing todo. Please try again.");
  }
}

async function updateTodo(id) {
  console.log("Updating existing todo with ID:", id);

  const todoTitle = document.getElementById("todoTitle").value.trim();
  const todoDescription = document.getElementById("todoDescription").value.trim();
  const todoLink = document.getElementById("todoLink").value.trim();
  const todoPriority = document.getElementById("todoPriority").value;
  const todoDeadlineInput = document.getElementById("todoDeadline").value;

  // Format deadline properly or set to null if not provided
  const todoDeadline = todoDeadlineInput ? new Date(todoDeadlineInput).toISOString() : null;

  if (!todoTitle) {
    showToast("Please enter a title for the task");
    return;
  }

  if (!todoPriority) {
    showToast("Please select a priority for the task");
    return;
  }

  try {
    // Get the todo from IndexedDB
    const todo = await db.todos.getById(id);

    if (!todo) {
      showToast("Task not found");
      return;
    }

    console.log("Original todo:", todo);

    // Update the todo properties
    todo.title = todoTitle;
    todo.description = todoDescription;
    todo.link = todoLink;
    todo.priority = todoPriority;
    todo.status = todoPriority; // Set status to match priority
    todo.deadline = todoDeadline;
    todo.updated = new Date().toISOString();

    // Preserve other important properties
    // Make sure we're not losing any existing data
    if (!todo.taskHistory) todo.taskHistory = [];

    console.log("Updated todo object:", todo);

    // Update the todo in IndexedDB
    await db.todos.update(todo);

    // Reset form and close dialog
    resetTodoForm();
    document.getElementById("todoFormDialog").close();

    // Reload todos
    loadTodos();

    showToast("Task updated successfully");
  } catch (error) {
    console.error("Error updating todo:", error);
    showToast("Error updating todo. Please try again.");
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function isTaskStarted(startTask) {
  // Check if startTask is a string (ISO date), which means the task is started
  return startTask !== null && typeof startTask === "string";
}

function calculateTaskDuration(startTask, taskHistory = []) {
  let totalMilliseconds = 0;
  const now = new Date();

  // Add up all completed sessions from task history
  if (taskHistory && taskHistory.length > 0) {
    taskHistory.forEach((entry) => {
      if (entry.duration) {
        totalMilliseconds += entry.duration;
      }
    });
  }

  // Add current session if task is active
  if (startTask && typeof startTask === "string") {
    totalMilliseconds += now - new Date(startTask);
  }

  // If no duration and no active session, return null
  if (totalMilliseconds === 0) return null;

  // Convert to hours, minutes and seconds
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

let durationTimers = {};

function startDurationTimer(todoId, startTask, taskHistory = []) {
  // Clear existing timer if any
  if (durationTimers[todoId]) {
    clearInterval(durationTimers[todoId]);
  }

  // Start new timer
  durationTimers[todoId] = setInterval(async () => {
    const durationElement = document.querySelector(`.task-duration[data-id="${todoId}"]`);
    if (durationElement) {
      // Get the latest todo to ensure we have the most up-to-date taskHistory
      try {
        const todo = await db.todos.getById(todoId);
        if (todo) {
          const duration = calculateTaskDuration(todo.startTask, todo.taskHistory);
          if (duration) {
            durationElement.textContent = duration;
          }
        }
      } catch (error) {
        console.error("Error updating duration:", error);
        // Fallback to using the provided taskHistory if we can't get the latest
        const duration = calculateTaskDuration(startTask, taskHistory);
        if (duration) {
          durationElement.textContent = duration;
        }
      }
    } else {
      // Clean up timer if element no longer exists
      clearInterval(durationTimers[todoId]);
      delete durationTimers[todoId];
    }
  }, 1000);
}

async function toggleTaskTimer(id) {
  try {
    // Get the todo from IndexedDB
    const todo = await db.todos.getById(id);

    if (!todo) {
      showToast("Task not found");
      return;
    }

    // Find the timer button and display elements using the correct selectors
    const todoElement = document.querySelector(`[data-id="${id}"]`);
    if (!todoElement) {
      console.error("Todo element not found");
      return;
    }

    const timerButton = todoElement.querySelector(".start-task-btn");
    let timerDisplay = todoElement.querySelector(".task-duration");

    if (!timerButton) {
      console.error("Timer button not found");
      return;
    }

    // Check if task is already started
    if (isTaskStarted(todo.startTask)) {
      // Stop the task
      const startTask = todo.startTask;
      const endTime = new Date().toISOString();

      // Calculate duration
      const startTime = new Date(startTask);
      const endTimeObj = new Date(endTime);
      const durationMs = endTimeObj - startTime;

      // Add to task history
      const taskHistory = todo.taskHistory || [];
      taskHistory.push({
        start: startTask,
        end: endTime,
        duration: durationMs,
      });

      // Update todo
      todo.taskHistory = taskHistory;
      todo.startTask = null;
      todo.updated = new Date().toISOString();

      // Update the todo in IndexedDB
      await db.todos.update(todo);

      // Update UI
      timerButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        Start Task
      `;
      timerButton.classList.remove("button-destructive");
      timerButton.classList.add("button-outline");

      // Remove data-timer-active attribute
      todoElement.removeAttribute("data-timer-active");

      // Clear the interval
      if (durationTimers[id]) {
        clearInterval(durationTimers[id]);
        delete durationTimers[id];
      }

      // Update the timer display with total accumulated duration
      const duration = calculateTaskDuration(null, taskHistory);

      // If timerDisplay doesn't exist, create it
      if (!timerDisplay) {
        timerDisplay = document.createElement("span");
        timerDisplay.className = "task-duration";
        timerDisplay.setAttribute("data-id", id);
      }

      // Append the timer display to the button
      timerButton.appendChild(timerDisplay);

      // Update the timer display
      timerDisplay.textContent = duration || "00:00:00";

      // Reload the todo to refresh the UI with the history button
      loadTodos();

      showToast("Task timer stopped");
    } else {
      // Start the task
      todo.startTask = new Date().toISOString();
      todo.updated = new Date().toISOString();

      // Update the todo in IndexedDB
      await db.todos.update(todo);

      // Set data-timer-active attribute
      todoElement.setAttribute("data-timer-active", "true");

      // Start the timer with the task history for accumulated time
      startDurationTimer(id, todo.startTask, todo.taskHistory || []);

      // Update UI
      timerButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="6" y="4" width="4" height="16"/>
          <rect x="14" y="4" width="4" height="16"/>
        </svg>
        Stop Task
      `;
      timerButton.classList.remove("button-outline");
      timerButton.classList.add("button-destructive");

      // Add timer display if it doesn't exist
      if (!timerDisplay) {
        timerDisplay = document.createElement("span");
        timerDisplay.className = "task-duration";
        timerDisplay.setAttribute("data-id", id);
      }

      // Append the timer display to the button
      timerButton.appendChild(timerDisplay);

      // Calculate initial accumulated duration
      const initialDuration = calculateTaskDuration(todo.startTask, todo.taskHistory || []);
      timerDisplay.textContent = initialDuration || "00:00:00";

      showToast("Task timer started");
    }
  } catch (error) {
    console.error("Error toggling task timer:", error);
    showToast("Error toggling task timer. Please try again.");
  }
}

function renderTodoTags(todo) {
  if (!todo.tagIds || !todo.tagIds.length) return "";

  // Return empty string initially
  const tagContainer = document.createElement("div");
  tagContainer.className = "todo-tags-container";

  // Get tags asynchronously and update the container
  db.tags
    .getAll()
    .then((tags) => {
      const tagsHtml = todo.tagIds
        .map((tagId) => {
          const tag = tags.find((t) => t.id === tagId);
          if (!tag) return ""; // Skip if tag doesn't exist
          return `<span class="tag-badge" style="background-color: ${tag.tagColor}" data-tooltip="${tag.tagDescription || "No description"}">${
            tag.tagName
          }</span>`;
        })
        .filter((html) => html !== "") // Filter out empty strings
        .join("");

      // Find the todo element and update its tags
      const todoElement = document.querySelector(`[data-id="${todo.id}"]`);
      if (todoElement) {
        const tagsContainer = todoElement.querySelector(".todo-tags");
        if (tagsContainer) {
          const addTagsButton = tagsContainer.querySelector(".add-tags");
          tagsContainer.innerHTML = tagsHtml;
          if (addTagsButton) {
            tagsContainer.appendChild(addTagsButton);
          }

          // Add tooltips to tags
          tagsContainer.querySelectorAll(".tag-badge").forEach((tag) => {
            createTooltip(tag, tag.dataset.tooltip);
          });
        }
      }
    })
    .catch((error) => {
      console.error("Error fetching tags:", error);
    });

  return ""; // Initial render will be empty, then updated asynchronously
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "REFRESH_PROJECTS") {
    loadProjects();
  } else if (message.type === "SHOW_TOAST") {
    showToast(message.message);
  }
});

async function showTaskHistory(todoId) {
  try {
    // Get the todo from IndexedDB
    const todo = await db.todos.getById(todoId);

    if (!todo) {
      showToast("Task not found");
      return;
    }

    const taskHistory = todo.taskHistory || [];
    const taskHistoryContent = document.getElementById("taskHistoryContent");
    const taskHistoryDialog = document.getElementById("taskHistoryDialog");

    let historyHTML = `
      <div class="task-history">
        <h3 class="text-lg font-medium mb-2">${todo.title}</h3>
    `;

    if (taskHistory.length === 0) {
      historyHTML += `
        <p class="text-gray-500">No time tracking history for this task yet.</p>
      </div>
      `;

      taskHistoryContent.innerHTML = historyHTML;
      taskHistoryDialog.showModal();
      return;
    }

    historyHTML += `
        <table class="w-full">
          <thead>
            <tr>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
    `;

    let totalDuration = 0;

    taskHistory.forEach((entry) => {
      const startTime = new Date(entry.start);
      const endTime = new Date(entry.end);
      const duration = entry.duration;

      totalDuration += duration;

      const hours = Math.floor(duration / (1000 * 60 * 60));
      const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((duration % (1000 * 60)) / 1000);

      const formattedDuration = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

      historyHTML += `
            <tr>
              <td>${startTime.toLocaleString()}</td>
              <td>${endTime.toLocaleString()}</td>
              <td>${formattedDuration}</td>
            </tr>
      `;
    });

    const totalHours = Math.floor(totalDuration / (1000 * 60 * 60));
    const totalMinutes = Math.floor((totalDuration % (1000 * 60 * 60)) / (1000 * 60));
    const totalSeconds = Math.floor((totalDuration % (1000 * 60)) / 1000);
    const formattedTotal = `${totalHours.toString().padStart(2, "0")}:${totalMinutes.toString().padStart(2, "0")}:${totalSeconds.toString().padStart(2, "0")}`;

    historyHTML += `
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" class="text-right font-medium">Total:</td>
              <td class="font-medium">${formattedTotal}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    `;

    taskHistoryContent.innerHTML = historyHTML;
    taskHistoryDialog.showModal();
  } catch (error) {
    console.error("Error showing task history:", error);
    showToast("Error showing task history. Please try again.");
  }
}

/**
 * Initialize the search functionality
 */
function initSearch() {
  const searchForm = document.getElementById("todoSearchForm");
  const searchTitle = document.getElementById("searchTitle");
  const searchTag = document.getElementById("searchTag");
  const performSearch = document.getElementById("performSearch");
  const resetSearch = document.getElementById("resetSearch");

  // If showing the form, populate the tag dropdown
  if (searchForm && !searchForm.classList.contains("hidden")) {
    populateTagDropdown();
  }

  // Perform search when search button is clicked
  if (performSearch) {
    performSearch.addEventListener("click", () => {
      currentSearchTitle = searchTitle.value.trim();
      currentSearchTag = searchTag.value;

      loadTodos({
        title: currentSearchTitle,
        tagId: currentSearchTag,
      });
    });
  }

  // Reset search when reset button is clicked
  if (resetSearch) {
    resetSearch.addEventListener("click", () => {
      searchTitle.value = "";
      searchTag.value = "";
      currentSearchTitle = "";
      currentSearchTag = "";

      loadTodos();
    });
  }
}

/**
 * Populate the tag dropdown with available tags
 */
async function populateTagDropdown() {
  try {
    const tags = await db.tags.getAll();
    const searchTag = document.getElementById("searchTag");

    if (!searchTag) {
      console.error("Search tag dropdown not found");
      return;
    }

    // Clear existing options except the first one
    while (searchTag.options.length > 1) {
      searchTag.remove(1);
    }

    // Add tags to dropdown
    tags.forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag.id;
      // Use tagName property if it exists, otherwise fall back to name
      option.textContent = tag.tagName || tag.name || `Tag ${tag.id}`;
      searchTag.appendChild(option);
    });
  } catch (error) {
    console.error("Error populating tag dropdown:", error);
  }
}

/**
 * Toggle the search form visibility
 */
function toggleSearchForm() {
  console.log("Search button clicked, toggling form visibility");
  const searchForm = document.getElementById("todoSearchForm");

  if (searchForm) {
    if (searchForm.classList.contains("hidden") || getComputedStyle(searchForm).display === "none") {
      searchForm.classList.remove("hidden");
      searchForm.style.display = "block";
      console.log("Search form should now be visible");
      // Populate tag dropdown
      populateTagDropdown();
    } else {
      searchForm.classList.add("hidden");
      searchForm.style.display = "none";
      console.log("Search form should now be hidden");
    }
  } else {
    console.error("Search form element not found");
  }
}
