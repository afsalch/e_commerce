const bcrypt = require("bcrypt");
const connection = require("../connectmysql");
const nodemailer = require("nodemailer");

const loginload = (req, res) => {
  if (req.session.AdminId) {
    res.redirect("/dashboard");
  } else {
    res.render("login");
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the email exists in the database without filtering by role
    const [existingUser] = await connection
      .promise()
      .query("SELECT * FROM admin WHERE email = ?", [email]);

    // Check if the user exists
    if (existingUser.length === 0) {
      return res
        .status(400)
        .json({ emailerror: "This email does not exist in our records." });
    }

    const user = existingUser[0];

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(400).json({ passworderror: "Incorrect password." });
    }

    // Check if the user is blocked
    if (user.isBlocked) {
      return res.status(403).json({
        isblocked: "Your account is blocked. Please contact support.",
      });
    }

    // Set session
    req.session.AdminId = user.id; 

    return res.status(200).json({ message: "Login successful!" }); 
  } catch (error) {
    console.error("Error during login:", error);
    return res
      .status(500)
      .json({ error: "An error occurred. Please try again later." });
  }
};

const dashboardload = async (req, res) => {
  if (req.session.AdminId) {
    try {
      // Fetch all transaction margins
      const [transactionResult] = await connection.promise().query(`
        SELECT margin FROM Transactions
      `);


      // Calculate total transaction margin
      const totalTransactionMargin = transactionResult.reduce((acc, row) => {
        const margin = parseFloat(row.margin);
        return acc + (isNaN(margin) ? 0 : margin); 
      }, 0);

      // If no transactions, set totalTransactionMargin to 0
      const finalTransactionMargin = isNaN(totalTransactionMargin) ? 0 : totalTransactionMargin;


      // Fetch all expense amounts
      const [expenseResult] = await connection.promise().query(`
        SELECT expense_amount FROM Expenses
      `);


      // Calculate total expense amount
      const totalExpenseAmount = expenseResult.reduce((acc, row) => {
        const expenseAmount = parseFloat(row.expense_amount);
        return acc + (isNaN(expenseAmount) ? 0 : expenseAmount); 
      }, 0);

      // If no expenses, set totalExpenseAmount to 0
      const finalExpenseAmount = isNaN(totalExpenseAmount) ? 0 : totalExpenseAmount;


      // Calculate the net amount (totalTransactionMargin - totalExpenseAmount)
      const netAmount = finalTransactionMargin - finalExpenseAmount;


      // Render the dashboard with the calculated netAmount
      res.render("dashboard", { netAmount });
    } catch (error) {
      console.error("Error loading dashboard:", error);
      res.status(500).send("Error loading dashboard");
    }
  } else {
    res.redirect("/");
  }
};






const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Could not log out.");
    } else {
      res.clearCookie("connect.sid");
      return res.redirect("/");
    }
  });
};

const forgetpassword = (req, res) => {
  try {
    res.render("forgetpassword");
  } catch (error) {}
};

const editpassword = async (req, res) => {
  try {
    const { email } = req.body;

    const query = "SELECT * FROM Admin WHERE email = ?";
    const otp = Math.floor(1000 + Math.random() * 9000);

    connection.query(query, [email], async (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return res.status(500).json({
          error: "An internal error occurred. Please try again later.",
        });
      }

      if (results.length === 0) {
        return res
          .status(400)
          .json({ emailerror: "This email does not exist." });
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "testotp456@gmail.com",
          pass: "rzkd otrs nzsx plws",
        },
      });

      const mailOptions = {
        from: "testotp456@gmail.com",
        to: email,
        subject: "Your OTP for Password Reset",
        text: `Your OTP for password reset is ${otp}.`,
      };

      try {
        await transporter.sendMail(mailOptions);

        const updateQuery =
          "UPDATE Admin SET otp = ?, otp_expires_at = ? WHERE email = ?";
        const otpExpiration = new Date(Date.now() + 15 * 60000);

        connection.query(
          updateQuery,
          [otp, otpExpiration, email],
          (err, result) => {
            if (err) {
              console.error("Error updating OTP in database:", err);
              return res.status(500).json({
                error: "Failed to save OTP. Please try again later.",
              });
            }

            res.status(200).json({
              success: true,
              message: "OTP sent to your email. Please check your inbox.",
              email: email,
            });
          }
        );
      } catch (err) {
        console.error("Error sending OTP email:", err);
        res
          .status(500)
          .json({ error: "Failed to send OTP. Please try again later." });
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res
      .status(500)
      .json({ error: "An error occurred. Please try again later." });
  }
};

const otpload = (req, res) => {
  try {
    const email = req.query.email;

    res.render("otp", { email });
  } catch (error) {}
};

const deleteOtp = (req, res) => {

  const { email } = req.body;

  const deleteOtpQuery =
    "UPDATE Admin SET otp = NULL, otp_expires_at = NULL WHERE email = ?";
  connection.query(deleteOtpQuery, [email], (error, results) => {
    if (error) {
      console.error("Error deleting OTP:", error);
      return res
        .status(500)
        .json({ error: "Failed to delete OTP. Please try again later." });
    }

    res
      .status(200)
      .json({ success: true, message: "OTP deleted successfully." });
  });
};

const verifyotp = async (req, res) => {
  try {

    const { email, otp } = req.body;

    const [rows] = await connection
      .promise()
      .query("SELECT * FROM Admin WHERE email = ?", [email]);


    if (rows.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Email not found." });
    }

    const storedOtp = rows[0].otp;


    if (otp == storedOtp) {
      
      req.session.otpsuccess = true;
      res.json({ success: true });
    } else {
      
      res.json({ success: false, message: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred during OTP verification",
      });
  }
};

const changepassword = (req, res) => {

  try {
    let email = req.query.email;

    res.render("changepassword", { email });
  } catch (error) {}
};


const updatepassword = async (req, res) => {
  console.log('updatepassword');
  
  try {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the password in the Admin table based on the email
    const query = "UPDATE Admin SET password = ? WHERE email = ?";
    
    connection.query(query, [hashedPassword, email], (error, results) => {
      if (error) {
        console.error("Database error:", error);
        return res.status(500).json({
          error: "An internal error occurred. Please try again later.",
        });
      }

      if (results.affectedRows === 0) {
        return res.status(400).json({ emailerror: "This email does not exist." });
      }

      res.status(200).json({
        success: true,
        message: "Password updated successfully.",
      });
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "An error occurred. Please try again later." });
  }
};


module.exports = {
  loginload,
  login,
  dashboardload,
  logout,
  forgetpassword,
  editpassword,
  changepassword,
  verifyotp,
  otpload,
  deleteOtp,
  updatepassword
};
