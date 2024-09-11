const connection = require("../connectmysql");

const categorylist = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 3;
      const offset = (page - 1) * limit;
  
      const [totalCategories] = await connection
        .promise()
        .query("SELECT COUNT(DISTINCT category_name) AS count FROM Categories");
      const total = totalCategories[0].count;
      const totalPages = Math.ceil(total / limit);
  
      const [categories] = await connection
        .promise()
        .query(`
          SELECT category_name, GROUP_CONCAT(subcategory_name SEPARATOR ', ') AS subcategory_names
          FROM Categories
          GROUP BY category_name
          LIMIT ? OFFSET ?`, [limit, offset]);
          console.log(categories);
  
      res.render("categorylist", { categories, page, totalPages });
    } catch (error) {
      console.error("Error fetching categories: ", error);
      res.status(500).send("An error occurred while fetching categories.");
    }
  };
  

const AddCategory = (req, res) => {
  try {
    res.render("addcategory");
  } catch (error) {}
};

const insertcategory = async (req, res) => {
    const { category_name, notes } = req.body;
  
    try {
      const [existingCategories] = await connection
        .promise()
        .query('SELECT category_name FROM Categories WHERE category_name LIKE ?', [category_name]);
  
      if (existingCategories.length > 0) {
        return res.status(400).json({ success: false, errors: [{ field: 'category_name', message: 'Category name already exists.' }] });
      }
  
      const [result] = await connection
        .promise()
        .query('INSERT INTO Categories (category_name, notes) VALUES (?, ?)', [
          category_name,
          notes,
        ]);
  
      res.status(201).json({
        success: true,
        message: 'Category added successfully.',
        categoryId: result.insertId,
      });
    } catch (error) {
      console.error('Error adding category:', error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while adding the category.',
      });
    }
};

  

const editcategory = async (req, res) => {
  const category_name = req.query.name;

  try {
    const [category] = await connection
      .promise()
      .query("SELECT * FROM Categories WHERE category_name = ?", [category_name]);

    if (category.length === 0) {
      return res.status(404).send("Category not found.");
    }

    res.render("editcategory", { category: category[0] });
  } catch (error) {
    console.error("Error fetching category: ", error);
    res.status(500).send("An error occurred while fetching the category.");
  }
};

const updatecategory = async (req, res) => {
    console.log('updatecategory');
    const { category_id, category_name, notes } = req.body;
  
    try {
      const [result] = await connection
        .promise()
        .query(
          "UPDATE Categories SET category_name = ?, notes = ? WHERE category_name = ?",
          [category_name, notes, category_id] 
        );
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: "Category not found." });
      }
  
      res
        .status(200)
        .json({ success: true, message: "Category updated successfully." });
    } catch (error) {
      console.error("Error updating category: ", error);
      res
        .status(500)
        .json({
          success: false,
          message: "An error occurred while updating the category.",
        }); 
    }
  };
  

const deleteCategory = async (req, res) => {
  const category_name = req.query.name;
  if (!category_name) {
    return res.status(400).send("Category ID is required");
  }

  try {
    const [result] = await connection
      .promise()
      .query("DELETE FROM Categories WHERE category_name = ?", [category_name]);

    res.redirect("/categorylist");
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).send("An error occurred while deleting the category");
  }
};

const subcategorylist = async (req, res) => {
    try {
        const itemsPerPage = 3; // Number of subcategories per page
        const page = parseInt(req.query.page) || 1; // Current page number, default to 1

        // Calculate the offset for the query
        const offset = (page - 1) * itemsPerPage;

        // Fetch the total number of subcategories
        const [totalResults] = await connection.promise().query(`
            SELECT COUNT(*) AS total
            FROM Categories
            WHERE subcategory_name IS NOT NULL
        `);
        const totalSubcategories = totalResults[0].total;
        const totalPages = Math.ceil(totalSubcategories / itemsPerPage);

        // Fetch subcategories for the current page
        const [categories] = await connection.promise().query(`
            SELECT id AS category_id, category_name, subcategory_name
            FROM Categories
            WHERE subcategory_name IS NOT NULL
            LIMIT ?, ?
        `, [offset, itemsPerPage]);

        // Process the results to create an array of subcategories
        const categoryList = categories.map(category => {
            const subcategories = category.subcategory_name.split(',').map(sub => sub.trim());
            return {
                category_id: category.category_id,
                category_name: category.category_name,
                subcategories: subcategories
            };
        });

        res.render("subcategorylist", { categoryList, totalPages, currentPage: page });
    } catch (error) {
        console.log(error);
        res.status(500).send('An error occurred while fetching subcategories.');
    }
};


