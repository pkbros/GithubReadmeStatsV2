/**
 * Parses embedded JSON metadata comment from SVG strings
 * Format in SVG: <!-- METADATA: { ... } -->
 */
export function parseSvgMetadata(svgString) {
  if (!svgString) return null;
  const match = svgString.match(/<!--\s*METADATA:\s*({[\s\S]*?})\s*-->/);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error("Failed to parse SVG METADATA JSON:", e);
    }
  }
  return null;
}

/**
 * Compresses an uploaded image file using HTML5 Canvas to a max side of 200px
 * and returns the Base64 data URL string.
 */
export function compressImageToBase64(file, maxDimension = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        // Export compressed PNG Base64
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Replaces {{avatar_x="X"_y="Y"_width="W"_height="H"}} tokens with an XML <image> tag
 */
export function replaceAvatarToken(svgString, base64Url) {
  if (!svgString) return svgString;

  const avatarRegex =
    /\{\{avatar_x="([^"]+)"_y="([^"]+)"_width="([^"]+)"_height="([^"]+)"\}\}/;
  const match = svgString.match(avatarRegex);

  if (match) {
    const [fullToken, x, y, width, height] = match;
    const replacement = base64Url
      ? `<image x="${x}" y="${y}" width="${width}" height="${height}" href="${base64Url}" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatarClip)"/>`
      : `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#1a1a2e" rx="3"/>`;

    return svgString.replace(fullToken, replacement);
  }

  return svgString;
}
