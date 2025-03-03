let tagColors = [
  "#EF4444",
  "#F97316",
  "#F59E0B",
  "#EAB308",
  "#84CC16",
  "#22C55E",
  "#10B981",
  "#14B8A6",
  "#06B6D4",
  "#0EA5E9",
  "#3B82F6",
  "#6366F1",
  "#8B5CF6",
  "#A855F7",
  "#D946EF",
  "#EC4899",
  "#F43F5E",
  "#64748B",
  "#6B7280",
  "#71717A",
  "#737373",
  "#78716C",
  "#7C2D12",
  "#831843",
  "#831843",
  "#052e16",
  "#082f49",
  "#0c4a6e",
  "#1e1b4b",
  "#312e81",
  "#3f6212",
  "#4c1d95",
  "#581c87",
  "#5b21b6",
  "#6b21a8",
  "#7c2d12",
  "#7e22ce",
  "#831843",
  "#86198f",
  "#881337",
  "#9f1239",
  "#a21caf",
  "#b45309",
  "#b91c1c",
  "#be123c",
  "#be185d",
  "#c2410c",
  "#c026d3",
  "#ca8a04",
  "#dc2626",
];

document.addEventListener("DOMContentLoaded", () => {
  // Add Tags button next to Add Task
  const addTaskBtn = document.getElementById("addTodo");
  const tagsBtn = document.createElement("button");
  tagsBtn.className = "button-outline";
  tagsBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/>
      <path d="M7 7h.01"/>
      <path d="M7 7h.01"/>
      <path d="M7 7h.01"/>
      <path d="m5 5 14 14"/>
    </svg>
    Tags
  `;
  addTaskBtn.parentNode.insertBefore(tagsBtn, addTaskBtn.nextSibling);

  // Create Tags Dialog
  const tagsDialog = document.createElement("dialog");
  tagsDialog.id = "tagsDialog";
  tagsDialog.className = "dialog";
  tagsDialog.innerHTML = `
    <div class="dialog-backdrop fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div class="dialog-content bg-white/90 p-6 w-96 flex flex-col gap-4 relative">
        <button class="close-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>
        <div class="flex gap-2 items-center">
          <h2 class="text-xl font-semibold title">Tags</h2>
          <button id="showTagForm" class="button-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14"/>
              <path d="M5 12h14"/>
            </svg>
            Add Tag
          </button>
        </div>
        <form id="tagForm" class="tag-form flex flex-col gap-4 hidden">
          <div class="flex gap-4">
            <div class="flex-1">
              <input type="text" id="tagName" class="input h-10 w-full" placeholder="Tag Name" required>
            </div>
            <div class="color-selector flex items-center gap-2">
              <div class="selected-color w-10 h-10 rounded cursor-pointer" style="background-color: ${tagColors[0]}"></div>
            </div>
          </div>
          <div class="color-grid hidden">
            ${tagColors
              .map(
                (color) => `
              <label class="color-option">
                <input type="radio" name="tagColor" value="${color}" ${color === tagColors[0] ? "checked" : ""}>
                <span style="background-color: ${color}"></span>
              </label>
            `
              )
              .join("")}
          </div>
          <textarea id="tagDescription" class="input min-h-[100px] p-2" placeholder="Tag description (optional)"></textarea>
          <div class="flex gap-2">
            <button type="reset" class="button-secondary flex-1">Reset</button>
            <button type="submit" id="tagSubmitBtn" class="button-primary flex-1">Add Tag</button>
          </div>
        </form>
        <div class="tag-list mt-4">
          <!-- Tags will be inserted here -->
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(tagsDialog);

  // Event Listeners
  tagsBtn.addEventListener("click", () => {
    loadTags();
    tagsDialog.showModal();
  });

  tagsDialog.querySelector(".close-button").addEventListener("click", () => {
    tagsDialog.close();
    document.getElementById("tagForm").classList.add("hidden");
  });

  tagsDialog.addEventListener("click", (e) => {
    if (e.target.classList.contains("dialog-backdrop")) {
      tagsDialog.close();
      document.getElementById("tagForm").classList.add("hidden");
    }
  });

  document.getElementById("tagForm").addEventListener("submit", (e) => {
    e.preventDefault();
    saveTag();
  });

  const colorSelector = tagsDialog.querySelector(".color-selector");
  const colorGrid = tagsDialog.querySelector(".color-grid");
  const selectedColor = tagsDialog.querySelector(".selected-color");

  colorSelector.addEventListener("click", () => {
    colorGrid.classList.toggle("hidden");
  });

  colorGrid.addEventListener("change", (e) => {
    if (e.target.type === "radio") {
      selectedColor.style.backgroundColor = e.target.value;
      colorGrid.classList.add("hidden");
    }
  });

  // Close color grid when clicking outside
  document.addEventListener("click", (e) => {
    if (!colorSelector.contains(e.target) && !colorGrid.contains(e.target)) {
      colorGrid.classList.add("hidden");
    }
  });

  // Add toggle for tag form visibility
  document.getElementById("showTagForm").addEventListener("click", () => {
    const tagForm = document.getElementById("tagForm");
    tagForm.classList.toggle("hidden");

    // Reset the form when showing it for a new tag
    if (!tagForm.classList.contains("hidden")) {
      resetTagForm();
    }
  });

  // Add event listener for the reset button to also hide the form
  document
    .getElementById("tagForm")
    .querySelector("button[type='reset']")
    .addEventListener("click", () => {
      resetTagForm();
      document.getElementById("tagForm").classList.add("hidden");
    });
});

