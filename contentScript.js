chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SHOW_TOAST") {
    showToast(message.message);
  } else if (message.type === "REFRESH_TODOS") {
    // If this is the dashboard page, refresh the todos
    if (window.location.href === chrome.runtime.getURL("dashboard.html")) {
      window.dispatchEvent(new CustomEvent("refreshTodos"));
    }
  } else if (message.type === "REFRESH_PROJECTS") {
    // If this is the dashboard page, refresh the projects
    if (window.location.href === chrome.runtime.getURL("dashboard.html")) {
      window.dispatchEvent(new CustomEvent("refreshProjects"));
    }
  } else if (message.type === "SHOW_TODO_DIALOG") {
    // Instead of accessing IndexedDB directly, send a message to the background script
    chrome.runtime.sendMessage(
      {
        type: "CHECK_TODO_EXISTS",
        data: { link: message.data.link },
      },
      function (response) {
        const existingTodo = response && response.todo;

        // Create and show dialog
        const dialog = document.createElement("dialog");
        dialog.className = "dev-dashboard-ext-dialog";

        // Add dialog styles
        const dialogStyle = document.createElement("style");
        dialogStyle.textContent = `
        .dev-dashboard-ext-dialog {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          padding: 1.5rem;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          z-index: 10000;
          max-width: 500px;
          width: 90%;
          border: 1px solid #e2e8f0;
        }
        
        .dev-dashboard-ext-dialog::backdrop {
          background: rgba(0, 0, 0, 0.5);
        }
        
        .dev-dashboard-ext-dialog-content {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        
        .dev-dashboard-ext-dialog-content h2 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: #1e293b;
        }
        
        .dev-dashboard-ext-form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        
        .dev-dashboard-ext-form-group.checkbox-group {
          flex-direction: row;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        
        .dev-dashboard-ext-form-group.checkbox-group input[type="checkbox"] {
          margin: 0;
          width: 16px;
          height: 16px;
        }
        
        .dev-dashboard-ext-form-group.checkbox-group label {
          margin: 0;
          font-size: 0.875rem;
          color: #475569;
        }
        
        .dev-dashboard-ext-form-group label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #475569;
        }
        
        .dev-dashboard-ext-form-group input,
        .dev-dashboard-ext-form-group textarea,
        .dev-dashboard-ext-form-group select {
          padding: 0.5rem;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          font-size: 0.875rem;
        }
        
        .dev-dashboard-ext-form-group textarea {
          min-height: 80px;
          resize: vertical;
        }
        
        .dev-dashboard-ext-todo-info {
          background: #f8fafc;
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }
        
        .dev-dashboard-ext-dialog-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-top: 1rem;
        }
        
        .dev-dashboard-ext-dialog-buttons button {
          padding: 0.5rem 1rem;
          border-radius: 4px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        #dev-dashboard-ext-save {
          background-color: #2563eb;
          color: white;
          border: none;
        }
        
        #dev-dashboard-ext-save:hover {
          background-color: #1d4ed8;
        }
        
        #dev-dashboard-ext-cancel,
        #dev-dashboard-ext-view-todo {
          background-color: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
        }
        
        #dev-dashboard-ext-cancel:hover,
        #dev-dashboard-ext-view-todo:hover {
          background-color: #e2e8f0;
        }
      `;
        document.head.appendChild(dialogStyle);

        let dialogContent = "";

        if (existingTodo) {
          // Show existing todo info
          dialogContent = `
          <div class="dev-dashboard-ext-dialog-content">
            <h2>Task Already Exists</h2>
            <p>A task with this link already exists:</p>
            <div class="dev-dashboard-ext-todo-info">
              <strong>${existingTodo.title}</strong>
              <p>${existingTodo.description || "No description"}</p>
              <p>Priority: ${existingTodo.priority}</p>
              <p>Deadline: ${existingTodo.deadline ? new Date(existingTodo.deadline).toLocaleDateString() : "No deadline"}</p>
            </div>
            <div class="dev-dashboard-ext-dialog-buttons">
              <button id="dev-dashboard-ext-view-todo">View Task</button>
              <button id="dev-dashboard-ext-cancel">Cancel</button>
            </div>
          </div>
        `;
        } else {
          // Show form to create new todo
          dialogContent = `
          <div class="dev-dashboard-ext-dialog-content">
            <h2>Add New Task</h2>
            <form id="dev-dashboard-ext-todo-form">
              <div class="dev-dashboard-ext-form-group">
                <label for="dev-dashboard-ext-title">Title</label>
                <input type="text" id="dev-dashboard-ext-title" value="${message.data.title || ""}" required>
              </div>
              <div class="dev-dashboard-ext-form-group">
                <label for="dev-dashboard-ext-description">Description</label>
                <textarea id="dev-dashboard-ext-description">${message.data.description || ""}</textarea>
              </div>
              <div class="dev-dashboard-ext-form-group">
                <label for="dev-dashboard-ext-priority">Priority</label>
                <select id="dev-dashboard-ext-priority" required>
                  <option value="">Select priority...</option>
                  <option value="URGENT">Urgent</option>
                  <option value="NORMAL">Normal</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
              <div class="dev-dashboard-ext-form-group">
                <label for="dev-dashboard-ext-deadline">Deadline (Optional)</label>
                <input type="date" id="dev-dashboard-ext-deadline">
              </div>
              <div class="dev-dashboard-ext-form-group checkbox-group">
                <input type="checkbox" id="dev-dashboard-ext-start-immediately">
                <label for="dev-dashboard-ext-start-immediately">Start task immediately after saving</label>
              </div>
              <input type="hidden" id="dev-dashboard-ext-link" value="${message.data.link || ""}">
              <div class="dev-dashboard-ext-dialog-buttons">
                <button type="submit" id="dev-dashboard-ext-save">Save Task</button>
                <button type="button" id="dev-dashboard-ext-cancel">Cancel</button>
              </div>
            </form>
          </div>
        `;
        }

        dialog.innerHTML = dialogContent;
        document.body.appendChild(dialog);
        dialog.showModal();

        // Add event listeners
        const cancelBtn = dialog.querySelector("#dev-dashboard-ext-cancel");
        cancelBtn.addEventListener("click", () => {
          dialog.close();
          dialog.remove();
          document.head.removeChild(dialogStyle);
        });

        dialog.addEventListener("click", (e) => {
          if (e.target === dialog) {
            dialog.close();
            dialog.remove();
            document.head.removeChild(dialogStyle);
          }
        });

        if (existingTodo) {
          const viewTodoBtn = dialog.querySelector("#dev-dashboard-ext-view-todo");
          viewTodoBtn.addEventListener("click", () => {
            chrome.runtime.sendMessage({
              type: "OPEN_DASHBOARD_WITH_TODO",
              todoId: existingTodo.id,
            });
            dialog.close();
            dialog.remove();
            document.head.removeChild(dialogStyle);
          });
        } else {
          const todoForm = dialog.querySelector("#dev-dashboard-ext-todo-form");
          todoForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const title = document.getElementById("dev-dashboard-ext-title").value;
            const description = document.getElementById("dev-dashboard-ext-description").value;
            const priority = document.getElementById("dev-dashboard-ext-priority").value;
            const link = document.getElementById("dev-dashboard-ext-link").value;
            const deadlineInput = document.getElementById("dev-dashboard-ext-deadline").value;
            const startImmediately = document.getElementById("dev-dashboard-ext-start-immediately").checked;

            // Format deadline properly or set to null if not provided
            const deadline = deadlineInput ? new Date(deadlineInput).toISOString() : null;

            if (!title) {
              showToast("Please enter a title for the task");
              return;
            }

            if (!priority) {
              showToast("Please select a priority for the task");
              return;
            }

            // Send message to background script to save the todo
            chrome.runtime.sendMessage(
              {
                type: "SAVE_TODO",
                data: {
                  title,
                  description,
                  priority,
                  link,
                  deadline,
                  startImmediately,
                },
              },
              function (response) {
                if (response && response.success) {
                  showToast("Task added successfully");
                  dialog.close();
                  dialog.remove();
                  document.head.removeChild(dialogStyle);
                } else {
                  showToast("Error saving task. Please try again.");
                }
              }
            );
          });
        }
      }
    );
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
