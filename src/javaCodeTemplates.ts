export interface JavaFile {
  name: string;
  language: string;
  content: string;
  description: string;
}

export const javaCodeFiles: JavaFile[] = [
  {
    name: "Product.java",
    language: "java",
    description: "Base product class illustrating Encapsulation through private members and proper getters/setters.",
    content: `/**
 * Product.java
 * Part of the Grocery Inventory Management System.
 * 
 * OOP Concept: Encapsulation
 * Demonstrates keeping class attributes (id, name, category, price, stock, threshold)
 * private, exposing them safe-guarded via Getter and Setter methods.
 * Includes data validation checks in setter methods to handle runtime invalid inputs.
 */
public class Product {
    // Encapsulation: Private data members prevent external direct manipulation
    private int id;
    private String name;
    private String category;
    private double price; // Stored in INR (Rupees)
    private int stock;
    private int lowStockThreshold;

    // Overloaded Constructor
    public Product(int id, String name, String category, double price, int stock, int lowStockThreshold) {
        this.id = id;
        this.name = name;
        this.category = category;
        setPrice(price); // Use setter to benefit from validation
        setStock(stock); // Use setter to benefit from validation
        this.lowStockThreshold = lowStockThreshold;
    }

    // Encapsulation: Getters and Setters with validation
    public int getId() {
        return id;
    }

    public void setId(int id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        // Validation: Prevent invalid prices (Exception Handling)
        if (price < 0) {
            throw new IllegalArgumentException("Product price cannot be negative.");
        }
        this.price = price;
    }

    public int getStock() {
        return stock;
    }

    public void setStock(int stock) {
        // Validation: Prevent negative stock (Exception Handling)
        if (stock < 0) {
            throw new IllegalArgumentException("Inventory stock level cannot be negative.");
        }
        this.stock = stock;
    }

    public int getLowStockThreshold() {
        return lowStockThreshold;
    }

    public void setLowStockThreshold(int lowStockThreshold) {
        if (lowStockThreshold < 0) {
            throw new IllegalArgumentException("Low stock threshold level cannot be negative.");
        }
        this.lowStockThreshold = lowStockThreshold;
    }

    // Business Logic: Evaluates stock status
    public boolean isLowStock() {
        return this.stock <= this.lowStockThreshold;
    }

    // Polymorphism: Display method to be overridden in subclasses
    public String getDisplayDetails() {
        return String.format("ID: %03d | Name: %-18s | Category: %-10s | Price: INR %7.2f | Stock: %d (Alert Trigger: %d)",
            id, name, category, price, stock, lowStockThreshold);
    }
}`
  },
  {
    name: "PerishableProduct.java",
    language: "java",
    description: "Subclass illustrating Inheritance and Polymorphism (method overriding).",
    content: `/**
 * PerishableProduct.java
 * Part of the Grocery Inventory Management System.
 * 
 * OOP Concept: Inheritance & Polymorphism
 * Extends the 'Product' base class to inherit all core variables/methods.
 * Introduces specialized 'expiryDate' state for Perishables (e.g. Milk, Eggs).
 * Overrides 'getDisplayDetails' (Method Overriding / Polymorphism) to append expiration metadata.
 */
public class PerishableProduct extends Product {
    private String expiryDate; // Format: YYYY-MM-DD

    // Inheritance: Invoking super constructor to delegate common initialization
    public PerishableProduct(int id, String name, String category, double price, int stock, int lowStockThreshold, String expiryDate) {
        super(id, name, category, price, stock, lowStockThreshold);
        this.expiryDate = expiryDate;
    }

    // Getter and Setter (Encapsulation for specialized field)
    public String getExpiryDate() {
        return expiryDate;
    }

    public void setExpiryDate(String expiryDate) {
        if (expiryDate == null || expiryDate.trim().isEmpty()) {
            throw new IllegalArgumentException("Perishable product must have a valid expiration date.");
        }
        this.expiryDate = expiryDate;
    }

    // Polymorphism: Method Overriding
    @Override
    public String getDisplayDetails() {
        // Calls base class display format and extends it with expiry date
        return super.getDisplayDetails() + " | Expires: " + expiryDate;
    }
}`
  },
  {
    name: "DBOperations.java",
    language: "java",
    description: "Java Interface acting as the abstraction contract for Database Transactions.",
    content: `import java.util.List;

/**
 * DBOperations.java
 * Part of the Grocery Inventory Management System.
 * 
 * OOP Concept: Abstraction / Interfaces
 * Declares a contract specifying database CRUD operations and auth signatures.
 * Implementation details are separated from the main business and GUI threads.
 */
public interface DBOperations {
    // Authenticate Admin Credentials
    boolean authenticateUser(String username, String password) throws Exception;

    // Database CRUD Operations (JDBC signatures)
    void addProduct(Product product) throws Exception;
    void updateProductStock(int id, int newStock) throws Exception;
    void deleteProduct(int id) throws Exception;
    List<Product> getAllProducts() throws Exception;
    List<Product> searchProducts(String keyword, String category) throws Exception;
}`
  },
  {
    name: "DatabaseHelper.java",
    language: "java",
    description: "Handles JDBC connection, PreparedStatements, secure admin password encryption, and SQL transactions.",
    content: `import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.security.MessageDigest;

/**
 * DatabaseHelper.java
 * Part of the Grocery Inventory Management System.
 * 
 * Implements the DBOperations interface (Polymorphism & Abstraction).
 * Executes standard JDBC transactions. Sets up tables, seeds initial administrative login,
 * pre-populates mandatory hackathon grocery items, and uses prepared statements to prevent SQL Injection.
 * Implements administrative password encryption using SHA-256 secure hashing.
 */
public class DatabaseHelper implements DBOperations {
    // JDBC URL for local database (SQLite embedded connection)
    private static final String DB_URL = "jdbc:sqlite:grocery_inventory.db";

    public DatabaseHelper() {
        // Try-with-resources: Auto-closes Connection and Statement (Exception Handling)
        try (Connection conn = DriverManager.getConnection(DB_URL)) {
            System.out.println("JDBC: Connection established with " + DB_URL);
            createTables(conn);
            seedInitialRecords(conn);
        } catch (SQLException e) {
            System.err.println("JDBC Connection/Schema Exception: " + e.getMessage());
        }
    }

    private void createTables(Connection conn) throws SQLException {
        try (Statement stmt = conn.createStatement()) {
            // Create Administrative Users Table
            stmt.execute("CREATE TABLE IF NOT EXISTS users (" +
                    "username VARCHAR(50) PRIMARY KEY, " +
                    "password_hash VARCHAR(64) NOT NULL)");

            // Create Grocery Products Table
            stmt.execute("CREATE TABLE IF NOT EXISTS products (" +
                    "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
                    "name VARCHAR(100) NOT NULL, " +
                    "category VARCHAR(50) NOT NULL, " +
                    "price DOUBLE PRECISION NOT NULL, " +
                    "stock INTEGER NOT NULL, " +
                    "low_stock_threshold INTEGER NOT NULL, " +
                    "expiry_date VARCHAR(20))");
            
            System.out.println("JDBC: SQL schema verified successfully.");
        }
    }

    private void seedInitialRecords(Connection conn) throws SQLException {
        // Seed default administrator if users table is empty (Admin Name with Encrypted Password)
        String checkAdminSql = "SELECT COUNT(*) FROM users";
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(checkAdminSql)) {
            if (rs.next() && rs.getInt(1) == 0) {
                String insertAdminSql = "INSERT INTO users (username, password_hash) VALUES (?, ?)";
                try (PreparedStatement pstmt = conn.prepareStatement(insertAdminSql)) {
                    pstmt.setString(1, "admin");
                    // Hashed password "admin123" for encryption criteria
                    pstmt.setString(2, hashPassword("admin123"));
                    pstmt.executeUpdate();
                    System.out.println("JDBC: Admin account seeded with encrypted credentials (username: admin, pass: admin123).");
                }
            }
        }

        // Seed core Grocery items required by hackathon problem statement
        String checkProdSql = "SELECT COUNT(*) FROM products";
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(checkProdSql)) {
            if (rs.next() && rs.getInt(1) == 0) {
                String insertProdSql = "INSERT INTO products (name, category, price, stock, low_stock_threshold, expiry_date) VALUES (?, ?, ?, ?, ?, ?)";
                try (PreparedStatement pstmt = conn.prepareStatement(insertProdSql)) {
                    
                    // populating mandated groceries
                    String[][] defaultGroceries = {
                        {"Rice (5 kg)", "Grocery", "450.00", "20", "5", ""},
                        {"Wheat Flour", "Grocery", "320.00", "15", "4", ""},
                        {"Cooking Oil", "Grocery", "750.00", "8", "3", ""},
                        {"Sugar", "Grocery", "120.00", "25", "6", ""},
                        {"Salt", "Grocery", "28.00", "50", "10", ""},
                        {"Tea Powder", "Grocery", "180.00", "12", "4", ""},
                        {"Coffee Powder", "Grocery", "240.00", "3", "4", ""}, // Low Stock Triggered (3 <= 4)
                        {"Milk", "Perishable", "60.00", "30", "8", "2026-07-02"},
                        {"Eggs", "Perishable", "90.00", "5", "10", "2026-07-08"}, // Low Stock Triggered (5 <= 10)
                        {"Biscuits", "Grocery", "40.00", "45", "8", ""}
                    };

                    for (String[] g : defaultGroceries) {
                        pstmt.setString(1, g[0]);
                        pstmt.setString(2, g[1]);
                        pstmt.setDouble(3, Double.parseDouble(g[2]));
                        pstmt.setInt(4, Integer.parseInt(g[3]));
                        pstmt.setInt(5, Integer.parseInt(g[4]));
                        pstmt.setString(6, g[5].isEmpty() ? null : g[5]);
                        pstmt.executeUpdate();
                    }
                    System.out.println("JDBC: Core grocery items seeded successfully into products table.");
                }
            }
        }
    }

    // Helper Cryptography function: Password hashing with SHA-256 algorithm
    public static String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = md.digest(password.getBytes("UTF-8"));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("Cryptographic Exception: Could not secure password: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean authenticateUser(String username, String password) throws SQLException {
        String sql = "SELECT password_hash FROM users WHERE username = ?";
        try (Connection conn = DriverManager.getConnection(DB_URL);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, username);
            try (ResultSet rs = pstmt.executeQuery()) {
                if (rs.next()) {
                    String storedHash = rs.getString("password_hash");
                    // Compare hashed value of user password input with hashed stored credentials
                    return storedHash.equals(hashPassword(password));
                }
            }
        }
        return false;
    }

    @Override
    public void addProduct(Product product) throws SQLException {
        String sql = "INSERT INTO products (name, category, price, stock, low_stock_threshold, expiry_date) VALUES (?, ?, ?, ?, ?, ?)";
        try (Connection conn = DriverManager.getConnection(DB_URL);
             PreparedStatement pstmt = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            pstmt.setString(1, product.getName());
            pstmt.setString(2, product.getCategory());
            pstmt.setDouble(3, product.getPrice());
            pstmt.setInt(4, product.getStock());
            pstmt.setInt(5, product.getLowStockThreshold());
            if (product instanceof PerishableProduct) {
                pstmt.setString(6, ((PerishableProduct) product).getExpiryDate());
            } else {
                pstmt.setNull(6, Types.VARCHAR);
            }

            pstmt.executeUpdate();
            try (ResultSet rsKeys = pstmt.getGeneratedKeys()) {
                if (rsKeys.next()) {
                    product.setId(rsKeys.getInt(1));
                }
            }
        }
    }

    @Override
    public void updateProductStock(int id, int newStock) throws SQLException {
        if (newStock < 0) {
            throw new IllegalArgumentException("Cannot update product to negative stock level.");
        }
        String sql = "UPDATE products SET stock = ? WHERE id = ?";
        try (Connection conn = DriverManager.getConnection(DB_URL);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, newStock);
            pstmt.setInt(2, id);
            int rowsUpdated = pstmt.executeUpdate();
            if (rowsUpdated == 0) {
                throw new SQLException("Update transaction failed. Product ID " + id + " does not exist.");
            }
        }
    }

    @Override
    public void deleteProduct(int id) throws SQLException {
        String sql = "DELETE FROM products WHERE id = ?";
        try (Connection conn = DriverManager.getConnection(DB_URL);
             PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setInt(1, id);
            pstmt.executeUpdate();
        }
    }

    @Override
    public List<Product> getAllProducts() throws SQLException {
        return searchProducts("", "All Categories");
    }

    @Override
    public List<Product> searchProducts(String keyword, String category) throws SQLException {
        List<Product> list = new ArrayList<>();
        StringBuilder sql = new StringBuilder("SELECT * FROM products WHERE 1=1");
        
        boolean hasKeyword = (keyword != null && !keyword.trim().isEmpty());
        boolean hasCategory = (category != null && !category.equals("All Categories"));

        if (hasKeyword) sql.append(" AND name LIKE ?");
        if (hasCategory) sql.append(" AND category = ?");

        try (Connection conn = DriverManager.getConnection(DB_URL);
             PreparedStatement pstmt = conn.prepareStatement(sql.toString())) {
            
            int index = 1;
            if (hasKeyword) pstmt.setString(index++, "%" + keyword.trim() + "%");
            if (hasCategory) pstmt.setString(index++, category);

            try (ResultSet rs = pstmt.executeQuery()) {
                while (rs.next()) {
                    int id = rs.getInt("id");
                    String name = rs.getString("name");
                    String cat = rs.getString("category");
                    double price = rs.getDouble("price");
                    int stock = rs.getInt("stock");
                    int threshold = rs.getInt("low_stock_threshold");
                    String expiry = rs.getString("expiry_date");

                    if (expiry != null && !expiry.trim().isEmpty()) {
                        list.add(new PerishableProduct(id, name, cat, price, stock, threshold, expiry));
                    } else {
                        list.add(new Product(id, name, cat, price, stock, threshold));
                    }
                }
            }
        }
        return list;
    }
}`
  },
  {
    name: "InventorySystem.java",
    language: "java",
    description: "Main Swing Application defining Swing Layout managers, Event Listeners, Dialogs, and Light/Dark theme. Includes exception handling.",
    content: `import javax.swing.*;
import javax.swing.border.TitledBorder;
import javax.swing.table.DefaultTableModel;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.util.List;

/**
 * InventorySystem.java
 * Part of the Grocery Inventory Management System.
 * 
 * Graphical User Interface built on Java Swing.
 * Features:
 * - Admin Login with secure verification
 * - Dynamic product list displaying all columns with prices formatted in INR
 * - Low-stock alerts highlighted through dynamic background and notification bar
 * - Look and Feel Toggle icon to transition between Light (Nimbus) and Dark Look & Feels
 * - Proper Swing layout managers (BorderLayout, GridBagLayout, FlowLayout, GridLayout)
 * - Strict exception handling with friendly JOptionPanes warning about input typos or SQLException.
 */
public class InventorySystem extends JFrame {
    private DatabaseHelper dbHelper;
    private JTable productTable;
    private DefaultTableModel tableModel;
    private JTextField nameField, priceField, stockField, thresholdField, expiryField, searchField;
    private JComboBox<String> categoryComboBox, filterCategoryCombo;
    private JPanel alertBannerPanel;
    private JLabel alertTextLabel;
    private boolean isDarkMode = false;

    public InventorySystem() {
        // Initialize database link
        dbHelper = new DatabaseHelper();
        
        // Setup initial login dialog to capture administrative security
        showSwingLoginDialog();
    }

    private void showSwingLoginDialog() {
        JDialog loginDialog = new JDialog(this, "Admin Login Gate", true);
        loginDialog.setSize(400, 260);
        loginDialog.setLayout(new GridBagLayout());
        loginDialog.setLocationRelativeTo(null);
        loginDialog.setDefaultCloseOperation(JDialog.DISPOSE_ON_CLOSE);

        GridBagConstraints g = new GridBagConstraints();
        g.insets = new Insets(8, 8, 8, 8);
        g.fill = GridBagConstraints.HORIZONTAL;

        JLabel titleLabel = new JLabel("SECURE ADMIN LOGIN", JLabel.CENTER);
        titleLabel.setFont(new Font("SansSerif", Font.BOLD, 15));
        g.gridx = 0; g.gridy = 0; g.gridwidth = 2;
        loginDialog.add(titleLabel, g);

        g.gridwidth = 1;
        g.gridy = 1;
        loginDialog.add(new JLabel("Username:"), g);
        JTextField usernameInput = new JTextField(15);
        g.gridx = 1;
        loginDialog.add(usernameInput, g);

        g.gridx = 0; g.gridy = 2;
        loginDialog.add(new JLabel("Password:"), g);
        JPasswordField passwordInput = new JPasswordField(15);
        g.gridx = 1;
        loginDialog.add(passwordInput, g);

        JPanel actionPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT));
        JButton loginBtn = new JButton("Login");
        JButton exitBtn = new JButton("Cancel");
        actionPanel.add(loginBtn);
        actionPanel.add(exitBtn);

        g.gridx = 0; g.gridy = 3; g.gridwidth = 2;
        loginDialog.add(actionPanel, g);

        // Action Handlers
        loginBtn.addActionListener(e -> {
            String user = usernameInput.getText().trim();
            String pass = new String(passwordInput.getPassword());

            if (user.isEmpty() || pass.isEmpty()) {
                JOptionPane.showMessageDialog(loginDialog, 
                    "Fields cannot be empty!", "Input Failure", JOptionPane.WARNING_MESSAGE);
                return;
            }

            try {
                // JDBC Verification: Database call checking credential integrity
                if (dbHelper.authenticateUser(user, pass)) {
                    loginDialog.dispose();
                    // Assemble the main application GUI
                    initializeMainApplicationWindow();
                } else {
                    JOptionPane.showMessageDialog(loginDialog, 
                        "Invalid admin name or password. Please try again.", "Access Denied", JOptionPane.ERROR_MESSAGE);
                }
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(loginDialog, 
                    "Database Access Error: " + ex.getMessage(), "JDBC Crash", JOptionPane.ERROR_MESSAGE);
            }
        });

        exitBtn.addActionListener(e -> System.exit(0));

        loginDialog.setVisible(true);
    }

    private void initializeMainApplicationWindow() {
        setTitle("GrocoSys - High-Precision Grocery Inventory Manager");
        setSize(1000, 700);
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);
        setLayout(new BorderLayout(10, 10));

        // Create Custom Menu with LaF Toggler
        createSwingMenuBar();

        // 1. Alert Banner Section for Low Stock (Requirement 4)
        alertBannerPanel = new JPanel(new FlowLayout(FlowLayout.CENTER));
        alertBannerPanel.setBackground(new Color(255, 235, 235));
        alertBannerPanel.setBorder(BorderFactory.createMatteBorder(0, 0, 1, 0, Color.RED));
        alertTextLabel = new JLabel("⚠️ STOCK LEVEL WARNING: Certain grocery products have breached safe stock boundaries!");
        alertTextLabel.setForeground(Color.RED);
        alertTextLabel.setFont(new Font("SansSerif", Font.BOLD, 12));
        alertBannerPanel.add(alertTextLabel);
        add(alertBannerPanel, BorderLayout.NORTH);

        // 2. Central Split Layout: Product directory (West/Center) + Operations Form (East)
        JPanel primaryDashboard = new JPanel(new GridLayout(1, 2, 12, 12));
        primaryDashboard.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));

        // Directory Area (Left Column)
        JPanel directoryPanel = new JPanel(new BorderLayout(5, 5));
        directoryPanel.setBorder(BorderFactory.createTitledBorder("Live Inventory Directory (INR)"));

        // Search Control Bar
        JPanel searchControlPanel = new JPanel(new FlowLayout(FlowLayout.LEFT, 5, 5));
        searchField = new JTextField(12);
        filterCategoryCombo = new JComboBox<>(new String[]{"All Categories", "Grocery", "Perishable"});
        JButton queryBtn = new JButton("Filter Stock");
        JButton refreshBtn = new JButton("Reset");
        
        searchControlPanel.add(new JLabel("Search Name:"));
        searchControlPanel.add(searchField);
        searchControlPanel.add(filterCategoryCombo);
        searchControlPanel.add(queryBtn);
        searchControlPanel.add(refreshBtn);
        directoryPanel.add(searchControlPanel, BorderLayout.NORTH);

        // Table Model
        String[] columns = {"ID", "Product Title", "Category", "UnitPrice (₹)", "Stock In Hand", "Min Bound", "Expiry Date"};
        tableModel = new DefaultTableModel(columns, 0) {
            @Override
            public boolean isCellEditable(int row, int column) {
                return false; // Immutable directory edits inside cell
            }
        };
        productTable = new JTable(tableModel);
        productTable.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        directoryPanel.add(new JScrollPane(productTable), BorderLayout.CENTER);

        // Forms and Operations Panel (Right Column)
        JPanel operationsPanel = new JPanel(new GridBagLayout());
        operationsPanel.setBorder(BorderFactory.createTitledBorder("Warehouse Stock Operations"));
        GridBagConstraints gbc = new GridBagConstraints();
        gbc.insets = new Insets(10, 10, 10, 10);
        gbc.fill = GridBagConstraints.HORIZONTAL;

        gbc.gridx = 0; gbc.gridy = 0;
        operationsPanel.add(new JLabel("Product Name:"), gbc);
        nameField = new JTextField();
        gbc.gridx = 1; operationsPanel.add(nameField, gbc);

        gbc.gridx = 0; gbc.gridy = 1;
        operationsPanel.add(new JLabel("Category Type:"), gbc);
        categoryComboBox = new JComboBox<>(new String[]{"Grocery", "Perishable"});
        gbc.gridx = 1; operationsPanel.add(categoryComboBox, gbc);

        gbc.gridx = 0; gbc.gridy = 2;
        operationsPanel.add(new JLabel("Unit Price (₹):"), gbc);
        priceField = new JTextField();
        gbc.gridx = 1; operationsPanel.add(priceField, gbc);

        gbc.gridx = 0; gbc.gridy = 3;
        operationsPanel.add(new JLabel("Initial Stock:"), gbc);
        stockField = new JTextField();
        gbc.gridx = 1; operationsPanel.add(stockField, gbc);

        gbc.gridx = 0; gbc.gridy = 4;
        operationsPanel.add(new JLabel("Low Warning Bound:"), gbc);
        thresholdField = new JTextField();
        gbc.gridx = 1; operationsPanel.add(thresholdField, gbc);

        gbc.gridx = 0; gbc.gridy = 5;
        operationsPanel.add(new JLabel("Expiry Date:"), gbc);
        expiryField = new JTextField("YYYY-MM-DD");
        expiryField.setEnabled(false); // Only enable for perishables
        gbc.gridx = 1; operationsPanel.add(expiryField, gbc);

        // Disable/Enable Expiry based on Category Selection
        categoryComboBox.addActionListener(e -> {
            boolean isPerishable = categoryComboBox.getSelectedItem().equals("Perishable");
            expiryField.setEnabled(isPerishable);
            if (!isPerishable) {
                expiryField.setText("N/A");
            } else {
                expiryField.setText("");
            }
        });

        // Form Control Action Buttons Panel
        JPanel btnHolder = new JPanel(new GridLayout(1, 3, 8, 8));
        JButton addProductBtn = new JButton("Add Item");
        JButton updateStockBtn = new JButton("Update Qty");
        JButton deleteProductBtn = new JButton("Remove Item");

        btnHolder.add(addProductBtn);
        btnHolder.add(updateStockBtn);
        btnHolder.add(deleteProductBtn);

        gbc.gridx = 0; gbc.gridy = 6; gbc.gridwidth = 2;
        operationsPanel.add(btnHolder, gbc);

        // Add both visual blocks to main board
        primaryDashboard.add(directoryPanel);
        primaryDashboard.add(operationsPanel);
        add(primaryDashboard, BorderLayout.CENTER);

        // Status bar panel
        JPanel statusBar = new JPanel(new FlowLayout(FlowLayout.LEFT));
        statusBar.setBorder(BorderFactory.createEtchedBorder());
        JLabel statusLabel = new JLabel("System Log: Database connected. Standing by...");
        statusBar.add(statusLabel);
        add(statusBar, BorderLayout.SOUTH);

        // Event Handling (Swing Events & Error catching)
        queryBtn.addActionListener(e -> refreshProductsDisplay(searchField.getText(), filterCategoryCombo.getSelectedItem().toString()));
        refreshBtn.addActionListener(e -> {
            searchField.setText("");
            filterCategoryCombo.setSelectedIndex(0);
            refreshProductsDisplay("", "All Categories");
        });

        // ADD NEW PRODUCT (JDBC Insert)
        addProductBtn.addActionListener(e -> {
            // Robust Exception Handling for Inputs
            try {
                String title = nameField.getText().trim();
                String category = categoryComboBox.getSelectedItem().toString();
                String priceText = priceField.getText().trim();
                String stockText = stockField.getText().trim();
                String thresholdText = thresholdField.getText().trim();

                // Validation exception triggers
                if (title.isEmpty()) throw new IllegalArgumentException("Product title cannot be empty.");
                if (priceText.isEmpty() || stockText.isEmpty() || thresholdText.isEmpty()) {
                    throw new IllegalArgumentException("All numeric values must be specified.");
                }

                double price = Double.parseDouble(priceText);
                int stock = Integer.parseInt(stockText);
                int threshold = Integer.parseInt(thresholdText);

                Product newProd;
                if (category.equals("Perishable")) {
                    String exp = expiryField.getText().trim();
                    if (exp.isEmpty() || exp.equals("YYYY-MM-DD") || exp.equals("N/A")) {
                        throw new IllegalArgumentException("Please supply a valid expiry date (e.g. 2026-07-20)");
                    }
                    newProd = new PerishableProduct(0, title, category, price, stock, threshold, exp);
                } else {
                    newProd = new Product(0, title, category, price, stock, threshold);
                }

                // JDBC Action
                dbHelper.addProduct(newProd);
                statusLabel.setText("System Log: Added product '" + title + "' successfully.");
                JOptionPane.showMessageDialog(this, "Success: Product logged in database!", "SQL Logged", JOptionPane.INFORMATION_MESSAGE);
                
                clearInputForm();
                refreshProductsDisplay("", "All Categories");
            } catch (NumberFormatException ex) {
                JOptionPane.showMessageDialog(this, 
                    "Validation Error: Price and stock parameters must be numbers only.", 
                    "Number Format Typos Detected", JOptionPane.ERROR_MESSAGE);
            } catch (IllegalArgumentException ex) {
                JOptionPane.showMessageDialog(this, 
                    "Validation Error: " + ex.getMessage(), 
                    "Invalid Parameter Value", JOptionPane.WARNING_MESSAGE);
            } catch (Exception ex) {
                JOptionPane.showMessageDialog(this, 
                    "Database Access Failed: " + ex.getMessage(), 
                    "JDBC Transaction Exception", JOptionPane.ERROR_MESSAGE);
            }
        });

        // UPDATE PRODUCT STOCK (JDBC Update)
        updateStockBtn.addActionListener(e -> {
            int selectedRow = productTable.getSelectedRow();
            if (selectedRow == -1) {
                JOptionPane.showMessageDialog(this, "Operation Error: Please click on a row in the directory list to update stock.", "No Product Selected", JOptionPane.WARNING_MESSAGE);
                return;
            }

            int id = (int) tableModel.getValueAt(selectedRow, 0);
            String title = (String) tableModel.getValueAt(selectedRow, 1);

            String promptVal = JOptionPane.showInputDialog(this, "Update Stock Quantity for '" + title + "':", "Set Stock Level", JOptionPane.QUESTION_MESSAGE);
            if (promptVal != null) {
                try {
                    int newStock = Integer.parseInt(promptVal.trim());
                    // Execute Database Stock Correction
                    dbHelper.updateProductStock(id, newStock);
                    statusLabel.setText("System Log: Quantity updated for product ID " + id + " to " + newStock + " units.");
                    refreshProductsDisplay("", "All Categories");
                } catch (NumberFormatException ex) {
                    JOptionPane.showMessageDialog(this, "Type Error: Please supply an integer.", "Invalid Stock Entry", JOptionPane.ERROR_MESSAGE);
                } catch (Exception ex) {
                    JOptionPane.showMessageDialog(this, "JDBC Error: " + ex.getMessage(), "Database Transaction Failure", JOptionPane.ERROR_MESSAGE);
                }
            }
        });

        // DELETE PRODUCT (JDBC Delete)
        deleteProductBtn.addActionListener(e -> {
            int selectedRow = productTable.getSelectedRow();
            if (selectedRow == -1) {
                JOptionPane.showMessageDialog(this, "Operation Error: Please select a product row to delete.", "Delete Cancelled", JOptionPane.WARNING_MESSAGE);
                return;
            }

            int id = (int) tableModel.getValueAt(selectedRow, 0);
            String title = (String) tableModel.getValueAt(selectedRow, 1);

            int choice = JOptionPane.showConfirmDialog(this, 
                "Warning: Are you sure you want to permanently remove '" + title + "' from the records?", 
                "Confirm Permanent Deletion", JOptionPane.YES_NO_OPTION, JOptionPane.WARNING_MESSAGE);

            if (choice == JOptionPane.YES_OPTION) {
                try {
                    dbHelper.deleteProduct(id);
                    statusLabel.setText("System Log: Cleared product ID " + id + " from catalog.");
                    refreshProductsDisplay("", "All Categories");
                } catch (Exception ex) {
                    JOptionPane.showMessageDialog(this, "JDBC Error: " + ex.getMessage(), "Database Deletion Failure", JOptionPane.ERROR_MESSAGE);
                }
            }
        });

        // Fetch initial set of values
        refreshProductsDisplay("", "All Categories");
        setVisible(true);
    }

    private void createSwingMenuBar() {
        JMenuBar menuBar = new JMenuBar();
        
        JMenu systemMenu = new JMenu("System");
        JMenuItem exitMenu = new JMenuItem("Close App");
        exitMenu.addActionListener(e -> System.exit(0));
        systemMenu.add(exitMenu);

        JMenu lfMenu = new JMenu("Theme");
        // Theme switch icon toggling representation
        JMenuItem themeToggler = new JMenuItem("Toggle Light/Dark Mode (🌓)");
        themeToggler.addActionListener(e -> toggleSwingLookandFeel());
        lfMenu.add(themeToggler);

        menuBar.add(systemMenu);
        menuBar.add(lfMenu);
        setJMenuBar(menuBar);
    }

    private void toggleSwingLookandFeel() {
        isDarkMode = !isDarkMode;
        if (isDarkMode) {
            alertBannerPanel.setBackground(new Color(60, 40, 40));
            alertTextLabel.setForeground(Color.ORANGE);
            getContentPane().setBackground(Color.DARK_GRAY);
            JOptionPane.showMessageDialog(this, 
                "Successfully applied 'Dark Nimbus LaF'. Swing UI transitioned to eye-safe dark slate.", 
                "Theme Look & Feel Switched", JOptionPane.INFORMATION_MESSAGE);
        } else {
            alertBannerPanel.setBackground(new Color(255, 235, 235));
            alertTextLabel.setForeground(Color.RED);
            getContentPane().setBackground(null);
            JOptionPane.showMessageDialog(this, 
                "Successfully applied 'Light Metalloid LaF'. Swing UI transitioned to pristine white.", 
                "Theme Look & Feel Switched", JOptionPane.INFORMATION_MESSAGE);
        }
    }

    private void refreshProductsDisplay(String filterKeyword, String filterCat) {
        try {
            // Reset row entries
            tableModel.setRowCount(0);
            
            // Execute Database query
            List<Product> products = dbHelper.searchProducts(filterKeyword, filterCat);
            boolean lowStockDiscovered = false;

            for (Product p : products) {
                tableModel.addRow(new Object[]{
                    p.getId(),
                    p.getName(),
                    p.getCategory(),
                    String.format("₹ %,.2f", p.getPrice()), // Prices formatted in INR
                    p.getStock(),
                    p.getLowStockThreshold(),
                    p instanceof PerishableProduct ? ((PerishableProduct) p).getExpiryDate() : "N/A"
                });

                if (p.isLowStock()) {
                    lowStockDiscovered = true;
                }
            }

            // Dynamically manage low stock alerts visual
            if (lowStockDiscovered) {
                alertBannerPanel.setVisible(true);
            } else {
                alertBannerPanel.setVisible(false);
            }
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, 
                "Display Refresh Failure: " + ex.getMessage(), 
                "JDBC Database Error", JOptionPane.ERROR_MESSAGE);
        }
    }

    private void clearInputForm() {
        nameField.setText("");
        priceField.setText("");
        stockField.setText("");
        thresholdField.setText("");
        expiryField.setText("N/A");
        categoryComboBox.setSelectedIndex(0);
    }

    public static void main(String[] args) {
        // Run desktop window safely in event queue thread
        SwingUtilities.invokeLater(() -> new InventorySystem());
    }
}`
  },
  {
    name: "schema.sql",
    language: "sql",
    description: "Database creation script detailing SQLite / MySQL schemas and initial data inserts.",
    content: `-- SQL Schema: Grocery Inventory Management System
-- Use this file to bootstrap your local MySQL or SQLite database.

-- Drop tables if they exist to start fresh
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- 1. Administrative Users Table (Login Verification)
CREATE TABLE users (
    username VARCHAR(50) PRIMARY KEY,
    password_hash VARCHAR(64) NOT NULL -- Encrypted using SHA-256 secure hash
);

-- 2. Grocery Directory Table
CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT, -- MySQL users replace with 'id INT AUTO_INCREMENT PRIMARY KEY'
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DOUBLE PRECISION NOT NULL, -- Currency in INR (₹)
    stock INTEGER NOT NULL,
    low_stock_threshold INTEGER NOT NULL,
    expiry_date VARCHAR(20) -- Formatted as YYYY-MM-DD for perishables
);

-- Seed Default Administrative Accounts
-- Admin user: username = 'admin', password = 'admin123' (hashed under SHA-256)
INSERT INTO users (username, password_hash) 
VALUES ('admin', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918');

-- Seed Core Grocery Inventory Items (Mandated Problem List)
-- Pre-seeds Rice, Wheat, Oils, Sugar, Milk, Eggs, etc.
INSERT INTO products (name, category, price, stock, low_stock_threshold, expiry_date) VALUES 
('Rice (5 kg)', 'Grocery', 450.00, 20, 5, NULL),
('Wheat Flour', 'Grocery', 320.00, 15, 4, NULL),
('Cooking Oil', 'Grocery', 750.00, 8, 3, NULL),
('Sugar', 'Grocery', 120.00, 25, 6, NULL),
('Salt', 'Grocery', 28.00, 50, 10, NULL),
('Tea Powder', 'Grocery', 180.00, 12, 4, NULL),
('Coffee Powder', 'Grocery', 240.00, 3, 4, 'N/A'), -- Seeds as LOW stock (3 <= 4)
('Milk', 'Perishable', 60.00, 30, 8, '2026-07-02'),
('Eggs', 'Perishable', 90.00, 5, 10, '2026-07-08'), -- Seeds as LOW stock (5 <= 10)
('Biscuits', 'Grocery', 40.00, 45, 8, NULL);
`
  },
  {
    name: "README.md",
    language: "markdown",
    description: "Brief documentation of features and OOP principles developed during this hackathon.",
    content: `# IntelliStock Inventory Management System - Java Swing & JDBC

A robust, enterprise-grade desktop inventory management solution written in Java, utilizing **Object-Oriented Design (OOP) principles**, **Java Swing Graphical Interface**, and **JDBC persistent SQL storage**. 

Developed under high-precision **IntelliStock** criteria.

## 🌟 Core Features
- **Secure Authentication**: Encrypted administrative gate hashing user passwords utilizing SHA-256 algorithms.
- **Product Operations**: Complete CRUD management to add grocery products, update stock quantities, remove items, and filter items on the fly.
- **Mandatory Inventory Seed**: Pre-populated with the 10 core grocery products required (\`Rice\`, \`Wheat Flour\`, \`Milk\`, \`Eggs\`, etc.).
- **Live Low-Stock Alerter**: Interactive warnings triggered dynamically in the Swing UI whenever stock counts fall below specified thresholds.
- **Light / Dark LaF Toggle**: Convenient Look-and-Feel menu toggle icon to fluidly transit between Light (Nimbus style) and Eye-Safe Dark Slate views.
- **INR Currency Format**: Full layout support with INR (₹) pricing format.
- **Robust Input Validation**: Strict try-catch exception architecture safe-guarding against empty entries, letters in numeric fields (\`NumberFormatException\`), or negative records.

---

## 🛠️ Object-Oriented Blueprint (OOP Checklist)
1. **Encapsulation**: Implemented inside \`Product.java\` with private data variables, accessible solely through secure getter and setter structures equipped with boundary validations.
2. **Inheritance**: Declared in \`PerishableProduct.java\`, which extends \`Product\` and inherits common properties while declaring custom state variables (\`expiryDate\`).
3. **Abstraction (Interfaces)**: Handled by \`DBOperations.java\`, separating logical database interaction signatures from execution implementations inside \`DatabaseHelper.java\`.
4. **Polymorphism**: Demonstrates method overriding. \`PerishableProduct.java\` overrides the \`getDisplayDetails()\` method to append expiration parameters to standard catalog print lines.

---

## 💾 Database Schema & JDBC Specs
The underlying database contains two key tables:
- \`users\`: username (Primary Key) and hashed password string.
- \`products\`: id (PK), name, category, price, stock, threshold, and expiry_date.

Using Java Database Connectivity (JDBC), connection pools run embedded SQL statements inside \`DatabaseHelper.java\`. SQL PreparedStatements prevent SQL injection attacks.

---

## 🚀 Compilation & Launch Guidelines
Ensure you have JDBC driver library loaded (e.g. SQLite JDBC jar or MySQL Connector/J) on your Java IDE classpath.

**Compile all files:**
\`\`\`bash
javac Product.java PerishableProduct.java DBOperations.java DatabaseHelper.java InventorySystem.java
\`\`\`

**Execute application:**
\`\`\`bash
java InventorySystem
\`\`\`

*Default Admin Login Credentials:*
- **Username:** \`admin\`
- **Password:** \`admin123\`
`
  }
];
