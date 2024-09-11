const connection = require("../connectmysql");

const expencelist = async (req, res) => {
    try {
        const itemsPerPage = 3; 
        const currentPage = parseInt(req.query.page) || 1;

        // Get the count of distinct expense names
        const [totalExpensesResult] = await connection
            .promise()
            .query("SELECT COUNT(DISTINCT expense_name) as count FROM Expenses");
        const totalExpenses = totalExpensesResult[0].count;

        const totalPages = Math.ceil(totalExpenses / itemsPerPage);

        const offset = (currentPage - 1) * itemsPerPage;

        // Get paginated distinct expense names
        const [expenses] = await connection
            .promise()
            .query("SELECT DISTINCT expense_name FROM Expenses LIMIT ? OFFSET ?", [itemsPerPage, offset]);

            console.log(expenses);
            

        res.render("expencelist", { expenses, totalPages, currentPage });
    } catch (error) {
        console.error("Error retrieving expenses:", error);
        res.status(500).send("Internal Server Error");
    }
};

  

const AddExpence = (req, res) => {
  try {
    res.render("AddExpence");
  } catch (error) {}
};

const insertexpense = async (req, res) => {
  const { expense_name, notes } = req.body;

  try {
    // Check if the expense already exists
    const checkExpenseQuery = `
            SELECT * FROM Expenses WHERE expense_name = ?;
        `;
    const [existingExpense] = await connection
      .promise()
      .query(checkExpenseQuery, [expense_name]);

    // If expense already exists, return a response
    if (existingExpense.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: "Expense already exists." });
    }

    // SQL query to insert data into the Expenses table
    const insertExpenseQuery = `
            INSERT INTO Expenses (expense_name, notes)
            VALUES (?, ?);
        `;

    // Execute the query
    const [result] = await connection
      .promise()
      .query(insertExpenseQuery, [expense_name, notes]);

    // Check if the insertion was successful
    if (result.affectedRows > 0) {
      res
        .status(201)
        .json({ success: true, message: "Expense added successfully." });
    } else {
      res
        .status(500)
        .json({ success: false, message: "Failed to add expense." });
    }
  } catch (error) {
    console.error("Error inserting expense:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const editexpense = async (req, res) => {
  try {
    const expence_name = req.query.expence_name;
    

    const [rows] = await connection
      .promise()
      .query("SELECT * FROM Expenses WHERE expense_name = ?", [expence_name]);

    const expense = rows[0];

    res.render("editexpence", { expense });
  } catch (error) {
    console.error("Error fetching expense: ", error);
    res.status(500).send("Server error");
  }
};

const updateExpense = async (req, res) => {
  const { existing_expence_name, expense_name, notes } = req.body;
  console.log(`existing_expence_name ${existing_expence_name}`);
  

  try {
    // First, check if the expense name already exists
    const checkExpenseQuery = `
        SELECT * FROM Expenses WHERE expense_name = ?;
    `;
    const [existingExpense] = await connection
      .promise()
      .query(checkExpenseQuery, [expense_name]);

    // If expense already exists, return a response
    if (existingExpense.length > 0) {
      return res
        .status(409)
        .json({ success: false, message: "Expense name already exists." });
    }

    // If the name is unique, proceed with the update
    const updateExpenseQuery = `
            UPDATE Expenses
            SET expense_name = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
            WHERE expense_name = ?;
        `;

    const [result] = await connection
      .promise()
      .query(updateExpenseQuery, [expense_name, notes, existing_expence_name]);

    if (result.affectedRows > 0) {
      res
        .status(200)
        .json({ success: true, message: "Expense updated successfully." });
    } else {
      res.status(404).json({ success: false, message: "Expense not found." });
    }
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

const deleteexpense = async (req,res)=>{
    try {
        const expense_name = req.query.expense_name;

        await connection.promise().query(`DELETE FROM Expenses WHERE expense_name = ?`, [expense_name]);

        res.redirect('/expencelist')
    } catch (error) {
        
    }
}

module.exports = {
  expencelist,
  AddExpence,
  insertexpense,
  editexpense,
  updateExpense,
  deleteexpense
};
