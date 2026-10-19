import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function main() {
  console.log("Starting Composio Connectivity Check...");
  console.log("COMPOSIO_API_KEY present:", !!process.env.COMPOSIO_API_KEY);
  
  const composio = new Composio({
    provider: new VercelProvider(),
  });
  
  try {
    const session = await composio.create("User_Vishu");
    console.log("Session created successfully.");

    // 1. Try to create the repo "code-mentor-dsa"
    console.log("Trying to create repository code-mentor-dsa...");
    try {
      const repoRes = await session.execute("GITHUB_CREATE_A_REPOSITORY_FOR_THE_AUTHENTICATED_USER", {
        name: "code-mentor-dsa",
        description: "DSA solutions pushed from CodeMentor AI sandbox",
        private: false
      });
      console.log("Repo Create Result:", JSON.stringify(repoRes, null, 2));
    } catch (e: any) {
      console.log("Repo might already exist or creation failed:", e.message);
    }

    // 2. Push a test file to code-mentor-dsa
    console.log("Trying to create/update file contents on code-mentor-dsa...");
    const fileRes = await session.execute("GITHUB_CREATE_OR_UPDATE_FILE_CONTENTS", {
      owner: "CodingManiaac",
      repo: "code-mentor-dsa",
      path: "test.txt",
      message: "Initial test commit from CodeMentor AI",
      content: Buffer.from("Hello world from CodeMentor AI!").toString("base64")
    });
    console.log("File Commit Result:", JSON.stringify(fileRes, null, 2));
  } catch (err) {
    console.error("Action flow failed:", err);
  }
}

main();
