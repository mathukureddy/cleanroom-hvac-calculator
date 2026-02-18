# Cursor Rules for Cleanroom HVAC Calculator

This directory contains Cursor AI rules to help with code generation and navigation.

## Available Rules

### 1. **project-structure.mdc** (Always Applied)
- **Type:** Always Active
- **Purpose:** Provides overview of the entire project structure
- **When Used:** Automatically applied to every AI interaction
- **Contains:** 
  - Backend and frontend file structure
  - Database schema overview
  - Key configuration files
  - Entry points

### 2. **api-implementation.mdc**
- **Type:** File Pattern Specific
- **Applies To:** `backend/**/*.js`, `backend/controllers/*`, `backend/routes/*`, `backend/services/*`
- **Purpose:** Guides backend API development
- **Contains:**
  - Express.js controller patterns
  - Route definitions
  - Database query patterns
  - Transaction handling
  - Error handling
  - Authentication patterns
  - Input validation
  - Best practices

### 3. **react-components.mdc**
- **Type:** File Pattern Specific
- **Applies To:** `frontend/src/**/*.js`, `frontend/src/components/*`, `frontend/src/pages/*`
- **Purpose:** Guides React frontend development
- **Contains:**
  - Functional component patterns
  - Hooks usage (useState, useEffect)
  - API integration
  - Form handling
  - React Router navigation
  - CSS class reference
  - Best practices

## How Rules Work

### Automatic Application
- `project-structure.mdc` is always active and provides context for every request
- Other rules activate based on file patterns (globs)

### Manual Application
You can also manually reference rules in your prompts:
- "Follow the API implementation patterns"
- "Use the React component patterns"
- "Reference the project structure"

## Usage Examples

### Creating a New API Endpoint
1. Create controller in `backend/controllers/`
2. The `api-implementation.mdc` rule will automatically provide patterns
3. Follow the standard CRUD structure
4. Add routes in `backend/routes/`

### Creating a New React Component
1. Create component in `frontend/src/components/` or `frontend/src/pages/`
2. The `react-components.mdc` rule will automatically provide patterns
3. Use hooks for state management
4. Integrate with API services

### Understanding Project Structure
- The `project-structure.mdc` rule is always available
- Ask questions like "Where should I add X?"
- Get guidance on file organization

## Maintenance

### Adding New Rules
```bash
# Create new rule file
touch .cursor/rules/my-rule.mdc

# Add frontmatter
---
description: Description of when to use this rule
globs: *.specific,*.files
---

# Rule Content
...
```

### Rule Types

**Always Applied:**
```yaml
---
alwaysApply: true
---
```

**File Pattern:**
```yaml
---
globs: *.js,src/**/*.tsx
---
```

**Manual Only:**
```yaml
---
description: Use for specific task
---
```

## Benefits

✅ Consistent code patterns across the project
✅ Faster development with guided examples
✅ Better code quality with built-in best practices
✅ Easier onboarding for new developers
✅ Reduced errors with validation patterns
✅ Quick reference for project structure

## Reference

See official Cursor documentation for more details on rules:
https://docs.cursor.com/
