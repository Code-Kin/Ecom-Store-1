// Next.js server startup hook — ensures DB schema + demo data exist before serving traffic.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureDatabase } = await import("./lib/bootstrap");
    await ensureDatabase();
  }
}
