const connection = require("../connectmysql");
const PDFDocument = require("pdfkit");

const transactionlist = async (req, res) => {
  try {
    const itemsPerPage = 3;
    const currentPage = parseInt(req.query.page) || 1;

    const [[{ count }]] = await connection
      .promise()
      .query("SELECT COUNT(*) AS count FROM Transactions");
    const totalPages = Math.ceil(count / itemsPerPage);

    const offset = (currentPage - 1) * itemsPerPage;

    const [transactions] = await connection
      .promise()
      .query(`SELECT * FROM Transactions LIMIT ?, ?`, [offset, itemsPerPage]);

    res.render("transactionlist", { transactions, currentPage, totalPages });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).send("Internal Server Error");
  }
};

const AddTransaction = async (req, res) => {
  try {
    const [customers] = await connection
      .promise()
      .query("SELECT * FROM Customers");

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
    const [paymentTypes] = await connection
      .promise()
      .query("SELECT * FROM Payments");

    res.render("AddTransaction", {
      customers,
      groupedCategories,
      paymentTypes,
      categoryLength,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("An error occurred while fetching data.");
  }
};

const getsubcategories = async (req, res) => {
  try {
    const { category_name } = req.body;

    const [categories] = await connection
      .promise()
      .query("SELECT * FROM Categories WHERE category_name = ?", [
        category_name,
      ]);

    const subcategories = categories
      .filter((category) => category.subcategory_name)
      .map((category) => category.subcategory_name);

    res.json({ success: true, subcategories });
  } catch (error) {
    console.error("Error fetching subcategories:", error);
    res.status(500).send("An error occurred while fetching subcategories.");
  }
};

const insertTransaction = async (req, res) => {
  const {
    transaction_date,
    customer_id,
    amount,
    category_name,
    subcategory_name,
    payment_method,
    notes,
    margin,
  } = req.body;

  const query = `
        INSERT INTO Transactions (transaction_date, customer_name, amount, category_name, subcategory_name, payment_method, notes, margin)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

  try {
    await connection
      .promise()
      .query(query, [
        transaction_date,
        customer_id,
        amount,
        category_name,
        subcategory_name,
        payment_method,
        notes,
        margin,
      ]);
    res.json({ success: true });
  } catch (error) {
    console.error("Error inserting transaction:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while inserting the transaction.",
      });
  }
};

const edittransaction = async (req, res) => {
  try {
    const id = req.query.id;

    const [Transactions] = await connection
      .promise()
      .query(`SELECT * FROM Transactions WHERE id = ?`, [id]);


    if (!Transactions.length) {
      return res.status(404).send("Transaction not found");
    }

    const transaction = Transactions[0];

    const [subcategories] = await connection
      .promise()
      .query(`SELECT * FROM Categories WHERE category_name = ?`, [
        transaction.category_name,
      ]);

    const [customers] = await connection
      .promise()
      .query("SELECT * FROM Customers");

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

    const categoriesArray = Object.values(groupedCategories);

    const [paymentTypes] = await connection
      .promise()
      .query("SELECT * FROM Payments");

    res.render("edittransaction", {
      transaction,
      customers,
      groupedCategories: categoriesArray,
      paymentTypes,
      subcategories,
    });
  } catch (error) {
    console.error("Error fetching transaction data:", error);
    res.status(500).send("Internal Server Error");
  }
};

const updatetransaction = async (req, res) => {
  try {
    const {
      transaction_id,
      transaction_date,
      customer_name,
      amount,
      margin,
      category_name,
      subcategory_name,
      payment_method,
      notes,
    } = req.body;

    const query = `
            UPDATE Transactions
            SET 
                transaction_date = ?, 
                customer_name = ?, 
                amount = ?, 
                margin = ?,
                category_name = ?, 
                subcategory_name = ?, 
                payment_method = ?, 
                notes = ?
            WHERE id = ?
        `;

    const values = [
      transaction_date,
      customer_name,
      amount,
      margin,
      category_name,
      subcategory_name,
      payment_method,
      notes,
      transaction_id,
    ];

    connection.query(query, values);

    return res.json({
      success: true,
      message: "Transaction updated successfully.",
    });
  } catch (error) {
    console.log("catch");
    console.error("Error updating transaction:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while updating the transaction.",
      });
  }
};

const deletetransaction = async (req, res) => {
  try {
    const id = req.query.id;

    await connection
      .promise()
      .query(`DELETE FROM Transactions  WHERE id = ?`, [id]);

    res.redirect("/transactionlist");
  } catch (error) {}
};

const downloadtransaction = async (req, res) => {
  try {
    const transactionId = req.query.id;

    // Fetch the transaction details from the database
    const [transactionResult] = await connection
      .promise()
      .query("SELECT * FROM Transactions WHERE id = ?", [transactionId]);

    if (transactionResult.length === 0) {
      return res.status(404).send("Transaction not found");
    }

    const transaction = transactionResult[0];

    const doc = new PDFDocument();

    // Set the headers for the PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="transaction.pdf"'
    );

    doc.pipe(res);

    // PDF Content
    doc
      .font("Helvetica-Bold")
      .fontSize(20)
      .text("Transaction Details", { align: "center" })
      .moveDown(2);

    doc
      .font("Helvetica")
      .fontSize(12)
      .text(
        `Transaction Date: ${new Date(
          transaction.transaction_date
        ).toDateString()}`,
        { align: "left" }
      )
      .moveDown(0.5);

    doc
      .text(`Customer Name: ${transaction.customer_name}`, { align: "left" })
      .moveDown(0.5);

    doc
      .text(`Amount: $${parseFloat(transaction.amount).toFixed(2)}`, {
        align: "left",
      }) // Changed line
      .moveDown(0.5);

    doc
      .text(`Category: ${transaction.category_name}`, { align: "left" })
      .moveDown(0.5);

    doc
      .text(`Subcategory: ${transaction.subcategory_name}`, { align: "left" })
      .moveDown(0.5);

    doc
      .text(`Payment Method: ${transaction.payment_method}`, { align: "left" })
      .moveDown(0.5);

    doc.text(`Margin: $${transaction.margin}`, { align: "left" }).moveDown(0.5);

    if (transaction.notes) {
      doc.text(`Notes: ${transaction.notes}`, { align: "left" }).moveDown(0.5);
    }

    // End the document
    doc.end();
  } catch (error) {
    console.error("Error generating transaction PDF:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  transactionlist,
  AddTransaction,
  getsubcategories,
  insertTransaction,
  edittransaction,
  updatetransaction,
  deletetransaction,
  downloadtransaction,
};
