#!/usr/bin/env python3
"""
Modern documentation server for Mawaqit API to ICS
Automatically converts Markdown files to HTML with modern design
"""

import os
import re
import markdown
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, unquote
from jinja2 import Template

class DocsRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.template = self.load_template()
        super().__init__(*args, **kwargs)
    
    def load_template(self):
        """Load the HTML template"""
        template_path = Path(__file__).parent / 'template.html'
        with open(template_path, 'r', encoding='utf-8') as f:
            return Template(f.read())
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_url = urlparse(self.path)
        path = unquote(parsed_url.path)
        
        # If it's the root, redirect to timeline.md
        if path == '/':
            self.send_response(302)
            self.send_header('Location', '/timeline.md')
            self.end_headers()
            return
        
        # If it's a .md file, convert it to HTML
        if path.endswith('.md'):
            self.serve_markdown(path)
        else:
            # For other files (CSS, JS, images), serve normally
            super().do_GET()
    
    def serve_markdown(self, path):
        """Serve a Markdown file converted to HTML"""
        file_path = Path(__file__).parent / path.lstrip('/')
        
        if not file_path.exists():
            self.send_error(404, "File not found")
            return
        
        try:
            # Read the Markdown content
            with open(file_path, 'r', encoding='utf-8') as f:
                markdown_content = f.read()
            
            # Convert to HTML
            html_content = self.convert_markdown_to_html(markdown_content)
            
            # Extract the file title
            title = self.extract_title(markdown_content, file_path.name)
            
            # Render the template
            rendered_html = self.template.render(
                title=title,
                content=html_content
            )
            
            # Send the response
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(rendered_html.encode('utf-8'))
            
        except Exception as e:
            self.send_error(500, f"Error during processing: {str(e)}")
    
    def convert_markdown_to_html(self, markdown_content):
        """Convert Markdown to HTML with extensions"""
        # Markdown configuration with extensions
        md = markdown.Markdown(
            extensions=[
                'markdown.extensions.fenced_code',  # Code blocks
                'markdown.extensions.codehilite',   # Syntax highlighting
                'markdown.extensions.tables',       # Tables
                'markdown.extensions.toc',          # Table of contents
                'markdown.extensions.attr_list',    # Attribute lists
                'markdown.extensions.def_list',     # Definition lists
                'markdown.extensions.footnotes',    # Footnotes
                'markdown.extensions.abbr',         # Abbreviations
                'markdown.extensions.smarty',       # Smart quotes
            ],
            extension_configs={
                'codehilite': {
                    'css_class': 'highlight',
                    'use_pygments': False,
                }
            }
        )
        
        return md.convert(markdown_content)
    
    def extract_title(self, markdown_content, filename):
        """Extract the title from Markdown content or use the filename"""
        # Look for the first H1 title
        lines = markdown_content.split('\n')
        for line in lines:
            if line.startswith('# '):
                return line[2:].strip()
        
        # If no H1 title, use the filename
        return filename.replace('.md', '').replace('_', ' ').title()

def run_server(port=8000):
    """Start the documentation server"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, DocsRequestHandler)
    
    print(f"🚀 Documentation server started on http://localhost:{port}")
    print(f"📚 Available documentation:")
    print(f"   - Timeline: http://localhost:{port}/timeline.md")
    print(f"   - API: http://localhost:{port}/api.md")
    print(f"   - Setup: http://localhost:{port}/setup.md")
    print(f"   - Testing: http://localhost:{port}/testing.md")
    print(f"   - Project Review: http://localhost:{port}/project_review.md")
    print(f"   - Features Integration: http://localhost:{port}/features_integration.md")
    print(f"   - E2E Testing Status: http://localhost:{port}/e2e-testing-status.md")
    print(f"   - Documentation Updates: http://localhost:{port}/documentation_updates.md")
    print(f"   - Documentation Guide: http://localhost:{port}/README.md")
    print(f"\n💡 Press Ctrl+C to stop the server")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print(f"\n👋 Server stopped")

if __name__ == '__main__':
    run_server() 