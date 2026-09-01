import React, { useState } from "react";
import { javaCodeFiles, JavaFile } from "../javaCodeTemplates";
import { Play, Copy, Check, FileCode, Terminal, HelpCircle, Save } from "lucide-react";

interface CodeExplorerProps {
  onCompilationSuccess: () => void;
}

export default function CodeExplorer({ onCompilationSuccess }: CodeExplorerProps) {
  const [files, setFiles] = useState<JavaFile[]>(javaCodeFiles);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  
  // Terminal Compilation States
  const [compilationLogs, setCompilationLogs] = useState<string[]>([]);
  const [isCompiling, setIsCompiling] = useState(false);
  const [hasCompiledOnce, setHasCompiledOnce] = useState(false);

  const activeFile = files[activeFileIndex];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.content);
    setCopiedIndex(activeFileIndex);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCodeChange = (newVal: string) => {
    setFiles(prev => prev.map((f, i) => i === activeFileIndex ? { ...f, content: newVal } : f));
  };

  const runCompilationSimulation = () => {
    setIsCompiling(true);
    setCompilationLogs(["$ javac Product.java PerishableProduct.java DBOperations.java DatabaseHelper.java InventorySystem.java"]);
    
    setTimeout(() => {
      setCompilationLogs(prev => [
        ...prev,
        "[INFO] Analyzing Java structures and imports...",
        "[INFO] Validating OOP Principles in compilation unit:",
        "  -> Product.java: Encapsulation [OK]",
        "  -> PerishableProduct.java: Inheritance and Polymorphism [OK]",
        "  -> DBOperations.java: Abstraction interface contracts [OK]",
        "  -> DatabaseHelper.java: Class inheritance mapping [OK]",
        "  -> InventorySystem.java: Swing thread components [OK]",
        "[SUCCESS] 5 classes successfully compiled to .class bytecode."
      ]);
      
      setTimeout(() => {
        setCompilationLogs(prev => [
          ...prev,
          "$ java InventorySystem",
          "[DATABASE] Establishing JDBC bridge to SQLite (grocery_inventory.db)",
          "[DATABASE] Query: CREATE TABLE IF NOT EXISTS users...",
          "[DATABASE] Query: CREATE TABLE IF NOT EXISTS products...",
          "[DATABASE] Seeding initial grocery stock directory...",
          "[RUNTIME] Swing Look-and-Feel initialized successfully.",
          "[RUNTIME] Launching main JFrame thread in Swing Event Queue."
        ]);
        setIsCompiling(false);
        setHasCompiledOnce(true);
        onCompilationSuccess(); // Resets products to original template values or syncs them
      }, 1000);

    }, 800);
  };

  return (
    <div className="h-full flex flex-col bg-[#161512] text-stone-200 font-sans">
      
      {/* Code Explorer Toolbar */}
      <div className="p-3.5 bg-stone-950/20 border-b border-stone-850 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <FileCode className="w-5 h-5 text-[#c5a880]" />
          <div>
            <h3 className="text-xs font-serif font-bold tracking-widest text-stone-300 uppercase">
              JAVA SOURCE CODE REPOSITORY
            </h3>
            <p className="text-[10px] text-stone-400">
              Inspect and customize the object-oriented Java classes to submit for evaluation.
            </p>
          </div>
        </div>

        <button
          onClick={runCompilationSimulation}
          disabled={isCompiling}
          className="flex items-center gap-1.5 bg-[#c5a880] hover:bg-[#b3946b] disabled:bg-stone-800 text-stone-950 p-2 px-4 rounded-xl text-xs font-serif italic font-medium cursor-pointer transition-all shadow-md"
        >
          <Play className="w-3.5 h-3.5" />
          {isCompiling ? "Compiling..." : "Compile & Run (javac)"}
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        
        {/* File Navigator Sidebar */}
        <div className="w-full md:w-56 bg-stone-950/40 border-r border-stone-850 p-2 flex flex-col gap-1 overflow-y-auto">
          <span className="text-[9px] uppercase tracking-wider font-bold text-stone-500 p-2">
            Java Packages & Files
          </span>

          {files.map((file, idx) => {
            const isActive = idx === activeFileIndex;
            return (
              <button
                key={file.name}
                onClick={() => setActiveFileIndex(idx)}
                className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all ${
                  isActive 
                    ? "bg-stone-900 text-[#c5a880] border-l-2 border-[#c5a880] font-semibold" 
                    : "hover:bg-stone-900/60 text-stone-400"
                }`}
              >
                <div className="flex items-center gap-2 font-mono truncate">
                  <span className={`text-[10px] font-bold ${
                    file.name.endsWith(".sql") ? "text-amber-500" : file.name.endsWith(".md") ? "text-stone-400" : "text-[#c5a880]"
                  }`}>
                    {file.name.endsWith(".sql") ? "SQL" : file.name.endsWith(".md") ? "MD" : "☕"}
                  </span>
                  <span className="truncate">{file.name}</span>
                </div>
              </button>
            );
          })}

          <div className="mt-auto p-3 bg-stone-950/60 rounded-xl border border-stone-850 text-[10px] text-stone-400 leading-normal">
            <span className="font-serif font-bold text-[#c5a880] block mb-1 uppercase tracking-wider">OOP Checklist Verified:</span>
            <ul className="list-disc pl-3.5 space-y-0.5 font-sans">
              <li>Product.java: <strong className="text-stone-300">Encapsulation</strong></li>
              <li>PerishableProduct.java: <strong className="text-stone-300">Inheritance</strong></li>
              <li>DBOperations.java: <strong className="text-stone-300">Abstraction</strong></li>
            </ul>
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-stone-900/10">
          
          {/* File Context Bar */}
          <div className="p-2 px-4 bg-stone-950/40 border-b border-stone-850 flex items-center justify-between text-xs font-mono">
            <span className="text-stone-400 truncate pr-4">
              File: <strong className="text-stone-200">{activeFile.name}</strong> — {activeFile.description}
            </span>
            
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 text-[10px] font-sans border border-stone-800 hover:bg-stone-900/60 text-stone-300 p-1 px-2.5 rounded-lg cursor-pointer transition-colors"
            >
              {copiedIndex === activeFileIndex ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy File Content
                </>
              )}
            </button>
          </div>

          {/* Interactive Code Textarea */}
          <div className="flex-1 overflow-auto relative font-mono text-xs p-4 flex">
            {/* Mock Line Numbers */}
            <div className="select-none text-stone-600 text-right pr-4 border-r border-stone-850/60 font-mono text-xs space-y-[2px]" style={{ minWidth: "30px" }}>
              {activeFile.content.split("\n").map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            <textarea
              value={activeFile.content}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="flex-1 pl-4 bg-transparent text-stone-300 font-mono text-xs border-none outline-none resize-none overflow-y-hidden"
              style={{ lineHeight: "18px", tabSize: 4 }}
              spellCheck={false}
            />
          </div>

        </div>

      </div>

      {/* COMPILATION TERMINAL DRAWER */}
      <div className="h-44 bg-stone-950/60 border-t border-stone-850 flex flex-col font-mono text-xs">
        <div className="p-2 px-4 bg-stone-950 flex items-center justify-between border-b border-stone-850 text-[10px] font-serif font-bold text-[#c5a880] tracking-wider uppercase">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-[#c5a880]" />
            COMPILER TERMINAL WINDOW (JDK Standard Console)
          </span>
          <span className="text-stone-500 font-sans font-light normal-case">Output Encoding: UTF-8</span>
        </div>

        <div className="flex-1 p-3 overflow-y-auto space-y-1 bg-stone-950/40 font-mono text-[11px] leading-relaxed select-text">
          {compilationLogs.length === 0 ? (
            <div className="text-stone-500 italic p-2 text-center">
              Terminal is standby. Click "Compile & Run" above to simulate Javac and run the Java Swing JVM environment.
            </div>
          ) : (
            compilationLogs.map((log, idx) => {
              const isCommand = log.startsWith("$");
              const isSuccess = log.includes("[SUCCESS]");
              const isError = log.includes("[ERROR]");
              return (
                <div 
                  key={idx} 
                  className={
                    isCommand 
                      ? "text-[#c5a880] font-bold" 
                      : isSuccess 
                        ? "text-emerald-400 font-bold" 
                        : isError 
                          ? "text-red-500 font-bold" 
                          : "text-stone-400"
                  }
                >
                  {log}
                </div>
              );
            })
          )}
          {isCompiling && (
            <div className="text-amber-500 animate-pulse font-bold">
              [COMPILING] Running javac on Java files...
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
