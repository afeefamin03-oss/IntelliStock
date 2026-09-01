import React, { useState, useEffect } from "react";
import { 
  Sun, Moon, Search, RotateCcw, AlertTriangle, Plus, Edit2, Trash2, 
  Lock, CheckCircle2, AlertOctagon, Terminal, Play, Info, FileText, Check, ShieldAlert, KeyRound, Filter
} from "lucide-react";
import bcrypt from "bcryptjs";
import { Product, JdbcLog, SqlUser } from "../types";

// Static default groceries requested
const initialGroceries: Product[] = [
  { id: 1, name: "Rice (5 kg)", category: "Grocery", price: 450.00, stock: 20, lowStockThreshold: 5, expiryDate: "" },
  { id: 2, name: "Wheat Flour", category: "Grocery", price: 320.00, stock: 15, lowStockThreshold: 4, expiryDate: "" },
  { id: 3, name: "Cooking Oil", category: "Grocery", price: 750.00, stock: 8, lowStockThreshold: 3, expiryDate: "" },
  { id: 4, name: "Sugar", category: "Grocery", price: 120.00, stock: 25, lowStockThreshold: 6, expiryDate: "" },
  { id: 5, name: "Salt", category: "Grocery", price: 28.00, stock: 50, lowStockThreshold: 10, expiryDate: "" },
  { id: 6, name: "Tea Powder", category: "Grocery", price: 180.00, stock: 12, lowStockThreshold: 4, expiryDate: "" },
  { id: 7, name: "Coffee Powder", category: "Grocery", price: 240.00, stock: 3, lowStockThreshold: 4, expiryDate: "" },
  { id: 8, name: "Milk", category: "Perishable", price: 60.00, stock: 30, lowStockThreshold: 8, expiryDate: "2026-07-02" },
  { id: 9, name: "Eggs", category: "Perishable", price: 90.00, stock: 5, lowStockThreshold: 10, expiryDate: "2026-07-08" },
  { id: 10, name: "Biscuits", category: "Grocery", price: 40.00, stock: 45, lowStockThreshold: 8, expiryDate: "" }
];

