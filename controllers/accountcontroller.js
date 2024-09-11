const connection = require('../connectmysql');


const accountlist = async (req, res) => {
    const itemsPerPage = 10; 
    const currentPage = parseInt(req.query.page) || 1; 

    try {
        const [totalAccounts] = await connection.promise().query("SELECT COUNT(*) AS total FROM account");
        const totalItems = totalAccounts[0].total;

        const totalPages = Math.ceil(totalItems / itemsPerPage);

        const offset = (currentPage - 1) * itemsPerPage;

        const [accounts] = await connection.promise().query("SELECT * FROM account LIMIT ?, ?", [offset, itemsPerPage]);

        // Render the accountlist view, passing the accounts data and pagination info
        res.render('accountlist', { accounts, totalPages, currentPage });
    } catch (error) {
        console.error("Error fetching accounts: ", error);
        res.status(500).json({ message: "An error occurred while fetching the accounts." });
    }
}


const AddAccount = (req,res)=>{
    res.render('addaccount')
}

const insertAccount = async (req,res)=>{
    const { acc_name, acc_number, price, notes } = req.body;

    try {
        // Insert the account into the database
        const [result] = await connection.promise().query(
            "INSERT INTO Account (acc_name, acc_number, price, notes) VALUES (?, ?, ?, ?)",
            [acc_name, acc_number, price, notes]
        );
        

        return res.status(201).json({ message: "Account added successfully." });
    } catch (error) {
        console.log('catch');
        console.error("Error adding account: ", error);
        return res.status(500).json({ message: "An error occurred while adding the account." });
    }
}


const editacc = async (req, res) => {
    try {
        const accountId = req.query.id;

        const [account] = await connection.promise().query("SELECT * FROM account WHERE id = ?", [accountId]);

        if (account.length === 0) {
            return res.status(404).json({ message: "Account not found." });
        }

        res.render('editaccount', { account: account[0] });
    } catch (error) {
        console.error("Error fetching account for editing: ", error);
        res.status(500).json({ message: "An error occurred while fetching the account." });
    }
}

const updateAccount = async (req, res) => {
    try {
        const { id, acc_name, acc_number, price, notes } = req.body;

        const query = `
            UPDATE account
            SET acc_name = ?, acc_number = ?, price = ?, notes = ?
            WHERE id = ?;
        `;

        const [result] = await connection.promise().query(query, [acc_name, acc_number, price, notes, id]);

        if (result.affectedRows > 0) {
            return res.status(200).json({ message: 'Account updated successfully.' });
        } 
    } catch (error) {
        console.error('Error updating account: ', error);
        return res.status(500).json({ message: 'An error occurred while updating the account.' });
    }
};

const deleteAccount = async (req, res) => {
    try {
        const accountId = req.query.id; 

        await connection.promise().query(
            "DELETE FROM account WHERE id = ?",
            [accountId]
        );

        res.redirect('/accountlist');

    } catch (error) {
        console.error('Error deleting account:', error);
        return res.status(500).json({ message: 'An error occurred while deleting the account.' });
    }
};



module.exports = {
    accountlist,
    AddAccount,
    insertAccount,
    editacc,
    updateAccount,
    deleteAccount
  };
  