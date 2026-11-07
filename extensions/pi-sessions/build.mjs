import * as esbuild from "esbuild";

async function build() {
  await esbuild.build({
    entryPoints: ["src/resume.tsx"],
    bundle: true,
    outfile: "resume.js",
    format: "cjs",
    platform: "node",
    target: "node22",
    external: ["@vicinae/api", "react", "react/jsx-runtime"],
  });
  console.log("Built resume.js successfully!");
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
