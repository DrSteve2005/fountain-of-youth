import { createFileRoute } from "@tanstack/react-router";
import { readPublicPot } from "@/lib/faucet-api";

const CORS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=20",
};

export const Route = createFileRoute("/api/pot")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () => {
        const pot = await readPublicPot();
        return Response.json(pot, { headers: CORS });
      },
    },
  },
});
