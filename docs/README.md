# 📚 Documentation

This folder contains all the documentation for the Mawaqit_API_to_ics project, organized in a structured way and accessible via a modern web server.

## 🚀 Documentation Server

### Quick Start
```bash
# From the project root
make docs-serve

# Or directly
cd docs && python docs_server.py
```

The server starts at `http://localhost:8000` and automatically converts Markdown files to HTML with a modern design.

## 📋 Documentation Structure

### 📖 Main Guides

| File | Description | URL |
|------|-------------|-----|
| `timeline.md` | Timeline and Clock interface documentation | `/timeline.md` |
| `api.md` | Complete REST API documentation | `/api.md` |
| `setup.md` | Installation and configuration guide | `/setup.md` |
| `testing.md` | Testing strategy (Python, JS, E2E) | `/testing.md` |


### 📊 Reports and Status

| File | Description | URL |
|------|-------------|-----|
| `project_review.md` | Complete project review | `/project_review.md` |
| `features_integration.md` | Religious features integration | `/features_integration.md` |
| `e2e-testing-status.md` | End-to-end test status | `/e2e-testing-status.md` |
| `documentation_updates.md` | Update history | `/documentation_updates.md` |

## 🎨 Server Features

### ✨ Highlights
- **Automatic conversion** Markdown → HTML
- **Modern and responsive design**
- **Smooth navigation** between pages
- **Syntax highlighting** for code
- **Full Markdown extensions support**
- **Custom template** with project colors

### 🔧 Supported Extensions
- **Code blocks** with syntax highlighting
- **Tables** with automatic formatting
- **Table of contents** generated automatically
- **Footnotes** and abbreviations
- **Smart quotes** and definition lists
- **Attribute lists** for custom CSS

## 🛠️ Technical Configuration

### Dependencies
```bash
uv run pip install markdown jinja2
```

### File Structure
```
docs/
├── docs_server.py          # Documentation server
├── template.html           # Modern HTML template
├── README.md               # This file
├── timeline.md             # Timeline documentation
├── api.md                  # API documentation
├── setup.md                # Installation guide
├── testing.md              # Testing documentation
├── project_review.md       # Project review
├── features_integration.md # Religious features
├── e2e-testing-status.md   # E2E status
└── documentation_updates.md # Update history
```

### HTML Template
The `template.html` file uses:
- **Modern design** with project colors
- **Responsive navigation** with sidebar menu
- **Syntax highlighting** for code
- **CSS animations** for better UX
- **Meta tags** for SEO

## 📝 Adding New Documentation

### 1. Create the Markdown file
```bash
# Create a new file
touch docs/new_guide.md
```

### 2. Add to the server
Edit `docs_server.py` and add in the `run_server()` function:
```python
print(f"   - New Guide: http://localhost:{port}/new_guide.md")
```

### 3. Restart the server
```bash
make docs-serve
```

## 🎯 Best Practices

### 📝 Writing
- **Clear titles** with logical hierarchy
- **Code examples** with syntax highlighting
- **Images and diagrams** to clarify concepts
- **Internal links** between documents
- **Regularly update** the documentation

### 🔧 Maintenance
- **Check links** after changes
- **Test the server** after additions
- **Update** `documentation_updates.md`
- **Validate Markdown** before commit

## 🚀 Advanced Usage

### Template Customization
The `template.html` file can be modified to:
- Change theme colors
- Add JavaScript features
- Modify navigation
- Integrate analytics

### Markdown Extensions
New extensions available in `docs_server.py`:
```python
extensions=[
    'markdown.extensions.fenced_code',
    'markdown.extensions.codehilite',
    'markdown.extensions.tables',
    'markdown.extensions.toc',
    # Add new extensions here
]
```

## 📞 Support

For any questions about the documentation:
1. Check this README
2. See `documentation_updates.md`
3. Test the server locally
4. Create an issue if needed

---

*Documentation is an essential part of the project. Please keep it up to date!* 📚✨ 