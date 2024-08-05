# CanvasLink for Google Calendar
![release](https://img.shields.io/badge/release-v0.1.0-blue?style=flat&logo=github&logoColor=%23ffffff)

A Google Chrome extension that automatically color-codes and imports all of your important Canvas tests, quizzes, essays, and assignments into Google Calendar by course.


## Inquiries
For inquiries about CanvasLink, including bug reports, suggestions, and more, please contact:

**Andrew Kwok** \
Email: andrewwkwok@gmail.com \
GitHub: https://github.com/aw-kwok

## Features
- Automatic importing of events from a user's Canvas courses into Google Calendar
- Customizable course colors for aesthetics and organization
- Syncing of colors between CanvasLink, imported Google Calendar events, and user's Canvas course colors

## Installation

1. **Clone the repository:** Download source code.

```sh
git clone https://github.com/aw-kwok/CanvasLink.git
```
2. **Install Dependencies:** Ensure you have [Node.js](https://nodejs.org/en/download/package-manager) and [npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) (package manager) installed. Then, install the project dependencies.
```sh
npm install
```

3. **Build the Extension:** Run the build command.
```sh
npm run build
```

4. **Load the Extension:**
- Open Chrome and go to `chrome://extensions`.
- Enable "Developer mode" by clicking the toggle switch in the top right corner.
- Click "Load unpacked" and select the extension directory.