import React, { useState } from "react";
import { Database, Terminal, RefreshCw, Play, Info, CheckCircle, HelpCircle } from "lucide-react";
import { Product, JdbcLog, SqlUser } from "../types";

interface DatabaseVisualizerProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  jdbcLogs: JdbcLog[];
  clearLogs: () => void;
  adminUsers: SqlUser[];
  categories: string[];
}

export default function DatabaseVisualizer({
  products,
  setProducts,
  jdbcLogs,
  clearLogs,
  adminUsers,
  categories
}: DatabaseVisualizerProps) {
  const [activeTable, setActiveTable] = useState<"products" | "users">("products");
  
  // SQL Terminal State
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM products WHERE stock <= low_stock_threshold;");
  const [terminalOutput, setTerminalOutput] = useState<{
    headers: string[];
    rows: any[][];
    message: string;
    isError: boolean;
  } | null>(null);

  // SQL Terminal executor
  const runSqlQuery = () => {
    const q = sqlQuery.trim().toLowerCase();
    
    if (q.startsWith("select * from products")) {
      // Basic select parser
      let rowsToDisplay = [...products];
      let msg = `Executed SELECT query successfully. Found ${rowsToDisplay.length} rows.`;
      
      if (q.includes("stock <= low_stock_threshold")) {
        rowsToDisplay = products.filter(p => p.stock <= p.lowStockThreshold);
        msg = `Executed filtered query: SELECT * FROM products WHERE stock <= low_stock_threshold. Found ${rowsToDisplay.length} low stock alerts.`;
      } else if (q.includes("category = 'perishable'")) {
        rowsToDisplay = products.filter(p => p.category === "Perishable");
        msg = `Executed: SELECT * FROM products WHERE category = 'Perishable'. Found ${rowsToDisplay.length} rows.`;
      } else if (q.includes("category = 'grocery'")) {
        rowsToDisplay = products.filter(p => p.category === "Grocery");
        msg = `Executed: SELECT * FROM products WHERE category = 'Grocery'. Found ${rowsToDisplay.length} rows.`;
      }

      setTerminalOutput({
        headers: ["id", "name", "category", "price", "stock", "low_stock_threshold", "expiry_date"],
        rows: rowsToDisplay.map(p => [p.id, p.name, p.category, p.price, p.stock, p.lowStockThreshold, p.expiryDate || "NULL"]),
        message: msg,
        isError: false
      });
    } else if (q.startsWith("select * from users")) {
      setTerminalOutput({
        headers: ["username", "password_hash"],
        rows: adminUsers.map(u => [u.username, u.passwordHash]),
        message: "Executed SELECT query successfully. Found 1 row.",
        isError: false
      });
    } else if (q.startsWith("update products")) {
      // Match UPDATE products SET stock = X WHERE id = Y
      const matchStock = q.match(/set stock\s*=\s*(\d+)/);
      const matchId = q.match(/where id\s*=\s*(\d+)/);

      if (matchStock && matchId) {
        const newStock = parseInt(matchStock[1]);
        const targetId = parseInt(matchId[1]);

        const exists = products.some(p => p.id === targetId);
        if (exists) {
          setProducts(prev => prev.map(p => p.id === targetId ? { ...p, stock: newStock } : p));
          setTerminalOutput({
            headers: [],
            rows: [],
            message: `Rows affected: 1. Successfully executed: UPDATE products SET stock = ${newStock} WHERE id = ${targetId};`,
            isError: false
          });
        } else {
          setTerminalOutput({
            headers: [],
            rows: [],
            message: `SQL Error: Row ID ${targetId} not discovered in products catalog. Update aborted.`,
            isError: true
          });
        }
      } else {
        setTerminalOutput({
          headers: [],
          rows: [],
          message: "SQL Warning: Parser limits require updating formats to 'UPDATE products SET stock = X WHERE id = Y'. Check syntax.",
          isError: true
        });
      }
    } else {
      setTerminalOutput({
        headers: [],
        rows: [],
        message: "SQL Exception: Command unrecognized. Embedded engine supports SELECT queries and 'UPDATE products SET stock = X WHERE id = Y' syntax.",
        isError: true
      });
    }
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#161512] text-stone-200 font-sans min-h-0">
      
      {/* LEFT BLOCK: SQLite Databases tables viewer */}
      <div className="flex-1 flex flex-col p-4 border-r border-stone-850 min-h-0">
        
        {/* Module Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-[#c5a880]" />
            <div>
              <h3 className="text-xs font-serif font-bold tracking-widest text-stone-300 uppercase">
                JDBC RELATIONAL SCHEMAS (LIVE DATABASE)
              </h3>
              <p className="text-[10px] text-stone-400 leading-normal">
                Visualizes SQLite relational tables in real-time. Keeps sync with the Swing app.
              </p>
            </div>
          </div>

          {/* Database select tab buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-stone-950 rounded-xl border border-stone-850">
            <button
              onClick={() => setActiveTable("products")}
              className={`p-1 px-3.5 rounded-lg text-[10px] font-serif cursor-pointer transition-colors ${
                activeTable === "products" ? "bg-[#c5a880] text-stone-950 font-semibold italic" : "text-stone-400 hover:text-stone-200"
              }`}
            >
              products
            </button>
            <button
              onClick={() => setActiveTable("users")}
              className={`p-1 px-3.5 rounded-lg text-[10px] font-serif cursor-pointer transition-colors ${
                activeTable === "users" ? "bg-[#c5a880] text-stone-950 font-semibold italic" : "text-stone-400 hover:text-stone-200"
              }`}
            >
              users
            </button>
          </div>
        </div>

        {/* Database Table Rendering */}
        <div className="flex-1 border border-stone-850 rounded-2xl bg-stone-950/40 overflow-auto">
          {activeTable === "products" ? (
            <table className="w-full text-left text-[11px] border-collapse font-mono">
              <thead className="bg-stone-900/60 text-[10px] tracking-wider text-stone-400 border-b border-stone-850 sticky top-0 font-serif">
                <tr>
                  <th className="p-2.5 border-r border-stone-850">id</th>
                  <th className="p-2.5 border-r border-stone-850">name (VARCHAR)</th>
                  <th className="p-2.5 border-r border-stone-850">category (VARCHAR)</th>
                  <th className="p-2.5 border-r border-stone-850 text-right">price (DOUBLE)</th>
                  <th className="p-2.5 border-r border-stone-850 text-center">stock (INT)</th>
                  <th className="p-2.5 border-r border-stone-850 text-center">threshold (INT)</th>
                  <th className="p-2.5 text-center">expiry_date (VARCHAR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-900">
                {products.map(p => {
                  const isLow = p.stock <= p.lowStockThreshold;
                  return (
                    <tr key={p.id} className={`hover:bg-stone-900/40 ${isLow ? "bg-red-950/10 text-red-200" : "text-stone-300"}`}>
                      <td className="p-2.5 border-r border-stone-900 font-bold text-stone-500">{p.id}</td>
                      <td className="p-2.5 border-r border-stone-900 font-sans font-medium text-stone-200">{p.name}</td>
                      <td className="p-2.5 border-r border-stone-900 text-[#c5a880]">{p.category}</td>
                      <td className="p-2.5 border-r border-stone-900 text-right font-sans">₹ {p.price.toFixed(2)}</td>
                      <td className={`p-2.5 border-r border-stone-900 text-center font-bold`}>
                        <span className={isLow ? "status-low" : "status-normal"}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-stone-900 text-center text-stone-500">{p.lowStockThreshold}</td>
                      <td className="p-2.5 text-center text-stone-400">{p.expiryDate || "NULL"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-[11px] border-collapse font-mono">
              <thead className="bg-stone-900/60 text-[10px] tracking-wider text-stone-400 border-b border-stone-850 sticky top-0 font-serif">
                <tr>
                  <th className="p-2.5 border-r border-stone-850">username (VARCHAR)</th>
                  <th className="p-2.5">password_hash (VARCHAR - BCRYPT ENCRYPTED)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-900">
                {adminUsers.map(u => (
                  <tr key={u.username} className="hover:bg-stone-900/40">
                    <td className="p-2.5 border-r border-stone-900 font-bold text-stone-200 font-sans">{u.username}</td>
                    <td className="p-2.5 text-stone-400 font-mono text-[10px] tracking-tighter break-all">
                      {u.passwordHash}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Database Stats Panel */}
        <div className="mt-2 text-[10px] text-stone-500 font-mono flex items-center justify-between">
          <span>* Primary database file: <code>grocery_inventory.db</code></span>
          <span>Synced with JDBC connections</span>
        </div>

        {/* SQL Terminal Shell */}
        <div className="mt-4 border border-stone-850 rounded-2xl bg-stone-950/20 flex flex-col font-mono text-xs shadow-inner">
          <div className="p-2 px-3 bg-stone-950 flex items-center justify-between text-[10px] font-serif font-bold text-[#c5a880] tracking-wider uppercase border-b border-stone-850">
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#c5a880]" />
              SQL CONSOLE INTERACTIVE PLAYGROUND
            </span>
            <span className="text-[9px] text-stone-500 italic font-sans pr-1">Run queries against SQLite engine!</span>
          </div>

          <div className="p-2.5 flex items-center gap-2 border-b border-stone-850 bg-stone-900/20">
            <input 
              type="text"
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="flex-1 bg-stone-950/60 p-2 border border-stone-850 text-stone-200 font-mono text-xs focus:outline-none focus:border-[#c5a880] rounded-xl"
              placeholder="e.g. SELECT * FROM products WHERE stock < 10;"
            />
            <button
              onClick={runSqlQuery}
              className="bg-[#c5a880] hover:bg-[#b3946b] text-stone-950 font-serif font-medium p-2 px-4 rounded-xl text-[11px] flex items-center gap-1 cursor-pointer shadow transition-colors shrink-0 italic"
            >
              <Play className="w-3 h-3" />
              Run Query
            </button>
          </div>

          {/* SQL Output Box */}
          <div className="p-3 max-h-36 overflow-y-auto bg-stone-950/20 text-[10px] leading-relaxed select-text space-y-1">
            {terminalOutput === null ? (
              <div className="text-stone-500 italic p-1.5 text-center">
                Console standby. Try typing <code className="bg-stone-900 p-0.5 rounded text-[#c5a880]">SELECT * FROM products;</code> or <code className="bg-stone-900 p-0.5 rounded text-[#c5a880]">UPDATE products SET stock = 50 WHERE id = 1;</code> and click Run.
              </div>
            ) : (
              <div className="space-y-2">
                <div className={`p-1.5 rounded font-sans text-[11px] ${
                  terminalOutput.isError ? "bg-red-950/20 text-red-400 border border-red-950/30" : "bg-emerald-950/20 text-emerald-400 border border-emerald-950/30"
                }`}>
                  {terminalOutput.message}
                </div>

                {terminalOutput.headers.length > 0 && (
                  <div className="overflow-x-auto border border-stone-850 rounded-xl bg-stone-950 p-1">
                    <table className="w-full text-left font-mono">
                      <thead className="text-stone-500 border-b border-stone-900">
                        <tr>
                          {terminalOutput.headers.map(h => <th key={h} className="p-1">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-900 text-stone-300">
                        {terminalOutput.rows.map((row, rIdx) => (
                          <tr key={rIdx}>
                            {row.map((cell, cIdx) => <td key={cIdx} className="p-1 pr-3">{String(cell)}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* RIGHT BLOCK: Scrolling live JDBC execution transactions log trace */}
      <div className="w-full md:w-96 p-4 flex flex-col min-h-0 border-l border-stone-850">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <Terminal className="w-5 h-5 text-[#c5a880]" />
            <h4 className="text-xs font-serif font-bold tracking-widest text-stone-300 uppercase">
              JDBC QUERY TRACE MONITOR
            </h4>
          </div>

          <button
            onClick={clearLogs}
            className="text-[9px] bg-stone-900 hover:bg-stone-800 border border-stone-850 text-stone-400 p-1 px-3 rounded-lg cursor-pointer transition-colors"
          >
            Clear Trace Logs
          </button>
        </div>

        {/* Scrollable Logs Container */}
        <div className="flex-1 border border-stone-850 bg-stone-950/20 rounded-2xl p-3 overflow-y-auto space-y-3.5 select-text">
          {jdbcLogs.length === 0 ? (
            <div className="text-stone-600 text-center text-xs p-8 italic leading-relaxed">
              Trace is idle. Logs will populate here in real-time as you log in, query, add, or alter product levels inside the Java Swing GUI.
            </div>
          ) : (
            jdbcLogs.map((log) => {
              const isSuccess = log.status === "SUCCESS";
              return (
                <div key={log.id} className="p-3 rounded-xl bg-stone-900/60 border border-stone-850 text-[10px] space-y-2 shadow-sm">
                  
                  {/* Status header */}
                  <div className="flex items-center justify-between border-b border-stone-850 pb-2 font-mono">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold tracking-wider ${
                      log.operationType === "INSERT" ? "bg-emerald-950/40 text-emerald-400" :
                      log.operationType === "UPDATE" ? "bg-sky-950/40 text-sky-400" :
                      log.operationType === "DELETE" ? "bg-red-950/40 text-red-400" : "bg-[#c5a880]/15 text-[#c5a880]"
                    }`}>
                      JDBC {log.operationType}
                    </span>

                    <span className={`text-[9px] font-semibold flex items-center gap-1 ${
                      isSuccess ? "text-emerald-400" : "text-red-400"
                    }`}>
                      {isSuccess ? <CheckCircle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
                      {log.status}
                    </span>
                  </div>

                  {/* Executed Code Details */}
                  <div className="space-y-2 font-mono">
                    <div>
                      <span className="text-stone-500 font-bold block text-[9px] uppercase tracking-wider">Executed SQL Statement:</span>
                      <pre className="p-2 rounded bg-stone-950/60 text-stone-300 font-mono text-[10px] overflow-x-auto whitespace-pre-wrap break-all border border-stone-850">
                        {log.sqlStatement}
                      </pre>
                    </div>

                    <div>
                      <span className="text-[#c5a880] font-bold block text-[9px] uppercase tracking-wider">Java Code Thread:</span>
                      <pre className="p-2 rounded bg-stone-950/60 text-stone-400 font-mono text-[9px] overflow-x-auto border border-stone-850">
                        {log.javaCodeSnippet}
                      </pre>
                    </div>

                    {log.exceptionMessage && (
                      <div className="mt-1 p-1.5 rounded bg-red-950/20 text-red-400 text-[9px] border border-red-950/30 whitespace-pre-wrap">
                        <strong>Thrown Exception:</strong> {log.exceptionMessage}
                      </div>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
}
