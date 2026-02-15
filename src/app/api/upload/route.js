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
    const folderPath = subfolder ? `${restaurantSlug}/${subfolder}` : restaurantSlug;
    const uniqueFileName = `${folderPath}/${Date.now()}-${fileName.replace(/\s+/g, "-")}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 60 });

    const publicUrl = `https://${process.env.R2_PUBLIC_DOMAIN}/${uniqueFileName}`;

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (error) {
    console.error("R2 Error:", error);
    return NextResponse.json(
      { error: error.message || "Something went wrong during upload" },
      { status: 500 }
    );
  }
}
