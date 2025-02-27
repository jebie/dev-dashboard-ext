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
    document.getElementById("todoFormDialog").showModal();
  });

  document.getElementById("saveTodo").addEventListener("click", saveTodo);
  document.getElementById("cancelTodo").addEventListener("click", () => {
    resetTodoForm();
    document.getElementById("todoFormDialog").close();
  });

  // Close modal when clicking outside
  document.getElementById("todoFormDialog").addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("dialog-backdrop")) {
      resetTodoForm();
      document.getElementById("todoFormDialog").close();
    }
  });
});

function loadTodos() {
  chrome.storage.sync.get(["todos"], (result) => {
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
        <p class="text-sm text-center" style="max-width: 400px;">Bravo! You've cleared your to-do list. In the realm of programming, where there's always another bug to squash and a feature to develop, achieving this is commendable. Your code has compiled, your scripts have run, and for a fleeting moment, the semicolons are all in their right places. Now, take a moment to sit back and revel in the harmony of an empty task queue. Bask in the calmness, uncluttered by pending tasks. Remember, every line of code you wrote today had a purpose and made a difference. Great work, programmer!</p>
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
  div.innerHTML = `
    <div class="todo-details">
      <h2>${todo.title}</h2>
      <div class="flex items-center gap-2">
        <p class="text-sm text-gray-600">Status: ${todo.status}</p>
        <p class="text-sm text-gray-600">Deadline: ${new Date(todo.deadline).toLocaleDateString()}</p>
        <a href="#" class="link-icon ${todo.link ? "" : "hidden"}">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
      ${todo.description ? `<p class="text-sm text-gray-500 mt-2 description">${todo.description}</p>` : ""}
    </div>
    <div class="todo-actions">
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
      <button class="button-destructive" data-id="${todo.id}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"/>
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          <line x1="10" y1="11" x2="10" y2="17"/>
          <line x1="14" y1="11" x2="14" y2="17"/>
        </svg>
        Delete
      </button>
    </div>`;

  const now = new Date();
  const deadline = new Date(todo.deadline);
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

  div.querySelector(".button-destructive").addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (button && confirm("Are you sure you want to delete this task?")) {
      deleteTodo(button.dataset.id);
    }
  });

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

  return div;
}

function resetTodoForm() {
  const form = document.getElementById("todoFormDialog");
  const inputs = form.querySelectorAll("input, textarea, select");
  inputs.forEach((input) => {
    if (input.type === "datetime-local") {
      input.value = new Date().toISOString().slice(0, 16);
    } else {
      input.value = "";
    }
  });

  // Reset priority to default
  const priority = document.getElementById("todoPriority");
  priority.selectedIndex = 0;
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

  chrome.storage.sync.get(["todos"], (result) => {
    const todos = result.todos || [];
    const newTodo = {
      id: Date.now().toString(),
      title,
      description,
      link: link || null,
      priority,
      deadline,
      status: priority,
      createdAt: new Date().toISOString(),
    };

    todos.push(newTodo);
    chrome.storage.sync.set({ todos }, () => {
      loadTodos();
      resetTodoForm();
      document.getElementById("todoFormDialog").close();
      showToast("Todo added successfully!");
    });
  });
}

function deleteTodo(id) {
  chrome.storage.sync.get(["todos"], (result) => {
    const todos = result.todos.filter((todo) => todo.id !== id);
    chrome.storage.sync.set({ todos }, () => {
      loadTodos();
      showToast("Todo deleted successfully!");
    });
  });
}

function updateTodoStatus(id, newStatus) {
  chrome.storage.sync.get(["todos"], (result) => {
    const todos = result.todos.map((todo) => {
      if (todo.id === id) {
        return { ...todo, priority: newStatus, status: newStatus };
      }
      return todo;
    });
    chrome.storage.sync.set({ todos }, () => {
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
  chrome.storage.sync.get(["todos"], (result) => {
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
      todoDeadline.value = todo.deadline.slice(0, 16); // Format datetime-local value

      dialog.showModal();

      // Remove any existing click handlers
      saveTodoBtn.replaceWith(saveTodoBtn.cloneNode(true));
      const newSaveBtn = document.getElementById("saveTodo");

      // Add new click handler
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

  chrome.storage.sync.get(["todos"], (result) => {
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

    chrome.storage.sync.set({ todos }, () => {
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
