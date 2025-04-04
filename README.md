# MCP Visualiser (React Version)

This web application serves as an educational tool to visually demonstrate the concept and flow of the Model Context Protocol (MCP)[cite: 90]. It shows how MCP structures conversational context and how that context evolves during an interaction between a user, frontend, backend, and an AI model (LLM)[cite: 90].

## Prerequisites

Before you begin, ensure you have Node.js installed on your system. Node.js includes npm (Node Package Manager), which is required to manage project dependencies.

1.  **Install Node.js:** Download and install the latest LTS (Long Term Support) version from the official Node.js website: [https://nodejs.org/](https://nodejs.org/)
2.  **Verify Installation:** Open your terminal or command prompt and run the following commands to check if Node.js and npm are installed correctly:
    ```bash
    node -v
    npm -v
    ```
    You should see version numbers printed for both.

## Installation

1.  **Get the Code:** Clone the repository or download the source code files to your local machine.
2.  **Navigate to Directory:** Open your terminal or command prompt and navigate into the project's root directory (the one containing `package.json` [cite: 112]).
    ```bash
    cd path/to/mcp-visualiser-react
    ```
3.  **Install Dependencies:** Run the following command to install all the necessary packages listed in `package.json`[cite: 112]:
    ```bash
    npm install
    ```
    This will download and install libraries like React, ReactFlow, Vite, Tailwind CSS, etc., into a `node_modules` folder.

## Running the Development Server

1.  **Start the Server:** Once the dependencies are installed, run the following command in your terminal from the project's root directory:
    ```bash
    npm run dev
    ```
    This command uses Vite [cite: 112] to start a local development server with hot module reloading (changes in the code will often update the browser automatically).
2.  **Access the App:** Look at the output in your terminal. Vite will typically print a message like:
    ```
      ➜  Local:   http://localhost:5173/
      ➜  Network: use --host to expose
      ➜  press h to show help
    ```
    Open your web browser and navigate to the "Local" URL provided (usually `http://localhost:5173` or the next available port).
3.  **Use the Visualiser:** You should now see the MCP Visualiser application running. Use the "Next Step" and "Previous Step" buttons to navigate through the interaction flow.

## Building for Production (Optional)

If you want to create an optimized build of the application for deployment:

1.  **Build the App:** Run the build script defined in `package.json`[cite: 112]:
    ```bash
    npm run build
    ```
    This command uses Vite to bundle and optimize the code, typically outputting the static files into a `dist` directory.
2.  **Preview the Build:** To test the production build locally, you can use the preview script[cite: 112]:
    ```bash
    npm run preview
    ```
    This will start a simple local server serving the contents of the `dist` folder. Access it using the URL provided in the terminal output.