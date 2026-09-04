import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default async function Icon() {
  const mark = await readFile(
    join(process.cwd(), "public/brand/clinchmark-mark.png"),
  );
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8f9fc",
        borderRadius: 36,
      }}
    >
      <img
        alt=""
        src={`data:image/png;base64,${mark.toString("base64")}`}
        width={180}
        height={180}
      />
    </div>,
    size,
  );
}
