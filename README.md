
<img width="1670" height="1303" alt="Screenshot 2025-08-06 at 12 12 40" src="https://github.com/user-attachments/assets/b4e8c8d3-d08c-4b65-a65f-d0c26a83e3f6" />


# Aditor.

This is a small project where I want to explore form development using a Notion-like editor. Unlike Notion (which has a single form block that contains all form blocks inside it), I'm making the entire document a form with form-type blocks added as top-level blocks.

It's worth noting that implementing keyboard navigation similar to Notion's is very complex (kudos to Notion's developers) and requires extensive testing to avoid breaking navigation every time a behavior is added or refined. I think adding Playwright tests would be the best approach for this.

I believe I've ultimately achieved something that can serve as a foundation to continue improving and implementing more blocks in the editor.

## Main Features

- **Block-based editing**: Create documents using different block types (text, headings, form fields)
- **Slash commands**: Quick block creation using `/` commands within the editor
- **Drag and drop**: Reorder blocks by dragging them to new positions
- **Form blocks**: Create interactive forms with short answer, multiple choice, and multiselect questions
- **Smart focus management**: Intuitive cursor positioning and block navigation
- **Keyboard shortcuts**: Efficient editing with arrow key navigation and keyboard shortcuts

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone git@github.com:asumaran/aditor.git

# Navigate to project directory
cd aditor

# Install dependencies
npm install
```

### Running the Project

```bash
# Start development server
npm run dev
```

### Running Tests

```bash
# Run all tests
npm test
```

## Architecture

The project follows a modular architecture with:

- **Context-based state management** for editor state
- **Custom hooks** for business logic and reusable functionality
- **Component composition** for flexible UI building

## Main TODOs

- [ ] Selection state for blocks
- [ ] Rectangule selection support
- [ ] <kbd>Delete</kbd>, <kbd>cmd + a</kbd>, etc support. Improve <kbd>cmd+z</kbd> support.
- [ ] Form preview.
- [ ] Persist form data (locally in the browser for now).