interface SwingSimulatorProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  addJdbcLog: (log: Omit<JdbcLog, "id" | "timestamp">) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  adminUsers: SqlUser[];
  setAdminUsers: React.Dispatch<React.SetStateAction<SqlUser[]>>;
  categories: string[];
  setCategories: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function SwingSimulator({
  products,
  setProducts,
  addJdbcLog,
  isDarkMode,
  setIsDarkMode,
  adminUsers,
  setAdminUsers,
  categories,
  setCategories
}: SwingSimulatorProps) {
  // Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [loginError, setLoginError] = useState("");

  // Register New Admin / Reset Password State
  const [showRegPanel, setShowRegPanel] = useState(false);
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");

  // Search/Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);

  // Advanced Filtering console
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [enableStockFilter, setEnableStockFilter] = useState(false);
  const [stockLimitFilter, setStockLimitFilter] = useState("15");
  const [enablePriceFilter, setEnablePriceFilter] = useState(false);
  const [minPriceFilter, setMinPriceFilter] = useState("0");
  const [maxPriceFilter, setMaxPriceFilter] = useState("1000");

  // Custom category addition
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Form Field State
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("Grocery");
  const [formPrice, setFormPrice] = useState("");
  const [formStock, setFormStock] = useState("");
  const [formThreshold, setFormThreshold] = useState("");
  const [formExpiry, setFormExpiry] = useState("N/A");

  // Dialog State (Simulating JOptionPanes)
  const [showDialog, setShowDialog] = useState<"none" | "success" | "error" | "update-qty" | "confirm-delete" | "report">("none");
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [qtyInput, setQtyInput] = useState("");
  
  // Expiry date enables when perishable is selected
  useEffect(() => {
    if (formCategory === "Perishable") {
      setFormExpiry("");
    } else {
      setFormExpiry("N/A");
    }
  }, [formCategory]);

  // Check if there are products with low stock (below threshold)
  const lowStockProducts = products.filter(p => p.stock <= p.lowStockThreshold);
  const hasLowStock = lowStockProducts.length > 0;

  // Custom JDBC Logger Trigger Helper
  const logJdbc = (
    type: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "AUTH" | "DDL",
    stmt: string,
    java: string,
    status: "SUCCESS" | "FAILED",
    exc?: string
  ) => {
    addJdbcLog({
      operationType: type,
      sqlStatement: stmt,
      javaCodeSnippet: java,
      status: status,
      exceptionMessage: exc
    });
  };

  // Admin password update or registration helper
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (!regUsername.trim() || !regPassword.trim()) {
      setRegError("Username and password cannot be empty.");
      return;
    }

    const exists = adminUsers.some(u => u.username.toLowerCase() === regUsername.trim().toLowerCase());
    
    // BCrypt hashing
    const hashedPassword = bcrypt.hashSync(regPassword, 10);
    
    const javaSnippet = `// Register/Update User with BCrypt Encryption
String sql = "INSERT INTO users (username, password_hash) VALUES (?, ?) " +
             "ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash;";
PreparedStatement pstmt = conn.prepareStatement(sql);
pstmt.setString(1, "${regUsername.trim()}");
pstmt.setString(2, "${hashedPassword}"); // BCrypt hash generated safely
int rowsAffected = pstmt.executeUpdate();`;

    if (exists) {
      // Update existing password
      setAdminUsers(prev => prev.map(u => u.username.toLowerCase() === regUsername.trim().toLowerCase() ? { ...u, passwordHash: hashedPassword } : u));
      logJdbc("UPDATE", `UPDATE users SET password_hash = '${hashedPassword}' WHERE username = '${regUsername.trim()}';`, javaSnippet, "SUCCESS");
      setRegSuccess(`Successfully updated password for administrator '${regUsername.trim()}' using BCrypt encryption!`);
      triggerSuccessModal("User Hashing Hub", `Success! Updated password for existing admin '${regUsername.trim()}' with real-time BCrypt hash: ${hashedPassword}`);
    } else {
      // Create new user
      const newUser = { username: regUsername.trim(), passwordHash: hashedPassword };
      setAdminUsers(prev => [...prev, newUser]);
      logJdbc("INSERT", `INSERT INTO users (username, password_hash) VALUES ('${regUsername.trim()}', '${hashedPassword}');`, javaSnippet, "SUCCESS");
      setRegSuccess(`Admin user '${regUsername.trim()}' created with BCrypt password encryption!`);
      triggerSuccessModal("User Hashing Hub", `Success! Registered new admin '${regUsername.trim()}' with real-time BCrypt hash: ${hashedPassword}`);
    }

    setRegUsername("");
    setRegPassword("");
  };

  // 1. Admin Auth Verification with Password Encryption (BCrypt)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const targetUser = adminUsers.find(u => u.username.toLowerCase() === username.toLowerCase().trim());
    const isPassValid = targetUser ? bcrypt.compareSync(password, targetUser.passwordHash) : false;

    const javaSnippet = `// JDBC Authentication Prepared Statement & BCrypt Verification
String sql = "SELECT password_hash FROM users WHERE username = ?";
PreparedStatement pstmt = conn.prepareStatement(sql);
pstmt.setString(1, "${username}");
ResultSet rs = pstmt.executeQuery();
if (rs.next()) {
    String storedHash = rs.getString("password_hash");
    // Verify password using jbcrypt library
    boolean authenticated = BCrypt.checkpw("${password.replace(/"/g, '\\"')}", storedHash);
}`;

    if (targetUser && isPassValid) {
      setIsLoggedIn(true);
      logJdbc(
        "AUTH",
        `SELECT password_hash FROM users WHERE username = '${username}';`,
        javaSnippet,
        "SUCCESS"
      );
      triggerSuccessModal("Admin Login Gate", `Access Granted! Successfully authenticated user '${username}' with BCrypt secure hash verification.`);
    } else {
      const excMessage = "SQLException: Access denied. Hashed password verification failed or username not found.";
      logJdbc(
        "AUTH",
        `SELECT password_hash FROM users WHERE username = '${username}';`,
        javaSnippet,
        "FAILED",
        excMessage
      );
      setLoginError("Invalid Admin Credentials. Tip: Check the registered users in 'Relational SQL tables' tab.");
      triggerErrorModal("Authentication Fail", "Access Denied: Hashed password does not align with the BCrypt credentials stored in users table.");
    }
  };

  // Helper modals
  const triggerSuccessModal = (title: string, msg: string) => {
    setDialogTitle(title);
    setDialogMessage(msg);
    setShowDialog("success");
  };

  const triggerErrorModal = (title: string, msg: string) => {
    setDialogTitle(title);
    setDialogMessage(msg);
    setShowDialog("error");
  };

  // Helper for adding dynamic categories
  const handleAddNewCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) {
      triggerErrorModal("Category Error", "Category name cannot be empty.");
      return;
    }
    
    // Check if category already exists
    const exists = categories.some(cat => cat.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      triggerErrorModal("Category Error", `Category '${trimmed}' already exists.`);
      return;
    }

    // Add category
    setCategories(prev => [...prev, trimmed]);
    setFormCategory(trimmed);
    setShowAddCategoryInput(false);
    setNewCategoryName("");

    const sql = `ALTER TABLE products ADD CONSTRAINT chk_category CHECK (category IN (${[...categories, trimmed].map(c => `'${c}'`).join(", ")}));`;
    const java = `// Registering dynamic category metadata
// SQLite doesn't natively enforce ADD CONSTRAINT, so we append the type to our memory cache
// and validate in custom code:
List<String> allowedCategories = getCategoriesFromDb();
if (!allowedCategories.contains("${trimmed}")) {
    allowedCategories.add("${trimmed}");
    saveCategoryToMetadataTable("${trimmed}");
}`;
    
    logJdbc("DDL", sql, java, "SUCCESS");
    triggerSuccessModal("Category Registered", `Success: '${trimmed}' registered as an available product category.`);
  };

  // 2. Add product (JDBC Insert with Input validation/exception management)
  const handleAddProduct = () => {
    try {
      // Input Validation - Exception Simulation
      if (!formName.trim()) {
        throw new Error("IllegalArgumentException: Product Name cannot be blank.");
      }
      if (!formPrice.trim() || isNaN(Number(formPrice))) {
        throw new NumberFormatException("NumberFormatException: Price must be a valid decimal number.");
      }
      if (Number(formPrice) < 0) {
        throw new Error("IllegalArgumentException: Price cannot be negative.");
      }
      if (!formStock.trim() || isNaN(Number(formStock)) || !Number.isInteger(Number(formStock))) {
        throw new NumberFormatException("NumberFormatException: Stock quantity must be a valid integer.");
      }
      if (Number(formStock) < 0) {
        throw new Error("IllegalArgumentException: Stock quantity cannot be negative.");
      }
      if (!formThreshold.trim() || isNaN(Number(formThreshold)) || !Number.isInteger(Number(formThreshold))) {
        throw new NumberFormatException("NumberFormatException: Low Warning Threshold must be a valid integer.");
      }
      if (Number(formThreshold) < 0) {
        throw new Error("IllegalArgumentException: Threshold value cannot be negative.");
      }
      if (formCategory === "Perishable" && (!formExpiry.trim() || formExpiry === "N/A")) {
        throw new Error("IllegalArgumentException: Perishable items must contain an expiration date (YYYY-MM-DD).");
      }

      // Successful Input Validation
      const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
      const newProd: Product = {
        id: newId,
        name: formName.trim(),
        category: formCategory,
        price: Number(formPrice),
        stock: Number(formStock),
        lowStockThreshold: Number(formThreshold),
        expiryDate: formCategory === "Perishable" ? formExpiry.trim() : ""
      };

      setProducts(prev => [...prev, newProd]);

      // JDBC Logger
      const sql = `INSERT INTO products (name, category, price, stock, low_stock_threshold, expiry_date) VALUES ('${newProd.name}', '${newProd.category}', ${newProd.price}, ${newProd.stock}, ${newProd.lowStockThreshold}, ${newProd.expiryDate ? `'${newProd.expiryDate}'` : 'NULL'});`;
      const java = `// JDBC Product Insert with PreparedStatement
String sql = "INSERT INTO products (name, category, price, stock, low_stock_threshold, expiry_date) VALUES (?, ?, ?, ?, ?, ?)";
PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
pstmt.setString(1, "${newProd.name}");
pstmt.setString(2, "${newProd.category}");
pstmt.setDouble(3, ${newProd.price});
pstmt.setInt(4, ${newProd.stock});
pstmt.setInt(5, ${newProd.lowStockThreshold});
${newProd.category === "Perishable" ? `pstmt.setString(6, "${newProd.expiryDate}");` : 'pstmt.setNull(6, java.sql.Types.VARCHAR);'}
pstmt.executeUpdate();`;

      logJdbc("INSERT", sql, java, "SUCCESS");
      triggerSuccessModal("Product Logged", `Success: '${newProd.name}' successfully added to database via JDBC statement.`);
      
      // Clear Form
      setFormName("");
      setFormPrice("");
      setFormStock("");
      setFormThreshold("");
      setFormExpiry(formCategory === "Perishable" ? "" : "N/A");
    } catch (err: any) {
      // Simulate Swing JOptionPane showing exception
      const excName = err.name || "IllegalArgumentException";
      const errMsg = err.message;
      
      const javaSnippet = `// Exception Handling triggered on input form
try {
    String name = nameField.getText();
    double price = Double.parseDouble(priceField.getText()); // throws NumberFormatException
    int stock = Integer.parseInt(stockField.getText());       // throws NumberFormatException
    if (price < 0 || stock < 0) throw new IllegalArgumentException("Negative values forbidden");
} catch (NumberFormatException ex) {
    JOptionPane.showMessageDialog(this, "Number Format Error!", "Error", JOptionPane.ERROR_MESSAGE);
} catch (IllegalArgumentException ex) {
    JOptionPane.showMessageDialog(this, ex.getMessage(), "Error", JOptionPane.ERROR_MESSAGE);
}`;

      logJdbc("INSERT", "-- TRANSACTION BLOCKED BY INPUT EXCEPTION --", javaSnippet, "FAILED", `${excName}: ${errMsg}`);
      triggerErrorModal("Input Exception Raised", `${excName}: ${errMsg}\nSwing event thread caught this input discrepancy safely.`);
    }
  };

  // 3. Update stock (JDBC Update)
  const handleUpdateStockClick = () => {
    if (selectedProductId === null) {
      triggerErrorModal("Selection Required", "Please click on a product row in the directory list first.");
      return;
    }
    const selectedProd = products.find(p => p.id === selectedProductId);
    if (selectedProd) {
      setQtyInput(String(selectedProd.stock));
      setShowDialog("update-qty");
    }
  };

  const submitStockUpdate = () => {
    try {
      if (!qtyInput.trim() || isNaN(Number(qtyInput)) || !Number.isInteger(Number(qtyInput))) {
        throw new NumberFormatException("NumberFormatException: New stock value must be a valid integer.");
      }
      if (Number(qtyInput) < 0) {
        throw new Error("IllegalArgumentException: Stock quantity cannot be negative.");
      }

      const updatedQty = Number(qtyInput);
      setProducts(prev => prev.map(p => p.id === selectedProductId ? { ...p, stock: updatedQty } : p));
      setShowDialog("none");

      const selectedProd = products.find(p => p.id === selectedProductId);
      const sql = `UPDATE products SET stock = ${updatedQty} WHERE id = ${selectedProductId};`;
      const java = `// JDBC Update Stock Level
String sql = "UPDATE products SET stock = ? WHERE id = ?";
PreparedStatement pstmt = conn.prepareStatement(sql);
pstmt.setInt(1, ${updatedQty});
pstmt.setInt(2, ${selectedProductId});
pstmt.executeUpdate();`;

      logJdbc("UPDATE", sql, java, "SUCCESS");
      triggerSuccessModal("Stock Level Updated", `Success: Changed stock level of '${selectedProd?.name}' to ${updatedQty} units.`);
    } catch (err: any) {
      const excName = err.name || "IllegalArgumentException";
      const errMsg = err.message;
      logJdbc("UPDATE", "-- UPDATE EXCEPTION TRIGGERED --", "// Exception Handling on JDialog Prompt", "FAILED", `${excName}: ${errMsg}`);
      triggerErrorModal("Number Format Exception", `${excName}: ${errMsg}`);
    }
  };

  // 4. Delete product (JDBC Delete)
  const handleDeleteClick = () => {
    if (selectedProductId === null) {
      triggerErrorModal("Selection Required", "Please click on a product row in the directory list to delete.");
      return;
    }
    setShowDialog("confirm-delete");
  };

  const confirmDeleteProduct = () => {
    const selectedProd = products.find(p => p.id === selectedProductId);
    if (selectedProd) {
      setProducts(prev => prev.filter(p => p.id !== selectedProductId));
      setSelectedProductId(null);
      setShowDialog("none");

      const sql = `DELETE FROM products WHERE id = ${selectedProductId};`;
      const java = `// JDBC Delete Row Entry
String sql = "DELETE FROM products WHERE id = ?";
PreparedStatement pstmt = conn.prepareStatement(sql);
pstmt.setInt(1, ${selectedProductId});
pstmt.executeUpdate();`;

      logJdbc("DELETE", sql, java, "SUCCESS");
      triggerSuccessModal("Product Cleared", `Success: Successfully cleared '${selectedProd.name}' from JDBC products catalog.`);
    }
  };

  // Filter products by search terms, dropdown category selection, stock limit and price ranges
  const filteredProducts = products.filter(p => {
    const matchesKeyword = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "All Categories" || p.category.toLowerCase() === categoryFilter.toLowerCase();
    
    let matchesStock = true;
    if (enableStockFilter) {
      const limit = Number(stockLimitFilter);
      if (!isNaN(limit)) {
        matchesStock = p.stock <= limit;
      }
    }

    let matchesPrice = true;
    if (enablePriceFilter) {
      const minP = Number(minPriceFilter) || 0;
      const maxP = Number(maxPriceFilter) || Infinity;
      matchesPrice = p.price >= minP && p.price <= maxP;
    }

    return matchesKeyword && matchesCategory && matchesStock && matchesPrice;
  });

  // Log filter select trigger with parametric PreparedStatement trace
  const handleFilterClick = () => {
    let sql = "SELECT * FROM products WHERE 1=1";
    let javaParams: string[] = [];
    let count = 1;

    if (searchTerm) {
      sql += ` AND name LIKE '%${searchTerm}%'`;
      javaParams.push(`pstmt.setString(${count++}, "%${searchTerm}%");`);
    }
    if (categoryFilter !== "All Categories") {
      sql += ` AND category = '${categoryFilter}'`;
      javaParams.push(`pstmt.setString(${count++}, "${categoryFilter}");`);
    }
    if (enableStockFilter) {
      const limit = Number(stockLimitFilter) || 0;
      sql += ` AND stock <= ${limit}`;
      javaParams.push(`pstmt.setInt(${count++}, ${limit});`);
    }
    if (enablePriceFilter) {
      const minP = Number(minPriceFilter) || 0;
      const maxP = Number(maxPriceFilter) || 1000;
      sql += ` AND price BETWEEN ${minP} AND ${maxP}`;
      javaParams.push(`pstmt.setDouble(${count++}, ${minP});\npstmt.setDouble(${count++}, ${maxP});`);
    }
    sql += ";";

    const java = `// JDBC Advanced Structured Search with PreparedStatements
String sql = "SELECT * FROM products WHERE 1=1"
${searchTerm ? ' + " AND name LIKE ?"' : ''}
${categoryFilter !== "All Categories" ? ' + " AND category = ?"' : ''}
${enableStockFilter ? ' + " AND stock <= ?"' : ''}
${enablePriceFilter ? ' + " AND price BETWEEN ? AND ?"' : ''};
PreparedStatement pstmt = conn.prepareStatement(sql);
${javaParams.join("\n")}
ResultSet rs = pstmt.executeQuery();`;

    logJdbc("SELECT", sql, java, "SUCCESS");
  };

  const handleResetFilter = () => {
    setSearchTerm("");
    setCategoryFilter("All Categories");
    setEnableStockFilter(false);
    setStockLimitFilter("15");
    setEnablePriceFilter(false);
    setMinPriceFilter("0");
    setMaxPriceFilter("1000");
    logJdbc(
      "SELECT",
      `SELECT * FROM products;`,
      `// JDBC Retrieve All Stock\nString sql = "SELECT * FROM products";\nStatement stmt = conn.createStatement();\nResultSet rs = stmt.executeQuery(sql);`,
      "SUCCESS"
    );
  };

  // Custom exception constructors for simulation accuracy
  class NumberFormatException extends Error {
    constructor(message: string) {
      super(message);
      this.name = "NumberFormatException";
    }
  }

  return (
    <div className={`font-sans h-full flex flex-col ${isDarkMode ? "bg-[#12110f] text-stone-200" : "bg-[#faf9f6] text-stone-800"}`}>
      
      {/* Simulation Header */}
      <div className={`p-3.5 border-b flex items-center justify-between transition-all ${isDarkMode ? "bg-stone-900/40 border-stone-800/40" : "bg-stone-100/40 border-stone-200/40"}`}>
        <div className="flex items-center gap-3">
          <div className={`p-1 px-3 rounded-full font-serif text-xs tracking-wider border font-medium ${isDarkMode ? "bg-stone-950 border-[#c5a880]/30 text-[#c5a880]" : "bg-white border-stone-300 text-[#b3946b]"}`}>
            JAR
          </div>
          <div>
            <h3 className="font-serif font-light text-sm flex items-center gap-2 tracking-wide uppercase">
              Swing Look-and-Feel IntelliStock Workspace
            </h3>
            <p className="text-[10px] text-stone-400 font-mono tracking-wider">JDK 17 | SQLite Driver v3.45.0</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono px-2.5 py-1 rounded-full border ${isDarkMode ? "bg-stone-950/60 text-[#c5a880] border-[#c5a880]/20" : "bg-stone-50 text-[#b3946b] border-stone-200"}`}>
            Look-and-Feel Style: {isDarkMode ? "Lux Metal Dark" : "Lux Nimbus Light"}
          </span>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-1.5 rounded-full transition-all border ${isDarkMode ? "bg-stone-900/60 border-stone-800 hover:border-[#c5a880]/30 text-[#c5a880]" : "bg-white border-stone-200 hover:border-[#c5a880]/30 text-[#b3946b]"}`}
            title="Toggle Swing Look-and-Feel Style"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-[#c5a880]" /> : <Moon className="w-3.5 h-3.5 text-[#b3946b]" />}
          </button>
        </div>
      </div>

      {/* SWING WINDOW CONTAINER */}
      <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center relative">
        
        {/* SWING WINDOW SHELL */}
        <div 
          className={`w-full max-w-4xl rounded-3xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
            isDarkMode 
              ? "glass-panel-dark border-stone-850 shadow-black/50 text-stone-200" 
              : "glass-panel-light border-stone-250/70 shadow-[0_15px_45px_rgba(197,168,128,0.15)] text-stone-800"
          }`}
          style={{ minHeight: "480px" }}
        >
          {/* Swing Window Title Bar */}
          <div className={`p-3 px-4 flex items-center justify-between border-b ${
            isDarkMode 
              ? "bg-stone-900/60 border-stone-850 text-stone-300" 
              : "bg-stone-100/60 border-stone-200 text-stone-700"
          }`}>
            <div className="flex items-center gap-2.5">
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-serif border ${
                isDarkMode ? "bg-stone-950 border-[#c5a880]/30 text-[#c5a880]" : "bg-white border-[#c5a880]/30 text-[#b3946b]"
              }`}>
                I
              </span>
              <span className={`text-[11px] tracking-wide font-serif ${isDarkMode ? "text-stone-300 font-medium" : "text-stone-600 font-semibold"}`}>
                IntelliStock Registry - High-Precision Provisioning Console (INR ₹)
              </span>
            </div>
            
            {/* Elegant Minimal Window Controls */}
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-stone-500/30 hover:bg-stone-400/50 cursor-pointer transition-colors" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#c5a880]/30 hover:bg-[#c5a880]/60 cursor-pointer transition-colors" />
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/40 hover:bg-red-500/80 cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Swing Menu Bar */}
          <div className={`p-1.5 px-4 border-b text-xs flex items-center justify-between select-none ${
            isDarkMode ? "bg-stone-950/20 border-stone-850 text-stone-400 font-serif" : "bg-stone-50/20 border-stone-200 text-stone-500 font-serif"
          }`}>
            <div className="flex items-center gap-4">
              <div className="cursor-pointer hover:text-[#c5a880] hover:bg-stone-800/10 dark:hover:bg-stone-800/20 px-2 py-0.5 rounded-lg transition-all">System</div>
              <div className="cursor-pointer hover:text-[#c5a880] hover:bg-stone-800/10 dark:hover:bg-stone-800/20 px-2 py-0.5 rounded-lg transition-all">Stock Database</div>
              <div 
                className="cursor-pointer hover:text-[#c5a880] hover:bg-stone-800/10 dark:hover:bg-stone-800/20 px-2 py-0.5 rounded-lg transition-all flex items-center gap-1"
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                Look & Feel Toggle (🌓)
              </div>
              <div className="cursor-pointer hover:text-[#c5a880] hover:bg-stone-800/10 dark:hover:bg-stone-800/20 px-2 py-0.5 rounded-lg transition-all">Help</div>
            </div>
            
            {/* Direct theme toggle icon inside menu-bar */}
            <div className="flex items-center gap-2 text-stone-500 font-sans">
              <span className="text-[10px] italic">LaF Style:</span>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)} 
                className={`p-1 rounded-lg cursor-pointer border transition-all ${
                  isDarkMode 
                    ? "bg-stone-900 border-stone-800 text-[#c5a880] hover:border-[#c5a880]/40" 
                    : "bg-white border-stone-200 text-[#b3946b] hover:border-[#c5a880]/40"
                }`}
              >
                {isDarkMode ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
              </button>
            </div>
          </div>


          {/* APPLICATION INTERIOR */}
          <div className="flex-1 flex flex-col relative" style={{ minHeight: "350px" }}>
            
            {!isLoggedIn ? (
              /* SECURE ADMIN LOGIN PANEL (MAPPED WITH PASSWORD ENCRYPTION RULES) */
              <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 ${isDarkMode ? "bg-gradient-to-tr from-[#12110f] to-[#1c1916]" : "bg-gradient-to-tr from-[#faf8f5] to-[#eae5da]"}`}>
                <div className={`w-full max-w-sm p-6 rounded-3xl border shadow-xl transition-all ${
                  isDarkMode ? "glass-card-dark border-stone-850 text-stone-300" : "glass-card-light border-[#c5a880]/30 text-stone-850"
                }`}>
                  {/* Gate Mode Tabs */}
                  <div className={`flex border-b mb-5 text-[11px] font-sans tracking-wide uppercase ${isDarkMode ? "border-stone-800" : "border-stone-200"}`}>
                    <button 
                      onClick={() => setShowRegPanel(false)}
                      className={`flex-1 pb-2.5 border-b-2 font-serif italic cursor-pointer transition-colors ${
                        !showRegPanel 
                          ? "border-[#c5a880] text-[#c5a880] font-bold" 
                          : "border-transparent text-stone-500 hover:text-stone-300"
                      }`}
                    >
                      🔒 Admin Sign In
                    </button>
                    <button 
                      onClick={() => setShowRegPanel(true)}
                      className={`flex-1 pb-2.5 border-b-2 font-serif italic cursor-pointer transition-colors ${
                        showRegPanel 
                          ? "border-[#c5a880] text-[#c5a880] font-bold" 
                          : "border-transparent text-stone-500 hover:text-stone-300"
                      }`}
                    >
                      🛡️ BCrypt Manager
                    </button>
                  </div>

                  {!showRegPanel ? (
                    <>
                      <div className="flex flex-col items-center gap-1 mb-4 text-center">
                        <h4 className="font-serif text-xs font-semibold tracking-widest uppercase text-[#c5a880]">SWING AUTHENTICATOR GATE</h4>
                        <p className={`text-[10px] leading-relaxed max-w-[240px] ${isDarkMode ? "text-stone-500" : "text-stone-500"}`}>
                          Verifying password encrypted via secure BCrypt salted hashes.
                        </p>
                      </div>

                      {loginError && (
                        <div className="p-2 mb-3.5 rounded bg-red-100 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-[11px] flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{loginError}</span>
                        </div>
                      )}

                      <form onSubmit={handleLogin} className="space-y-4 text-xs">
                        <div>
                          <label className={`block mb-1 font-serif italic ${isDarkMode ? "text-stone-400" : "text-stone-600"}`}>Admin Username:</label>
                          <input 
                            type="text" 
                            value={username} 
                            onChange={(e) => setUsername(e.target.value)}
                            className={`w-full p-2 border rounded-xl font-sans focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880]/30 transition-all ${
                              isDarkMode ? "bg-stone-900/60 border-stone-800 text-stone-200" : "bg-white border-stone-250 text-stone-800"
                            }`}
                            placeholder="username"
                          />
                        </div>

                        <div>
                          <label className={`block mb-1 font-serif italic ${isDarkMode ? "text-stone-400" : "text-stone-600"}`}>Password:</label>
                          <input 
                            type="password" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)}
                            className={`w-full p-2 border rounded-xl font-sans focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880]/30 transition-all ${
                              isDarkMode ? "bg-stone-900/60 border-stone-800 text-stone-200" : "bg-white border-stone-250 text-stone-800"
                            }`}
                            placeholder="password"
                          />
                        </div>

                        <div className="pt-1.5">
                          <button 
                            type="submit" 
                            className="w-full bg-[#c5a880] hover:bg-[#b3946b] text-stone-950 font-serif italic font-medium p-2.5 rounded-xl transition-all shadow-md cursor-pointer text-center text-xs"
                          >
                            Sign In & Match BCrypt
                          </button>
                        </div>
                      </form>

                      <div className={`mt-4 p-3 rounded-xl border text-[10px] flex items-start gap-2 leading-relaxed ${
                        isDarkMode ? "bg-stone-900/40 border-stone-850 text-stone-400" : "bg-stone-50 border-stone-200 text-stone-600"
                      }`}>
                        <Info className="w-4 h-4 text-[#c5a880] shrink-0 mt-0.5" />
                        <div>
                          <strong>Default Database User:</strong> Login with name <code className="bg-stone-900/80 px-1 py-0.5 rounded text-[#c5a880] font-mono">admin</code> and password <code className="bg-stone-900/80 px-1 py-0.5 rounded text-[#c5a880] font-mono">admin123</code> (verified against stored salt hash).
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-col items-center gap-1 mb-4 text-center">
                        <h4 className="font-serif text-xs font-semibold tracking-widest uppercase text-[#c5a880]">BCRYPT CRYPTO-PROVISIONER</h4>
                        <p className={`text-[10px] leading-relaxed max-w-[240px] ${isDarkMode ? "text-stone-500" : "text-stone-500"}`}>
                          Register new admin accounts or alter current passwords using genuine BCrypt algorithms.
                        </p>
                      </div>

                      {regError && (
                        <div className="p-2 mb-3 rounded bg-red-100 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-[11px] flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>{regError}</span>
                        </div>
                      )}

                      {regSuccess && (
                        <div className="p-2 mb-3 rounded bg-emerald-100 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                          <span>{regSuccess}</span>
                        </div>
                      )}

                      <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
                        <div>
                          <label className={`block mb-1 font-serif italic ${isDarkMode ? "text-stone-400" : "text-stone-600"}`}>Username to Save/Update:</label>
                          <input 
                            type="text" 
                            value={regUsername} 
                            onChange={(e) => setRegUsername(e.target.value)}
                            className={`w-full p-2 border rounded-xl font-sans focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880]/30 transition-all ${
                              isDarkMode ? "bg-stone-900/60 border-stone-800 text-stone-200" : "bg-white border-stone-250 text-stone-800"
                            }`}
                            placeholder="e.g., admin"
                          />
                        </div>

                        <div>
                          <label className={`block mb-1 font-serif italic ${isDarkMode ? "text-stone-400" : "text-stone-600"}`}>Password:</label>
                          <input 
                            type="password" 
                            value={regPassword} 
                            onChange={(e) => setRegPassword(e.target.value)}
                            className={`w-full p-2 border rounded-xl font-sans focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880]/30 transition-all ${
                              isDarkMode ? "bg-stone-900/60 border-stone-800 text-stone-200" : "bg-white border-stone-250 text-stone-800"
                            }`}
                            placeholder="e.g., admin123"
                          />
                        </div>

                        <div className="pt-2">
                          <button 
                            type="submit" 
                            className="w-full bg-[#c5a880] hover:bg-[#b3946b] text-stone-950 font-serif italic font-medium p-2.5 rounded-xl transition-all shadow-md cursor-pointer text-center text-xs"
                          >
                            Encrypt & Save to Users DB Table
                          </button>
                        </div>
                      </form>

                      <div className={`mt-3.5 p-3 rounded-xl border text-[9px] flex items-start gap-2 leading-relaxed ${
                        isDarkMode ? "bg-stone-900/40 border-stone-850 text-stone-400" : "bg-stone-50 border-stone-200 text-stone-600"
                      }`}>
                        <KeyRound className="w-3.5 h-3.5 text-[#c5a880] shrink-0 mt-0.5" />
                        <div>
                          <strong>JDBC BCrypt Salt Flow:</strong> Generates a random cryptographic salt, hashes the input password with 10 rounds, and commits the result to the <code>users</code> relation. Updates existing records automatically on matching username.
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* MAIN INVENTORY SCREEN (AFTER LOGIN SUCCESS) */
              <div className="flex-1 flex flex-col p-4 gap-4 animate-fadeIn">
                
                {/* 1. Low stock alert banner (Criterion: "show low stock alert") */}
                {hasLowStock && (
                  <div className={`p-3.5 px-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-pulse ${
                    isDarkMode 
                      ? "bg-red-950/15 border-red-900/30 text-red-300" 
                      : "bg-red-50/70 backdrop-blur-md border-red-200/80 text-red-800"
                  }`}>
                    <div className="flex items-center gap-2.5">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                      <div className="font-sans">
                        <strong className="font-serif italic font-semibold">🚨 Low Stock Alert Active!</strong>{" "}
                        The following items require immediate replenishment:{" "}
                        <span className="font-semibold underline tracking-wide">
                          {lowStockProducts.map(p => p.name).join(", ")}
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-widest bg-red-150 dark:bg-red-950/45 px-2.5 py-1 rounded-full text-red-500 border border-red-500/20">
                      [Alert Flag: TRUE]
                    </span>
                  </div>
                )}

                {/* Dashboard grid layout */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-0">
                  
                  {/* Left Column: Table Directory (7 cols) */}
                  <div className={`lg:col-span-7 flex flex-col rounded-3xl p-5 min-h-0 transition-all ${
                    isDarkMode ? "glass-card-dark border-stone-850/60" : "glass-card-light border-white/60"
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4">
                      <span className="text-xs font-serif italic tracking-widest text-[#c5a880] uppercase flex items-center gap-2">
                        📦 Product Stock Directory
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowDialog("report")}
                          className="px-3 py-1.5 text-[10px] bg-[#c5a880]/15 hover:bg-[#c5a880]/25 text-[#c5a880] border border-[#c5a880]/30 rounded-xl font-serif italic cursor-pointer transition-all flex items-center gap-1.5 shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          📊 Generate Report
                        </button>
                        <span className="text-[9px] font-mono tracking-wider text-stone-500">SELECT * FROM products</span>
                      </div>
                    </div>

                    {/* Filter controls row */}
                    <div className={`flex flex-col gap-3 mb-4 p-3 rounded-2xl border transition-all ${
                      isDarkMode ? "bg-stone-950/30 border-stone-900/50" : "bg-[#c5a880]/5 border-stone-200/55"
                    }`}>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[140px]">
                          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                          <input 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search catalog..."
                            className={`w-full pl-9 pr-3 p-1.5 text-xs border rounded-xl font-sans focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880]/30 transition-all ${
                              isDarkMode ? "bg-stone-950/40 border-stone-850 text-stone-200" : "bg-white/60 border-stone-250 text-stone-800"
                            }`}
                          />
                        </div>
                        
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className={`p-1.5 px-3 text-xs border rounded-xl font-sans focus:outline-none focus:border-[#c5a880] transition-all cursor-pointer ${
                            isDarkMode ? "bg-stone-950/40 border-stone-850 text-stone-200" : "bg-white/60 border-stone-250 text-stone-800"
                          }`}
                        >
                          <option value="All Categories">All Categories</option>
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>

                        <button
                          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                          className={`p-1.5 px-3 text-xs border rounded-xl cursor-pointer transition-all flex items-center gap-1.5 font-sans ${
                            showAdvancedFilters
                              ? "bg-[#c5a880] text-stone-950 border-[#c5a880]"
                              : isDarkMode 
                                ? "bg-stone-900/60 border-stone-800 text-stone-300 hover:bg-stone-850" 
                                : "bg-white border-stone-250 hover:bg-stone-50 text-stone-750"
                          }`}
                        >
                          <Filter className="w-3.5 h-3.5" />
                          <span>Filters</span>
                        </button>

                        <button
                          onClick={handleFilterClick}
                          className="p-1.5 px-4 text-xs bg-[#c5a880] hover:bg-[#b3946b] text-stone-950 rounded-xl font-serif italic font-medium cursor-pointer transition-all shadow-sm"
                        >
                          Query
                        </button>

                        <button
                          onClick={handleResetFilter}
                          title="Reset Search"
                          className={`p-1.5 border rounded-xl cursor-pointer transition-all ${
                            isDarkMode ? "bg-stone-900/60 border-stone-850 text-stone-300 hover:bg-stone-850" : "bg-white border-stone-250 hover:bg-stone-50 text-stone-700"
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* COLLAPSIBLE ADVANCED SEARCH JPANEL PANEL */}
                      {showAdvancedFilters && (
                        <div className={`p-3 rounded-xl border font-mono text-[11px] space-y-2.5 transition-all ${
                          isDarkMode ? "bg-stone-950/60 border-stone-900/60 text-stone-300" : "bg-white/60 border-stone-200 text-stone-700"
                        }`}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Stock warning limit input */}
                            <div className="flex items-center gap-2 border-stone-800/40 pr-2">
                              <input 
                                type="checkbox" 
                                id="stockFilterCheckbox"
                                checked={enableStockFilter}
                                onChange={(e) => setEnableStockFilter(e.target.checked)}
                                className="rounded accent-[#c5a880] cursor-pointer"
                              />
                              <label htmlFor="stockFilterCheckbox" className="cursor-pointer select-none">Stock Limit:</label>
                              <input 
                                type="number" 
                                disabled={!enableStockFilter}
                                value={stockLimitFilter}
                                onChange={(e) => setStockLimitFilter(e.target.value)}
                                className={`w-14 p-1 px-1.5 border rounded-lg text-center text-xs font-sans focus:outline-none focus:border-[#c5a880] ${
                                  !enableStockFilter 
                                    ? "bg-stone-500/10 text-stone-500 border-stone-800/30" 
                                    : isDarkMode 
                                      ? "bg-stone-950 border-stone-800 text-stone-200" 
                                      : "bg-white border-stone-250 text-stone-800"
                                }`}
                              />
                              <span className="text-[9px] text-stone-500"> (stock &lt;= limit)</span>
                            </div>

                            {/* Price range inputs */}
                            <div className="flex items-center gap-1.5 pl-1">
                              <input 
                                type="checkbox" 
                                id="priceFilterCheckbox"
                                checked={enablePriceFilter}
                                onChange={(e) => setEnablePriceFilter(e.target.checked)}
                                className="rounded accent-[#c5a880] cursor-pointer"
                              />
                              <label htmlFor="priceFilterCheckbox" className="cursor-pointer select-none whitespace-nowrap">Price Range:</label>
                              <input 
                                type="number" 
                                placeholder="Min"
                                disabled={!enablePriceFilter}
                                value={minPriceFilter}
                                onChange={(e) => setMinPriceFilter(e.target.value)}
                                className={`w-16 p-1 px-1.5 border rounded-lg text-center text-xs font-sans focus:outline-none focus:border-[#c5a880] ${
                                  !enablePriceFilter 
                                    ? "bg-stone-500/10 text-stone-500 border-stone-800/30" 
                                    : isDarkMode 
                                      ? "bg-stone-950 border-stone-800 text-stone-200" 
                                      : "bg-white border-stone-250 text-stone-800"
                                }`}
                              />
                              <span className="text-stone-500">to</span>
                              <input 
                                type="number" 
                                placeholder="Max"
                                disabled={!enablePriceFilter}
                                value={maxPriceFilter}
                                onChange={(e) => setMaxPriceFilter(e.target.value)}
                                className={`w-16 p-1 px-1.5 border rounded-lg text-center text-xs font-sans focus:outline-none focus:border-[#c5a880] ${
                                  !enablePriceFilter 
                                    ? "bg-stone-500/10 text-stone-500 border-stone-800/30" 
                                    : isDarkMode 
                                      ? "bg-stone-950 border-stone-800 text-stone-200" 
                                      : "bg-white border-stone-250 text-stone-800"
                                }`}
                              />
                            </div>
                          </div>

                          {/* JDBC Prepared Statement Preview */}
                          <div className={`p-2 rounded-xl border text-[9.5px] text-[#c5a880] flex items-center justify-between font-mono ${
                            isDarkMode ? "bg-stone-950 border-stone-850" : "bg-stone-100/60 border-stone-200"
                          }`}>
                            <span className="truncate">
                              <span className="text-stone-500">PreparedStatement:</span> SELECT * FROM products WHERE 1=1
                              {searchTerm && " AND name LIKE ?"}
                              {categoryFilter !== "All Categories" && " AND category = ?"}
                              {enableStockFilter && " AND stock <= ?"}
                              {enablePriceFilter && " AND price BETWEEN ? AND ?"}
                            </span>
                            <span className="text-stone-500 font-bold shrink-0 pl-1">?[Parameters Linked]</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Directory list table view */}
                    <div className={`flex-1 overflow-auto border rounded-2xl transition-all ${
                      isDarkMode ? "bg-stone-950/40 border-stone-850/60" : "bg-white/50 border-stone-250/70"
                    }`}>
                      <table className="w-full text-left text-xs border-collapse font-sans">
                        <thead className={`sticky top-0 font-serif text-[10px] tracking-widest uppercase border-b ${
                          isDarkMode ? "bg-stone-900/90 text-stone-400 border-stone-850" : "bg-stone-50/90 text-stone-500 border-stone-200"
                        }`}>
                          <tr>
                            <th className="p-3">ID</th>
                            <th className="p-3">Product Title</th>
                            <th className="p-3">Category</th>
                            <th className="p-3 text-right">Price (₹)</th>
                            <th className="p-3 text-center">Stock</th>
                            <th className="p-3 text-center">Limit</th>
                            <th className="p-3 text-center">Expiry</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y font-mono text-[11px] ${
                          isDarkMode ? "divide-stone-850/40" : "divide-stone-200/50"
                        }`}>
                          {filteredProducts.map((p) => {
                            const isLow = p.stock <= p.lowStockThreshold;
                            const isSelected = p.id === selectedProductId;
                            return (
                              <tr 
                                key={p.id}
                                onClick={() => setSelectedProductId(isSelected ? null : p.id)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected 
                                    ? isDarkMode 
                                      ? "bg-[#c5a880]/15 text-[#c5a880] border-l-2 border-[#c5a880]" 
                                      : "bg-[#c5a880]/10 text-stone-900 font-medium border-l-2 border-[#c5a880]"
                                    : isLow 
                                      ? isDarkMode 
                                        ? "bg-red-950/20 text-red-300 hover:bg-red-950/30" 
                                        : "bg-red-50/70 text-red-800 hover:bg-red-100/70"
                                      : isDarkMode 
                                        ? "hover:bg-stone-900/40 text-stone-300" 
                                        : "hover:bg-stone-50 text-stone-700"
                                }`}
                              >
                                <td className="p-3 py-3 font-bold">{p.id}</td>
                                <td className="p-3 py-3 font-sans font-medium">{p.name}</td>
                                <td className="p-3 py-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-sans font-medium tracking-wide ${
                                    p.category === "Perishable" 
                                      ? isDarkMode ? "bg-amber-950/30 text-amber-400 border border-amber-900/20" : "bg-amber-50 text-amber-700 border border-amber-100"
                                      : isDarkMode ? "bg-stone-900 text-stone-300 border border-stone-800" : "bg-stone-100 text-stone-700 border border-stone-200"
                                  }`}>
                                    {p.category}
                                  </span>
                                </td>
                                <td className="p-3 py-3 text-right font-sans text-xs">
                                  ₹ {p.price.toFixed(2)}
                                </td>
                                <td className="p-3 py-3 text-center font-bold">
                                  <span className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] ${
                                    isLow 
                                      ? "text-red-500 bg-red-500/10 border border-red-500/20" 
                                      : isDarkMode 
                                        ? "text-stone-300 bg-stone-900/60 border border-stone-800" 
                                        : "text-stone-700 bg-stone-50 border border-stone-200"
                                  }`}>
                                    {p.stock}
                                  </span>
                                </td>
                                <td className="p-3 py-3 text-center text-stone-500">{p.lowStockThreshold}</td>
                                <td className="p-3 py-3 text-center text-stone-450">{p.expiryDate || "—"}</td>
                              </tr>
                            );
                          })}
                          {filteredProducts.length === 0 && (
                            <tr>
                              <td colSpan={7} className="p-10 text-center text-stone-500 font-serif italic">
                                No inventory items match current filter criteria.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 text-[10px] text-stone-500 font-serif italic flex items-center justify-between">
                      <span>* Select any row to correct stock quantity or perform administrative removal.</span>
                      <span>Total Rows: {filteredProducts.length}</span>
                    </div>
                  </div>

                  {/* Right Column: Add/Update operations form (5 cols) */}
                  <div className={`lg:col-span-5 flex flex-col rounded-3xl p-5 transition-all ${
                    isDarkMode ? "glass-card-dark border-stone-850/60" : "glass-card-light border-white/60"
                  }`}>
                    <div className="flex items-center gap-2 mb-4">
                      <FileText className="w-4 h-4 text-[#c5a880]" />
                      <h3 className="text-xs font-serif font-bold tracking-widest uppercase text-[#c5a880]">
                        Warehouse Operations
                      </h3>
                    </div>

                    <div className="flex-1 space-y-4 text-xs font-sans">
                      <div>
                        <label className="block text-stone-500 text-[10px] uppercase tracking-wider mb-1.5 font-serif italic">Product Title:</label>
                        <input 
                          type="text"
                          value={formName}
                          onChange={(e) => setFormName(e.target.value)}
                          placeholder="e.g. Vintage Chardonnay"
                          className={`w-full p-2 border rounded-xl font-sans text-xs focus:outline-none focus:border-[#c5a880] focus:ring-1 focus:ring-[#c5a880]/30 transition-all ${
                            isDarkMode ? "bg-stone-950/40 border-stone-850 text-stone-200" : "bg-white/60 border-stone-250 text-stone-850"
                          }`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-stone-500 text-[10px] uppercase tracking-wider font-serif italic">Category Type:</label>
                            <button
                              type="button"
                              onClick={() => setShowAddCategoryInput(!showAddCategoryInput)}
                              className="text-[9px] text-[#c5a880] hover:text-[#b3946b] font-serif italic font-bold flex items-center gap-0.5 cursor-pointer"
                            >
                              {showAddCategoryInput ? "✕ Cancel" : "➕ New"}
                            </button>
                          </div>
                          {showAddCategoryInput && (
                            <div className="flex items-center gap-1 mb-1.5 animate-fadeIn">
                              <input 
                                type="text"
                                placeholder="New category..."
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className={`flex-1 p-1 px-2 border rounded-lg text-[10px] font-sans focus:outline-none focus:border-[#c5a880] ${
                                  isDarkMode ? "bg-stone-950 border-stone-800 text-stone-200" : "bg-white border-stone-200 text-stone-800"
                                }`}
                              />
                              <button
                                type="button"
                                onClick={handleAddNewCategory}
                                className="px-2 py-1 bg-[#c5a880] hover:bg-[#b3946b] text-stone-950 rounded-lg text-[10px] font-serif font-bold cursor-pointer"
                              >
                                Save
                              </button>
                            </div>
                          )}
                          <select
                            value={formCategory}
                            onChange={(e) => setFormCategory(e.target.value)}
                            className={`w-full p-2 border rounded-xl font-sans focus:outline-none focus:border-[#c5a880] transition-all cursor-pointer ${
                              isDarkMode ? "bg-stone-950/40 border-stone-850 text-stone-200" : "bg-white/60 border-stone-250 text-stone-850"
                            }`}
                          >
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-stone-500 text-[10px] uppercase tracking-wider mb-1.5 font-serif italic">Expiry Date:</label>
                          <input 
                            type="text"
                            value={formExpiry}
                            onChange={(e) => setFormExpiry(e.target.value)}
                            disabled={formCategory !== "Perishable"}
                            placeholder="YYYY-MM-DD"
                            className={`w-full p-2 border rounded-xl font-sans focus:outline-none focus:border-[#c5a880] disabled:opacity-40 transition-all ${
                              isDarkMode ? "bg-stone-950/40 border-stone-850 text-stone-200" : "bg-white/60 border-stone-250 text-stone-850"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-stone-500 text-[10px] uppercase tracking-wider mb-1.5 font-serif italic">Price (₹):</label>
                          <input 
                            type="text"
                            value={formPrice}
                            onChange={(e) => setFormPrice(e.target.value)}
                            placeholder="INR"
                            className={`w-full p-2 border rounded-xl font-sans focus:outline-none focus:border-[#c5a880] transition-all ${
                              isDarkMode ? "bg-stone-950/40 border-stone-850 text-stone-200" : "bg-white/60 border-stone-250 text-stone-850"
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-stone-500 text-[10px] uppercase tracking-wider mb-1.5 font-serif italic">Initial Stock:</label>
                          <input 
                            type="text"
                            value={formStock}
                            onChange={(e) => setFormStock(e.target.value)}
                            placeholder="Qty"
                            className={`w-full p-2 border rounded-xl font-sans focus:outline-none focus:border-[#c5a880] transition-all ${
                              isDarkMode ? "bg-stone-950/40 border-stone-850 text-stone-200" : "bg-white/60 border-stone-250 text-stone-850"
                            }`}
                          />
                        </div>

                        <div>
                          <label className="block text-stone-500 text-[10px] uppercase tracking-wider mb-1.5 font-serif italic">Low Warning:</label>
                          <input 
                            type="text"
                            value={formThreshold}
                            onChange={(e) => setFormThreshold(e.target.value)}
                            placeholder="Limit"
                            className={`w-full p-2 border rounded-xl font-sans focus:outline-none focus:border-[#c5a880] transition-all ${
                              isDarkMode ? "bg-stone-950/40 border-stone-850 text-stone-200" : "bg-white/60 border-stone-250 text-stone-850"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <button
                          onClick={handleAddProduct}
                          className="w-full bg-[#c5a880] hover:bg-[#b3946b] text-stone-950 py-2.5 rounded-xl font-serif italic font-medium flex items-center justify-center gap-1 shadow-md cursor-pointer transition-all"
                        >
                          <Plus className="w-4 h-4" />
                          Add Product Record (JDBC)
                        </button>
                      </div>

                      <div className="border-t border-stone-800/20 dark:border-stone-800/80 my-2 pt-4 grid grid-cols-2 gap-3 font-sans">
                        <button
                          onClick={handleUpdateStockClick}
                          className={`p-2.5 rounded-xl font-serif italic text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                            isDarkMode 
                              ? "bg-stone-900/60 border-stone-800 text-stone-300 hover:bg-stone-900" 
                              : "bg-white/60 border-stone-250 text-stone-700 hover:bg-stone-50"
                          }`}
                        >
                          <Edit2 className="w-3.5 h-3.5 text-[#c5a880]" />
                          Correct Stock Qty
                        </button>

                        <button
                          onClick={handleDeleteClick}
                          className={`p-2.5 rounded-xl font-serif italic text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                            isDarkMode 
                              ? "bg-stone-900/60 border-red-950/40 text-red-400 hover:bg-red-950/20" 
                              : "bg-red-50/50 border-red-200/60 text-red-600 hover:bg-red-100/50"
                          }`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Remove Item
                        </button>
                      </div>
                    </div>

                    <div className={`mt-4 p-3 rounded-xl border text-[9.5px] leading-relaxed flex gap-2.5 transition-all ${
                      isDarkMode ? "bg-stone-950/40 border-stone-850 text-stone-400" : "bg-stone-50 border-stone-200 text-stone-600"
                    }`}>
                      <Terminal className="w-4 h-4 text-[#c5a880] shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-[#c5a880] font-serif italic">JDBC Link Active:</strong> Every action on these panels issues simulated PreparedStatements directly impacting the relational database schema below.
                      </div>
                    </div>
                  </div>

                </div>

                {/* Simulated Swing Status Bar */}
                <div className={`p-2 px-4 rounded-xl text-[10px] font-mono flex justify-between items-center select-none ${
                  isDarkMode ? "bg-stone-950/60 text-stone-400 border border-stone-850/60" : "bg-stone-100/60 text-stone-600 border border-stone-200"
                }`}>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    JDBC Connected: SQLite Connection pool is ACTIVE
                  </span>
                  <span>Session Admin: admin</span>
                </div>

              </div>
            )}

          </div>
        </div>

      </div>

      {/* SIMULATED JOptionPane MODAL OVERLAYS */}
      {showDialog !== "none" && (
        <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          
          <div className={`w-full ${showDialog === "report" ? "max-w-md" : "max-w-sm"} rounded-3xl border shadow-2xl overflow-hidden font-sans transition-all duration-300 ${
            isDarkMode 
              ? "bg-stone-950/90 border-stone-850/80 text-stone-200 backdrop-blur-xl shadow-stone-950/60" 
              : "bg-white/95 border-stone-200/80 text-stone-800 backdrop-blur-xl shadow-stone-300/40"
          }`}>
            
            {/* Dialog Header */}
            <div className={`p-3.5 px-5 border-b flex items-center justify-between text-[11px] font-serif uppercase tracking-widest text-[#c5a880] ${
              isDarkMode ? "bg-stone-900/40 border-stone-850/80" : "bg-stone-50 border-stone-200/60"
            }`}>
              <span>{showDialog === "report" ? "Statement Report" : showDialog === "error" ? "System Notification" : "User Input Panel"}</span>
              <button onClick={() => setShowDialog("none")} className="hover:text-red-500 font-bold transition-colors cursor-pointer text-xs">✕</button>
            </div>

            {/* Dialog Body */}
            <div className="p-5 flex gap-4 text-xs leading-normal">
              {showDialog !== "report" && (
                <div className="shrink-0 mt-0.5">
                  {showDialog === "success" && <CheckCircle2 className="w-8 h-8 text-emerald-500" />}
                  {showDialog === "error" && <AlertOctagon className="w-8 h-8 text-red-500" />}
                  {showDialog === "update-qty" && <Edit2 className="w-8 h-8 text-[#c5a880]" />}
                  {showDialog === "confirm-delete" && <AlertTriangle className="w-8 h-8 text-amber-500" />}
                </div>
              )}

              <div className="flex-1">
                {showDialog === "report" ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2.5 border-b pb-3 border-stone-800/10 dark:border-stone-800/80">
                      <FileText className="w-5.5 h-5.5 text-[#c5a880]" />
                      <div>
                        <h4 className="font-serif font-bold text-xs tracking-wider text-[#c5a880] uppercase">INVENTORY VALUATION STATEMENT</h4>
                        <p className="text-[10px] text-stone-500">
                          Comprehensive JDBC product stock audit statement
                        </p>
                      </div>
                    </div>

                    {/* Overall Summary Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-2.5 rounded-xl border transition-all ${
                        isDarkMode ? "bg-stone-900/40 border-stone-850" : "bg-stone-50 border-stone-200"
                      }`}>
                        <span className="text-[9px] uppercase tracking-wider text-stone-500 block font-serif">Total SKU Count</span>
                        <span className="text-sm font-bold font-mono text-[#c5a880]">{products.length} Items</span>
                      </div>
                      <div className={`p-2.5 rounded-xl border transition-all ${
                        isDarkMode ? "bg-[#c5a880]/5 border-[#c5a880]/20" : "bg-[#c5a880]/5 border-[#c5a880]/30"
                      }`}>
                        <span className="text-[9px] uppercase tracking-wider text-[#c5a880] block font-serif">Total Value (INR)</span>
                        <span className="text-sm font-bold font-mono text-[#c5a880]">
                          ₹{products.reduce((acc, curr) => acc + (curr.price * curr.stock), 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    {/* Category breakdowns */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      isDarkMode ? "bg-stone-900/30 border-stone-850" : "bg-[#c5a880]/5 border-stone-200/50"
                    }`}>
                      <span className="text-[9px] tracking-wider font-serif text-stone-500 block mb-2 uppercase font-bold">Category Breakdown</span>
                      <div className="space-y-1.5 text-[10.5px] font-mono">
                        {categories.map(cat => {
                          const catProds = products.filter(p => p.category.toLowerCase() === cat.toLowerCase());
                          const catVal = catProds.reduce((acc, curr) => acc + (curr.price * curr.stock), 0);
                          const count = catProds.length;
                          return (
                            <div key={cat} className="flex justify-between items-center py-0.5 border-b border-stone-800/10 dark:border-stone-800/40 last:border-0">
                              <span className="text-stone-450">{cat} ({count})</span>
                              <span className="font-semibold text-stone-300">
                                ₹{catVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Top 3 Valued Products List */}
                    <div className={`p-3 rounded-xl border transition-all ${
                      isDarkMode ? "bg-stone-900/30 border-stone-850" : "bg-stone-50 border-stone-200"
                    }`}>
                      <span className="text-[9px] tracking-wider font-serif text-stone-500 block mb-2 uppercase font-bold">Top 3 Contributors</span>
                      <div className="space-y-1 text-[10px] font-sans">
                        {[...products]
                          .sort((a, b) => (b.price * b.stock) - (a.price * a.stock))
                          .slice(0, 3)
                          .map(p => (
                            <div key={p.id} className="flex justify-between items-center">
                              <span className="text-stone-500 truncate max-w-[190px]">{p.name} <code className="text-[8.5px] font-mono text-stone-400">({p.stock} units)</code></span>
                              <span className="font-mono text-stone-300 font-medium">₹{(p.price * p.stock).toLocaleString("en-IN", { minimumFractionDigits: 1 })}</span>
                            </div>
                          ))
                        }
                      </div>
                    </div>

                    {/* Aggregate SQL Query Code Tracer */}
                    <div className={`p-2.5 rounded-xl border font-mono text-[9px] space-y-1 ${
                      isDarkMode ? "bg-stone-950 border-stone-850 text-stone-300" : "bg-stone-50 border-stone-200 text-stone-700"
                    }`}>
                      <div className="text-stone-500 border-b border-stone-800/10 dark:border-stone-800/40 pb-1 uppercase font-bold flex items-center justify-between">
                        <span>JDBC Aggregator Trace:</span>
                        <span className="text-[8px] text-[#c5a880] font-normal">SELECT GROUP BY</span>
                      </div>
                      <code className="text-emerald-500 block whitespace-pre overflow-x-auto leading-normal">
                        {`SELECT category, SUM(price * stock) AS total_val, COUNT(*) AS count\nFROM products GROUP BY category;`}
                      </code>
                      <code className="text-stone-400 block whitespace-pre overflow-x-auto leading-tight mt-1.5">
                        {`// JDBC Execution\nStatement stmt = conn.createStatement();\nResultSet rs = stmt.executeQuery(sql);\nwhile (rs.next()) {\n    System.out.printf("Category: %s | Total: ₹%.2f\\n", \n        rs.getString("category"), rs.getDouble("total_val"));\n}`}
                      </code>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <h5 className="font-serif font-semibold mb-1 text-[11px] tracking-widest text-[#c5a880] uppercase">
                      {dialogTitle || "System Message"}
                    </h5>
                    <p className="whitespace-pre-line text-xs leading-relaxed font-sans font-medium text-stone-550">{dialogMessage}</p>

                    {/* Prompt input field for stock quantity updates */}
                    {showDialog === "update-qty" && (
                      <div className="mt-3.5 space-y-1.5">
                        <label className="block text-[9.5px] font-serif uppercase tracking-wider text-stone-400">Enter New Stock Units (Quantity):</label>
                        <input 
                          type="text"
                          value={qtyInput}
                          onChange={(e) => setQtyInput(e.target.value)}
                          className={`w-full p-2 border rounded-xl font-mono text-center focus:outline-none focus:border-[#c5a880] ${
                            isDarkMode ? "bg-stone-900 border-stone-800 text-stone-200" : "bg-white border-stone-250 text-stone-850"
                          }`}
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Dialog Footer Actions */}
            <div className={`p-3 px-5 border-t flex justify-end gap-2 text-xs ${
              isDarkMode ? "bg-stone-900/40 border-stone-850" : "bg-stone-50 border-stone-200"
            }`}>
              {showDialog === "update-qty" ? (
                <>
                  <button 
                    onClick={() => setShowDialog("none")}
                    className={`px-3.5 py-1.5 rounded-xl border font-serif italic text-xs hover:bg-stone-100 dark:hover:bg-stone-900 cursor-pointer transition-colors ${
                      isDarkMode ? "border-stone-800 text-stone-300" : "border-stone-250 text-stone-600"
                    }`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={submitStockUpdate}
                    className="px-5 py-1.5 bg-[#c5a880] hover:bg-[#b3946b] text-stone-950 font-serif italic text-xs font-bold rounded-xl cursor-pointer transition-colors"
                  >
                    OK
                  </button>
                </>
              ) : showDialog === "confirm-delete" ? (
                <>
                  <button 
                    onClick={() => setShowDialog("none")}
                    className={`px-3.5 py-1.5 rounded-xl border font-serif italic text-xs hover:bg-stone-100 dark:hover:bg-stone-900 cursor-pointer transition-colors ${
                      isDarkMode ? "border-stone-800 text-stone-300" : "border-stone-250 text-stone-600"
                    }`}
                  >
                    No
                  </button>
                  <button 
                    onClick={confirmDeleteProduct}
                    className="px-5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-serif italic text-xs font-bold rounded-xl cursor-pointer transition-colors"
                  >
                    Yes
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setShowDialog("none")}
                  className="px-6 py-1.5 bg-[#c5a880] hover:bg-[#b3946b] text-stone-950 font-serif italic text-xs font-bold rounded-xl cursor-pointer transition-colors"
                >
                  OK
                </button>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
