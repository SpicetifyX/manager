import { useState } from "react";
import { FaFlag, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";
import * as backend from "../../wailsjs/go/app/App";

type Category = "extension" | "theme" | "app";

const STORAGE_COUNT = "spx:submit:count";
const STORAGE_HISTORY = "spx:submit:history";
const STORAGE_WARNED = "spx:submit:warned";
const SPAM_THRESHOLD = 3;

function getCount(): number {
  return parseInt(localStorage.getItem(STORAGE_COUNT) || "0", 10);
}

function getHistory(): { category: string; repoURL: string }[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_HISTORY) || "[]");
  } catch {
    return [];
  }
}

function appendHistory(entry: { category: string; repoURL: string }) {
  const h = getHistory();
  h.push(entry);
  localStorage.setItem(STORAGE_HISTORY, JSON.stringify(h));
  localStorage.setItem(STORAGE_COUNT, String(getCount() + 1));
}
function hasBeenWarned(): boolean {
  return localStorage.getItem(STORAGE_WARNED) === "1";
}

export default function SubmitAddon() {
  const [category, setCategory] = useState<Category>("extension");
  const [repoURL, setRepoURL] = useState("");
  const [note, setNote] = useState("");
  const [discordUser, setDiscordUser] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<"success" | "error" | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [showSpamModal, setShowSpamModal] = useState(false);

  const GITHUB_REPO_RE = /^https?:\/\/github\.com\/[^/]+/;

  function validateURL(val: string): string | null {
    if (!val.trim()) return "Please enter a GitHub repository URL.";
    if (!GITHUB_REPO_RE.test(val.trim())) return "Must be a valid GitHub repository URL e.g. https://github.com/username/repo";
    return null;
  }

  async function doSubmit() {
    const url = repoURL.trim();
    const isDuplicate = getHistory().some((h) => h.category === category && h.repoURL === url);

    setSubmitting(true);
    setResult(null);

    try {
      const ok = await (backend as any).SubmitMissingAddon(category, url, note.trim(), discordUser.trim(), isDuplicate);
      if (ok) {
        appendHistory({ category, repoURL: url });
        setResult("success");
        setRepoURL("");
        setNote("");
        setDiscordUser("");
      } else {
        setResult("error");
      }
    } catch {
      setResult("error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validateURL(repoURL);
    if (err) {
      setUrlError(err);
      return;
    }

    if (getCount() >= SPAM_THRESHOLD && !hasBeenWarned()) {
      setShowSpamModal(true);
      return;
    }

    doSubmit();
  }

  function dismissSpamModal() {
    localStorage.setItem(STORAGE_WARNED, "1");
    setShowSpamModal(false);
    doSubmit();
  }

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#171b20] px-6 pt-6 pb-10">
      {showSpamModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-lg border border-[#2a2e34] bg-[#1a1e24] p-6 shadow-xl">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-yellow-500/15 text-yellow-400">
                <FaExclamationCircle size={16} />
              </div>
              <h2 className="text-base font-semibold text-white">Hold on a second</h2>
            </div>
            <p className="mb-5 text-sm text-[#a0a0a0] leading-relaxed">
              You've already submitted a few reports, we really do see them all and we'll get to yours as soon as possible. Please don't spam
              submissions, it just makes our review harder.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSpamModal(false)}
                className="flex-1 rounded bg-[#2a2e34] px-4 py-2 text-sm font-medium text-[#a0a0a0] hover:bg-[#333] transition-colors"
              >
                Go back
              </button>
              <button
                onClick={dismissSpamModal}
                className="flex-1 rounded bg-[#d63c6a] px-4 py-2 text-sm font-medium text-white hover:bg-[#c52c5a] transition-colors"
              >
                Submit anyway
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto w-full">
        <div className="mb-4 flex items-center gap-4 border-b border-[#1e2228] pb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d63c6a]/20 text-[#d63c6a]">
            <FaFlag size={18} />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">Report Missing Listing</h1>
            <p className="text-sm text-[#a0a0a0]">Found an extension, theme, or app that isn't showing up? Let us know and we'll add it manually.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-[#c0c0c0]">Category</label>
            <div className="flex gap-2">
              {(["extension", "theme", "app"] as Category[]).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className={`rounded px-5 py-2 text-sm font-medium capitalize transition-colors ${category === c ? "bg-[#d63c6a] text-white" : "bg-[#1e2228] text-[#a0a0a0] hover:bg-[#2a2e34] hover:text-white"
                    }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#c0c0c0]">
              GitHub Repository URL <span className="text-[#d63c6a]">*</span>
            </label>
            <input
              type="text"
              value={repoURL}
              onChange={(e) => {
                setRepoURL(e.target.value);
                setUrlError(null);
              }}
              onBlur={() => setUrlError(validateURL(repoURL))}
              placeholder="https://github.com/username/repo"
              className={`rounded bg-[#1e2228] px-4 py-3 text-sm text-white placeholder-[#555] outline-none ring-1 transition focus:ring-[#d63c6a] ${urlError ? "ring-red-500" : "ring-[#2a2e34]"}`}
            />
            <div className="h-6 flex items-center">
              {urlError && (
                <div className="flex items-center gap-2 rounded border border-red-500/30 bg-red-900/20 px-3 py-1 text-xs w-full">
                  <FaExclamationCircle size={11} className="shrink-0 text-red-400" />
                  <span className="text-red-400">{urlError}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#c0c0c0]">
              Note <span className="text-[#555] font-normal">(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any extra context e.g. where the JS file is located, what the app is called..."
              rows={2}
              maxLength={300}
              className="resize-none rounded bg-[#1e2228] px-4 py-2.5 text-sm text-white placeholder-[#555] outline-none ring-1 ring-[#2a2e34] transition focus:ring-[#d63c6a]"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-[#c0c0c0]">
              Discord Username <span className="text-[#555] font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={discordUser}
              onChange={(e) => setDiscordUser(e.target.value)}
              placeholder="e.g. stormpiehhh, jeff"
              maxLength={32}
              className="rounded bg-[#1e2228] px-4 py-3 text-sm text-white placeholder-[#555] outline-none ring-1 ring-[#2a2e34] transition focus:ring-[#d63c6a]"
            />
            <p className="text-xs text-[#555]">So we can ping and or message you when your submission is reviewed.</p>
          </div>

          {result === "success" && (
            <div className="flex items-center gap-2 rounded bg-green-900/30 px-3 py-2 text-sm text-green-400 ring-1 ring-green-700/40">
              <FaCheckCircle size={13} />
              Submitted! We'll review it and add it to the marketplace.
            </div>
          )}
          {result === "error" && (
            <div className="flex items-center gap-2 rounded bg-red-900/30 px-3 py-2 text-sm text-red-400 ring-1 ring-red-700/40">
              <FaExclamationCircle size={13} />
              Something went wrong. Check your connection and try again.
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !!urlError || !repoURL.trim()}
            className={`flex items-center justify-center gap-2 rounded px-5 py-3 text-sm font-semibold transition-all ${submitting || !!urlError || !repoURL.trim()
                ? "cursor-not-allowed bg-[#2a2e34] text-[#555]"
                : "bg-[#d63c6a] text-white hover:bg-[#c52c5a] active:bg-[#b51c4a]"
              }`}
          >
            <FaFlag size={12} />
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </form>

        <div className="mt-4 rounded bg-[#1e2228] px-4 py-3 text-sm text-[#a0a0a0] ring-1 ring-[#2a2e34]">
          <span className="font-medium text-[#c0c0c0]">How does this work? </span>
          Your submission goes to the SpicetifyX dev team. We'll find the correct file paths and add a manual override so it shows up in the
          marketplace for everyone, usually within a day or two.
        </div>
      </div>
    </div>
  );
}
