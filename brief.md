Project Brief: MCP Visualiser Application

1. Introduction & Goal:

The primary goal of this web application is to serve as an educational tool that visually demonstrates the concept and flow of the Model Context Protocol (MCP). It aims to demystify how MCP structures conversational context and how that context evolves during an interaction between a user, frontend, backend, and an AI model (LLM). The target audience includes developers, AI practitioners, or anyone seeking a clearer understanding of MCP principles.

2. Problem Addressed:

The Model Context Protocol standardizes how rich contextual information (like chat history, system instructions, tool usage) is packaged and exchanged in AI systems. However, understanding this flow purely from specification documents or static JSON examples can be abstract. This visualiser provides a dynamic, step-by-step visual representation to make the process more tangible and easier to grasp.

3. Core Functionality:

The application presents a simplified, predefined AI interaction sequence on a single web page, featuring:

Actor Visualisation: A main canvas area displays key system components as distinct nodes (e.g., "User", "Web Client", "Backend App", "LLM") connected by edges (arrows) representing potential communication paths. This uses the Svelte Flow library for rendering.
Sequential Flow Animation: Users click a "Next Step" button to advance through the predefined interaction sequence (e.g., user sends message, backend processes, LLM receives context, LLM responds, etc.). The currently active part of the flow is indicated by highlighting the relevant actors and/or edges involved in that specific step.
MCP Object Display: A sidebar persistently displays the current state of the MCP JSON object relevant to the interaction step being shown. This uses a JSON tree viewer component for clear formatting.
Synchronised Updates: As the user clicks "Next Step" and the visual flow progresses, the MCP object displayed in the sidebar updates simultaneously, clearly showing how messages (user, assistant, tool calls/results if included) are added or how the context package changes at each stage.
Contextual Description: A simple text label indicates the action being performed in the current step (e.g., "Backend sends context to LLM").
4. Scope:

In Scope: Visualising a single, hardcoded example interaction sequence; demonstrating the structure and evolution of an MCP object; providing simple, forward-only step-through control.
Out of Scope: Real-time interaction processing; allowing users to input custom messages or define custom sequences; complex debugging features (e.g., rewind, step back, breakpoints); acting as a tool to generate or validate MCP objects. It is purely an illustrative/educational tool based on a fixed scenario.
5. Technology:

The application is built as a single-page web app using:

SvelteKit: A modern web framework providing structure, routing (though minimal here), and build tooling.
Svelte Flow (@xyflow/svelte): A library for rendering the node-based actor/flow diagram.
Svelte: The underlying UI compiler driving reactivity and component structure.
Vanilla JS/Svelte Stores: For managing the state of the current step and associated data.
svelte-json-tree (or similar): For displaying the MCP JSON object.
6. Benefit:

By visually correlating the message flow between system components with the corresponding changes in the structured MCP context object, this application provides an intuitive and accessible way to understand the fundamental mechanics and value of the Model Context Protocol.

