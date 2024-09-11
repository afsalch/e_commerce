const connection = require('../connectmysql');


const paymentlist = async (req, res) => {
    const page = parseInt(req.query.page) || 1; 
    const pageSize = 3; 
    const offset = (page - 1) * pageSize;

    try {
        const [payments] = await connection.promise().query("SELECT * FROM Payments LIMIT ? OFFSET ?", [pageSize, offset]);

        const [[{ totalCount }]] = await connection.promise().query("SELECT COUNT(*) as totalCount FROM Payments");

        const totalPages = Math.ceil(totalCount / pageSize);

        res.render('paymentlist', { payments, currentPage: page, totalPages });
    } catch (error) {
        console.error("Error fetching payments: ", error);
        res.status(500).json({ message: "An error occurred while fetching the payments." });
    }
};


const AddPayment = (req,res)=>{
    res.render('AddPayment')
}

const insertpayment = async (req, res) => {
    try {
        const { payment_type, status } = req.body;

        const query = 'INSERT INTO Payments (payment_type, status) VALUES (?, ?)';
        const [result] = await connection.promise().query(query, [payment_type, status]);

        return res.status(200).json({ message: "Payment added successfully" });
    } catch (error) {
        console.error('Error inserting payment:', error);
        res.status(500).json({ message: 'An error occurred while inserting the payment.' });
    }
};

const updateStatus = async (req,res)=>{
    const { id, status } = req.query;

    try {
        await connection.promise().query('UPDATE Payments SET status = ? WHERE id = ?', [status, id]);

        res.redirect('/paymentlist');
    } catch (error) {
        console.error('Error updating payment status: ', error);
        res.status(500).json({ message: 'An error occurred while updating the payment status.' });
    }
}

const editpayment = async (req,res)=>{
    const { id } = req.query;

    try {
        const [payments] = await connection.promise().query('SELECT * FROM Payments WHERE id = ?', [id]);

        
            res.render('editpayment', { payment: payments[0] });
        
    } catch (error) {
        console.error('Error fetching payment: ', error);
        res.status(500).json({ message: 'An error occurred while fetching the payment.' });
    }
}

const updatepayment = async (req, res) => {
    const { id } = req.params;
    const { payment_type } = req.body;

    try {
        await connection.promise().query('UPDATE Payments SET payment_type = ? WHERE id = ?', [payment_type, id]);

        res.status(200).json({ message: 'Payment updated successfully.' });
    } catch (error) {
        console.error('Error updating payment: ', error);
        res.status(500).json({ message: 'An error occurred while updating the payment.' });
    }
};

const deletepayment = async (req,res)=>{
    const id = req.query.id;

    try {
        await connection.promise().query('DELETE FROM Payments WHERE id = ?', [id]);
        res.redirect('/paymentlist')
    } catch (error) {
        console.error('Error deleting payment: ', error);
        res.status(500).json({ message: 'An error occurred while deleting the payment.' });
    }
}


module.exports = {
  paymentlist,
  AddPayment,
  insertpayment,
  updateStatus,
  editpayment,
  updatepayment,
  deletepayment
};
