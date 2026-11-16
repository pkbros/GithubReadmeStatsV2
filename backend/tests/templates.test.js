const { test, describe } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

// Templates are duplicated: one copy for the API renderer, one served to the
// React editor (which reads the embedded METADATA block). Validate both.
const TEMPLATE_DIRS = [
  path.join(__dirname, "..", "templates"),
  path.join(__dirname, "..", "..", "frontend", "public", "templates"),
];

const METADATA_RE = /<!--\s*METADATA:\s*({[\s\S]*?})\s*-->/;

describe("SVG template metadata", () => {
  for (const dir of TEMPLATE_DIRS) {
    const label = path.relative(path.join(__dirname, "..", ".."), dir);
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.toLowerCase().endsWith(".svg"));

    for (const file of files) {
      test(`${label}/${file} has valid metadata with keyed controls`, () => {
        const svg = fs.readFileSync(path.join(dir, file), "utf8");
        const match = svg.match(METADATA_RE);

        assert.ok(match, "METADATA block is missing");

        let metadata;
        assert.doesNotThrow(() => {
          metadata = JSON.parse(match[1]);
        }, "METADATA must be valid JSON");

        assert.ok(metadata.id, "metadata.id is required");
        assert.ok(Array.isArray(metadata.controls), "controls must be an array");

        metadata.controls.forEach((control, index) => {
          assert.ok(
            control && control.key,
            `control at index ${index} is missing a "key" (stray control)`,
          );
          assert.ok(control.type, `control "${control.key}" is missing "type"`);
        });
      });
    }
  }

  test("card1 defines the avatarClip referenced by uploaded avatars", () => {
    for (const dir of TEMPLATE_DIRS) {
      const svg = fs.readFileSync(path.join(dir, "card1-identity.svg"), "utf8");
      assert.match(svg, /clipPath id="avatarClip"/, `${dir} missing avatarClip`);
    }
  });

  test("card5 wires the heart_2_animation token", () => {
    for (const dir of TEMPLATE_DIRS) {
      const svg = fs.readFileSync(path.join(dir, "card5-footer.svg"), "utf8");
      assert.ok(
        svg.includes("{{heart_2_animation}}"),
        `${dir} missing heart_2_animation token`,
      );
    }
  });
});
