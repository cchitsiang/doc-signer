import { list, del } from "@vercel/blob";

// Read-once retrieval for the ephemeral upload flow. Streams the stored PDF for
// the given id and deletes it immediately, so each uploaded PDF can be fetched
// exactly once. Served same-origin, so the app fetches it without CORS.

export async function GET(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[a-f0-9]{16,64}$/.test(id)) {
    return new Response("Bad id", { status: 400 });
  }
  try {
    const { blobs } = await list({ prefix: `pdf/${id}.pdf` });
    const blob = blobs[0];
    if (!blob) {
      return new Response("Not found (already used or expired)", { status: 404 });
    }
    const fetched = await fetch(blob.url);
    const bytes = await fetched.arrayBuffer();
    await del(blob.url); // read-once: drop it after serving
    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "error", { status: 500 });
  }
}
