import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';

// --- Base Node Style (Optional - Can use Tailwind directly) ---
// const nodeStyle = {
//   padding: '10px 15px',
//   border: '1px solid #ddd',
//   borderRadius: '5px',
//   background: '#fff',
//   display: 'flex',
//   alignItems: 'center',
//   justifyContent: 'center',
//   minWidth: '150px',
// };

// --- Custom Node Components ---

export const UserNode = memo(({ data }) => {
  return (
    // Use Tailwind classes directly for styling
    <div className={`react-flow__node-default ${data.isHighlighted ? 'highlight' : ''} flex items-center justify-center p-2 border rounded bg-white min-w-[120px]`}>
       {/* Placeholder for User Icon */}
      <span role="img" aria-label="User" className="mr-2">👤</span>
      <Handle type="source" position={Position.Right} id="user-right-source" />
      <div>{data.label}</div>
      {/* No target handle needed for the initial user node typically */}
    </div>
  );
});

export const ClientNode = memo(({ data }) => {
  return (
    <div className={`react-flow__node-default ${data.isHighlighted ? 'highlight' : ''} flex items-center justify-center p-2 border rounded bg-white min-w-[150px]`}>
       {/* Placeholder for Client Icon */}
      <span role="img" aria-label="Client" className="mr-2">💻</span>
      <Handle type="target" position={Position.Left} id="client-left-target" />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Right} id="client-right-source" />
    </div>
  );
});

export const BackendNode = memo(({ data }) => {
  return (
    <div className={`react-flow__node-default ${data.isHighlighted ? 'highlight' : ''} flex items-center justify-center p-2 border rounded bg-white min-w-[150px]`}>
      {/* Placeholder for Backend Icon */}
      <span role="img" aria-label="Backend" className="mr-2">⚙️</span>
      <Handle type="target" position={Position.Left} id="backend-left-target" />
       {/* Handle for connection from Tool */}
       <Handle type="target" position={Position.Bottom} id="bottom-target" />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Right} id="backend-right-source" />
       {/* Handle for connection to Tool */}
      <Handle type="source" position={Position.Bottom} id="bottom-source" />
    </div>
  );
});


export const LLMNode = memo(({ data }) => {
  return (
     <div className={`react-flow__node-output ${data.isHighlighted ? 'highlight' : ''} flex items-center justify-center p-2 border rounded bg-white min-w-[120px]`}>
       {/* Placeholder for LLM Icon */}
      <span role="img" aria-label="LLM" className="mr-2">🧠</span>
      <Handle type="target" position={Position.Left} id="llm-left-target" />
      <div>{data.label}</div>
       <Handle type="source" position={Position.Right} id="llm-right-source" /> {/* Assuming LLM can send back */}
    </div>
  );
});

export const ToolNode = memo(({ data }) => {
  return (
    // Add a specific class for tool node styling if needed
    <div className={`react-flow__node-default tool-node ${data.isHighlighted ? 'highlight' : ''} flex items-center justify-center p-2 border border-purple-500 rounded bg-purple-50 min-w-[150px]`}>
      {/* Placeholder for Tool Icon */}
      <span role="img" aria-label="Tool" className="mr-2">🔧</span>
      {/* Handles to connect to Backend */}
      <Handle type="target" position={Position.Top} id="top-target" />
      <div>{data.label}</div>
      <Handle type="source" position={Position.Top} id="top-source" />
    </div>
  );
});

// Ensure display names are set for React DevTools
UserNode.displayName = 'UserNode';
ClientNode.displayName = 'ClientNode';
BackendNode.displayName = 'BackendNode';
LLMNode.displayName = 'LLMNode';
ToolNode.displayName = 'ToolNode';