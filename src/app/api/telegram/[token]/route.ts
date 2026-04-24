import { getBotInstance } from "@/lib/bot";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Security: Check secret token header if provided in environment
    const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (secretToken) {
      const headerToken = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (headerToken !== secretToken) {
        return Response.json({ status: "error", message: "Unauthorized" }, { status: 401 });
      }
    }

    const bot = await getBotInstance(token);
    const body = await req.json();
    
    // Memberitahu Telegraf untuk memproses update melalui webhook berdasarkan token bot unik
    await bot.handleUpdate(body);
    
    return Response.json({ status: "ok" });
  } catch (err: any) {
    console.error(`Bot Error (Webhook):`, err);
    return Response.json({ status: "error", message: err.message }, { status: 500 });
  }
}
