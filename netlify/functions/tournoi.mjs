import { getStore } from "@netlify/blobs";
import { timingSafeEqual } from "node:crypto";

const same = (a, b) => {
  const x = Buffer.from(a || ""), y = Buffer.from(b || "");
  return x.length === y.length && timingSafeEqual(x, y);
};
const authorized = (req) => {
  const key = Netlify.env.get("ORGANIZER_KEY");
  return !!key && same(req.headers.get("x-organizer-key"), key);
};

export default async (req) => {
  const store = getStore({ name: "poolnight", consistency: "strong" });
  const headers = { "Content-Type": "application/json", "Cache-Control": "no-store" };

  if (req.method === "GET") {
    const data = await store.get("tournoi", { type: "text" });
    return new Response(data || "null", { headers });
  }

  // POST = vérifier la clé organisateur (ne renvoie jamais la clé)
  if (req.method === "POST") {
    return authorized(req)
      ? new Response("ok", { headers })
      : new Response("forbidden", { status: 403 });
  }

  if (req.method === "PUT") {
    if (!authorized(req)) return new Response("forbidden", { status: 403 });
    const body = await req.text();
    if (body.length > 500000) return new Response("too large", { status: 413 });
    try { JSON.parse(body); } catch { return new Response("bad json", { status: 400 }); }
    await store.set("tournoi", body);
    return new Response("ok", { headers });
  }

  return new Response("method not allowed", { status: 405 });
};

export const config = { path: "/api/tournoi" };
