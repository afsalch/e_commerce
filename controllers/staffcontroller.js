const bcrypt = require('bcrypt');
const connection = require('../connectmysql');


const stafflists = async (req, res) => {
    const itemsPerPage = 3; 
    const page = parseInt(req.query.page) || 1; 
    const offset = (page - 1) * itemsPerPage; 

    try {
        const [currentUser] = await connection.promise().query(
            "SELECT * FROM Admin WHERE id = ?",
            [req.session.AdminId]
        );

        if (currentUser.length === 0) {
            return res.status(400).json({ error: "User not found." });
        }

        const userRole = currentUser[0].role;

        const [staffMembers] = await connection.promise().query(
            "SELECT * FROM Admin WHERE role = 'staff' LIMIT ? OFFSET ?",
            [itemsPerPage, offset]
        );

        const [[{ total }]] = await connection.promise().query(
            "SELECT COUNT(*) AS total FROM Admin WHERE role = 'staff'"
        );

        const totalPages = Math.ceil(total / itemsPerPage); 
        const message = staffMembers.length === 0 ? "No staff members have been added yet." : null;

        res.render('liststaffs', {
            staff: staffMembers,
            message: message,
            currentPage: page,
            totalPages: totalPages,
            userRole: userRole 
        });
    } catch (error) {
        console.error("Error fetching staff members: ", error);
        res.status(500).json({ error: "An error occurred while fetching staff members." });
    }
};

const AddStaff = (req,res)=>{
    res.render('addstaff')
}

const insertStaff = async (req, res) => {
    try {
        const { user, email, password, phone } = req.body;
        const role = 'staff'; 
        const isBlocked = false;  
        
        const [existingUser] = await connection.promise().query(
            "SELECT * FROM Admin WHERE email = ?",
            [email]
        );
    
        if (existingUser.length > 0) {
            console.log('Staff already exists');
            return res.status(400).json({ error: "This Email already exists" });
        }
    
        const passwordHash = await bcrypt.hash(password, 10);
    
        const [result] = await connection.promise().query(
            "INSERT INTO Admin (user, email, password, phone, role, isBlocked) VALUES (?, ?, ?, ?, ?, ?)",
            [user, email, passwordHash, phone, role, isBlocked]
        );

        return res.status(200).json({ message: "Staff successfully inserted" });
         
    } catch (error) {
        console.error("Error: " + error);
        return res.status(500).json({ error: "An error occurred. Please try again later." });
    }
};


const editstaff = async (req, res) => {
    try {
        const id = req.query.id;

        const [staffMember] = await connection.promise().query(
            "SELECT * FROM Admin WHERE id = ? AND role = 'staff'",
            [id]
        );

        if (staffMember.length === 0) {
            return res.status(404).send('Staff member not found');
        }

        res.render('editstaff', { staff: staffMember[0] });
    } catch (error) {
        console.error("Error fetching staff member: ", error);
        res.status(500).json({ error: "An error occurred while fetching the staff member." });
    }
};

const updateStaff = async (req, res) => {
    try {
        const id = req.query.id;
        const { user, email, phone, password } = req.body;

        await connection.promise().query(
            "UPDATE Admin SET email = NULL WHERE id = ?",
            [id]
        );

        const [existingUser] = await connection.promise().query(
            "SELECT * FROM Admin WHERE email = ?",
            [email]
        );

        if (existingUser.length > 0) {
            console.log('Staff already exists');
            return res.status(400).json({ error: "This Email already exists" });
        }

        let hashedPassword;

        if (password) {
            hashedPassword = await bcrypt.hash(password, 10); 
        }

        const updateQuery = `
            UPDATE Admin 
            SET user = ?, email = ?, phone = ?, password = ? 
            WHERE id = ?
        `;

        await connection.promise().query(updateQuery, [
            user,
            email,  
            phone,
            hashedPassword || (await getCurrentPassword(id)),  
            id
        ]);

        res.json({ success: true, message: "Staff member successfully updated" });
    } catch (error) {
        console.error("Error updating staff member: ", error);
        res.status(500).json({ error: "An error occurred while updating the staff member." });
    }
};

const getCurrentPassword = async (id) => {
    const [staffMember] = await connection.promise().query(
        "SELECT password FROM Admin WHERE id = ?",
        [id]
    );

    return staffMember.length > 0 ? staffMember[0].password : null;
};

const deletestaff = async (req, res) => {
    try {
        const id = req.query.id;

        await connection.promise().query(
            "DELETE FROM Admin WHERE id = ?",
            [id]
        );

        res.redirect('/stafflists');
    } catch (error) {
        console.error("Error deleting staff member: ", error);
        res.status(500).json({ error: "An error occurred while deleting the staff member." });
    }
};

const blockUserStatus = async (req,res)=>{
    const { userId } = req.body;

    try {
        const [result] = await connection.promise().query(
            "UPDATE Admin SET isBlocked = true WHERE id = ?",
            [userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Error blocking user: ", error);
        res.status(500).json({ success: false });
    }
}

const unblockUserStatus = async (req,res)=>{
    const { userId } = req.body;

    try {
        const [result] = await connection.promise().query(
            "UPDATE Admin SET isBlocked = false WHERE id = ?",
            [userId]
        );
        res.json({ success: true });
    } catch (error) {
        console.error("Error unblocking user: ", error);
        res.status(500).json({ success: false });
    }
}


const editprofile = async (req, res) => {
    try {
        const adminId = req.session.AdminId; 

        // Fetch the admin data from the Admin table
        const [adminData] = await connection.promise().query(
            'SELECT * FROM Admin WHERE id = ?',
            [adminId]
        );

        if (adminData.length === 0) {
            return res.status(404).json({ success: false, message: 'Admin not found.' });
        }

        // Pass the admin data to the editprofile.ejs view
        res.render('editprofile', { admin: adminData[0] });
    } catch (error) {
        console.error('Error fetching admin data: ', error);
        res.status(500).json({ success: false, message: 'An error occurred while fetching admin data.' });
    }
};


const updateuser = async (req, res) => {
    try {
        const adminId = req.session.AdminId; // Get AdminId from the session
        const { user, email, phone } = req.body; // Destructure the new data from the request body

        // Update the admin data in the Admin table
        const [result] = await connection.promise().query(
            'UPDATE Admin SET user = ?, email = ?, phone = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [user, email, phone, adminId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Admin not found' });
        }

        // If the update is successful, send a success response
        res.json({ message: 'Staff successfully updated' });
    } catch (error) {
        console.error('Error updating admin data: ', error);
        res.status(500).json({ error: 'An error occurred while updating admin data' });
    }
};








module.exports = {
    stafflists,
    AddStaff,
    insertStaff,
    editstaff,
    updateStaff,
    deletestaff,
    blockUserStatus,
    unblockUserStatus,
    editprofile,
    updateuser
  };