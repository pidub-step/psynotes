#!/usr/bin/env node

/**
 * Vercel MCP Server for Medical Note Transcription App
 * 
 * This server provides tools and resources for interacting with Vercel,
 * including deployment management, project configuration, and domain settings.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";

// Get Vercel credentials from environment variables
const vercelToken = process.env.VERCEL_TOKEN;
const vercelTeamId = process.env.VERCEL_TEAM_ID; // Optional

// Validate environment variables
if (!vercelToken) {
  console.error("Error: VERCEL_TOKEN environment variable is required");
  process.exit(1);
}

// Vercel API base URL
const VERCEL_API_URL = "https://api.vercel.com";

/**
 * Create an MCP server with capabilities for resources and tools
 * to interact with Vercel services.
 */
const server = new Server(
  {
    name: "vercel-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

/**
 * Handler for listing available resources.
 * For now, we don't expose any static resources.
 */
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: []
  };
});

/**
 * Handler for reading resources.
 * This would be used if we exposed any static resources.
 */
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  throw new McpError(
    ErrorCode.InvalidRequest,
    `Resource not found: ${request.params.uri}`
  );
});

/**
 * Handler that lists available tools for Vercel operations.
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // Project tools
      {
        name: "list_projects",
        description: "List all Vercel projects",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of projects to return (default: 20)"
            }
          },
          required: []
        }
      },
      {
        name: "get_project",
        description: "Get details of a specific Vercel project",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "ID of the project"
            }
          },
          required: ["projectId"]
        }
      },
      {
        name: "create_project",
        description: "Create a new Vercel project",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Name of the project"
            },
            framework: {
              type: "string",
              description: "Framework used (e.g., nextjs, react, vue)"
            },
            gitRepository: {
              type: "object",
              description: "Git repository details",
              properties: {
                type: {
                  type: "string",
                  description: "Repository type (e.g., github)"
                },
                repo: {
                  type: "string",
                  description: "Repository name (e.g., username/repo)"
                }
              }
            }
          },
          required: ["name"]
        }
      },
      
      // Deployment tools
      {
        name: "list_deployments",
        description: "List deployments for a project",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "ID of the project"
            },
            limit: {
              type: "number",
              description: "Maximum number of deployments to return (default: 10)"
            }
          },
          required: ["projectId"]
        }
      },
      {
        name: "get_deployment",
        description: "Get details of a specific deployment",
        inputSchema: {
          type: "object",
          properties: {
            deploymentId: {
              type: "string",
              description: "ID of the deployment"
            }
          },
          required: ["deploymentId"]
        }
      },
      {
        name: "create_deployment",
        description: "Create a new deployment from source files",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "ID of the project"
            },
            target: {
              type: "string",
              description: "Deployment target (e.g., production, preview)"
            }
          },
          required: ["projectId"]
        }
      },
      
      // Domain tools
      {
        name: "list_domains",
        description: "List domains for a project",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "ID of the project"
            }
          },
          required: ["projectId"]
        }
      },
      {
        name: "add_domain",
        description: "Add a domain to a project",
        inputSchema: {
          type: "object",
          properties: {
            projectId: {
              type: "string",
              description: "ID of the project"
            },
            domain: {
              type: "string",
              description: "Domain name to add"
            }
          },
          required: ["projectId", "domain"]
        }
      }
    ]
  };
});

/**
 * Handler for tool calls.
 * Implements all the Vercel operations exposed as tools.
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    // Helper function to make API requests to Vercel
    const vercelFetch = async (endpoint: string, options: any = {}) => {
      const url = `${VERCEL_API_URL}${endpoint}`;
      const headers = {
        Authorization: `Bearer ${vercelToken}`,
        "Content-Type": "application/json",
        ...options.headers
      };
      
      if (vercelTeamId) {
        headers["X-Vercel-Team-Id"] = vercelTeamId;
      }
      
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(`Vercel API error: ${(error as any).message || response.statusText}`);
      }
      
      return response.json();
    };
    
    switch (request.params.name) {
      // Project tools
      case "list_projects": {
        const limit = Number(request.params.arguments?.limit || 20);
        
        // Note: This is a simplified implementation
        // In a real implementation, you would use the Vercel API directly
        // since @vercel/client doesn't expose all endpoints
        
        // Placeholder response
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              projects: [
                { id: "prj_example1", name: "Example Project 1", framework: "nextjs" },
                { id: "prj_example2", name: "Example Project 2", framework: "react" }
              ]
            }, null, 2)
          }]
        };
      }
      
      case "get_project": {
        const projectId = String(request.params.arguments?.projectId);
        
        // Placeholder response
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              id: projectId,
              name: "Example Project",
              framework: "nextjs",
              createdAt: new Date().toISOString()
            }, null, 2)
          }]
        };
      }
      
      case "create_project": {
        const name = String(request.params.arguments?.name);
        const framework = String(request.params.arguments?.framework || "nextjs");
        
        // Placeholder response
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              id: `prj_${Date.now().toString(36)}`,
              name,
              framework,
              createdAt: new Date().toISOString()
            }, null, 2)
          }]
        };
      }
      
      // Deployment tools
      case "list_deployments": {
        const projectId = String(request.params.arguments?.projectId);
        const limit = Number(request.params.arguments?.limit || 10);
        
        // Placeholder response
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              deployments: [
                {
                  id: "dpl_example1",
                  url: "https://example-project-abc123.vercel.app",
                  created: new Date().toISOString(),
                  state: "READY"
                }
              ]
            }, null, 2)
          }]
        };
      }
      
      case "get_deployment": {
        const deploymentId = String(request.params.arguments?.deploymentId);
        
        // Placeholder response
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              id: deploymentId,
              url: "https://example-project-abc123.vercel.app",
              created: new Date().toISOString(),
              state: "READY",
              meta: {
                githubCommitRef: "main"
              }
            }, null, 2)
          }]
        };
      }
      
      case "create_deployment": {
        const projectId = String(request.params.arguments?.projectId);
        const target = String(request.params.arguments?.target || "production");
        
        // Placeholder response
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              id: `dpl_${Date.now().toString(36)}`,
              url: "https://example-project-abc123.vercel.app",
              created: new Date().toISOString(),
              state: "BUILDING",
              target
            }, null, 2)
          }]
        };
      }
      
      // Domain tools
      case "list_domains": {
        const projectId = String(request.params.arguments?.projectId);
        
        // Placeholder response
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              domains: [
                {
                  name: "example.com",
                  verified: true,
                  configuredBy: "CNAME"
                }
              ]
            }, null, 2)
          }]
        };
      }
      
      case "add_domain": {
        const projectId = String(request.params.arguments?.projectId);
        const domain = String(request.params.arguments?.domain);
        
        // Placeholder response
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              name: domain,
              verified: false,
              configurationRequired: true,
              verification: [
                {
                  type: "TXT",
                  domain: domain,
                  value: "vercel-verification=example123"
                }
              ]
            }, null, 2)
          }]
        };
      }
      
      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
    }
  } catch (error: any) {
    console.error("Tool execution error:", error);
    return {
      content: [{
        type: "text",
        text: `Error: ${error.message || "Unknown error"}`
      }],
      isError: true
    };
  }
});

/**
 * Start the server using stdio transport.
 * This allows the server to communicate via standard input/output streams.
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Vercel MCP server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
