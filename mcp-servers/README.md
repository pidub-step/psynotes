# MCP Servers for Medical Note Transcription App

This directory contains Model Context Protocol (MCP) servers that provide tools and resources for interacting with external services used in the Medical Note Transcription App.

## Available Servers

### Supabase Server

The Supabase server provides tools for interacting with Supabase services, including:

- Storage operations (buckets, files)
- Database operations (tables, queries)
- Edge Functions

#### Environment Variables

To use the Supabase server, you need to set the following environment variables in the MCP settings configuration file:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase API key

### Vercel Server

The Vercel server provides tools for interacting with Vercel services, including:

- Project management
- Deployment operations
- Domain configuration

#### Environment Variables

To use the Vercel server, you need to set the following environment variables in the MCP settings configuration file:

- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_TEAM_ID`: (Optional) Your Vercel team ID

## Setup Instructions

1. Build the servers:

```bash
cd supabase-server
npm install
npm run build

cd ../vercel-server
npm install
npm run build
```

2. Configure the MCP settings file:

Edit the MCP settings file located at:
- For Claude Desktop: `~/Library/Application Support/Claude/claude_desktop_config.json`
- For Claude Dev: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

Add the following configuration:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "node",
      "args": ["/absolute/path/to/psynotes/mcp-servers/supabase-server/build/index.js"],
      "env": {
        "SUPABASE_URL": "your-supabase-url",
        "SUPABASE_KEY": "your-supabase-key"
      },
      "disabled": false,
      "autoApprove": []
    },
    "vercel": {
      "command": "node",
      "args": ["/absolute/path/to/psynotes/mcp-servers/vercel-server/build/index.js"],
      "env": {
        "VERCEL_TOKEN": "your-vercel-token",
        "VERCEL_TEAM_ID": "your-vercel-team-id (optional)"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Replace the placeholder values with your actual API keys and tokens.

3. Restart Claude to apply the changes.

## Usage

Once the servers are configured and running, you can use the tools they provide in your conversations with Claude. For example:

```
Use the Supabase server to create a storage bucket:
<use_mcp_tool>
<server_name>supabase</server_name>
<tool_name>create_bucket</tool_name>
<arguments>
{
  "name": "medical-notes",
  "public": false
}
</arguments>
</use_mcp_tool>
```

```
Use the Vercel server to list projects:
<use_mcp_tool>
<server_name>vercel</server_name>
<tool_name>list_projects</tool_name>
<arguments>
{
  "limit": 10
}
</arguments>
</use_mcp_tool>
```

## Security Considerations

- Keep your API keys and tokens secure.
- Do not share your MCP settings file with others.
- Consider using environment variables or a secure method to store your credentials.
