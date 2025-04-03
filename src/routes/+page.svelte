<script>
  import { SvelteFlow, Controls, Background, Position } from '@xyflow/svelte';
  import { writable, derived } from 'svelte/store';
  import JsonTree from 'svelte-json-tree'; // Assuming installed

  // 1. Define Interaction Steps & MCP States
  const interactionSteps = [
    {
      description: "Initial State",
      highlightIds: [], // Nothing highlighted initially
      mcpState: { protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1", context: { messages: [] } }
    },
    {
      description: "User sends 'Hello'",
      highlightIds: ['user', 'client'], // Highlight user and client receiving
      mcpState: {
        protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
        context: { messages: [ { role: "user", content: "Hello" } ] }
      }
    },
    {
      description: "Client sends request to Backend",
      highlightIds: ['client', 'backend'],
      mcpState: { // State as received/processed by backend initially
        protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
        context: { messages: [ { role: "user", content: "Hello" } ] }
      }
    },
    {
      description: "Backend sends context to LLM",
      highlightIds: ['backend', 'llm'],
      mcpState: { // Backend adds system prompt before sending
        protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
        context: { messages: [
           { role: "system", content: "You are a helpful assistant." },
           { role: "user", content: "Hello" }
        ] }
      }
    },
    {
      description: "LLM responds, received by Backend",
      highlightIds: ['llm', 'backend'], // LLM generated, Backend received
      mcpState: { // State before backend adds assistant response to history
        protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
        context: { messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello" }
          // LLM response "Hi there!" is processed next
        ] }
      }
    },
    {
      description: "Backend sends response to Client",
      highlightIds: ['backend', 'client'],
      mcpState: { // State includes assistant response now
        protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
        context: { messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there!" }
        ] }
      }
    },
    {
      description: "Client displays response to User",
      highlightIds: ['client', 'user'],
      mcpState: { // Final state for this turn displayed
        protocol: "mcp", version: "1.0", conversation_id: "vis-convo-1",
        context: { messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Hello" },
          { role: "assistant", content: "Hi there!" }
        ] }
      }
    }
  ];

  // 2. State Management
  const currentStepIndex = writable(0);
  const currentStep = derived(currentStepIndex, ($index) => interactionSteps[$index]);
  const currentMcpState = derived(currentStep, ($step) => $step.mcpState);

  // 3. Svelte Flow Nodes (Actors)
  const initialNodes = [
    { id: 'user', type: 'input', data: { label: 'User' }, position: { x: 50, y: 150 }, sourcePosition: Position.Right },
    { id: 'client', data: { label: 'Web Client' }, position: { x: 250, y: 150 }, sourcePosition: Position.Right, targetPosition: Position.Left },
    { id: 'backend', data: { label: 'Backend App' }, position: { x: 450, y: 150 }, sourcePosition: Position.Right, targetPosition: Position.Left },
    { id: 'llm', type: 'output', data: { label: 'LLM' }, position: { x: 650, y: 150 }, targetPosition: Position.Left },
  ];
  let nodes = writable(initialNodes); // Use writable store

  // 4. Svelte Flow Edges (Connections)
  const initialEdges = [
    { id: 'edge-user-client', source: 'user', target: 'client', animated: false }, // Removed direct style
    { id: 'edge-client-backend', source: 'client', target: 'backend', animated: false }, // Removed direct style
    { id: 'edge-backend-llm', source: 'backend', target: 'llm', animated: false }, // Removed direct style
    // Add return path edges if needed, e.g.:
    // { id: 'edge-llm-backend', source: 'llm', target: 'backend', animated: false },
    // { id: 'edge-backend-client', source: 'backend', target: 'client', animated: false },
    // { id: 'edge-client-user', source: 'client', target: 'user', animated: false },
  ];
   let edges = writable(initialEdges); // Use writable store

  // 5. Step Advancement Function
  function nextStep() {
    currentStepIndex.update(index => {
      let nextIndex = index + 1;
      if (nextIndex >= interactionSteps.length) {
        nextIndex = 0; // Loop back to the beginning
      }
      return nextIndex;
    });
  }

  // 6. Reactive Logic to Update Styles via Classes
  $: {
    const step = $currentStep;
    if (step) {
        // Update Nodes: Add/remove a 'highlight' class
        nodes.update(nds => nds.map(n => ({
            ...n,
            class: step.highlightIds.includes(n.id) ? 'highlight' : '' // Assign class based on highlight state
        })));

        // Update Edges: Add/remove animation and 'highlight' class
        edges.update(eds => eds.map(e => {
            // Highlight edge if BOTH source AND target are highlighted in this step
            const isActive = step.highlightIds.includes(e.source) && step.highlightIds.includes(e.target);

            return {
                ...e,
                class: isActive ? 'highlight' : '', // Assign class based on highlight state
                animated: isActive // Control animation based on the same logic
            };
        }));
    }
  }

