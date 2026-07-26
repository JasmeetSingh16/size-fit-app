import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { topic, shop } = await authenticate.webhook(request);

    console.log(`Received ${topic} webhook for ${shop}`);

    const charts = await db.sizeChart.findMany({ where: { shop } });
    for (const chart of charts) {
      await db.sizeEntry.deleteMany({ where: { sizeChartId: chart.id } });
    }
    await db.sizeChart.deleteMany({ where: { shop } });
    await db.quizResponse.deleteMany({ where: { shop } });

    return new Response();
  } catch (error) {
    // If authentication/HMAC verification fails or throws unexpectedly,
    // always return a clean 401 rather than letting it surface as a 500.
    if (error instanceof Response) {
      return error;
    }
    console.error("shop/redact webhook error:", error);
    return new Response("Unauthorized", { status: 401 });
  }
};
