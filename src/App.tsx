import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import axios from 'axios';

type HistoryItem = {
  code: string;
  result: string;
  sourceLang: string;
  targetLang: string;
  mode: "convert" | "explain" | "fix";
  timestamp: string;
};

const languages = [
  "Python", "JavaScript", "TypeScript", "Java", "C#", "C++", "Go", "Ruby", "PHP", "VB.NET"
];

function App() {
  const [code, setCode] = useState("// Write your code here");
  const [translated, setTranslated] = useState("");
  const [loading, setLoading] = useState(false);
  const [sourceLang, setSourceLang] = useState("Python");
  const [targetLang, setTargetLang] = useState("JavaScript");
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState("light");
  const [mode, setMode] = useState<"convert" | "explain" | "fix">("convert");
  const [verbose, setVerbose] = useState(false);

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const stored = localStorage.getItem("code-history");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        handleTranslate();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [code, sourceLang, targetLang, mode]);

  const handleTranslate = async () => {
    setLoading(true);
    try {
      const response = await axios.post("https://code-translator-backend.onrender.com/convert", {
        code,
        source_lang: sourceLang,
        target_lang: targetLang,
        mode: mode,
        verbose: verbose,
      });

      const output = response.data.converted_code;
      setTranslated(output);

      const newEntry = {
        code,
        result: output,
        sourceLang,
        targetLang,
        mode,
        timestamp: new Date().toISOString(),
      };
      const updatedHistory = [newEntry, ...history.slice(0, 9)];
      setHistory(updatedHistory);
      localStorage.setItem("code-history", JSON.stringify(updatedHistory));
    } catch (error) {
      setTranslated("Something went wrong 😢");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(translated);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleExport = () => {
    const blob = new Blob([translated], { type: "text/plain;charset=utf-8" });

    const langToExt: { [key: string]: string } = {
      python: "py",
      javascript: "js",
      typescript: "ts",
      java: "java",
      "c#": "cs",
      "c++": "cpp",
      go: "go",
      ruby: "rb",
      php: "php",
      "vb.net": "vb"
    };

    const normalized = (mode === "convert" ? targetLang : sourceLang).toLowerCase();
    const ext = langToExt[normalized] || "txt";

    const filename = `${mode}-output.${ext}`;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSwap = () => {
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
  };

  const spinnerText =
    mode === "convert" ? "Converting..." :
      mode === "explain" ? "Explaining..." :
        "Fixing...";

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="bg-gray-300 dark:bg-gray-700 text-sm px-4 py-2 rounded"
          >
            {theme === "light" ? "Switch to Dark Mode 🌙" : "Switch to Light Mode ☀️"}
          </button>
        </div>

        <h1 className="text-3xl font-bold text-center text-blue-700 dark:text-blue-300 mb-4">
          Code Translator App 🚀
        </h1>

        {mode !== "fix" && (
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-center gap-3 items-center mb-4">
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="p-2 rounded border w-full sm:w-auto"
            >
              {languages.map((lang) => (
                <option key={lang}>{lang}</option>
              ))}
            </select>

            {mode === "convert" && (
              <button
                onClick={handleSwap}
                className="bg-gray-200 dark:bg-gray-700 text-lg px-3 py-1 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                title="Swap Languages"
              >
                🔁
              </button>
            )}

            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="p-2 rounded border w-full sm:w-auto"
              disabled={mode === "explain"}
            >
              {languages.map((lang) => (
                <option key={lang}>{lang}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-center mt-2 gap-4 flex-wrap">
          {["convert", "explain", "fix"].map((m) => (
            <label key={m} className="inline-flex items-center gap-2">
              <input
                type="radio"
                name="mode"
                value={m}
                checked={mode === m}
                onChange={() => setMode(m as "convert" | "explain" | "fix")}
              />
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </label>
          ))}
        </div>

        {mode === "fix" && (
          <div className="flex justify-center mt-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={verbose}
                onChange={(e) => setVerbose(e.target.checked)}
              />
              Verbose mode (include explanation)
            </label>
          </div>
        )}

        <div className="mt-4">
          <Editor
            height="300px"
            defaultLanguage="javascript"
            value={code}
            onChange={(value) => setCode(value || "")}
            theme="vs-dark"
            options={{ wordWrap: 'on', fontSize: 14 }}
            className="w-full"
          />
        </div>

        <div className="text-center mt-4">
          <button
            onClick={handleTranslate}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 w-full sm:w-auto"
          >
            {loading ? spinnerText : mode === "convert" ? "Convert" : mode === "explain" ? "Explain" : "Fix"}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-6">
            <div className="w-8 h-8 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
            <span className="ml-3 text-blue-600 font-medium">{spinnerText}</span>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-md mt-4 relative overflow-x-auto">
            <h2 className="font-semibold mb-2">
              {mode === "convert" && "Converted Code:"}
              {mode === "explain" && "Explanation:"}
              {mode === "fix" && "Fixed Code:"}
            </h2>
            <div className="absolute top-2 right-2 flex gap-2">
              <button
                onClick={handleCopy}
                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-1 text-sm rounded"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={handleExport}
                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-1 text-sm rounded"
              >
                Export
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-200 mt-6 overflow-x-auto">
              {translated}
            </pre>
          </div>
        )}

        {/* ✅ History Viewer */}
        {history.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded shadow-md mt-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold">History (Last 10)</h3>
              <button
                onClick={() => {
                  setHistory([]);
                  localStorage.removeItem("code-history");
                }}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear History
              </button>
            </div>
            <ul className="space-y-2 text-sm">
              {history.map((item: HistoryItem, idx: number) => (
                <li key={idx} className="border-b border-gray-300 pb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(item.timestamp).toLocaleString()} | {item.mode.toUpperCase()}
                    </span>
                    <button
                      onClick={() => {
                        setCode(item.code);
                        setSourceLang(item.sourceLang);
                        setTargetLang(item.targetLang);
                        setMode(item.mode);
                        setVerbose(false);
                      }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Load This Again
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 p-2 rounded overflow-x-auto">
                    {item.result.slice(0, 300)}{item.result.length > 300 ? "..." : ""}
                  </pre>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