async function loadTags(todoId = null) {
  try {
    const tags = await db.tags.getAll();
    let todo = null;

    if (todoId) {
      todo = await db.todos.getById(todoId);
    }

    const selectedTagIds = todo?.tagIds || [];
    const tagList = document.querySelector(".tag-list");

    if (tags.length === 0) {
      tagList.innerHTML = `
        <div class="flex flex-col items-center justify-center py-8 text-gray-500">
          <p class="mt-2 text-center">Wow, such emptiness—no tags yet!</p>
        </div>
      `;
      return;
    }

    tagList.innerHTML = tags
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(
        (tag) => `
        <div class="tag-item">
          <div class="tag-info">
            <span class="tag-badge" style="background-color: ${tag.tagColor}">${tag.tagName}</span>
            <p class="tag-description">${tag.tagDescription || ""}</p>
          </div>
          <div class="tag-actions">
            ${
              !todoId
                ? `
              <button class="icon-button edit-tag" data-id="${tag.id}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                  <path d="m15 5 4 4"/>
                </svg>
              </button>
              <button class="icon-button delete-tag" data-id="${tag.id}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
              </button>
            `
                : `
              <button class="icon-button ${selectedTagIds.includes(tag.id) ? "remove-tag-from-todo destructive" : "add-tag-to-todo"}" data-id="${tag.id}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  ${selectedTagIds.includes(tag.id) ? '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>' : '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'}
                </svg>
              </button>
            `
            }
          </div>
        </div>
      `
      )
      .join("");

    // Add event listeners for edit and delete buttons
    if (!todoId) {
      // Edit tag buttons
      tagList.querySelectorAll(".edit-tag").forEach((button) => {
        button.addEventListener("click", () => {
          const tagId = button.dataset.id;
          editTag(tagId);
        });
      });

      // Delete tag buttons
      tagList.querySelectorAll(".delete-tag").forEach((button) => {
        button.addEventListener("click", () => {
          const tagId = button.dataset.id;
          deleteTag(tagId);
        });
      });
    } else {
      // Add tag to todo buttons
      tagList.querySelectorAll(".add-tag-to-todo").forEach((button) => {
        button.addEventListener("click", () => {
          const tagId = button.dataset.id;
          addTagToTodo(todoId, tagId);
        });
      });

      // Remove tag from todo buttons
      tagList.querySelectorAll(".remove-tag-from-todo").forEach((button) => {
        button.addEventListener("click", () => {
          const tagId = button.dataset.id;
          removeTagFromTodo(todoId, tagId);
        });
      });
    }
  } catch (error) {
    console.error("Error loading tags:", error);
    showToast("Failed to load tags. Please try again.");
  }
}

