import { r2 } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { fileName, fileType, restaurantSlug, subfolder } = await request.json();

    if (!restaurantSlug) {
      return NextResponse.json({ error: "Restaurant Slug is required" }, { status: 400 });
    }

    // اسم فایل رو یونیک میکنیم که تکراری نشه (مثلا: my-restaurant/category/173822-pizza.jpg)
    const folderPath = subfolder ? `${restaurantSlug}/${subfolder}` : restaurantSlug;
    const uniqueFileName = `${folderPath}/${Date.now()}-${fileName.replace(/\s+/g, "-")}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: fileType,
    });

    // تولید لینک موقت (فقط ۶۰ ثانیه اعتبار داره برای امنیت)
    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 60 });

    // لینک نهایی که باید توی دیتابیس ذخیره بشه
    const publicUrl = `https://${process.env.R2_PUBLIC_DOMAIN}/${uniqueFileName}`;

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (error) {
    console.error("R2 Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
