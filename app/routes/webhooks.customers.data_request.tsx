import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// Shopify's mandatory GDPR webhook: a customer or store owner has
// requested the personal data this app holds for a specific customer.
// This app does not store any customer-identifying data — quiz
// responses are anonymous (just height/weight/product ID, no name,
// email, or customer ID) — so there is nothing to return here.
export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  return new Response();
};