async function saveTag(id = null) {
  const tagName = document.getElementById("tagName").value;
  const tagColor = document.querySelector('input[name="tagColor"]:checked')?.value;
  const tagDescription = document.getElementById("tagDescription").value;

  if (!tagName || !tagColor) {
    showToast("Please fill in all required fields!");
    return;
  }

  try {
    // Check if we're updating an existing tag
    const tagId = id || document.getElementById("tagSubmitBtn").dataset.id;

    if (tagId) {
      // Update existing tag
      const existingTag = await db.tags.getById(tagId);
      if (existingTag) {
        const updatedTag = {
          ...existingTag,
          tagName,
          tagColor,
          tagDescription,
          updatedAt: new Date().toISOString(),
        };

        await db.tags.update(updatedTag);
        showToast("Tag updated successfully!");
      } else {
        showToast("Tag not found!");
      }
    } else {
      // Create new tag
      const newTag = {
        id: Date.now().toString(),
        tagName,
        tagColor,
        tagDescription,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.tags.add(newTag);
      showToast("Tag created successfully!");
    }

    resetTagForm();
    document.getElementById("tagForm").classList.add("hidden");
    loadTags();
  } catch (error) {
    console.error("Error saving tag:", error);
    showToast("Failed to save tag. Please try again.");
  }
}

async function deleteTag(id) {
  if (!confirm("Are you sure you want to delete this tag? This will remove it from all todos.")) {
    return;
  }

  try {
    // Get all todos that have this tag
    const todos = await db.todos.getAll();
    const todosWithTag = todos.filter((todo) => todo.tagIds && todo.tagIds.includes(id));

    // Remove tag from todos
    for (const todo of todosWithTag) {
      const updatedTodo = {
        ...todo,
        tagIds: todo.tagIds.filter((tagId) => tagId !== id),
      };
      await db.todos.update(updatedTodo);
    }

    // Delete the tag
    await db.tags.remove(id);

    showToast("Tag deleted successfully!");
    loadTags();
  } catch (error) {
    console.error("Error deleting tag:", error);
    showToast("Failed to delete tag. Please try again.");
  }
}

async function editTag(id) {
  try {
    const tag = await db.tags.getById(id);

    if (tag) {
      // Show the tag form if it's hidden
      document.getElementById("tagForm").classList.remove("hidden");

      // Update form title
      document.querySelector("#tagForm button[type='submit']").textContent = "Update Tag";

      // Populate form fields
      document.getElementById("tagName").value = tag.tagName;
      document.getElementById("tagDescription").value = tag.tagDescription || "";

      // Select the color
      const colorInput = document.querySelector(`input[name="tagColor"][value="${tag.tagColor}"]`);
      if (colorInput) {
        colorInput.checked = true;
        document.querySelector(".selected-color").style.backgroundColor = tag.tagColor;
      }

      // Store the tag ID in the submit button's dataset
      document.getElementById("tagSubmitBtn").dataset.id = id;
    } else {
      showToast("Tag not found!");
    }
  } catch (error) {
    console.error("Error editing tag:", error);
    showToast("Failed to load tag data. Please try again.");
  }
}

function resetTagForm() {
  document.getElementById("tagForm").reset();

  // Reset the submit button text
  document.querySelector("#tagForm button[type='submit']").textContent = "Add Tag";

  // Clear the tag ID from the submit button's dataset
  document.getElementById("tagSubmitBtn").dataset.id = "";

  // Reset the selected color
  const defaultColor = tagColors[0];
  document.querySelector(".selected-color").style.backgroundColor = defaultColor;
  document.querySelector(`input[name="tagColor"][value="${defaultColor}"]`).checked = true;
}

async function addTagToTodo(todoId, tagId) {
  try {
    console.log(`Adding tag ${tagId} to todo ${todoId}`);
    const todo = await db.todos.getById(todoId);

    if (todo) {
      // Initialize tagIds array if it doesn't exist
      const tagIds = todo.tagIds || [];

      // Only add the tag if it's not already there
      if (!tagIds.includes(tagId)) {
        // Create a new array with the new tag ID
        const updatedTagIds = [...tagIds, tagId];

        // Create a new todo object with the updated tagIds
        const updatedTodo = {
          ...todo,
          tagIds: updatedTagIds,
          updated: new Date().toISOString(),
        };

        console.log("Updating todo with new tag:", updatedTodo);

        // Update the todo in the database
        await db.todos.update(updatedTodo);
        showToast("Tag added to todo!");

        // Refresh the tags display
        loadTags(todoId);

        // Refresh todos list if we're on the dashboard
        if (window.location.href.includes("dashboard.html")) {
          window.dispatchEvent(new CustomEvent("refreshTodos"));
        }
      } else {
        showToast("Tag already added to this todo!");
      }
    } else {
      showToast("Todo not found!");
    }
  } catch (error) {
    console.error("Error adding tag to todo:", error);
    showToast("Failed to add tag to todo. Please try again.");
  }
}

async function removeTagFromTodo(todoId, tagId) {
  try {
    console.log(`Removing tag ${tagId} from todo ${todoId}`);
    const todo = await db.todos.getById(todoId);

    if (todo && todo.tagIds) {
      // Filter out the tag ID to remove
      const updatedTagIds = todo.tagIds.filter((id) => id !== tagId);

      // Create a new todo object with the updated tagIds
      const updatedTodo = {
        ...todo,
        tagIds: updatedTagIds,
        updated: new Date().toISOString(),
      };

      console.log("Updating todo after removing tag:", updatedTodo);

      // Update the todo in the database
      await db.todos.update(updatedTodo);
      showToast("Tag removed from todo!");

      // Refresh the tags display
      loadTags(todoId);

      // Refresh todos list if we're on the dashboard
      if (window.location.href.includes("dashboard.html")) {
        window.dispatchEvent(new CustomEvent("refreshTodos"));
      }
    } else {
      showToast("Todo not found or has no tags!");
    }
  } catch (error) {
    console.error("Error removing tag from todo:", error);
    showToast("Failed to remove tag from todo. Please try again.");
  }
}
