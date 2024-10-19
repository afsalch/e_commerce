const connection = require("../connectmysql");

const subexpencelist = async (req, res) => {
    try {
      const itemsPerPage = 3; 
      const page = parseInt(req.query.page) || 1; 
  
      const offset = (page - 1) * itemsPerPage;
  
      // Fetch total count of sub-expenses
      const [totalResults] = await connection.promise().query(`
              SELECT COUNT(*) AS total
              FROM Expenses
              WHERE subcategory_name  IS NOT NULL
          `);
      const totalSubexpenses = totalResults[0].total;
      const totalPages = Math.ceil(totalSubexpenses / itemsPerPage);
  
      // Fetch sub-expenses with pagination, including `created_at`
      const [expenseList] = await connection.promise().query(
        `
              SELECT id AS expense_id, category_name, subcategory_name, expense_amount, created_at
              FROM Expenses
              WHERE subcategory_name IS NOT NULL
              LIMIT ?, ?
          `,
        [offset, itemsPerPage]
      );
  
      // Process the results to create an array of sub-expenses
      const expenses = expenseList.map((expense) => {
        const subexpenses = expense.subcategory_name
          .split(",")
          .map((sub) => sub.trim());
        return {
          expense_id: expense.expense_id,
          expense_name: expense.category_name,
          subexpenses: subexpenses,
          expense_amount: expense.expense_amount,
          created_at: expense.created_at, 
        };
      });
  
  
      // Render the subexpencelist view and pass the necessary data
      res.render("subexpencelist", { expenses, totalPages, currentPage: page });
    } catch (error) {
      console.error("Error retrieving sub-expenses:", error);
      res.status(500).send("An error occurred while fetching sub-expenses.");
    }
  };
  

const AddSubExpence = async (req, res) => {
  try {
    const [categories] = await connection
      .promise()
      .query("SELECT * FROM Categories");

    const groupedCategories = categories.reduce((acc, curr) => {
      const categoryName = curr.category_name;
      const subcategoryName = curr.subcategory_name;

      if (!acc[categoryName]) {
        acc[categoryName] = {
          category_name: categoryName,
          subcategories: [],
        };
      }

      if (subcategoryName) {
        acc[categoryName].subcategories.push({
          id: curr.id,
          subcategory_name: subcategoryName,
        });
      }

      return acc;
    }, {});

    const categoryLength = categories.length;

    res.render("addsubexpence", { groupedCategories, categoryLength });
  } catch (error) {
    console.error("Error retrieving expenses:", error);
    res.status(500).send("Internal Server Error");
  }
};

const insertsubexpense = async (req, res) => {
    const { category_name, subcategory_name, amount, notes } = req.body;
    console.log(`category_name ${category_name}`);
    console.log(`subcategory_name ${subcategory_name}`);
    console.log(`amount ${amount}`);
    
    try {
      // Insert the new subexpense
      await connection
        .promise()
        .query(
          "INSERT INTO Expenses (category_name, subcategory_name, expense_amount, notes) VALUES (?, ?, ?, ?)",
          [category_name, subcategory_name, amount, notes]
        );
  
      res
        .status(201)
        .json({ success: true, message: "Sub Expense added successfully." });
    } catch (error) { 
      console.error("Error adding subexpense: ", error);
      res
        .status(500)
        .json({
          success: false,
          message: "An error occurred while adding the subexpense.",
        });
    }
  };
  
  

  const editsubexpense = async (req, res) => {
    try {
      // Extract the ID from the query parameters
      const expenseId = req.query.id;
  
      // Query the database to get the expense with the specific ID
      const [expense] = await connection
        .promise()
        .query("SELECT * FROM Expenses WHERE id = ?", [expenseId]);
  
      // Check if the expense was found
      if (expense.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Expense not found." });
      }

      const [categories] = await connection
      .promise()
      .query("SELECT * FROM Categories");
  
      // Group categories and subcategories
      const groupedCategories = categories.reduce((acc, curr) => {
        const categoryName = curr.category_name;
        const subcategoryName = curr.subcategory_name;
  
        if (!acc[categoryName]) {
          acc[categoryName] = {
            category_name: categoryName,
            subcategories: [], 
          };
        }
  
        if (subcategoryName) {
          acc[categoryName].subcategories.push({
            id: curr.id,
            subcategory_name: subcategoryName,
          });
        }
  
        return acc;
      }, {});

      const selectedCategory = expense[0].category_name;

      const selectedSubcategories = groupedCategories[selectedCategory]
        ? groupedCategories[selectedCategory].subcategories
        : [];

        
  
      res.render("editsubexpence", { 
          expense: expense[0], 
          groupedCategories,
          selectedCategory,
          selectedSubcategory: expense[0].subcategory_name, 
          selectedSubcategories 
        });
          
    } catch (error) {
      console.error("Error retrieving expense:", error);
      res.status(500).send("Internal Server Error");
    }
  };

  
  


  
  

  const updatesubexpense = async (req, res) => {
    try {
      console.log("updateCategorySubcategory");
      const { expense_id, category_name, subcategory_name, amount } = req.body;
      console.log("req.body:", JSON.stringify(req.body));
  
      // Check if the expense exists
      const [currentExpense] = await connection
        .promise()
        .query("SELECT * FROM Expenses WHERE id = ?", [expense_id]);
  
      if (currentExpense.length === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Expense not found." });
      }
  
      // Update the category, subcategory, and amount in the database
      const [result] = await connection
        .promise()
        .query(
          "UPDATE Expenses SET category_name = ?, subcategory_name = ?, expense_amount = ? WHERE id = ?",
          [category_name, subcategory_name, amount, expense_id]
        );
  
      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ success: false, message: "Expense not found." });
      }
  
      res
        .status(200)
        .json({ success: true, message: "Category, Subcategory, and Amount updated successfully!" });
    } catch (error) {
      console.error("Error updating category and subcategory:", error);
      res
        .status(500)
        .json({ success: false, message: "Failed to update Category and Subcategory." });
    }
  };
  
  

const deletesubexpence = async (req, res) => {
  try {
    // Extract the ID from the query parameters
    const expense_id = req.query.id;

    // Check if the ID is provided
    if (!expense_id) {
      return res
        .status(400)
        .json({ success: false, message: "Sub Expense ID is required." });
    }

    // Delete the sub-expense from the database
    await connection
      .promise()
      .query(`DELETE FROM Expenses WHERE id = ?`, [
        expense_id,
      ]);

    res.redirect("/subexpencelist");
  } catch (error) {
    console.error("Error deleting sub-expense:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete Sub Expense." });
  }
};

module.exports = {
  subexpencelist,
  AddSubExpence,
  insertsubexpense,
  editsubexpense,
  updatesubexpense,
  deletesubexpence,
};
