const connection = require('../connectmysql'); 

const createAdminTableQuery = `
CREATE TABLE IF NOT EXISTS Admin (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'staff') NOT NULL,
  isBlocked BOOLEAN DEFAULT FALSE,
  otp VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`

const createAccountTableQuery = `
CREATE TABLE IF NOT EXISTS Accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,  
  acc_name VARCHAR(255) NOT NULL,
  acc_number VARCHAR(50) NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  status BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;


const createPaymentTableQuery = `
CREATE TABLE IF NOT EXISTS Payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  payment_type VARCHAR(255) NOT NULL,
  status ENUM('Active', 'Inactive') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

const createCustomerTableQuery = `
CREATE TABLE IF NOT EXISTS Customers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20) NOT NULL,
  address TEXT,
  notes TEXT,
  balance DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

const createCategoryTableQuery = `
CREATE TABLE IF NOT EXISTS Categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(255) NOT NULL,
  subcategory_name TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

const createTransactionTableQuery = `
CREATE TABLE IF NOT EXISTS Transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transaction_date DATE NOT NULL,
  customer_name VARCHAR(255) NOT NULL,  
  amount DECIMAL(10, 2) NOT NULL,
  category_name VARCHAR(255) NOT NULL,
  subcategory_name VARCHAR(255) NOT NULL,
  payment_method VARCHAR(255) NOT NULL,  
  margin INT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;

const createExpenseTableQuery = `
CREATE TABLE IF NOT EXISTS Expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(255) NOT NULL,
  subcategory_name VARCHAR(255),
  expense_amount DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
`;




// Function to create all the tables
async function createTables() {
    try {
        await connection.promise().query(createAdminTableQuery);
        await connection.promise().query(createAccountTableQuery);
        await connection.promise().query(createPaymentTableQuery);
        await connection.promise().query(createCustomerTableQuery);
        await connection.promise().query(createCategoryTableQuery);
        await connection.promise().query(createTransactionTableQuery); 
        await connection.promise().query(createExpenseTableQuery);  
    } catch (error) {
        console.error("Error creating tables: ", error);
    }
}

module.exports = {
    createTables,
};
