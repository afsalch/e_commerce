const connection = require('../project/connectmysql'); 

const authMiddleware = async (req, res, next) => {
    if (!req.session.AdminId) {
        return res.redirect('/'); 
    }

    try {
        const [user] = await connection.promise().query(
            "SELECT * FROM admin WHERE id = ?",
            [req.session.AdminId]
        );

        if (user.length === 0) {
            return res.redirect('/'); 
        }

        next();
    } catch (error) {
        console.error("Error checking user privileges:", error);
        return res.status(500).json({ error: "An error occurred while checking user privileges." });
    }
};

module.exports = authMiddleware;
