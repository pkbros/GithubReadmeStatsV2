import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  parseSvgMetadata,
  compressImageToBase64,
  replaceAvatarToken,
} from "../utils/svgParser";
import { replaceSvgTokens, buildStatsTokenMap } from "../utils/svgRenderer";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  MousePointerClick,
  RefreshCw,
  FileText,
} from "lucide-react";

const API_BASE_URL =
  "https://github-readmestats-71957385499.asia-south1.run.app";
const CARD_IDS = ["1", "2", "3", "4", "5"];
const FILE_NAMES = {
  1: "card1-identity.svg",
  2: "card2-stats.svg",
  3: "card3-quest-log.svg",
  4: "card4-tech-stack.svg",
  5: "card5-footer.svg",
};

export default function EditorPage() {
  const { username } = useParams();
  const navigate = useNavigate();

  const [statsData, setStatsData] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [templates, setTemplates] = useState({});
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [cardOverrides, setCardOverrides] = useState({});
  const [avatarBase64, setAvatarBase64] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // Fetch stats from backend
  useEffect(() => {
    if (!username) return;
    let cancelled = false;

    fetch(`${API_BASE_URL}/api/stats/${username}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) {
          setStatsData(data);
          setLoadingStats(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching stats:", err);
        if (!cancelled) setLoadingStats(false);
      });

    return () => {
      cancelled = true;
    };
  }, [username]);

  // Load templates from public/templates/
  useEffect(() => {
    Promise.all(
      CARD_IDS.map((id) =>
        fetch(`/templates/${FILE_NAMES[id]}`)
          .then((res) => res.text())
          .then((text) => [id, text]),
      ),
    ).then((results) => {
      const loaded = {};
      results.forEach(([id, text]) => {
        loaded[id] = text;
      });
      setTemplates(loaded);
    });
  }, []);

  const allMetadata = useMemo(() => {
    const meta = {};
    for (const [id, svg] of Object.entries(templates)) {
      meta[id] = parseSvgMetadata(svg);
    }
    return meta;
  }, [templates]);

  // Initialize overrides with defaults
  useEffect(() => {
    if (!selectedCardId) return;
    const meta = allMetadata[selectedCardId];
    if (!meta?.controls) return;

    setCardOverrides((prev) => {
      const updated = { ...prev };
      meta.controls.forEach((c) => {
        if (
          c.type !== "avatar" &&
          !(c.key in updated) &&
          c.default !== undefined
        ) {
          updated[c.key] = String(c.default);
        }
      });
      return updated;
    });
  }, [selectedCardId, allMetadata]);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      // Compress to JPEG for smaller inline base64
      const base64 = await compressImageToBase64(file, 200);
      setAvatarBase64(base64);
    } catch (err) {
      console.error("Failed to compress avatar:", err);
    }
  };

  const handleOverrideChange = (key, value) => {
    setCardOverrides((prev) => ({ ...prev, [key]: value }));
  };

  // Build rendered SVG for preview
  const getRenderedSvg = (cardId) => {
    const rawSvg = templates[cardId];
    if (!rawSvg) return "<svg></svg>";

    const statsTokens = buildStatsTokenMap(statsData);
    const mergedTokens = {
      ...statsTokens,
      username: username || "octocat",
      ...cardOverrides,
    };

    let rendered = replaceSvgTokens(rawSvg, mergedTokens);

    if (cardId === "1") {
      rendered = replaceAvatarToken(rendered, avatarBase64);
    }

    return rendered;
  };

  // Download SVG file on the client-side
  const handleDownloadSvg = (cardId) => {
    const svgContent = getRenderedSvg(cardId);
    const blob = new Blob([svgContent], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${username}-${FILE_NAMES[cardId]}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy Markdown link for dynamic API cards
  const handleCopyMarkdown = (cardId) => {
    const params = new URLSearchParams();
    params.set("username", username || "octocat");

    // Add only overrides relevant to this specific card's control keys
    const meta = allMetadata[cardId];
    if (meta?.controls) {
      meta.controls.forEach((control) => {
        const val = cardOverrides[control.key];
        if (val) params.set(control.key, val);
      });
    }

    const markdown = `![Card ${cardId}](${API_BASE_URL}/api/card/${cardId}?${params.toString()})`;
    navigator.clipboard.writeText(markdown);
    setCopiedId(cardId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const selectedMeta = selectedCardId ? allMetadata[selectedCardId] : null;

  return (
    <div className="h-[calc(100vh-65px)] grid grid-cols-1 lg:grid-cols-12 bg-base-300 overflow-hidden font-sans">
      {/* ═══ PREVIEW PANEL (8 cols) ═══ */}
      <div className="lg:col-span-8 p-4 md:p-6 flex flex-col gap-4 overflow-y-auto">
        {/* Top Bar */}
        <div className="flex items-center justify-between bg-base-200 p-3 rounded-xl border border-base-300 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="btn btn-sm btn-ghost gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <div className="badge badge-primary text-xs font-mono">
              @{username}
            </div>
          </div>
          {loadingStats && (
            <div className="flex items-center gap-2 text-xs text-primary animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Fetching
              Stats...
            </div>
          )}
        </div>

        {/* Cards Stack */}
        <div className="flex flex-col gap-6 w-full">
          {CARD_IDS.map((id) => {
            const isSelected = selectedCardId === id;
            const meta = allMetadata[id];
            const isAutoFetched = meta?.source === "github_api";

            return (
              <div key={id} className="flex flex-col gap-2">
                <div
                  onClick={() => setSelectedCardId(id)}
                  className={`cursor-pointer transition-all duration-300 rounded-xl border-2 p-2 ${
                    isSelected
                      ? "border-primary ring-4 ring-primary/20"
                      : "border-transparent hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 px-1 text-xs font-semibold opacity-60">
                    <span>{meta?.name || `Card ${id}`}</span>
                    <div className="flex gap-2">
                      {isAutoFetched && (
                        <span className="badge badge-ghost badge-xs">
                          Auto from GitHub
                        </span>
                      )}
                      {isSelected && (
                        <span className="badge badge-primary badge-xs">
                          Editing
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    dangerouslySetInnerHTML={{ __html: getRenderedSvg(id) }}
                  />
                </div>

                {/* Per-card action buttons */}
                <div className="flex justify-end gap-2 pr-1">
                  {id === "1" ? (
                    <button
                      onClick={() => handleDownloadSvg(id)}
                      className="btn btn-sm btn-outline btn-secondary gap-2 text-xs"
                    >
                      <Download className="w-3.5 h-3.5" /> Download SVG
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCopyMarkdown(id)}
                      className="btn btn-sm btn-outline btn-primary gap-2 text-xs"
                    >
                      {copiedId === id ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Markdown Link
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ SIDE EDIT PANEL (4 cols) ═══ */}
      <div className="lg:col-span-4 bg-base-200 border-l border-base-300 p-5 flex flex-col overflow-y-auto">
        {!selectedCardId ? (
          <div className="my-auto text-center flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-base-content/20 rounded-2xl">
            <MousePointerClick className="w-12 h-12 text-primary animate-bounce" />
            <h3 className="text-lg font-bold">Click on any card to edit</h3>
            <p className="text-xs opacity-60 max-w-xs">
              Select a card from the preview to customize its tokens, upload an
              avatar, or pick animations.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 flex-1">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-base-300 pb-3 shrink-0">
              <div>
                <h3 className="font-bold text-lg">
                  {selectedMeta?.name || `Card ${selectedCardId}`}
                </h3>
                {selectedMeta?.description && (
                  <p className="text-xs opacity-60 mt-1">
                    {selectedMeta.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedCardId(null)}
                className="btn btn-xs btn-ghost"
              >
                ✕
              </button>
            </div>

            {/* Instruction block for Card 1 */}
            {selectedCardId === "1" && (
              <div className="card bg-info/10 border border-info/20 text-xs p-4 flex flex-col gap-2 rounded-xl">
                <div className="flex items-center gap-2 font-bold text-info">
                  <FileText className="w-4 h-4" /> SVG Hosting Steps:
                </div>
                <ol className="list-decimal pl-4 flex flex-col gap-1 opacity-80">
                  <li>Customize your card profile details below.</li>
                  <li>
                    Click <strong>Download SVG</strong>.
                  </li>
                  <li>
                    Upload the file into your GitHub profile repository (e.g.{" "}
                    <code>username/username</code>).
                  </li>
                  <li>
                    Add it to your profile README using:
                    <pre className="bg-base-300 p-1.5 rounded mt-1 font-mono overflow-x-auto text-[10px]">
                      {`![Identity](https://raw.githubusercontent.com/${username}/${username}/main/${username}-card1-identity.svg)`}
                    </pre>
                  </li>
                </ol>
              </div>
            )}

            {/* Auto-populated banner */}
            {selectedMeta?.source === "github_api" && (
              <div className="alert alert-info text-xs py-2">
                <span>
                  This card is auto-populated from GitHub stats for{" "}
                  <strong>@{username}</strong>. No manual editing needed.
                </span>
              </div>
            )}

            {/* Dynamic Controls */}
            <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
              {selectedMeta?.controls?.map((control) => {
                if (control.type === "avatar") {
                  return (
                    <div key={control.key} className="form-control w-full">
                      <label className="label">
                        <span className="label-text text-xs font-bold font-mono">
                          {control.label}
                        </span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="file-input file-input-bordered file-input-primary file-input-sm w-full"
                      />
                    </div>
                  );
                }

                if (control.type === "color") {
                  return (
                    <div key={control.key} className="form-control w-full">
                      <label className="label">
                        <span className="label-text text-xs font-bold font-mono">{`{{${control.label}}}`}</span>
                      </label>
                      <input
                        type="color"
                        value={cardOverrides[control.key] ?? control.default}
                        onChange={(e) =>
                          handleOverrideChange(control.key, e.target.value)
                        }
                        className="w-full h-10 rounded-lg cursor-pointer border border-base-300"
                      />
                    </div>
                  );
                }

                if (control.type === "select") {
                  return (
                    <div key={control.key} className="form-control w-full">
                      <label className="label">
                        <span className="label-text text-xs font-bold font-mono">{`{{${control.label}}}`}</span>
                      </label>
                      <select
                        value={cardOverrides[control.key] ?? control.default}
                        onChange={(e) =>
                          handleOverrideChange(control.key, e.target.value)
                        }
                        className="select select-bordered select-sm w-full text-xs"
                      >
                        {control.options?.map((opt) => (
                          <option key={opt.label} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                return (
                  <div key={control.key} className="form-control w-full">
                    <label className="label">
                      <span className="label-text text-xs font-bold font-mono">{`{{${control.label}}}`}</span>
                    </label>
                    <input
                      type="text"
                      placeholder={control.default || ""}
                      value={cardOverrides[control.key] ?? ""}
                      onChange={(e) =>
                        handleOverrideChange(control.key, e.target.value)
                      }
                      className="input input-bordered input-sm w-full text-xs"
                    />
                  </div>
                );
              })}
            </div>

            {/* Bottom Copy/Download CTA */}
            <div className="pt-3 border-t border-base-300 shrink-0">
              {selectedCardId === "1" ? (
                <button
                  onClick={() => handleDownloadSvg(selectedCardId)}
                  className="btn btn-secondary btn-block gap-2 text-sm shadow-md"
                >
                  <Download className="w-4 h-4" /> Download SVG File
                </button>
              ) : (
                <button
                  onClick={() => handleCopyMarkdown(selectedCardId)}
                  className="btn btn-primary btn-block gap-2 text-sm shadow-md"
                >
                  {copiedId === selectedCardId ? (
                    <>
                      <Check className="w-4 h-4" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy Markdown Link
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