</script>

<div class="app-container">
  <div class="flow-container">
    <SvelteFlow {nodes} {edges} fitView>
      <Background />
      <Controls />
    </SvelteFlow>
  </div>

  <div class="sidebar">
    <h2>MCP Visualiser</h2>
    <button on:click={nextStep}>Next Step</button>
    <div class="step-info">
        <p><strong>Step {$currentStepIndex + 1}/{interactionSteps.length}:</strong> {$currentStep.description}</p>
    </div>
    <hr/>
    <h3>MCP State</h3>
    <div class="mcp-display">
      <JsonTree value={$currentMcpState} />
    </div>
  </div>
</div>

<style>
  /* Base layout styles */
  .app-container {
    display: flex;
    height: 100vh;
    width: 100vw;
    font-family: sans-serif;
  }

  .flow-container {
    flex-grow: 1;
    height: 100%;
    width: 100%; /* Ensure width is explicitly set */
    border-right: 1px solid #ccc;
    position: relative; /* Good practice for positioning child elements */
  }

  .sidebar {
    width: 350px; /* Adjust width as needed */
    padding: 15px;
    box-sizing: border-box;
    overflow-y: auto;
    height: 100%;
    background-color: #f9f9f9;
    display: flex;
    flex-direction: column;
  }

  .sidebar h2, .sidebar h3 {
      margin-top: 0;
  }

  .sidebar button {
      padding: 10px 15px;
      font-size: 1em;
      margin-bottom: 15px;
      cursor: pointer;
  }

  .step-info {
      background-color: #eee;
      padding: 5px 10px;
      border-radius: 4px;
      margin-bottom: 15px;
  }

   .mcp-display {
       flex-grow: 1;
       overflow: auto;
       background-color: white;
       border: 1px solid #eee;
       padding: 5px;
       font-size: 0.9em;
   }

  /* Global styles for Svelte Flow with !important to override conflicts */
  /* IMPORTANT: Using !important is a workaround for CSS conflicts.
     Ideally, resolve conflicts without !important if possible,
     but this ensures rendering for now. */

  /* Default Node Styles */
  :global(.svelte-flow__node) {
    border: 1px solid #777 !important;
    padding: 10px 15px !important;
    border-radius: 3px !important;
    background: white !important;
    min-width: 150px !important;
    text-align: center !important;
    position: absolute !important; /* Crucial for positioning */
    display: block !important;    /* Ensure correct display type */
    visibility: visible !important; /* Ensure visibility */
  }

  /* Highlighted Node Style */
  :global(.svelte-flow__node.highlight) {
    background: lightblue !important;
    border-color: dodgerblue !important;
  }

  /* Default Edge Style */
  :global(.svelte-flow__edge .svelte-flow__edge-path) {
    stroke: #aaa !important;
    stroke-width: 2 !important;
    fill: none !important; /* Edges shouldn't be filled */
    stroke-linecap: round !important; /* Nicer line ends */
    stroke-linejoin: round !important;
    pointer-events: none !important; /* Usually handled by Svelte Flow */
    visibility: visible !important; /* Ensure visibility */
  }

  /* Highlighted Edge Style */
  :global(.svelte-flow__edge.highlight .svelte-flow__edge-path) {
    stroke: dodgerblue !important;
    stroke-width: 3 !important;
  }

  /* Optional: Style for animated edges (Svelte Flow adds .animated class) */
  :global(.svelte-flow__edge.animated .svelte-flow__edge-path) {
      /* Svelte Flow handles animation, you might add dashed stroke etc. if desired */
      /* stroke-dasharray: 5, 5 !important; */
  }

</style>