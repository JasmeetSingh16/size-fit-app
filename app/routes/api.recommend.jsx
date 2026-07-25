import { json } from "@remix-run/node";
import db from "../db.server"; // your Prisma client, same pattern as Bulk Tag Manager
import { recommendSize } from "../recommendation.server";

// This route is exposed to the storefront via the App Proxy
// (configured in shopify.app.toml — see README) so it's reachable at
// https://{shop}/apps/fit-quiz/api/recommend

export async function action({ request }) {
  const body = await request.json();
  const { productId, heightCm, weightKg, fitPreference } = body;

  const shopDomain = new URL(request.url).searchParams.get("shop");

  // The storefront sends a plain numeric ID (e.g. "8271502770250"),
  // but the admin screen saves it in Shopify's GraphQL ID format
  // (e.g. "gid://shopify/Product/8271502770250"). Normalize before lookup.
  const normalizedProductId = productId.startsWith("gid://")
    ? productId
    : `gid://shopify/Product/${productId}`;

  const sizeChart = await db.sizeChart.findUnique({
    where: { shop_productId: { shop: shopDomain, productId: normalizedProductId } },
    include: { sizes: true },
  });

  if (!sizeChart) {
    return json({ recommendedSize: null, confidence: 0 });
  }

  const result = recommendSize(sizeChart.sizes, {
    heightCm,
    weightKg,
    fitPreference,
  });

  // Log the response for v2 (learning from real data later)
  await db.quizResponse.create({
    data: {
      shop: shopDomain,
      productId: normalizedProductId,
      heightCm,
      weightKg,
      fitPreference,
      recommendedSize: result.recommendedSize ?? "unknown",
      confidence: result.confidence,
    },
  });

  return json(result);
}