import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop } = await authenticate.webhook(request);
    console.log(`Received ${topic} webhook for ${shop}`);
    return new Response();
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error("customers/redact webhook error:", error);
    return new Response("Unauthorized", { status: 401 });
  }
};
