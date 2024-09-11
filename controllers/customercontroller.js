const connection = require("../connectmysql");

const customerslist = async (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const limit = parseInt(req.query.limit) || 10; 
    const offset = (page - 1) * limit; 
  
    try {
      const [totalCountResult] = await connection.promise().query("SELECT COUNT(*) AS total FROM Customers");
      const totalCustomers = totalCountResult[0].total;
      const totalPages = Math.ceil(totalCustomers / limit); 
  
      const [customers] = await connection.promise().query("SELECT * FROM Customers LIMIT ? OFFSET ?", [limit, offset]);
  
      res.render("customerlist", {
        customers,
        currentPage: page,
        totalPages,
      });
    } catch (error) {
      console.error("Error fetching customers: ", error);
      res.status(500).send("An error occurred while fetching customers.");
    }
  };
  

const AddCustomer = (req, res) => {
  res.render("addcustomer");
};

const insertcustomer = async (req, res) => {
  const { customer_name, email, phone, address, notes, balance } = req.body;

  try {
    const [existingCustomer] = await connection
      .promise()
      .query(`SELECT * FROM Customers WHERE email = ?`, [email]);

    if (existingCustomer.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: "Email already exists." });
    }

    const [result] = await connection.promise().query(
      `INSERT INTO Customers (customer_name, email, phone, address, notes, balance) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      [customer_name, email, phone, address, notes, balance]
    );

    res.status(201).json({
      success: true,
      message: "Customer added successfully.",
      customerId: result.insertId,
    });
  } catch (error) {
    console.error("Error inserting customer: ", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while adding the customer.",
    });
  }
};

const editCustomer = async (req, res) => {
  const customerId = req.query.id;

  try {
    const [customer] = await connection
      .promise()
      .query(`SELECT * FROM Customers WHERE id = ?`, [customerId]);

    res.render("editcustomer", { customer: customer[0] });
  } catch (error) {
    console.error("Error fetching customer details:", error);
    res.status(500).send("An error occurred while fetching customer details.");
  }
};

const updateCustomer = async (req, res) => {
  const { id, customer_name, email, phone, address, notes, balance } = req.body;

  try {
    await connection.promise().query(
      `UPDATE Customers 
         SET customer_name = ?, email = ?, phone = ?, address = ?, notes = ?, balance = ? 
         WHERE id = ?`,
      [customer_name, email, phone, address, notes, balance, id]
    );

    res.json({ success: true, message: "Customer updated successfully." });
  } catch (error) {
    console.error("Error updating customer:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while updating the customer.",
      });
  }
};

const deletecustomer = async (req, res) => {
    try {
        const id = req.query.id;

        await connection.promise().query(`DELETE FROM Customers WHERE id = ?`, [id]);

        res.redirect('/customerslist')
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ success: false, message: 'An error occurred while deleting the customer.' });
    }
};

module.exports = {
  customerslist,
  AddCustomer,
  insertcustomer,
  editCustomer,
  updateCustomer,
  deletecustomer
};