const AddSubcategory = async (req, res) => {
    try {
        const [categories] = await connection.promise().query('SELECT DISTINCT category_name FROM Categories');

        res.render('addsubcategory', { categories });
    } catch (error) {
        console.error('Error fetching categories: ', error);
        res.status(500).send('An error occurred while fetching categories.');
    }
};



const insertsubcategory = async (req, res) => {
    const { subcategory_name, category_name, notes } = req.body;

    try {
        const [category] = await connection.promise().query(
            'SELECT * FROM Categories WHERE category_name = ?',
            [category_name]
        );

        if (category.length === 0) {
            return res.status(404).json({ success: false, message: 'Category not found.' });
        }

        const [existingSubcategory] = await connection.promise().query(
            'SELECT * FROM Categories WHERE subcategory_name = ? AND category_name = ?',
            [subcategory_name, category_name]
        );

        if (existingSubcategory.length > 0) {
            return res.status(409).json({ success: false, message: 'Subcategory name must be unique within the category.' });
        }

        await connection.promise().query(
            'INSERT INTO Categories (subcategory_name, category_name) VALUES (?, ?)',
            [subcategory_name, category_name]
        );


        res.status(201).json({ success: true, message: 'Subcategory added successfully.' });
    } catch (error) {
        console.error('Error adding subcategory: ', error);
        res.status(500).json({ success: false, message: 'An error occurred while adding the subcategory.' });
    }
};


const editsubcategory = async (req, res) => {
    try {
        const subcategoryname = req.query.subcategory; 

        const [categories] = await connection.promise().query('SELECT DISTINCT category_name FROM Categories');


        // Fetch the subcategory details from the database
        const [subcategory] = await connection.promise().query(
            'SELECT * FROM Categories WHERE subcategory_name = ?',
            [subcategoryname]
        );

        if (subcategory.length === 0) {
            return res.status(404).send('Subcategory not found.');
        }

        res.render('editsubcategory', { subcategory: subcategory[0],categories });
    } catch (error) {
        console.error('Error fetching subcategory:', error);
        res.status(500).send('An error occurred while fetching the subcategory.');
    }
};

const updatesubcategory = async (req, res) => {
    try {
        const { subcategory_id, subcategory_name, category_name, notes } = req.body;

        if (!subcategory_name || !category_name) {
            return res.status(400).json({ success: false, message: 'Subcategory name and category name are required.' });
        }

        const [existingSubcategories] = await connection.promise().query(
            'SELECT * FROM Categories WHERE subcategory_name = ? AND id != ?',
            [subcategory_name, subcategory_id] 
        );

        if (existingSubcategories.length > 0) {
            return res.status(400).json({ success: false, message: 'Subcategory name already exists.' });
        }

        const [result] = await connection.promise().query(
            'UPDATE Categories SET subcategory_name = ?, category_name = ?, notes = ? WHERE id = ?',
            [subcategory_name, category_name, notes, subcategory_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Subcategory not found.' });
        }

        res.status(200).json({ success: true, message: 'Subcategory updated successfully.' });
    } catch (error) {
        console.error('Error updating subcategory:', error);
        res.status(500).json({ success: false, message: 'An error occurred while updating the subcategory.' });
    }
};

const deletesubcategory = async (req, res) => {
    try {
        const subcategory = req.query.subcategory;

        if (!subcategory) {
            return res.status(400).send('Subcategory is required');
        }

        
        await connection.promise().query(`DELETE FROM Categories WHERE subcategory_name = ?`, [subcategory]);

        res.redirect('/subcategorylist')
    } catch (error) {
        console.error('Error in deletesubcategory:', error);
        res.status(500).send('An error occurred');
    }
};









module.exports = {
  categorylist,
  AddCategory,
  insertcategory,
  editcategory,
  updatecategory,
  subcategorylist,
  deleteCategory,
  AddSubcategory,
  insertsubcategory,
  editsubcategory,
  updatesubcategory,
  deletesubcategory
};
