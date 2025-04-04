import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ReactFlow, Controls, Background, Position, useNodesState, useEdgesState, MiniMap } from '@xyflow/react';
import { JsonViewer } from '@textea/json-viewer';
// Assuming CustomNodes.jsx exists in the same directory and exports these:
import { UserNode, ClientNode, BackendNode, LLMNode, ToolNode } from './CustomNodes';

import '@xyflow/react/dist/style.css';
import './style.css'; // Ensure your CSS supports the new highlight classes

// Define custom node types for React Flow
const nodeTypes = {
    userNode: UserNode,
    clientNode: ClientNode,
    backendNode: BackendNode,
    llmNode: LLMNode,
    toolNode: ToolNode,
};

// --- Fully Restructured Interaction Steps (Corrected Initialization) ---
// Values from previous steps are copied directly to avoid self-referencing error.

const interactionSteps = [
    // --- Initial Hello Flow ---
    { // 0: Initial State
        stepIndex: 0,
        description: "Initial State - Ready",
        type: 'INFO',
        activeNodeIds: [],
        actionDetails: null,
        transportDetails: null,
        nodeMemoryStates: {
            'user': { data: { status: "Idle" }, isMcpFormat: false },
            'client': { data: null, isMcpFormat: false },
            'backend': { data: null, isMcpFormat: false },
            'llm': { data: { status: "Idle" }, isMcpFormat: false },
            'get_weather_tool': { data: { status: "Idle" }, isMcpFormat: false },
        }
    },
    { // 1: User -> Client (Transport)
        stepIndex: 1,
        description: "[Transport] User sends 'Hello' to Client",
        type: 'TRANSPORT',
        activeNodeIds: ['user', 'client'],
        actionDetails: null,
        transportDetails: { sourceId: 'user', targetId: 'client', data: { type: "User Message", content: "Hello" }, isMcpFormat: false },
        nodeMemoryStates: {
            'user': { data: { status: "Sent 'Hello'" }, isMcpFormat: false },
            'client': { data: { userMessage: "Hello" }, isMcpFormat: false },
            'backend': { data: null, isMcpFormat: false }, // from step 0
            'llm': { data: { status: "Idle" }, isMcpFormat: false }, // from step 0
            'get_weather_tool': { data: { status: "Idle" }, isMcpFormat: false }, // from step 0
        }
    },
    { // 2: Client -> Backend (Transport - MCP Creation)
        stepIndex: 2,
        description: "[Transport] Client creates MCP and sends to Backend",
        type: 'TRANSPORT',
        activeNodeIds: ['client', 'backend'],
        actionDetails: null,
        transportDetails: { sourceId: 'client', targetId: 'backend', data: { protocol: "mcp", version: "1.0", context: { messages: [{ role: "user", content: "Hello" }] } }, isMcpFormat: true },
        nodeMemoryStates: {
            'user': { data: { status: "Sent 'Hello'" }, isMcpFormat: false }, // from step 1
            'client': { data: { status: "Sent MCP to backend" }, isMcpFormat: false },
            'backend': { data: { protocol: "mcp", version: "1.0", context: { messages: [{ role: "user", content: "Hello" }] } }, isMcpFormat: true },
            'llm': { data: { status: "Idle" }, isMcpFormat: false }, // from step 1
            'get_weather_tool': { data: { status: "Idle" }, isMcpFormat: false }, // from step 1
        }
    },
    { // 3: Backend Action - Add System Message
        stepIndex: 3,
        description: "[Action] Backend adds System Message to MCP",
        type: 'ACTION',
        activeNodeIds: ['backend'],
        actionDetails: {
            nodeId: 'backend',
             // beforeData explicitly copied from step 2's end state for backend
            beforeData: { protocol: "mcp", version: "1.0", context: { messages: [{ role: "user", content: "Hello" }] } },
            afterData: { protocol: "mcp", version: "1.0", context: { messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }] } },
            changeDescription: "Added system message.", isMcpUpdate: true
        },
        transportDetails: null,
        nodeMemoryStates: {
            'user': { data: { status: "Sent 'Hello'" }, isMcpFormat: false }, // from step 2
            'client': { data: { status: "Sent MCP to backend" }, isMcpFormat: false }, // from step 2
            'backend': { data: { protocol: "mcp", version: "1.0", context: { messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }] } }, isMcpFormat: true }, // Action result
            'llm': { data: { status: "Idle" }, isMcpFormat: false }, // from step 2
            'get_weather_tool': { data: { status: "Idle" }, isMcpFormat: false }, // from step 2
        }
    },
    { // 4: Backend -> LLM (Transport - MCP)
        stepIndex: 4,
        description: "[Transport] Backend sends MCP context to LLM",
        type: 'TRANSPORT',
        activeNodeIds: ['backend', 'llm'],
        actionDetails: null,
         // transportData explicitly copied from step 3's end state for backend
        transportDetails: { sourceId: 'backend', targetId: 'llm', data: { protocol: "mcp", version: "1.0", context: { messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }] } }, isMcpFormat: true },
        nodeMemoryStates: {
            'user': { data: { status: "Sent 'Hello'" }, isMcpFormat: false }, // from step 3
            'client': { data: { status: "Sent MCP to backend" }, isMcpFormat: false }, // from step 3
            'backend': { data: { status: "Sent context to LLM" }, isMcpFormat: false }, // Backend state updated
            'llm': { data: { protocol: "mcp", version: "1.0", context: { messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }] } }, isMcpFormat: true }, // LLM received data
            'get_weather_tool': { data: { status: "Idle" }, isMcpFormat: false }, // from step 3
        }
    },
    { // 5: LLM Action - Process Request
        stepIndex: 5,
        description: "[Action] LLM processes request",
        type: 'ACTION',
        activeNodeIds: ['llm'],
        actionDetails: {
            nodeId: 'llm',
            // beforeData/afterData explicitly copied from step 4's end state for llm
            beforeData: { protocol: "mcp", version: "1.0", context: { messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }] } },
            afterData: { protocol: "mcp", version: "1.0", context: { messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }] } },
            changeDescription: "Generating response...", isMcpUpdate: false
        },
        transportDetails: null,
        // nodeMemoryStates explicitly copied from step 4's end state
        nodeMemoryStates: {
            'user': { data: { status: "Sent 'Hello'" }, isMcpFormat: false },
            'client': { data: { status: "Sent MCP to backend" }, isMcpFormat: false },
            'backend': { data: { status: "Sent context to LLM" }, isMcpFormat: false },
            'llm': { data: { protocol: "mcp", version: "1.0", context: { messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }] } }, isMcpFormat: true },
            'get_weather_tool': { data: { status: "Idle" }, isMcpFormat: false },
        }
    },
    { // 6: LLM -> Backend (Transport - Response)
        stepIndex: 6,
        description: "[Transport] LLM sends response 'Hi there!' to Backend",
        type: 'TRANSPORT',
        activeNodeIds: ['llm', 'backend'],
        actionDetails: null,
        transportDetails: { sourceId: 'llm', targetId: 'backend', data: { type: "LLM Raw Response", content: "Hi there!" }, isMcpFormat: false },
        nodeMemoryStates: {
            'user': { data: { status: "Sent 'Hello'" }, isMcpFormat: false }, // from step 5
            'client': { data: { status: "Sent MCP to backend" }, isMcpFormat: false }, // from step 5
            'backend': { // Backend received response, still holds MCP from step 3
                data: {
                    receivedResponse: "Hi there!",
                    // Explicitly copy MCP state from step 3's *end* state for backend
                    currentMCP: { protocol: "mcp", version: "1.0", context: { messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }] } }
                 },
                isMcpFormat: false // Mixed data
            },
            'llm': { data: { status: "Sent 'Hi there!'" }, isMcpFormat: false }, // LLM finished
            'get_weather_tool': { data: { status: "Idle" }, isMcpFormat: false }, // from step 5
        }
    },
    { // 7: Backend Action - Add Assistant Response
        stepIndex: 7,
        description: "[Action] Backend adds 'Hi there!' to MCP context",
        type: 'ACTION',
        activeNodeIds: ['backend'],
        actionDetails: {
            nodeId: 'backend',
             // beforeData explicitly copied from step 6's end state for backend (the MCP part)
            beforeData: { protocol: "mcp", version: "1.0", context: { messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }] } },
            afterData: { protocol: "mcp", version: "1.0", context: { messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }] } },
            changeDescription: "Added assistant message.", isMcpUpdate: true
        },
        transportDetails: null,
        nodeMemoryStates: {
            'user': { data: { status: "Sent 'Hello'" }, isMcpFormat: false }, // from step 6
            'client': { data: { status: "Sent MCP to backend" }, isMcpFormat: false }, // from step 6
            'backend': { // Backend holds the updated MCP
                data: { protocol: "mcp", version: "1.0", context: { messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }] } },
                isMcpFormat: true
            },
            'llm': { data: { status: "Sent 'Hi there!'" }, isMcpFormat: false }, // from step 6
            'get_weather_tool': { data: { status: "Idle" }, isMcpFormat: false }, // from step 6
        }
    },

    // --- Weather Request Flow ---
    { // 8: User -> Client (Transport - New Question)
        stepIndex: 8,
        description: "[Transport] User asks 'What's the weather...?' to Client",
        type: 'TRANSPORT',
        activeNodeIds: ['user', 'client'],
        actionDetails: null,
        transportDetails: { sourceId: 'user', targetId: 'client', data: { type: "User Message", content: "What's the weather in London?" }, isMcpFormat: false },
        nodeMemoryStates: {
            'user': { data: { status: "Sent weather question" }, isMcpFormat: false },
            'client': { data: { userMessage: "What's the weather in London?" }, isMcpFormat: false },
             // Explicitly copy previous states for unchanged nodes
            'backend': { data: { protocol: "mcp", version: "1.0", context: { messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }] } }, isMcpFormat: true }, // from step 7
            'llm': { data: { status: "Sent 'Hi there!'" }, isMcpFormat: false }, // from step 7
            'get_weather_tool': { data: { status: "Idle" }, isMcpFormat: false }, // from step 7
        }
    },
    { // 9: Client -> Backend (Transport - MCP Update Request)
        stepIndex: 9,
        description: "[Transport] Client adds message to MCP and sends to Backend",
        type: 'TRANSPORT',
        activeNodeIds: ['client', 'backend'],
        actionDetails: null,
        transportDetails: {
            sourceId: 'client', targetId: 'backend',
            data: { protocol: "mcp", version: "1.0", context: { messages: [ { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" } ] } },
            isMcpFormat: true
        },
        nodeMemoryStates: {
            'user': { data: { status: "Sent weather question" }, isMcpFormat: false }, // from step 8
            'client': { data: { status: "Sent updated MCP to backend" }, isMcpFormat: false },
            'backend': { // Backend receives the updated MCP
                data: { protocol: "mcp", version: "1.0", context: { messages: [ { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" } ] } },
                isMcpFormat: true
            },
            'llm': { data: { status: "Sent 'Hi there!'" }, isMcpFormat: false }, // from step 8
            'get_weather_tool': { data: { status: "Idle" }, isMcpFormat: false }, // from step 8
        }
    },
    { // 10: Backend Action - Prepare for LLM (No Change)
        stepIndex: 10,
        description: "[Action] Backend prepares context for LLM",
        type: 'ACTION',
        activeNodeIds: ['backend'],
        actionDetails: {
            nodeId: 'backend',
            // Explicitly copy backend state from step 9
            beforeData: { protocol: "mcp", version: "1.0", context: { messages: [ { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" } ] } },
            afterData: { protocol: "mcp", version: "1.0", context: { messages: [ { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" } ] } },
            changeDescription: "Preparing context...", isMcpUpdate: false
        },
        transportDetails: null,
        // Explicitly copy node states from step 9
        nodeMemoryStates: {
            'user': { data: { status: "Sent weather question" }, isMcpFormat: false },
            'client': { data: { status: "Sent updated MCP to backend" }, isMcpFormat: false },
            'backend': { data: { protocol: "mcp", version: "1.0", context: { messages: [ { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" } ] } }, isMcpFormat: true },
            'llm': { data: { status: "Sent 'Hi there!'" }, isMcpFormat: false },
            'get_weather_tool': { data: { status: "Idle" }, isMcpFormat: false },
        }
    },
    { // 11: Backend -> LLM (Transport - MCP)
        stepIndex: 11,
        description: "[Transport] Backend sends MCP context to LLM",
        type: 'TRANSPORT',
        activeNodeIds: ['backend', 'llm'],
        actionDetails: null,
        // transport data explicitly copied from step 10 backend state
        transportDetails: {
            sourceId: 'backend', targetId: 'llm',
            data: { protocol: "mcp", version: "1.0", context: { messages: [ { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" } ] } },
            isMcpFormat: true
        },
        nodeMemoryStates: {
            'user': { data: { status: "Sent weather question" }, isMcpFormat: false }, // from step 10
            'client': { data: { status: "Sent updated MCP to backend" }, isMcpFormat: false }, // from step 10
            'backend': { data: { status: "Sent context to LLM (weather q)" }, isMcpFormat: false },
            'llm': { // LLM receives updated MCP
                 data: { protocol: "mcp", version: "1.0", context: { messages: [ { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" } ] } },
                 isMcpFormat: true
             },
            'get_weather_tool': { data: { status: "Idle" }, isMcpFormat: false }, // from step 10
        }
    },
    { // 12: LLM Action - Decide Tool Use
        stepIndex: 12,
        description: "[Action] LLM processes, decides to call tool",
        type: 'ACTION',
        activeNodeIds: ['llm'],
        actionDetails: {
            nodeId: 'llm',
            // Explicitly copy llm state from step 11
            beforeData: { protocol: "mcp", version: "1.0", context: { messages: [ { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" } ] } },
            afterData: { protocol: "mcp", version: "1.0", context: { messages: [ { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" } ] } },
            changeDescription: "Deciding action... wants tool.", isMcpUpdate: false
        },
        transportDetails: null,
         // Explicitly copy node states from step 11
        nodeMemoryStates: {
            'user': { data: { status: "Sent weather question" }, isMcpFormat: false },
            'client': { data: { status: "Sent updated MCP to backend" }, isMcpFormat: false },
            'backend': { data: { status: "Sent context to LLM (weather q)" }, isMcpFormat: false },
            'llm': { data: { protocol: "mcp", version: "1.0", context: { messages: [ { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" } ] } }, isMcpFormat: true },
            'get_weather_tool': { data: { status: "Idle" }, isMcpFormat: false },
        }
    },
    { // 13: LLM -> Backend (Transport - Tool Call in MCP)
        stepIndex: 13,
        description: "[Transport] LLM sends tool call request to Backend",
        type: 'TRANSPORT',
        activeNodeIds: ['llm', 'backend'],
        actionDetails: null,
        transportDetails: {
            sourceId: 'llm', targetId: 'backend',
            data: { protocol: "mcp", version: "1.0", context: { messages: [
                // Previous messages from step 12's LLM memory
                { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" },
                // LLM adds the tool call message
                { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] }
            ] } },
            isMcpFormat: true
        },
        nodeMemoryStates: {
            'user': { data: { status: "Sent weather question" }, isMcpFormat: false }, // from step 12
            'client': { data: { status: "Sent updated MCP to backend" }, isMcpFormat: false }, // from step 12
            'backend': { // Backend receives MCP containing the tool call
                data: { protocol: "mcp", version: "1.0", context: { messages: [
                     { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" },
                     { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] }
                 ] } },
                isMcpFormat: true
            },
            'llm': { data: { status: "Sent tool call" }, isMcpFormat: false },
            'get_weather_tool': { data: { status: "Idle" }, isMcpFormat: false }, // from step 12
        }
    },
    { // 14: Backend Action - Identify Tool Call
        stepIndex: 14,
        description: "[Action] Backend identifies tool call request",
        type: 'ACTION',
        activeNodeIds: ['backend'],
        actionDetails: {
            nodeId: 'backend',
            // Explicitly copy backend state from step 13
            beforeData: { protocol: "mcp", version: "1.0", context: { messages: [ { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" }, { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] } ] } },
            afterData: { protocol: "mcp", version: "1.0", context: { messages: [ { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" }, { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] } ] } },
            changeDescription: "Identified tool 'get_weather', args: {'location': 'London, UK'}", isMcpUpdate: false
        },
        transportDetails: null,
        nodeMemoryStates: {
            'user': { data: { status: "Sent weather question" }, isMcpFormat: false }, // from step 13
            'client': { data: { status: "Sent updated MCP to backend" }, isMcpFormat: false }, // from step 13
            'backend': { // Add extracted args to backend memory for clarity
                data: {
                    // Explicitly copy backend MCP state from step 13
                    currentMCP: { protocol: "mcp", version: "1.0", context: { messages: [ { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" }, { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] } ] } },
                    extractedToolArgs: { location: 'London, UK' },
                    toolCallId: "tool-call-123"
                },
                isMcpFormat: false // Mixed data now
            },
             'llm': { data: { status: "Sent tool call" }, isMcpFormat: false }, // from step 13
             'get_weather_tool': { data: { status: "Idle" }, isMcpFormat: false }, // from step 13
        }
    },
    { // 15: Backend -> Tool (Transport - Args)
        stepIndex: 15,
        description: "[Transport] Backend sends request arguments to Tool 'get_weather'",
        type: 'TRANSPORT',
        activeNodeIds: ['backend', 'get_weather_tool'],
        actionDetails: null,
        transportDetails: { sourceId: 'backend', targetId: 'get_weather_tool', data: { type: "Tool Arguments", content: { location: "London, UK" } }, isMcpFormat: false },
        nodeMemoryStates: {
            'user': { data: { status: "Sent weather question" }, isMcpFormat: false }, // from step 14
            'client': { data: { status: "Sent updated MCP to backend" }, isMcpFormat: false }, // from step 14
            'backend': { // Backend is waiting for tool, still holds MCP + args
                 data: {
                    // Explicitly copy backend MCP state from step 14
                    currentMCP: { protocol: "mcp", version: "1.0", context: { messages: [ { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" }, { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] } ] } },
                    extractedToolArgs: { location: 'London, UK' },
                    toolCallId: "tool-call-123",
                    status: "Waiting for tool result"
                },
                isMcpFormat: false // Mixed data
            },
            'llm': { data: { status: "Sent tool call" }, isMcpFormat: false }, // from step 14
            'get_weather_tool': { data: { status: "Executing", args: { location: "London, UK" } }, isMcpFormat: false } // Tool received args
        }
    },
    { // 16: Tool Action - Execute
        stepIndex: 16,
        description: "[Action] Tool 'get_weather' executes",
        type: 'ACTION',
        activeNodeIds: ['get_weather_tool'],
        actionDetails: { nodeId: 'get_weather_tool', beforeData: { status: "Executing", args: { location: "London, UK" } }, afterData: { status: "Executed", args: { location: "London, UK" }, result: { temperature: "15°C", condition: "Cloudy" } }, changeDescription: "Simulating API call...", isMcpUpdate: false },
        transportDetails: null,
        nodeMemoryStates: {
            'user': { data: { status: "Sent weather question" }, isMcpFormat: false }, // from step 15
            'client': { data: { status: "Sent updated MCP to backend" }, isMcpFormat: false }, // from step 15
            'backend': { // Backend state unchanged during tool execution
                 data: {
                    currentMCP: { protocol: "mcp", version: "1.0", context: { messages: [ { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" }, { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] } ] } },
                    extractedToolArgs: { location: 'London, UK' },
                    toolCallId: "tool-call-123",
                    status: "Waiting for tool result"
                },
                isMcpFormat: false // Mixed data
            },
            'llm': { data: { status: "Sent tool call" }, isMcpFormat: false }, // from step 15
            'get_weather_tool': { data: { status: "Executed", args: { location: "London, UK" }, result: { temperature: "15°C", condition: "Cloudy" } }, isMcpFormat: false } // Tool has result
        }
    },
     { // 17: Tool -> Backend (Transport - Result)
         stepIndex: 17,
         description: "[Transport] Tool sends result back to Backend",
         type: 'TRANSPORT',
         activeNodeIds: ['get_weather_tool', 'backend'],
         actionDetails: null,
         transportDetails: { sourceId: 'get_weather_tool', targetId: 'backend', data: { type: "Tool Result", content: { temperature: "15°C", condition: "Cloudy" } }, isMcpFormat: false },
         nodeMemoryStates: {
             'user': { data: { status: "Sent weather question" }, isMcpFormat: false }, // from step 16
             'client': { data: { status: "Sent updated MCP to backend" }, isMcpFormat: false }, // from step 16
             'backend': { // Backend received result, still holds original MCP + args
                 data: {
                    // Explicitly copy backend state from step 16
                    currentMCP: { protocol: "mcp", version: "1.0", context: { messages: [ { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" }, { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] } ] } },
                    extractedToolArgs: { location: 'London, UK' },
                    toolCallId: "tool-call-123",
                    status: "Received tool result",
                    receivedToolResult: { temperature: "15°C", condition: "Cloudy" } // Added result
                 },
                 isMcpFormat: false // Still mixed data
             },
             'llm': { data: { status: "Sent tool call" }, isMcpFormat: false }, // from step 16
             'get_weather_tool': { data: { status: "Result sent" }, isMcpFormat: false } // Tool finished sending
         }
     },
     { // 18: Backend Action - Add Tool Result to MCP
         stepIndex: 18,
         description: "[Action] Backend adds tool result message to MCP",
         type: 'ACTION',
         activeNodeIds: ['backend'],
         actionDetails: {
             nodeId: 'backend',
             // beforeData is the MCP part from step 17's backend memory
             beforeData: { protocol: "mcp", version: "1.0", context: { messages: [ { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" }, { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] } ] } },
             afterData: { protocol: "mcp", version: "1.0", context: { messages: [
                 // Previous messages
                 { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" }, { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] },
                 // Add the new tool_results message
                 { role: "tool_results", tool_call_id: "tool-call-123", content: '{"temperature": "15°C", "condition": "Cloudy"}' }
             ] } },
             changeDescription: "Added tool_results message.", isMcpUpdate: true
         },
         transportDetails: null,
         nodeMemoryStates: {
             'user': { data: { status: "Sent weather question" }, isMcpFormat: false }, // from step 17
             'client': { data: { status: "Sent updated MCP to backend" }, isMcpFormat: false }, // from step 17
             'backend': { // Backend now holds the MCP updated with tool results
                 data: { protocol: "mcp", version: "1.0", context: { messages: [
                     { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" }, { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] },
                     { role: "tool_results", tool_call_id: "tool-call-123", content: '{"temperature": "15°C", "condition": "Cloudy"}' }
                 ] } },
                 isMcpFormat: true
             },
             'llm': { data: { status: "Sent tool call" }, isMcpFormat: false }, // from step 17
             'get_weather_tool': { data: { status: "Result sent" }, isMcpFormat: false } // from step 17
         }
     },
     { // 19: Backend -> LLM (Transport - MCP with Result)
         stepIndex: 19,
         description: "[Transport] Backend sends updated MCP (with tool result) to LLM",
         type: 'TRANSPORT',
         activeNodeIds: ['backend', 'llm'],
         actionDetails: null,
         // transport data explicitly copied from step 18 backend state
         transportDetails: { sourceId: 'backend', targetId: 'llm',
             data: { protocol: "mcp", version: "1.0", context: { messages: [
                 { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" }, { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] },
                 { role: "tool_results", tool_call_id: "tool-call-123", content: '{"temperature": "15°C", "condition": "Cloudy"}' }
             ] } },
             isMcpFormat: true },
         nodeMemoryStates: {
             'user': { data: { status: "Sent weather question" }, isMcpFormat: false }, // from step 18
             'client': { data: { status: "Sent updated MCP to backend" }, isMcpFormat: false }, // from step 18
             'backend': { data: { status: "Sent MCP with tool result to LLM" }, isMcpFormat: false },
             'llm': { // LLM gets MCP with results
                  data: { protocol: "mcp", version: "1.0", context: { messages: [
                      { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" }, { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] },
                      { role: "tool_results", tool_call_id: "tool-call-123", content: '{"temperature": "15°C", "condition": "Cloudy"}' }
                  ] } },
                  isMcpFormat: true
              },
             'get_weather_tool': { data: { status: "Result sent" }, isMcpFormat: false } // from step 18
         }
     },
      { // 20: LLM Action - Generate Final Response
        stepIndex: 20,
        description: "[Action] LLM processes tool result, generates final response",
        type: 'ACTION',
        activeNodeIds: ['llm'],
        actionDetails: {
            nodeId: 'llm',
             // Explicitly copy llm state from step 19 (which itself got it from step 18's backend state)
            beforeData: { protocol: "mcp", version: "1.0", context: { messages: [
                { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" }, { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] },
                { role: "tool_results", tool_call_id: "tool-call-123", content: '{"temperature": "15°C", "condition": "Cloudy"}' }
            ] } },
             // In this simplified view, the LLM's internal state doesn't change *until* it sends the response.
            afterData: { protocol: "mcp", version: "1.0", context: { messages: [
                { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" }, { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] },
                { role: "tool_results", tool_call_id: "tool-call-123", content: '{"temperature": "15°C", "condition": "Cloudy"}' }
            ] } },
            changeDescription: "Generating final answer using tool result...", isMcpUpdate: false
        },
        transportDetails: null,
         // Explicitly copy node states from step 19
        nodeMemoryStates: {
             'user': { data: { status: "Sent weather question" }, isMcpFormat: false },
             'client': { data: { status: "Sent updated MCP to backend" }, isMcpFormat: false },
             'backend': { data: { status: "Sent MCP with tool result to LLM" }, isMcpFormat: false },
             'llm': { data: { protocol: "mcp", version: "1.0", context: { messages: [
                  { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" }, { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] },
                  { role: "tool_results", tool_call_id: "tool-call-123", content: '{"temperature": "15°C", "condition": "Cloudy"}' }
             ] } }, isMcpFormat: true },
             'get_weather_tool': { data: { status: "Result sent" }, isMcpFormat: false }
         }
    },
    { // 21: LLM -> Backend (Transport - Final Response)
        stepIndex: 21,
        description: "[Transport] LLM sends final response to Backend",
        type: 'TRANSPORT',
        activeNodeIds: ['llm', 'backend'],
        actionDetails: null,
        transportDetails: { sourceId: 'llm', targetId: 'backend', data: { type: "LLM Final Response", content: "The weather in London is currently 15°C and Cloudy." }, isMcpFormat: false },
        nodeMemoryStates: {
            'user': { data: { status: "Sent weather question" }, isMcpFormat: false }, // from step 20
            'client': { data: { status: "Sent updated MCP to backend" }, isMcpFormat: false }, // from step 20
            'backend': { // Backend receives final text, still holds MCP from step 18's action result
                data: {
                    receivedResponse: "The weather in London is currently 15°C and Cloudy.",
                     // Explicitly copy MCP state from step 18's *end* state for backend
                    currentMCP: { protocol: "mcp", version: "1.0", context: { messages: [
                         { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" }, { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] },
                         { role: "tool_results", tool_call_id: "tool-call-123", content: '{"temperature": "15°C", "condition": "Cloudy"}' }
                    ] } }
                 },
                isMcpFormat: false // Mixed state
            },
            'llm': { data: { status: "Sent final response" }, isMcpFormat: false },
            'get_weather_tool': { data: { status: "Result sent" }, isMcpFormat: false } // from step 20
        }
    },
    { // 22: Backend Action - Add Final Response to MCP
        stepIndex: 22,
        description: "[Action] Backend adds final LLM response to MCP",
        type: 'ACTION',
        activeNodeIds: ['backend'],
        actionDetails: {
            nodeId: 'backend',
            // beforeData is the MCP part from step 21's backend memory
            beforeData: { protocol: "mcp", version: "1.0", context: { messages: [
                 { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" }, { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] },
                 { role: "tool_results", tool_call_id: "tool-call-123", content: '{"temperature": "15°C", "condition": "Cloudy"}' }
            ] } },
            // afterData includes the final assistant message
            afterData: { protocol: "mcp", version: "1.0", context: { messages: [
                 { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" }, { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] },
                 { role: "tool_results", tool_call_id: "tool-call-123", content: '{"temperature": "15°C", "condition": "Cloudy"}' },
                 { role: "assistant", content: "The weather in London is currently 15°C and Cloudy." } // Final message added
            ] } },
            changeDescription: "Added final assistant message.", isMcpUpdate: true
        },
        transportDetails: null,
        nodeMemoryStates: {
            'user': { data: { status: "Sent weather question" }, isMcpFormat: false }, // from step 21
            'client': { data: { status: "Sent updated MCP to backend" }, isMcpFormat: false }, // from step 21
            'backend': { // Backend holds final MCP state for the turn
                 data: { protocol: "mcp", version: "1.0", context: { messages: [
                     { role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello" }, { role: "assistant", content: "Hi there!" }, { role: "user", content: "What's the weather in London?" }, { role: "assistant", content: null, tool_calls: [{ id: "tool-call-123", type: "function", function: { name: "get_weather", arguments: '{"location": "London, UK"}' } }] },
                     { role: "tool_results", tool_call_id: "tool-call-123", content: '{"temperature": "15°C", "condition": "Cloudy"}' },
                     { role: "assistant", content: "The weather in London is currently 15°C and Cloudy." }
                 ] } },
                 isMcpFormat: true
             },
             'llm': { data: { status: "Sent final response" }, isMcpFormat: false }, // from step 21
             'get_weather_tool': { data: { status: "Result sent" }, isMcpFormat: false } // from step 21
        }
    },
    { // 23: Backend -> Client (Transport - Final Response for Display)
        stepIndex: 23,
        description: "[Transport] Backend sends final response content to Client",
        type: 'TRANSPORT',
        activeNodeIds: ['backend', 'client'],
        actionDetails: null,
        transportDetails: { sourceId: 'backend', targetId: 'client', data: { type: "Final Response for Display", content:"The weather in London is currently 15°C and Cloudy."}, isMcpFormat: false },
        nodeMemoryStates: {
             'user': { data: { status: "Sent weather question" }, isMcpFormat: false }, // from step 22
             'client': { // Client receives the final displayable message
                  data: { displayMessage: "The weather in London is currently 15°C and Cloudy." },
                  isMcpFormat: false
             },
             'backend': { data: { status: "Sent final response to client" }, isMcpFormat: false }, // Backend finished sending
             'llm': { data: { status: "Sent final response" }, isMcpFormat: false }, // from step 22
             'get_weather_tool': { data: { status: "Result sent" }, isMcpFormat: false } // from step 22
        }
    },
    { // 24: Client -> User (Transport - Display)
        stepIndex: 24,
        description: "[Transport] Client displays final response to User",
        type: 'TRANSPORT',
        activeNodeIds: ['client', 'user'],
        actionDetails: null,
        // Transporting the UI update concept
        transportDetails: { sourceId: 'client', targetId: 'user', data: { type: "UI Update", content: "The weather in London is currently 15°C and Cloudy." }, isMcpFormat: false },
        nodeMemoryStates: {
            'user': { data: { status: "Received final response" }, isMcpFormat: false }, // User sees the response
            'client': { data: { status: "Displayed final response" }, isMcpFormat: false }, // Client finished displaying
            // Restore other nodes to idle or last relevant state
            'backend': { data: { status: "Idle" }, isMcpFormat: false }, // Ready for next turn
            'llm': { data: { status: "Idle" }, isMcpFormat: false }, // Ready for next turn
            'get_weather_tool': { data: { status: "Idle" }, isMcpFormat: false } // Ready for next turn
        }
    }
];


// Initial Nodes and Edges remain the same
const initialNodesData = [
    { id: 'user', type: 'userNode', data: { label: 'User' }, position: { x: 50, y: 150 } },
    { id: 'client', type: 'clientNode', data: { label: 'Web Client' }, position: { x: 250, y: 150 } },
    { id: 'backend', type: 'backendNode', data: { label: 'Backend App' }, position: { x: 450, y: 150 } },
    { id: 'llm', type: 'llmNode', data: { label: 'LLM' }, position: { x: 650, y: 150 } },
    { id: 'get_weather_tool', type: 'toolNode', data: { label: 'Tool: get_weather' }, position: { x: 450, y: 300 } },
];
const initialEdgesData = [
    { id: 'edge-user-client', source: 'user', target: 'client', type: 'smoothstep' },
    { id: 'edge-client-backend', source: 'client', target: 'backend', type: 'smoothstep' },
    { id: 'edge-backend-llm', source: 'backend', target: 'llm', type: 'smoothstep' },
    { id: 'edge-backend-tool', source: 'backend', target: 'get_weather_tool', type: 'smoothstep', sourceHandle: 'bottom-source', targetHandle: 'top-target' },
    { id: 'edge-llm-backend', source: 'llm', target: 'backend', type: 'smoothstep' },
    { id: 'edge-tool-backend', source: 'get_weather_tool', target: 'backend', type: 'smoothstep', sourceHandle: 'top-source', targetHandle: 'bottom-target' },
    { id: 'edge-backend-client', source: 'backend', target: 'client', type: 'smoothstep' },
    { id: 'edge-client-user', source: 'client', target: 'user', type: 'smoothstep' },
];


function McpVisualiserApp() {
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    // Initialize nodes/edges state AFTER constants are defined
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesData);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdgesData);
    const [selectedNodeMemory, setSelectedNodeMemory] = useState(null);

    // Derive current step details
    const currentStep = useMemo(() => interactionSteps[currentStepIndex], [currentStepIndex]);
    const currentActionDetails = useMemo(() => currentStep?.type === 'ACTION' ? currentStep.actionDetails : null, [currentStep]);
    const currentTransportDetails = useMemo(() => currentStep?.type === 'TRANSPORT' ? currentStep.transportDetails : null, [currentStep]);

    const nextStep = useCallback(() => {
        setCurrentStepIndex(prevIndex => (prevIndex + 1) % interactionSteps.length);
        setSelectedNodeMemory(null);
    }, []); // interactionSteps.length is constant here

    const prevStep = useCallback(() => {
        setCurrentStepIndex(prevIndex => (prevIndex - 1 + interactionSteps.length) % interactionSteps.length);
        setSelectedNodeMemory(null);
    }, []); // interactionSteps.length is constant


    useEffect(() => {
        if (!currentStep) return;

        const { activeNodeIds, type, actionDetails, transportDetails } = currentStep;

        setNodes((nds) =>
            nds.map((node) => {
                 let highlightClass = '';
                 if (activeNodeIds?.includes(node.id)) {
                     if (type === 'ACTION' && node.id === actionDetails?.nodeId) {
                         highlightClass = 'action-highlight'; // Green ring for main actor
                     } else if (type === 'TRANSPORT') {
                          highlightClass = 'transport-involved-highlight'; // Blue ring for transport participants
                     }
                 }

                return {
                    ...node,
                    className: highlightClass, // Apply calculated highlight
                    // Pass highlight status to custom node if needed
                    data: {
                        ...node.data,
                        isHighlighted: activeNodeIds?.includes(node.id)
                    }
                 };
            })
        );

        setEdges((eds) =>
            eds.map((edge) => {
                let isTransportEdge = false;
                if (type === 'TRANSPORT' && transportDetails) {
                    isTransportEdge = (edge.source === transportDetails.sourceId && edge.target === transportDetails.targetId);
                }

                return {
                    ...edge,
                    className: isTransportEdge ? 'transport-edge-highlight' : '',
                    animated: isTransportEdge,
                };
            })
        );
    }, [currentStep, setNodes, setEdges]); // Dependencies are correct


    // Get memory for a node *at the current step*
    const getNodeMemory = useCallback((nodeId) => {
        // Safely access memory state
        const memoryState = currentStep?.nodeMemoryStates?.[nodeId];
        if (memoryState) {
            return {
                nodeId: nodeId,
                data: memoryState.data,
                isMcpFormat: memoryState.isMcpFormat ?? false
             };
        }
        // Fallback
        return { nodeId: nodeId, data: { status: "State undefined for this step" }, isMcpFormat: false };
    }, [currentStep]); // Dependency on currentStep is correct


    const onNodeClick = useCallback((event, node) => {
        const memory = getNodeMemory(node.id);
        setSelectedNodeMemory(memory);
    }, [getNodeMemory]); // Dependency on getNodeMemory is correct


    // --- Render Logic ---
    return (
        <div className="app-container">
            <div className="flow-container">
                <ReactFlow
                    nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                    nodeTypes={nodeTypes} onNodeClick={onNodeClick} fitView proOptions={{ hideAttribution: true }}
                    onlyRenderVisibleElements={false} >
                    <Background /> <Controls /> <MiniMap nodeStrokeWidth={3} zoomable pannable />
                </ReactFlow>
            </div>

            <div className="sidebar">
                <h2>MCP Visualiser</h2>
                 <div className="controls"> <button onClick={prevStep}>Prev</button> <button onClick={nextStep}>Next</button> </div>
                 {/* Safely access description */}
                <div className="step-info"> <p><strong>Step {currentStepIndex + 1}/{interactionSteps.length}:</strong> {currentStep?.description || 'Loading...'}</p> </div>
                <hr />

                {/* ACTION Details Display */}
                {currentActionDetails && (
                    <div className="action-details-display">
                        <h3>Action: {currentActionDetails.nodeId}</h3>
                        <p className="change-desc">{currentActionDetails.changeDescription} {currentActionDetails.isMcpUpdate ? <strong>(MCP Update)</strong> : ''}</p>
                        <div className="action-data-split">
                            <div className="action-data-before">
                                <h4>Before</h4>
                                {currentActionDetails.beforeData ? <JsonViewer value={currentActionDetails.beforeData} theme="light" displayDataTypes={false} enableClipboard={false} rootName={false} /> : <p className="no-data">(No 'before' state)</p>}
                            </div>
                            <div className="action-data-after">
                                <h4>After</h4>
                                 {currentActionDetails.afterData ? <JsonViewer value={currentActionDetails.afterData} theme="light" displayDataTypes={false} enableClipboard={false} rootName={false} />: <p className="no-data">(No 'after' state)</p>}
                            </div>
                        </div>
                         <hr/>
                    </div>
                )}

                {/* TRANSPORT Data Display (Pink Box) */}
                {currentTransportDetails && (
                    <div className="transport-data-display">
                        <h3>Transport: {currentTransportDetails.sourceId} → {currentTransportDetails.targetId}</h3>
                         <p>Format: {currentTransportDetails.isMcpFormat ? <strong>MCP</strong> : 'Other/Raw'}</p>
                         {currentTransportDetails.data ? <JsonViewer value={currentTransportDetails.data} theme="light" displayDataTypes={false} enableClipboard={false} rootName={false} /> : <p className="no-data">(No transport data)</p>}
                         <hr/>
                    </div>
                )}

                {/* Node Memory Display (On Click - Yellow Box) */}
                {selectedNodeMemory && (
                    <div className="memory-display">
                        <h3>Memory: {selectedNodeMemory.nodeId} (Click)</h3>
                         <p>Format: {selectedNodeMemory.isMcpFormat ? <strong>MCP</strong> : 'Other/Raw'}</p>
                         {/* Check if data is non-null and not just empty object/status */}
                         {selectedNodeMemory.data && Object.keys(selectedNodeMemory.data).length > 0 && !(Object.keys(selectedNodeMemory.data).length === 1 && selectedNodeMemory.data.status) ? (
                             <JsonViewer value={selectedNodeMemory.data} theme="light" displayDataTypes={true} enableClipboard={true} rootName={false} />
                         ) : <p className="no-data">(No specific data in memory)</p> }
                        <button onClick={() => setSelectedNodeMemory(null)}>Close</button>
                         <hr/>
                    </div>
                )}

                 {/* Fallback for INFO steps or unhandled types */}
                 {currentStep?.type === 'INFO' && (
                      <div className="info-display">
                          <p>System is ready. Click 'Next' to start.</p>
                           <hr/>
                     </div>
                 )}
                 {!currentActionDetails && !currentTransportDetails && currentStep?.type !== 'INFO' && (
                      <p><i>Step details panel not applicable for type: {currentStep?.type}</i></p>
                 )}

            </div>
        </div>
    );
}

export default McpVisualiserApp;