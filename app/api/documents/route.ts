import { session, json, failure } from "@/lib/renoxis/http";
export async function GET(request: Request) {
  try {
    const { db, user } = await session();
    const path = new URL(request.url).searchParams.get("path");
    if (!path) {
      const { data, error } = await db.storage
        .from("renoxis-documents")
        .list(user.id, {
          limit: 100,
          sortBy: { column: "created_at", order: "desc" },
        });
      if (error) return json({ error: "Document storage unavailable." }, 503);
      return json({ files: data });
    }
    if (!path.startsWith(user.id + "/") || path.includes(".."))
      return json({ error: "Invalid document." }, 403);
    const { data, error } = await db.storage
      .from("renoxis-documents")
      .createSignedUrl(path, 60);
    if (error) return json({ error: "Document not found." }, 404);
    return json({ url: data.signedUrl });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    const { db, user } = await session(request);
    if (Number(request.headers.get("content-length") || 0) > 4500000)
      return json({ error: "Maximum file size is 4 MB." }, 413);
    const form = await request.formData();
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      file.size > 4194304 ||
      !["application/pdf", "image/png", "image/jpeg", "text/plain"].includes(
        file.type,
      )
    )
      throw new Error("Upload a PDF, PNG, JPG or text file up to 4 MB.");
    const name = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
    const path = user.id + "/" + crypto.randomUUID() + "_" + name;
    const { error } = await db.storage
      .from("renoxis-documents")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) return json({ error: "Upload failed. Please retry." }, 503);
    return json({ path }, 201);
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: Request) {
  try {
    const { db, user } = await session(request);
    const { path } = await request.json();
    if (
      typeof path !== "string" ||
      !path.startsWith(user.id + "/") ||
      path.includes("..")
    )
      throw new Error("Invalid document.");
    const { error } = await db.storage.from("renoxis-documents").remove([path]);
    if (error) return json({ error: "Delete failed." }, 503);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
