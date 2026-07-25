import { useState } from "react";
import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  TextField,
  Select,
  Button,
  Text,
  Badge,
  BlockStack,
  InlineStack,
  Banner,
  Divider,
  EmptyState,
} from "@shopify/polaris";
import { DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";

// ---- Loader: fetch products + existing size charts for this shop ----
export async function loader({ request }) {
  const { admin, session } = await authenticate.admin(request);

  const response = await admin.graphql(`
    query {
      products(first: 25) {
        edges {
          node { id title }
        }
      }
    }
  `);
  const data = await response.json();
  const products = data.data.products.edges.map((e) => e.node);

  const charts = await db.sizeChart.findMany({
    where: { shop: session.shop },
    include: { sizes: true },
    orderBy: { updatedAt: "desc" },
  });

  return json({ products, charts });
}

// ---- Action: save a size chart ----
export async function action({ request }) {
  const { session } = await authenticate.admin(request);
  const formData = await request.formData();
  const productId = formData.get("productId");
  const productName = formData.get("productName");
  const sizesJson = formData.get("sizes");
  const sizes = JSON.parse(sizesJson);

  const existing = await db.sizeChart.findUnique({
    where: { shop_productId: { shop: session.shop, productId } },
  });

  if (existing) {
    await db.sizeEntry.deleteMany({ where: { sizeChartId: existing.id } });
    await db.sizeChart.update({
      where: { id: existing.id },
      data: { productName, sizes: { create: sizes } },
    });
  } else {
    await db.sizeChart.create({
      data: { shop: session.shop, productId, productName, sizes: { create: sizes } },
    });
  }

  return json({ success: true });
}

const SIZE_PRESETS = ["S", "M", "L", "XL"];

const emptyRow = (presetIndex) => ({
  label: SIZE_PRESETS[presetIndex] ?? "",
  heightMinCm: "",
  heightMaxCm: "",
  weightMinKg: "",
  weightMaxKg: "",
});

// Shared grid template so the header row and every data row line up
// in exactly the same columns, regardless of content width.
const rowGridStyle = {
  display: "grid",
  gridTemplateColumns: "70px 1fr 1fr 1fr 1fr 32px",
  gap: "12px",
  alignItems: "center",
};

export default function SizeCharts() {
  const { products, charts } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();

  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [rows, setRows] = useState([emptyRow(0), emptyRow(1), emptyRow(2)]);
  const [saved, setSaved] = useState(false);

  // Show the last 6 digits of the product ID alongside the title so
  // duplicate-named products are never ambiguous in this list.
  const productOptions = products.map((p) => ({
    label: `${p.title}  ·  #${p.id.slice(-6)}`,
    value: p.id,
  }));

  function updateRow(index, field, value) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    setRows((prev) => [...prev, emptyRow(prev.length)]);
  }

  function removeRow(index) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    const product = products.find((p) => p.id === selectedProductId);
    const cleanedSizes = rows
      .filter((r) => r.label.trim() !== "")
      .map((r) => ({
        label: r.label,
        heightMinCm: r.heightMinCm ? Number(r.heightMinCm) : null,
        heightMaxCm: r.heightMaxCm ? Number(r.heightMaxCm) : null,
        weightMinKg: r.weightMinKg ? Number(r.weightMinKg) : null,
        weightMaxKg: r.weightMaxKg ? Number(r.weightMaxKg) : null,
      }));

    const formData = new FormData();
    formData.append("productId", selectedProductId);
    formData.append("productName", product?.title ?? "");
    formData.append("sizes", JSON.stringify(cleanedSizes));

    submit(formData, { method: "post" });
    setSaved(true);
  }

  const isSaving = navigation.state === "submitting";
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <Page
      title="Size Charts"
      subtitle="Set a height/weight range per size so shoppers get an accurate recommendation."
    >
      <Layout>
        {saved && !isSaving && (
          <Layout.Section>
            <Banner tone="success" onDismiss={() => setSaved(false)}>
              Size chart saved for {selectedProduct?.title}.
            </Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <BlockStack gap="100">
                <Text as="h2" variant="headingMd">
                  Create or edit a size chart
                </Text>
                <Text as="p" tone="subdued" variant="bodySm">
                  Products with the same name show their ID so you always pick the right one.
                </Text>
              </BlockStack>

              <Select
                label="Product"
                options={productOptions}
                value={selectedProductId}
                onChange={setSelectedProductId}
              />

              <Divider />

              <BlockStack gap="300">
                <div style={rowGridStyle}>
                  <Text as="span" variant="bodySm" fontWeight="semibold">Size</Text>
                  <Text as="span" variant="bodySm" fontWeight="semibold">Height min</Text>
                  <Text as="span" variant="bodySm" fontWeight="semibold">Height max</Text>
                  <Text as="span" variant="bodySm" fontWeight="semibold">Weight min</Text>
                  <Text as="span" variant="bodySm" fontWeight="semibold">Weight max</Text>
                  <div />
                </div>

                {rows.map((row, i) => (
                  <div key={i} style={rowGridStyle}>
                    <TextField
                      labelHidden
                      label="Size"
                      value={row.label}
                      onChange={(v) => updateRow(i, "label", v)}
                      placeholder="M"
                      autoComplete="off"
                    />
                    <TextField
                      labelHidden
                      label="Height min"
                      type="number"
                      value={row.heightMinCm}
                      onChange={(v) => updateRow(i, "heightMinCm", v)}
                      autoComplete="off"
                      suffix="cm"
                    />
                    <TextField
                      labelHidden
                      label="Height max"
                      type="number"
                      value={row.heightMaxCm}
                      onChange={(v) => updateRow(i, "heightMaxCm", v)}
                      autoComplete="off"
                      suffix="cm"
                    />
                    <TextField
                      labelHidden
                      label="Weight min"
                      type="number"
                      value={row.weightMinKg}
                      onChange={(v) => updateRow(i, "weightMinKg", v)}
                      autoComplete="off"
                      suffix="kg"
                    />
                    <TextField
                      labelHidden
                      label="Weight max"
                      type="number"
                      value={row.weightMaxKg}
                      onChange={(v) => updateRow(i, "weightMaxKg", v)}
                      autoComplete="off"
                      suffix="kg"
                    />
                    <Button
                      icon={DeleteIcon}
                      accessibilityLabel="Remove size"
                      onClick={() => removeRow(i)}
                      variant="tertiary"
                      tone="critical"
                    />
                  </div>
                ))}
              </BlockStack>

              <InlineStack gap="200" align="space-between">
                <Button icon={PlusIcon} onClick={addRow}>
                  Add size row
                </Button>
                <Button variant="primary" onClick={handleSave} loading={isSaving}>
                  Save size chart
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="300">
              <Text as="h2" variant="headingMd">
                Existing size charts
              </Text>

              {charts.length === 0 ? (
                <EmptyState
                  heading="No size charts yet"
                  image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
                >
                  <p>Create one above to start getting size recommendations on your storefront.</p>
                </EmptyState>
              ) : (
                <BlockStack gap="300">
                  {charts.map((chart) => (
                    <Card key={chart.id} background="bg-surface-secondary">
                      <BlockStack gap="200">
                        <InlineStack align="space-between" blockAlign="center">
                          <Text as="h3" variant="headingSm">
                            {chart.productName ?? "Untitled product"}
                          </Text>
                          <Badge tone="success">{`${chart.sizes.length} sizes`}</Badge>
                        </InlineStack>
                        <Text as="p" variant="bodySm" tone="subdued">
                          #{chart.productId.replace("gid://shopify/Product/", "")}
                        </Text>
                        <InlineStack gap="150">
                          {chart.sizes.map((s) => (
                            <Badge key={s.id}>{s.label}</Badge>
                          ))}
                        </InlineStack>
                      </BlockStack>
                    </Card>
                  ))}
                </BlockStack>
              )}
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}