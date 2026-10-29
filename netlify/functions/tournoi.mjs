import { getStore } from "@netlify/blobs";

export default async (req) => {
  const store = getStore({ name: "poolnight", consistency: "strong" });
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };

  if (req.method === "GET") {
    const data = await store.get("tournoi", { type: "text" });
    return new Response(data || "null", { headers });
  }

  if (req.method === "PUT") {
    const key = Netlify.env.get("ORGANIZER_KEY");
    if (!key || req.headers.get("x-organizer-key") !== key) {
      return new Response("forbidden", { status: 403 });
    }
    const body = await req.text();
    if (body.length > 500000) return new Response("too large", { status: 413 });
    try { JSON.parse(body); } catch { return new Response("bad json", { status: 400 }); }
    await store.set("tournoi", body);
    return new Response("ok", { headers });
  }

  return new Response("method not allowed", { status: 405 });
};

export const config = { path: "/api/tournoi" };
