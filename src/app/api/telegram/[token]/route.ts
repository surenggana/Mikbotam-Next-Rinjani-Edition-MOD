import { getBotInstance } from "@/lib/bot";

export async function POST(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const bot = await getBotInstance(token);
    const body = await req.json();
    
    // Memberitahu Telegraf untuk memproses update melalui webhook berdasarkan token bot unik
    await bot.handleUpdate(body);
    
    return Response.json({ status: "ok" });
  } catch (err: any) {
    console.error(`Bot Error (Webhook - ${params.token}):`, err);
    return Response.json({ status: "error", message: err.message }, { status: 500 });
  }
}
