import { put } from "@vercel/blob";

// Ephemeral upload endpoint for the iOS Shortcut path. Accepts a raw PDF body,
// stores it in Vercel Blob under an unguessable id, and returns { id }. The blob
// is deleted on first read by /api/pdf (read-once), so it does not linger.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: cors });
}

export async function POST(request: Request): Promise<Response> {
  try {
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength === 0) {
      return json({ error: "Empty body" }, 400);
    }
    // ~4.5MB Vercel function request-body limit; reject larger up front.
    if (bytes.byteLength > 4_400_000) {
      return json({ error: "PDF too large (max ~4MB)" }, 413);
    }
    const id = crypto.randomUUID().replace(/-/g, "");
    await put(`pdf/${id}.pdf`, bytes, {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/pdf",
    });
    return json({ id }, 200);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "upload failed" }, 500);
  }
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });
}
