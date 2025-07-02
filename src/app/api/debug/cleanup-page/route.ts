import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * GET /api/debug/cleanup-page
 * Simple HTML page to trigger workspace cleanup
 */
export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Workspace Cleanup</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        .status { background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 10px 0; }
        button { background: #dc2626; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin: 5px; }
        button:hover { background: #b91c1c; }
        .safe { background: #16a34a; }
        .safe:hover { background: #15803d; }
        pre { background: #f8f8f8; padding: 10px; border-radius: 5px; overflow-x: auto; }
      </style>
    </head>
    <body>
      <h1>Workspace Cleanup Tool</h1>
      
      <div class="status" id="status">
        <h3>Current Status:</h3>
        <p>Loading workspace information...</p>
      </div>
      
      <div>
        <button class="safe" onclick="checkStatus()">Check Status</button>
        <button onclick="cleanupWorkspaces()">Delete Duplicate Workspaces</button>
        <button class="safe" onclick="checkConstraints()">Check Database Constraints</button>
      </div>
      
      <div id="results"></div>
      
      <script>
        async function checkStatus() {
          try {
            const response = await fetch('/api/workspace/cleanup');
            const data = await response.json();
            document.getElementById('status').innerHTML = 
              '<h3>Current Status:</h3>' +
              '<p>Total workspaces: ' + data.totalCount + '</p>' +
              '<p>Needs cleanup: ' + (data.needsCleanup ? 'Yes' : 'No') + '</p>' +
              '<pre>' + JSON.stringify(data.workspaces, null, 2) + '</pre>';
          } catch (error) {
            document.getElementById('status').innerHTML = '<p>Error: ' + error.message + '</p>';
          }
        }
        
        async function cleanupWorkspaces() {
          if (!confirm('This will delete all duplicate workspaces, keeping only the oldest one. Continue?')) {
            return;
          }
          
          try {
            const response = await fetch('/api/workspace/cleanup', { method: 'DELETE' });
            const data = await response.json();
            document.getElementById('results').innerHTML = 
              '<h3>Cleanup Results:</h3>' +
              '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            checkStatus(); // Refresh status
          } catch (error) {
            document.getElementById('results').innerHTML = '<p>Error: ' + error.message + '</p>';
          }
        }
        
        async function checkConstraints() {
          try {
            const response = await fetch('/api/debug/check-constraints');
            const data = await response.json();
            document.getElementById('results').innerHTML = 
              '<h3>Database Constraints:</h3>' +
              '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
          } catch (error) {
            document.getElementById('results').innerHTML = '<p>Error: ' + error.message + '</p>';
          }
        }
        
        // Load status on page load
        checkStatus();
      </script>
    </body>
    </html>
  `

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}