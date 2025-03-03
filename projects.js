// Projects Module
// This file contains all functionality related to bookmark projects

/**
 * Show a toast notification
 * @param {string} message - The message to display
 */
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/**
 * Load projects from IndexedDB and display them in the projects list
 */
async function loadProjects() {
  try {
    const projects = await db.projects.getAll();
    const projectsList = document.getElementById("projectsList");

    if (!projectsList) {
      console.error("Projects list element not found");
      return;
    }

    projectsList.innerHTML = "";

    if (projects.length === 0) {
      projectsList.innerHTML = `<div class="text-gray-500 text-center py-4">No projects added yet</div>`;
      return;
    }

    // Sort projects by noClick (descending) and then by updated date (descending)
    projects.sort((a, b) => {
      // First compare by noClick (descending)
      if (a.noClick !== b.noClick) {
        return b.noClick - a.noClick; // Higher noClick values first
      }
      // Then compare by updated timestamp (descending)
      return new Date(b.updated) - new Date(a.updated); // Newer dates first
    });

    projects.forEach((project) => {
      const projectElement = createProjectElement(project);
      projectsList.appendChild(projectElement);
    });
  } catch (error) {
    console.error("Error loading projects:", error);
    showToast("Failed to load projects. Please try again.");
  }
}

/**
 * Create a DOM element for a project
 * @param {Object} project - The project object
 * @returns {HTMLElement} - The project element
 */
function createProjectElement(project) {
  const projectElement = document.createElement("div");
  projectElement.className =
    "project-item flex items-center justify-between p-2 mb-2 bg-white/80 rounded border border-purple-100 hover:bg-purple-50 transition-colors";

  const contentContainer = document.createElement("div");
  contentContainer.className = "flex-1 min-w-0 mr-2";

  const titleElement = document.createElement("a");
  titleElement.href = project.link;
  titleElement.className = "project-title block truncate text-blue-600 hover:text-blue-800";
  titleElement.textContent = project.title;

  const linkElement = document.createElement("div");
  linkElement.className = "project-link text-xs text-gray-500 truncate";
  linkElement.textContent = project.link;

  // Update noClick count when project is clicked
  titleElement.addEventListener("click", async () => {
    try {
      const projectToUpdate = await db.projects.getById(project.id);
      if (projectToUpdate) {
        projectToUpdate.noClick = (projectToUpdate.noClick || 0) + 1;
        projectToUpdate.updated = new Date().toISOString();

        await db.projects.update(projectToUpdate);
        loadProjects();
      }
    } catch (error) {
      console.error("Error updating project click count:", error);
    }
  });

  const removeButton = document.createElement("button");
  removeButton.className = "remove-project p-1 ml-2 text-gray-500 hover:text-red-500 hover:bg-red-50 border-0";
  removeButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
      <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
      <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
    </svg>
  `;
  removeButton.title = "Remove project";
  removeButton.addEventListener("click", () => {
    deleteProject(project.id);
  });

  contentContainer.appendChild(titleElement);
  contentContainer.appendChild(linkElement);

  projectElement.appendChild(contentContainer);
  projectElement.appendChild(removeButton);

  return projectElement;
}

/**
 * Delete a project by ID
 * @param {string} id - The project ID to delete
 */
async function deleteProject(id) {
  try {
    const projectToDelete = await db.projects.getById(id);

    if (!projectToDelete) {
      showToast("Project not found!");
      return;
    }

    // Confirm before deleting
    if (!confirm(`Are you sure you want to delete the project "${projectToDelete.title}"?`)) {
      return;
    }

    await db.projects.remove(id);
    loadProjects();
    showToast("Project removed successfully!");
  } catch (error) {
    console.error("Error deleting project:", error);
    showToast("Failed to delete project. Please try again.");
  }
}

/**
 * Initialize projects module
 */
function initProjects() {
  // Load projects on page load
  loadProjects();

  // Listen for refresh events
  window.addEventListener("refreshProjects", () => {
    loadProjects();
  });
}

// Initialize when the DOM is ready
document.addEventListener("DOMContentLoaded", initProjects);

// Export functions for use in other modules
window.projectsModule = {
  loadProjects,
  createProjectElement,
  deleteProject,
};
