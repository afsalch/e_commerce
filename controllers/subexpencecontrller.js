const connection = require('../connectmysql');


const subexpencelist = async (req, res) => {
    try {
        const itemsPerPage = 3; // Number of sub-expenses per page
        const page = parseInt(req.query.page) || 1; // Current page number, default to 1

        // Calculate the offset for the query
        const offset = (page - 1) * itemsPerPage;

        // Fetch the total number of sub-expenses
        const [totalResults] = await connection.promise().query(`
            SELECT COUNT(*) AS total
            FROM Expenses
            WHERE subexpense_name IS NOT NULL
        `);
        const totalSubexpenses = totalResults[0].total;
        const totalPages = Math.ceil(totalSubexpenses / itemsPerPage);

        // Fetch sub-expenses for the current page
        const [expenseList] = await connection.promise().query(`
            SELECT id AS expense_id, expense_name, subexpense_name, expense_amount
            FROM Expenses
            WHERE subexpense_name IS NOT NULL
            LIMIT ?, ?
        `, [offset, itemsPerPage]);

        // Process the results to create an array of sub-expenses
        const expenses = expenseList.map(expense => {
            const subexpenses = expense.subexpense_name.split(',').map(sub => sub.trim());
            return {
                expense_id: expense.expense_id,
                expense_name: expense.expense_name,
                subexpenses: subexpenses,
                expense_amount: expense.expense_amount
            };
        });

        

        res.render("subexpencelist", { expenses, totalPages, currentPage: page });
    } catch (error) {
        console.error("Error retrieving sub-expenses:", error);
        res.status(500).send('An error occurred while fetching sub-expenses.');
    }
};




const AddSubExpence = async (req, res) => {
    try {
        const [expenses] = await connection.promise().query("SELECT DISTINCT expense_name FROM Expenses");

        res.render('addsubexpence', { expenses });
    } catch (error) {
        console.error("Error retrieving expenses:", error);
        res.status(500).send("Internal Server Error");
    }
}


const insertsubexpense = async (req, res) => {
    const { subexpense_name, expense_name, amount, notes } = req.body;

    try {
        // Check if the expense exists
        const [expense] = await connection.promise().query(
            'SELECT * FROM Expenses WHERE expense_name = ? AND subexpense_name IS NULL',
            [expense_name]
        );

        if (expense.length === 0) {
            return res.status(404).json({ success: false, message: 'Expense not found.' });
        }

        // Check if the subexpense name already exists for the given expense
        const [existingSubexpense] = await connection.promise().query(
            'SELECT * FROM Expenses WHERE subexpense_name = ? AND expense_name = ?',
            [subexpense_name, expense_name]
        );

        if (existingSubexpense.length > 0) {
            return res.status(409).json({ success: false, message: 'Sub Expense name must be unique within the Expense.' });
        }

        // Insert the new subexpense
        await connection.promise().query(
            'INSERT INTO Expenses (subexpense_name, expense_name, expense_amount, notes) VALUES (?, ?, ?, ?)',
            [subexpense_name, expense_name, amount, notes]
        );

        res.status(201).json({ success: true, message: 'Sub Expense added successfully.' });

    } catch (error) {
        console.error('Error adding subexpense: ', error);
        res.status(500).json({ success: false, message: 'An error occurred while adding the subexpense.' }); 
    }
};



const editsubexpense = async (req, res) => {
    try {
        // Extract the ID from the query parameters
        const expenseId = req.query.id;

        // Query the database to get the expense with the specific ID
        const [expense] = await connection.promise().query(
            'SELECT * FROM Expenses WHERE id = ?',
            [expenseId]
        );

        // Query to get distinct expense names
        const [expenses] = await connection.promise().query("SELECT DISTINCT expense_name FROM Expenses");

        if (expense.length === 0) {
            return res.status(404).json({ success: false, message: 'Expense not found.' });
        }

        // Pass the expense data and expenses to the 'editsubexpence' view
        res.render('editsubexpence', { expense: expense[0], expenses });
    } catch (error) {
        console.error("Error retrieving expense:", error);
        res.status(500).send("Internal Server Error");
    }
};


const updatesubexpense = async (req, res) => {
    try {
        console.log('updatesubexpense');
        const { expense_id, subexpense_name, amount } = req.body;
        console.log('req.body:', JSON.stringify(req.body));

        // Check if the current sub-expense name exists and is different from the new name
        const [existingSubexpense] = await connection.promise().query(
            'SELECT * FROM Expenses WHERE subexpense_name = ? AND id != ?',
            [subexpense_name, expense_id]
        );

        if (existingSubexpense.length > 0) {
            return res.status(409).json({ success: false, message: 'Sub Expense name must be unique within the Expense.' });
        }

        // Check if the sub-expense exists
        const [currentSubexpense] = await connection.promise().query(
            'SELECT * FROM Expenses WHERE id = ?',
            [expense_id]
        );

        if (currentSubexpense.length === 0) {
            return res.status(404).json({ success: false, message: 'Sub Expense not found.' });
        }

        // Update the sub-expense in the database
        const [result] = await connection.promise().query(
            'UPDATE Expenses SET subexpense_name = ?, expense_amount = ? WHERE id = ?',
            [subexpense_name, amount, expense_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Sub Expense not found.' });
        }

        res.status(200).json({ success: true, message: 'Sub Expense updated successfully!' });
    } catch (error) {
        console.error("Error updating sub-expense:", error);
        res.status(500).json({ success: false, message: 'Failed to update Sub Expense.' });
    }
};

const deletesubexpence = async (req, res) => {
    try {
        // Extract the ID from the query parameters
        const subexpense_name = req.query.id;

        // Check if the ID is provided
        if (!subexpense_name) {
            return res.status(400).json({ success: false, message: 'Sub Expense ID is required.' });
        }

        // Delete the sub-expense from the database
        await connection.promise().query(`DELETE FROM Expenses WHERE subexpense_name = ?`, [subexpense_name]);


       res.redirect('/subexpencelist')
    } catch (error) {
        console.error("Error deleting sub-expense:", error);
        res.status(500).json({ success: false, message: 'Failed to delete Sub Expense.' });
    }
};







module.exports = {
    subexpencelist,
    AddSubExpence,
    insertsubexpense,
    editsubexpense,
    updatesubexpense,
    deletesubexpence
  };