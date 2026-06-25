import { Composio } from "@composio/core";
import { VercelProvider } from "@composio/vercel";

const composio = new Composio({
  provider: new VercelProvider(),
});

export async function getTools(userId: string) {
  const session = await composio.create(userId);

  return await session.tools();
}