chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SHOW_TOAST") {
    showToast(message.message);
  } else if (message.type === "REFRESH_TODOS") {
    // If this is the dashboard page, refresh the todos
    if (window.location.href === chrome.runtime.getURL("dashboard.html")) {
      window.dispatchEvent(new CustomEvent("refreshTodos"));
    }
  } else if (message.type === "SHOW_TODO_DIALOG") {
    // First check if a todo with this link already exists
    chrome.storage.local.get(["todos"], (result) => {
      const todos = result.todos || [];
      const existingTodo = todos.find((todo) => todo.link === message.data.link);

      // Create and show dialog
      const dialog = document.createElement("dialog");
      dialog.className = "dev-dashboard-ext-dialog";

      dialog.innerHTML = `
        <div class="dev-dashboard-ext-container">
          <h2 class="dev-dashboard-ext-title">${existingTodo ? "Update TODO" : "Add to TODO"}</h2>
          <div class="dev-dashboard-ext-field">
            <label class="dev-dashboard-ext-label">Title</label>
            <input type="text" id="todoTitle" class="dev-dashboard-ext-input">
          </div>
          <div class="dev-dashboard-ext-field">
            <label class="dev-dashboard-ext-label">Description</label>
            <textarea id="todoDescription" class="dev-dashboard-ext-input dev-dashboard-ext-textarea" placeholder="Enter description..."></textarea>
          </div>
          <div class="dev-dashboard-ext-field">
            <label class="dev-dashboard-ext-label">Link</label>
            <input type="url" id="todoLink" class="dev-dashboard-ext-input">
          </div>
          <div class="dev-dashboard-ext-field">
            <label class="dev-dashboard-ext-label">Deadline</label>
            <input type="datetime-local" id="todoDeadline" class="dev-dashboard-ext-input">
          </div>
          <div class="dev-dashboard-ext-field">
            <label class="dev-dashboard-ext-label">Priority</label>
            <select id="todoPriority" class="dev-dashboard-ext-input dev-dashboard-ext-select">
              <option value="NORMAL" selected>Normal</option>
              <option value="URGENT">Urgent</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <div class="dev-dashboard-ext-field">
            <label class="dev-dashboard-ext-checkbox-label">
              <input type="checkbox" id="todoStartTask" class="dev-dashboard-ext-checkbox">
              Start timing this task immediately
            </label>
          </div>
          <div class="dev-dashboard-ext-actions">
            <button id="cancelBtn" class="dev-dashboard-ext-button-secondary">Cancel</button>
            <button id="saveBtn" class="dev-dashboard-ext-button-primary">Save</button>
          </div>
        </div>
      `;

      // Add styles
      const style = document.createElement("style");
      style.textContent = `
        /* Scoped reset for our dialog only */
        .dev-dashboard-ext-dialog * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .dev-dashboard-ext-dialog {
          --ext-background: #ffffff;
          --ext-foreground: #0f172a;
          --ext-card: #ffffff;
          --ext-card-foreground: #0f172a;
          --ext-primary: hsl(222.2 47.4% 11.2%);
          --ext-primary-foreground: #ffffff;
          --ext-secondary: #f1f5f9;
          --ext-secondary-foreground: #0f172a;
          --ext-muted: #f1f5f9;
          --ext-muted-foreground: #64748b;
          --ext-border: #e2e8f0;
          --ext-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);

          border: none;
          box-shadow: var(--ext-shadow);
          background: var(--ext-background);
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          max-width: 90vw;
          max-height: 90vh;
          z-index: 2147483647;
          margin: 0;
          padding: 0;
          padding-left: 0.5rem;
          padding-right: 0.5rem;
        }
        .dev-dashboard-ext-dialog::backdrop {
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }
        .dev-dashboard-ext-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding: 1rem;
          min-width: 400px;
        }
        .dev-dashboard-ext-field {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .dev-dashboard-ext-input {
          border: 1px solid var(--ext-border);
          padding: 0.5rem;
          background: var(--ext-background);
          color: var(--ext-foreground);
          height: 2.5rem;
          width: 100%;
          outline: none;
          transition: all 0.2s;
        }
        .dev-dashboard-ext-input:focus {
          border-color: var(--ext-primary);
          box-shadow: 0 0 0 1px var(--ext-primary);
        }
        .dev-dashboard-ext-textarea {
          min-height: 100px;
          height: auto;
          resize: vertical;
        }
        .dev-dashboard-ext-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none' stroke='currentColor' stroke-width='1.5'%3E%3Cpath d='M2.5 5L6 8.5L9.5 5'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          padding-right: 2.5rem;
        }
        .dev-dashboard-ext-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }
        .dev-dashboard-ext-button-primary {
          background-color: var(--ext-primary);
          color: white;
          padding: 0.5rem 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
        .dev-dashboard-ext-button-primary:hover {
          opacity: 0.8;
          transform: translateY(-1px);
        }
        .dev-dashboard-ext-button-secondary {
          background-color: var(--ext-secondary);
          color: var(--ext-secondary-foreground);
          padding: 0.5rem 1rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
        .dev-dashboard-ext-button-secondary:hover {
          opacity: 0.8;
          transform: translateY(-1px);
        }
        .dev-dashboard-ext-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--ext-foreground);
          margin-bottom: 0.5rem;
        }
        .dev-dashboard-ext-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--ext-muted-foreground);
        }
        .dev-dashboard-ext-checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          color: var(--ext-foreground);
        }

        .dev-dashboard-ext-checkbox {
          width: 1rem;
          height: 1rem;
          border: 1px solid var(--ext-border);
          border-radius: 0.25rem;
          cursor: pointer;
        }
      `;

      document.head.appendChild(style);
      document.body.appendChild(dialog);

      // Show the dialog first
      dialog.showModal();

      // Wait for next tick to ensure DOM is ready
      setTimeout(() => {
        // Set the title and add event listeners AFTER adding dialog to DOM
        const todoTitle = dialog.querySelector("#todoTitle");
        const todoLink = dialog.querySelector("#todoLink");
        const todoDeadline = dialog.querySelector("#todoDeadline");
        const saveBtn = dialog.querySelector("#saveBtn");
        const cancelBtn = dialog.querySelector("#cancelBtn");
        const todoDescription = dialog.querySelector("#todoDescription");
        const todoPriority = dialog.querySelector("#todoPriority");

        // Fill form with existing data if found
        if (existingTodo) {
          todoTitle.value = existingTodo.title;
          todoDescription.value = existingTodo.description || "";
          todoLink.value = existingTodo.link;
          todoPriority.value = existingTodo.priority;
          todoDeadline.value = new Date(existingTodo.deadline).toISOString().slice(0, 16);
        } else {
          if (todoTitle) todoTitle.value = message.data.title;
          if (todoLink) todoLink.value = message.data.link;
          if (todoPriority) todoPriority.value = "NORMAL"; // Default priority
          if (todoDeadline) {
            const now = new Date();
            todoDeadline.value = now.toISOString().slice(0, 16);
          }
        }

        if (saveBtn) {
          saveBtn.addEventListener("click", () => {
            const todoData = {
              id: existingTodo ? existingTodo.id : Date.now().toString(),
              title: dialog.querySelector("#todoTitle").value,
              description: dialog.querySelector("#todoDescription").value || "",
              priority: dialog.querySelector("#todoPriority").value,
              link: dialog.querySelector("#todoLink").value,
              status: existingTodo ? existingTodo.status : "NORMAL",
              deadline: new Date(dialog.querySelector("#todoDeadline").value).toISOString(),
              updatedAt: new Date().toISOString(),
              createdAt: existingTodo ? existingTodo.createdAt : new Date().toISOString(),
              startTask: dialog.querySelector("#todoStartTask").checked ? [[new Date().toISOString()]] : [],
            };

            // Validate deadline
            if (!todoData.deadline) {
              showToast("Please set a valid deadline!");
              return;
            }

            chrome.runtime.sendMessage(
              {
                type: existingTodo ? "UPDATE_TODO" : "SAVE_TODO",
                todo: todoData,
              },
              (response) => {
                showToast(`Todo ${existingTodo ? "updated" : "added"} successfully!`);
              }
            );

            dialog.close();
            dialog.remove();
          });
        }

        if (cancelBtn) {
          cancelBtn.addEventListener("click", () => {
            dialog.close();
            dialog.remove();
          });
        }

        // Add backdrop click handler
        dialog.addEventListener("click", (e) => {
          const dialogDimensions = dialog.getBoundingClientRect();
          if (
            e.clientX < dialogDimensions.left ||
            e.clientX > dialogDimensions.right ||
            e.clientY < dialogDimensions.top ||
            e.clientY > dialogDimensions.bottom
          ) {
            dialog.close();
            dialog.remove();
          }
        });
      }, 0);
    });
  }
});

function showToast(message) {
  const toast = document.createElement("div");
  toast.style.cssText = `
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        padding: 1rem;
        background-color: hsl(222.2 47.4% 11.2%);
        color: white;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s;
    `;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Force reflow
  toast.offsetHeight;
  toast.style.opacity = "1";

  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 300);
  }, 3000);
}
