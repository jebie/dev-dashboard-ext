# Personal Dashboard & TODO Chrome Extension

Transform your new tab into a personal dashboard that keeps you focused on your priorities. Every time you open a new tab, you'll be reminded of your current tasks and their status, ensuring nothing important slips through the cracks.

![Screenshot 2025-02-28 at 7 51 00 PM](https://github.com/user-attachments/assets/336bcba1-41ee-4a0e-b14d-769b70a46b0b)

## About This Project

This project was primarily developed using [Cursor](https://cursor.sh/), an AI-powered code editor. As the project supervisor, I provided the requirements, feature specifications, and guidance while Cursor generated much of the implementation code. My role involved:

- Defining the core functionality and user experience
- Specifying the required features and UI components
- Reviewing and refining AI-generated code
- Testing and debugging the implementation
- Ensuring code quality and best practices

This collaborative approach between human supervision and AI assistance resulted in a robust Chrome extension that effectively manages tasks while maintaining clean, maintainable code.

## Features

- 🎯 Priority-based task management
- ⏰ Real-time age counter
- 🔗 Quick task creation from any webpage
- 📊 Visual status indicators
- 🎨 Clean, modern interface
- 🔄 Automatic task status updates
- 🎨 Responsive design
- 🏷️ Task Tags Management
- ⏱️ Task Time Tracking
  - Track time spent on tasks
  - View task history with start/end times
  - Real-time duration counter
  - Accumulated time tracking across multiple sessions
- 📚 Bookmark Projects
  - Save important webpages as projects
  - Quick access to your project links
  - Track project usage statistics
  - Add projects directly from any webpage

### Tags Feature
- Create and manage custom tags with:
  - Custom names and descriptions
  - Color coding (50+ predefined colors)
  - Tooltips showing tag descriptions
- Assign multiple tags to tasks
- Quick tag filtering and organization
- Visual tag badges on tasks
- Easy tag addition/removal from tasks

### Bookmark Projects Feature
- Save important webpages as project bookmarks
- Add projects directly from any webpage via context menu
- Visually appealing project cards with hover effects
- Track usage statistics for each project
- Confirmation dialog when deleting projects
- Organized in a dedicated section on your dashboard

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The extension will now replace your new tab page

## How to Use

### Managing Tasks

1. **Add a New Task**
   - Click the "Add Task" button on your dashboard
   - Fill in the task details (title, description, priority, deadline)
   - Click "Save" to create the task

2. **Quick Add from Any Page**
   - Right-click on any text on a webpage
   - Select "Add to TODO List"
   - The dialog will open with the selected text as the title
   - Fill in additional details and save

3. **Update Task Status**
   - Use the status dropdown on each task to mark as:
     - Urgent
     - Normal
     - Pending
     - Done

4. **Track Time on Tasks**
   - Click "Start Task" to begin tracking time
   - Timer displays in HH:MM:SS format
   - Click "Stop Task" to end the current session
   - View complete history of work sessions in a table
   - Track multiple work sessions per task
   - Accumulated time is preserved across sessions

5. **Edit or Delete Tasks**
   - Click the edit icon to modify task details
   - Click the delete icon to remove a task
   - Click the link icon to open the associated URL

### Managing Bookmark Projects

1. **Add a New Project**
   - Right-click on any webpage
   - Select "Personalized Data" > "Add Project"
   - The project will be automatically added to your dashboard
   - A notification will confirm the successful addition

2. **Access Your Projects**
   - All saved projects appear in the Projects section of your dashboard
   - Click on a project title to open it in a new tab
   - Projects track usage statistics automatically

3. **Remove Projects**
   - Click the delete icon on any project
   - Confirm deletion when prompted
   - The project will be permanently removed from your dashboard

### Profile Management

1. **Set Up Your Profile**
   - Click the edit icon in the profile section
   - Enter your name and birthdate
   - Your age will be displayed in real-time

## Privacy

All your data is stored locally in Chrome's storage sync, ensuring your tasks and personal information remain private and accessible across your Chrome instances.

## Contributing

Feel free to submit issues and enhancement requests!

## Support

If you find this project helpful, consider buying me a coffee:

<a href="https://www.buymeacoffee.com/jebie" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;">
</a>

## License

[MIT License](LICENSE)
