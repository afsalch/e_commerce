const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const userlogin = require("./routes/loginroute");
const session = require('express-session');
require('dotenv').config();
const nocache = require('nocache');
const connection = require('./connectmysql'); // Corrected path
const bcrypt = require('bcrypt');

const { createTables } = require('./models/usermodel'); // Corrected path

const app = express();

app.use(nocache());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: process.env.SESSION_SECRET, 
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }   
}));
 
app.use('/', userlogin);

async function Sample() {
    try {
        const [existingUser] = await connection.promise().query(
            "SELECT * FROM Admin WHERE role = 'admin'"
        );

        if (existingUser.length === 0) {
            const username = "Admin"; 
            const email = "admin@gmail.com"; 
            const password = "Admin@123"; 
            const phone = '6282211474';  
            const isBlocked = false; 

            const hashedPassword = await bcrypt.hash(password, 10); 

            await connection.promise().query(
                "INSERT INTO Admin (user, email, password, phone, role, isBlocked) VALUES (?, ?, ?, ?, 'admin', ?)",
                [username, email, hashedPassword, phone, isBlocked]
            );
        }
    } catch (error) {
        console.error("Error checking or creating admin account: ", error);
    }
}

async function initializeApp() {
    await createTables(); 
    await Sample(); 

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

initializeApp();
