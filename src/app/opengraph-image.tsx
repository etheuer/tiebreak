import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
export const dynamic = "force-static";
export const alt = "Clinchmark — Find your better fit.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default async function OpenGraphImage() {
  const [logo, font] = await Promise.all([
    readFile(join(process.cwd(), "public/brand/clinchmark-logo.png")),
    readFile(join(process.cwd(), "src/app/fonts/instrument-sans-600.ttf")),
  ]);
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#f8f9fc",
        padding: 70,
        fontFamily: "Instrument",
        color: "#24243e",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 780,
        }}
      >
        <img
          alt=""
          src={`data:image/png;base64,${logo.toString("base64")}`}
          width={380}
          height={127}
          style={{ marginLeft: -12, marginTop: -35 }}
        />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{ fontSize: 86, letterSpacing: "-4px", lineHeight: 1.05 }}
          >
            Find your
          </div>
          <div
            style={{
              fontSize: 86,
              letterSpacing: "-4px",
              lineHeight: 1.05,
              color: "#594acc",
            }}
          >
            better fit.
          </div>
          <div style={{ fontSize: 26, marginTop: 30, color: "#626477" }}>
            Clear comparisons. Thoughtful choices.
          </div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          position: "absolute",
          right: 70,
          top: 155,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 120,
            height: 310,
            borderRadius: 30,
            background: "#eeebfa",
          }}
        />
        <div
          style={{
            display: "flex",
            width: 120,
            height: 250,
            borderRadius: 30,
            background: "#e5f1ec",
          }}
        />
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: "Instrument", data: font, weight: 600, style: "normal" }],
    },
  );
}
