import { db } from "@/server/db";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ file: string }> },
) {
  const { file } = await params;
  if (!/^upload-[a-f0-9-]+\.webp$/.test(file))
    return new Response(null, { status: 404 });
  const row = (
    await db().query<{ bytes: Uint8Array }>(
      "SELECT bytes FROM media WHERE id=$1",
      [file],
    )
  ).rows[0];
  if (!row) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(row.bytes), {
    headers: {
      "Content-Type": "image/webp",
      "Cache-Control": "public,max-age=31536000,immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
