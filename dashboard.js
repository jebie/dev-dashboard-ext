document.addEventListener("DOMContentLoaded", () => {
  // Load user profile
  chrome.storage.sync.get(["userName", "birthdate"], (result) => {
    const defaultName = "Juan Dela Cruz";
    const defaultBirthdate = "1992-04-14";

    if (result.userName) {
      document.getElementById("userName").textContent = result.userName;
    } else {
      document.getElementById("userName").textContent = defaultName;
      chrome.storage.sync.set({ userName: defaultName });
    }
    if (result.birthdate) {
      document.getElementById("birthdate").textContent = new Date(result.birthdate).toLocaleDateString();
      startAgeCounter(new Date(result.birthdate));
    } else {
      document.getElementById("birthdate").textContent = new Date(defaultBirthdate).toLocaleDateString();
      startAgeCounter(new Date(defaultBirthdate));
      chrome.storage.sync.set({ birthdate: defaultBirthdate });
    }
  });

  // Load todos
  loadTodos();

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
    console.error("Required elements not found");
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
    document.getElementById("todoFormDialog").showModal();
  });

  document.getElementById("saveTodo").addEventListener("click", saveTodo);
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
});

function loadTodos() {
  chrome.storage.local.get(["todos"], (result) => {
    const todos = result.todos || [];
    const todoList = document.getElementById("todoList");
    todoList.innerHTML = "";

    if (todos.length === 0) {
      const emptyState = document.createElement("div");
      emptyState.className = "flex flex-col items-center justify-center h-[200px] text-muted-foreground";
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
        <p class="text-sm text-center" style="max-width: 400px;">Bravo! You've cleared your to-do list—a rare feat in programming! Take a moment to enjoy the calm before the next bug or feature. Great job!</p>
      `;
      todoList.appendChild(emptyState);
      return;
    }

    // Sort todos by priority and deadline
    todos.sort((a, b) => {
      const priorityOrder = { URGENT: 0, NORMAL: 1, PENDING: 2, DONE: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority] || new Date(a.deadline) - new Date(b.deadline);
    });

    todos.forEach((todo) => {
      const todoElement = createTodoElement(todo);
      todoList.appendChild(todoElement);
    });
  });
}

function createTodoElement(todo) {
  const div = document.createElement("div");
  div.className = `todo-item ${todo.priority.toLowerCase()}`;
  div.setAttribute("data-id", todo.id);

  // Move the now declaration to the top since we need it in multiple places
  const now = new Date();
  const deadline = new Date(todo.deadline);

  div.innerHTML = `
    <div class="todo-details">
      <h2>${todo.title}</h2>
      <div class="flex items-center gap-2">
        <p class="text-sm text-gray-600">Status: ${todo.status}</p>
        <p class="text-sm text-gray-600">Deadline: ${deadline.toLocaleDateString()}</p>
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
        <button class="${
          isTaskStarted(todo.startTask) ? "button-destructive" : "button-outline"
        } start-task-btn" data-id="${todo.id}">
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
          ${
            calculateTaskDuration(todo.startTask)
              ? `<span class="task-duration" data-id="${todo.id}">${calculateTaskDuration(todo.startTask)}</span>`
              : ""
          }
        </button>
        ${
          todo.startTask && todo.startTask.length > 0
            ? `<button class="button-outline start-time-history" data-id="${todo.id}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-list">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
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

  if (deadline < now && todo.status !== "DONE") {
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
    if (button && confirm("Are you sure you want to delete this task?")) {
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
    startDurationTimer(todo.id, todo.startTask);
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
}

function saveTodo() {
  const title = document.getElementById("todoTitle").value;
  const description = document.getElementById("todoDescription").value;
  const link = document.getElementById("todoLink").value;
  const priority = document.getElementById("todoPriority").value;
  const deadline = document.getElementById("todoDeadline").value;

  if (!title || !deadline) {
    showToast("Please fill in all required fields!");
    return;
  }

  chrome.storage.local.get(["todos"], (result) => {
    const todos = result.todos || [];
    const newTodo = {
      id: Date.now().toString(),
      title,
      description,
      link: link || null,
      priority,
      deadline,
      status: priority,
      startTask: [],
      createdAt: new Date().toISOString(),
    };

    todos.push(newTodo);
    chrome.storage.local.set({ todos }, () => {
      loadTodos();
      resetTodoForm();
      document.getElementById("todoFormDialog").close();
      showToast("Todo added successfully!");
    });
  });
}

function deleteTodo(id) {
  chrome.storage.local.get(["todos"], (result) => {
    const todos = result.todos.filter((todo) => todo.id !== id);
    chrome.storage.local.set({ todos }, () => {
      loadTodos();
      showToast("Todo deleted successfully!");
    });
  });
}

function updateTodoStatus(id, newStatus) {
  chrome.storage.local.get(["todos"], (result) => {
    const todos = result.todos.map((todo) => {
      if (todo.id === id) {
        return { ...todo, priority: newStatus, status: newStatus };
      }
      return todo;
    });
    chrome.storage.local.set({ todos }, () => {
      loadTodos();
      showToast("Todo status updated!");
    });
  });
}

function startAgeCounter(birthDate) {
  const ageElement = document.getElementById("userAge");

  function updateCounter() {
    const now = new Date();
    const yearDiff = now.getTime() - birthDate.getTime();
    const ageDecimal = yearDiff / (365.25 * 24 * 60 * 60 * 1000); // Account for leap years

    ageElement.textContent = ageDecimal.toFixed(8);
  }

  // Update every second
  updateCounter();
  setInterval(updateCounter, 1000);
}

function editTodo(id) {
  chrome.storage.local.get(["todos"], (result) => {
    const todo = result.todos.find((t) => t.id === id);
    if (todo) {
      const dialog = document.getElementById("todoFormDialog");
      const todoTitle = document.getElementById("todoTitle");
      const todoDescription = document.getElementById("todoDescription");
      const todoLink = document.getElementById("todoLink");
      const todoPriority = document.getElementById("todoPriority");
      const todoDeadline = document.getElementById("todoDeadline");
      const saveTodoBtn = document.getElementById("saveTodo");

      // Fill in existing data
      todoTitle.value = todo.title;
      todoDescription.value = todo.description || "";
      todoLink.value = todo.link || "";
      todoPriority.value = todo.priority;
      // Format the deadline to match datetime-local input format (YYYY-MM-DDThh:mm)
      todoDeadline.value = new Date(todo.deadline).toISOString().slice(0, 16);

      dialog.showModal();

      // Remove any existing click handlers
      const newSaveBtn = saveTodoBtn.cloneNode(true);
      saveTodoBtn.parentNode.replaceChild(newSaveBtn, saveTodoBtn);

      // Add new click handler for update
      newSaveBtn.addEventListener("click", () => updateTodo(id));
    }
  });
}

function updateTodo(id) {
  const title = document.getElementById("todoTitle").value;
  const description = document.getElementById("todoDescription").value;
  const link = document.getElementById("todoLink").value;
  const priority = document.getElementById("todoPriority").value;
  const deadline = document.getElementById("todoDeadline").value;

  if (!title || !deadline) {
    showToast("Please fill in all required fields!");
    return;
  }

  chrome.storage.local.get(["todos"], (result) => {
    const todos = result.todos.map((todo) => {
      if (todo.id === id) {
        return {
          ...todo,
          title,
          description,
          link: link || null,
          priority,
          deadline: new Date(deadline).toISOString(),
          status: priority,
          updatedAt: new Date().toISOString(),
        };
      }
      return todo;
    });

    chrome.storage.local.set({ todos }, () => {
      loadTodos();
      document.getElementById("todoFormDialog").close();
      showToast("Todo updated successfully!");
    });
  });
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
  if (!startTask || !Array.isArray(startTask)) return false;
  const lastEntry = startTask[startTask.length - 1];
  return Array.isArray(lastEntry) && lastEntry.length === 1;
}

function calculateTaskDuration(startTask) {
  if (!startTask || !Array.isArray(startTask) || startTask.length === 0) return null;

  let totalMilliseconds = 0;
  const now = new Date();

  startTask.forEach((entry) => {
    if (entry.length === 2) {
      // Completed interval
      totalMilliseconds += new Date(entry[1]) - new Date(entry[0]);
    } else if (entry.length === 1) {
      // Ongoing interval
      totalMilliseconds += now - new Date(entry[0]);
    }
  });

  // Convert to hours, minutes and seconds
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

let durationTimers = {};

function startDurationTimer(todoId, startTask) {
  // Clear existing timer if any
  if (durationTimers[todoId]) {
    clearInterval(durationTimers[todoId]);
  }

  // Start new timer
  durationTimers[todoId] = setInterval(() => {
    const durationElement = document.querySelector(`.task-duration[data-id="${todoId}"]`);
    if (durationElement) {
      durationElement.textContent = calculateTaskDuration(startTask);
    } else {
      // Clean up timer if element no longer exists
      clearInterval(durationTimers[todoId]);
      delete durationTimers[todoId];
    }
  }, 1000);
}

function toggleTaskTimer(id) {
  chrome.storage.local.get(["todos"], (result) => {
    const todos = result.todos.map((todo) => {
      if (todo.id === id) {
        const startTask = todo.startTask || [];
        const now = new Date().toISOString();

        if (isTaskStarted(startTask)) {
          // Stop the task - add end time to last entry
          startTask[startTask.length - 1].push(now);
          // Clear the timer
          if (durationTimers[id]) {
            clearInterval(durationTimers[id]);
            delete durationTimers[id];
          }
        } else {
          // Start the task - add new entry with start time
          startTask.push([now]);
        }

        return {
          ...todo,
          startTask,
          updatedAt: now,
        };
      }
      return todo;
    });

    chrome.storage.local.set({ todos }, () => {
      loadTodos();
      showToast("Task timer updated!");
    });
  });
}

function renderTodoTags(todo) {
  if (!todo.tagIds || !todo.tagIds.length) return "";

  // Return empty string initially
  const tagContainer = document.createElement("div");
  tagContainer.className = "todo-tags-container";

  // Get tags asynchronously and update the container
  chrome.storage.local.get(["tags"], (result) => {
    const tags = result.tags || [];
    const tagsHtml = todo.tagIds
      .map((tagId) => {
        const tag = tags.find((t) => t.id === tagId);
        if (!tag) return "";
        return `<span class="tag-badge" style="background-color: ${tag.tagColor}" data-tooltip="${
          tag.tagDescription || "No description"
        }">${tag.tagName}</span>`;
      })
      .join("");

    // Find the todo element and update its tags
    const todoElement = document.querySelector(`[data-id="${todo.id}"]`);
    if (todoElement) {
      const tagsContainer = todoElement.querySelector(".todo-tags");
      if (tagsContainer) {
        const addTagsButton = tagsContainer.querySelector(".add-tags");
        tagsContainer.innerHTML = tagsHtml;
        tagsContainer.appendChild(addTagsButton);

        // Add tooltips to tags
        tagsContainer.querySelectorAll(".tag-badge").forEach((tag) => {
          createTooltip(tag, tag.dataset.tooltip);
        });
      }
    }
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

function showTaskHistory(todoId) {
  chrome.storage.local.get(["todos"], (result) => {
    const todos = result.todos || [];
    const todo = todos.find(t => t.id === todoId);
    
    if (!todo || !todo.startTask || todo.startTask.length === 0) {
      showToast("No history available for this task");
      return;
    }
    
    const taskHistoryContent = document.getElementById("taskHistoryContent");
    const taskHistoryDialog = document.getElementById("taskHistoryDialog");
    
    if (!taskHistoryContent || !taskHistoryDialog) {
      console.error("Task history elements not found");
      return;
    }
    
    // Create the history table
    let historyHTML = `
      <h3 class="text-lg font-medium mb-2">${todo.title}</h3>
      <div class="task-history">
        <table class="w-full text-sm">
          <thead>
            <tr>
              <th class="text-left">Start Date</th>
              <th class="text-left">End Date</th>
              <th class="text-left">Duration</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Calculate total duration
    let totalDuration = 0;
    
    todo.startTask.forEach(entry => {
      const startDate = new Date(entry[0]);
      let endDate = entry[1] ? new Date(entry[1]) : null;
      let duration = 0;
      
      if (endDate) {
        duration = endDate - startDate;
      } else {
        endDate = new Date();
        duration = endDate - startDate;
      }
      
      totalDuration += duration;
      
      // Format duration as HH:MM:SS
      const durationHours = Math.floor(duration / (1000 * 60 * 60));
      const durationMinutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
      const durationSeconds = Math.floor((duration % (1000 * 60)) / 1000);
      const formattedDuration = `${durationHours.toString().padStart(2, '0')}:${durationMinutes.toString().padStart(2, '0')}:${durationSeconds.toString().padStart(2, '0')}`;
      
      historyHTML += `
        <tr>
          <td>${startDate.toLocaleString()}</td>
          <td>${entry[1] ? endDate.toLocaleString() : "-"}</td>
          <td>${formattedDuration}</td>
        </tr>
      `;
    });
    
    // Format total duration
    const totalHours = Math.floor(totalDuration / (1000 * 60 * 60));
    const totalMinutes = Math.floor((totalDuration % (1000 * 60 * 60)) / (1000 * 60));
    const totalSeconds = Math.floor((totalDuration % (1000 * 60)) / 1000);
    const formattedTotal = `${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}:${totalSeconds.toString().padStart(2, '0')}`;
    
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
  });
}
