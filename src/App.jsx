import React, {useState, useMemo, useEffect, useCallback} from 'react';
// Corrected line using only named exports:
import {ReactFlow, Controls, Background, Position, useNodesState, useEdgesState} from '@xyflow/react';
// Import the new JSON viewer - THIS LINE WAS CHANGED
import {JsonViewer} from '@textea/json-viewer';

// Import React Flow styles
import '@xyflow/react/dist/style.css';

// Import your main CSS
import './style.css';

// --- Interaction Steps, Initial Nodes, Initial Edges (remain the same) ---
// 1. Define Interaction Steps & MCP States
//    Updated to include tool use
const interactionSteps = [
    // ... (Keep initial steps 0-6 the same as before) ...
    {
        description: "Initial State",
        highlightIds: [],
        mcpState: {protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1", context: {messages: []}}
    },
    {
        description: "User sends 'Hello'",
        highlightIds: ['user', 'client'],
        mcpState: {
            protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
            context: {messages: [{role: "user", content: "Hello"}]}
        }
    },
    {
        description: "Client sends request to Backend",
        highlightIds: ['client', 'backend'],
        mcpState: {
            protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
            context: {messages: [{role: "user", content: "Hello"}]}
        }
    },
    {
        description: "Backend sends context to LLM",
        highlightIds: ['backend', 'llm'],
        mcpState: {
            protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
            context: {
                messages: [
                    {role: "system", content: "You are a helpful assistant."},
                    {role: "user", content: "Hello"}
                ]
            }
        }
    },
    {
        description: "LLM responds 'Hi there!', received by Backend",
        highlightIds: ['llm', 'backend'],
        mcpState: { // State before backend adds assistant response
            protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
            context: {
                messages: [
                    {role: "system", content: "You are a helpful assistant."},
                    {role: "user", content: "Hello"}
                    // LLM response "Hi there!" is processed next
                ]
            }
        }
    },
    {
        description: "Backend adds 'Hi there!' to context",
        highlightIds: ['backend'], // Backend processing
        mcpState: { // State includes assistant response now
            protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
            context: {
                messages: [
                    {role: "system", content: "You are a helpful assistant."},
                    {role: "user", content: "Hello"},
                    {role: "assistant", content: "Hi there!"}
                ]
            }
        }
    },
    // --- NEW STEPS START HERE ---
    {
        description: "User asks 'What's the weather in London?'",
        highlightIds: ['user', 'client'],
        mcpState: { // User message added
            protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
            context: {
                messages: [
                    {role: "system", content: "You are a helpful assistant."},
                    {role: "user", content: "Hello"},
                    {role: "assistant", content: "Hi there!"},
                    {role: "user", content: "What's the weather in London?"} // New user message
                ]
            }
        }
    },
    {
        description: "Client sends request to Backend",
        highlightIds: ['client', 'backend'],
        mcpState: { // State at backend before LLM call
            protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
            context: {
                messages: [
                    {role: "system", content: "You are a helpful assistant."},
                    {role: "user", content: "Hello"},
                    {role: "assistant", content: "Hi there!"},
                    {role: "user", content: "What's the weather in London?"}
                ]
            }
        }
    },
    {
        description: "Backend sends context to LLM",
        highlightIds: ['backend', 'llm'],
        mcpState: { // State sent to LLM
            protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
            context: {
                messages: [
                    {role: "system", content: "You are a helpful assistant."},
                    {role: "user", content: "Hello"},
                    {role: "assistant", content: "Hi there!"},
                    {role: "user", content: "What's the weather in London?"}
                ]
            }
        }
    },
    {
        description: "LLM decides to call get_weather tool",
        highlightIds: ['llm', 'backend'], // LLM -> Backend (contains tool call)
        mcpState: { // LLM response includes tool_calls object
            protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
            context: {
                messages: [
                    {role: "system", content: "You are a helpful assistant."},
                    {role: "user", content: "Hello"},
                    {role: "assistant", content: "Hi there!"},
                    {role: "user", content: "What's the weather in London?"},
                    // **** HIGHLIGHT: LLM requests tool execution ****
                    {
                        role: "assistant", content: null, tool_calls: [
                            {
                                id: "tool-call-123",
                                type: "function",
                                function: {name: "get_weather", arguments: '{"location": "London, UK"}'}
                            }
                        ]
                    }
                    // ***********************************************
                ]
            }
        }
    },
    {
        description: "Backend executes tool & prepares result",
        highlightIds: ['backend'], // Backend processing tool call
        mcpState: { // State *before* adding tool_results
            protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
            context: {
                messages: [
                    {role: "system", content: "You are a helpful assistant."},
                    {role: "user", content: "Hello"},
                    {role: "assistant", content: "Hi there!"},
                    {role: "user", content: "What's the weather in London?"},
                    {
                        role: "assistant", content: null, tool_calls: [
                            {
                                id: "tool-call-123",
                                type: "function",
                                function: {name: "get_weather", arguments: '{"location": "London, UK"}'}
                            }
                        ]
                    }
                ]
            }
        }
    },
    {
        description: "Backend adds tool result to context for LLM",
        highlightIds: ['backend', 'llm'], // Sending result back to LLM
        mcpState: { // Context now includes the tool_results message
            protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
            context: {
                messages: [
                    {role: "system", content: "You are a helpful assistant."},
                    {role: "user", content: "Hello"},
                    {role: "assistant", content: "Hi there!"},
                    {role: "user", content: "What's the weather in London?"},
                    {
                        role: "assistant", content: null, tool_calls: [
                            {
                                id: "tool-call-123",
                                type: "function",
                                function: {name: "get_weather", arguments: '{"location": "London, UK"}'}
                            }
                        ]
                    },
                    // **** HIGHLIGHT: Result of the tool execution ****
                    {
                        role: "tool_results",
                        tool_call_id: "tool-call-123",
                        content: '{"temperature": "15°C", "condition": "Cloudy"}'
                    }
                    // *************************************************
                ]
            }
        }
    },
    {
        description: "LLM generates final response using tool result",
        highlightIds: ['llm', 'backend'], // LLM -> Backend (final answer)
        mcpState: { // State before backend adds the final assistant response
            protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
            context: {
                messages: [
                    {role: "system", content: "You are a helpful assistant."},
                    {role: "user", content: "Hello"},
                    {role: "assistant", content: "Hi there!"},
                    {role: "user", content: "What's the weather in London?"},
                    {
                        role: "assistant", content: null, tool_calls: [
                            {
                                id: "tool-call-123",
                                type: "function",
                                function: {name: "get_weather", arguments: '{"location": "London, UK"}'}
                            }
                        ]
                    },
                    {
                        role: "tool_results",
                        tool_call_id: "tool-call-123",
                        content: '{"temperature": "15°C", "condition": "Cloudy"}'
                    }
                    // LLM final response is processed next
                ]
            }
        }
    },
    {
        description: "Backend adds final LLM response to context",
        highlightIds: ['backend'], // Backend processing
        mcpState: { // Final state for this turn, including the weather answer
            protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
            context: {
                messages: [
                    {role: "system", content: "You are a helpful assistant."},
                    {role: "user", content: "Hello"},
                    {role: "assistant", content: "Hi there!"},
                    {role: "user", content: "What's the weather in London?"},
                    {
                        role: "assistant", content: null, tool_calls: [
                            {
                                id: "tool-call-123",
                                type: "function",
                                function: {name: "get_weather", arguments: '{"location": "London, UK"}'}
                            }
                        ]
                    },
                    {
                        role: "tool_results",
                        tool_call_id: "tool-call-123",
                        content: '{"temperature": "15°C", "condition": "Cloudy"}'
                    },
                    // **** HIGHLIGHT: Final assistant message using tool result ****
                    {role: "assistant", content: "The weather in London is currently 15°C and Cloudy."}
                    // ***************************************************************
                ]
            }
        }
    },
    {
        description: "Backend sends final response to Client",
        highlightIds: ['backend', 'client'],
        mcpState: { // Final state sent to client
            protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
            context: {
                messages: [
                    {role: "system", content: "You are a helpful assistant."},
                    {role: "user", content: "Hello"},
                    {role: "assistant", content: "Hi there!"},
                    {role: "user", content: "What's the weather in London?"},
                    {
                        role: "assistant", content: null, tool_calls: [
                            {
                                id: "tool-call-123",
                                type: "function",
                                function: {name: "get_weather", arguments: '{"location": "London, UK"}'}
                            }
                        ]
                    },
                    {
                        role: "tool_results",
                        tool_call_id: "tool-call-123",
                        content: '{"temperature": "15°C", "condition": "Cloudy"}'
                    },
                    {role: "assistant", content: "The weather in London is currently 15°C and Cloudy."}
                ]
            }
        }
    },
    {
        description: "Client displays final response to User",
        highlightIds: ['client', 'user'],
        mcpState: { // Final state displayed
            protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
            context: {
                messages: [
                    {role: "system", content: "You are a helpful assistant."},
                    {role: "user", content: "Hello"},
                    {role: "assistant", content: "Hi there!"},
                    {role: "user", content: "What's the weather in London?"},
                    {
                        role: "assistant", content: null, tool_calls: [
                            {
                                id: "tool-call-123",
                                type: "function",
                                function: {name: "get_weather", arguments: '{"location": "London, UK"}'}
                            }
                        ]
                    },
                    {
                        role: "tool_results",
                        tool_call_id: "tool-call-123",
                        content: '{"temperature": "15°C", "condition": "Cloudy"}'
                    },
                    {role: "assistant", content: "The weather in London is currently 15°C and Cloudy."}
                ]
            }
        }
    }
    // --- END OF NEW STEPS ---
];
const initialNodesData = [
    {id: 'user', type: 'input', data: {label: 'User'}, position: {x: 50, y: 150}, sourcePosition: Position.Right},
    {
        id: 'client',
        data: {label: 'Web Client'},
        position: {x: 250, y: 150},
        sourcePosition: Position.Right,
        targetPosition: Position.Left
    },
    {
        id: 'backend',
        data: {label: 'Backend App'},
        position: {x: 450, y: 150},
        sourcePosition: Position.Right,
        targetPosition: Position.Left
    },
    {id: 'llm', type: 'output', data: {label: 'LLM'}, position: {x: 650, y: 150}, targetPosition: Position.Left},
];
const initialEdgesData = [
    {id: 'edge-user-client', source: 'user', target: 'client', animated: false},
    {id: 'edge-client-backend', source: 'client', target: 'backend', animated: false},
    {id: 'edge-backend-llm', source: 'backend', target: 'llm', animated: false},
    // Add return path edges if needed and uncomment if desired
    // { id: 'edge-llm-backend', source: 'llm', target: 'backend', animated: false },
    // { id: 'edge-backend-client', source: 'backend', target: 'client', animated: false },
    // { id: 'edge-client-user', source: 'client', target: 'user', animated: false },
];


function McpVisualiserApp() {
    // --- State Management, Step Advancement, useEffect (remain the same) ---
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodesData);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdgesData);

    const currentStep = useMemo(() => interactionSteps[currentStepIndex], [currentStepIndex]);
    const currentMcpState = useMemo(() => currentStep.mcpState, [currentStep]);

    const nextStep = useCallback(() => {
        setCurrentStepIndex(prevIndex => (prevIndex + 1) % interactionSteps.length); // Loop back
    }, []);

    useEffect(() => {
        if (!currentStep) return;

        const {highlightIds} = currentStep;

        setNodes((nds) =>
            nds.map((node) => ({
                ...node,
                className: highlightIds.includes(node.id) ? 'highlight' : '',
            }))
        );

        setEdges((eds) =>
            eds.map((edge) => {
                const isActive = highlightIds.includes(edge.source) && highlightIds.includes(edge.target);
                return {
                    ...edge,
                    className: isActive ? 'highlight' : '',
                    animated: isActive,
                };
            })
        );
    }, [currentStep, setNodes, setEdges]);


    return (
        <div className="app-container">
            <div className="flow-container">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    fitView
                >
                    <Background/>
                    <Controls/>
                </ReactFlow>
            </div>

            <div className="sidebar">
                <h2>MCP Visualiser</h2>
                <button onClick={nextStep}>Next Step</button>
                <div className="step-info">
                    <p><strong>Step {currentStepIndex + 1}/{interactionSteps.length}:</strong> {currentStep.description}
                    </p>
                </div>
                <hr/>
                <h3>MCP State</h3>
                <div className="mcp-display">
                    {/* Use the new JsonViewer component - THIS BLOCK WAS CHANGED */}
                    <JsonViewer
                        value={currentMcpState}
                        theme="light" // Or "dark" or a custom theme object
                        displayDataTypes={false}
                        enableClipboard={false}
                    />
                </div>
            </div>
        </div>
    );
}

export default McpVisualiserApp;