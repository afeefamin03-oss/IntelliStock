export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  stock: number;
  lowStockThreshold: number;
  expiryDate?: string;
}

export interface SqlUser {
  username: string;
  passwordHash: string;
}

export interface JdbcLog {
  id: string;
  timestamp: string;
  operationType: "SELECT" | "INSERT" | "UPDATE" | "DELETE" | "AUTH" | "DDL";
  sqlStatement: string;
  javaCodeSnippet: string;
  status: "SUCCESS" | "FAILED";
  exceptionMessage?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
}
