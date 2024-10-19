const express = require("express");
const route = express.Router();
const login = require("../controllers/admincontroller");
const usercontroller = require("../controllers/staffcontroller");
const accountcontroller = require("../controllers/accountcontroller");
const authmiddleware = require("../middlewares")
const paymentcontroller = require('../controllers/paymentcontroller')
const customercontroller = require('../controllers/customercontroller')
const categorycontroller = require('../controllers/categorycontroller')
const transactioncontroller = require('../controllers/transactioncontroller')
const subexpencecontrller = require('../controllers/subexpencecontrller')

// login routes

route.get("/", login.loginload);

route.post('/adminlogin',login.login)

route.get('/dashboard', login.dashboardload)

route.get('/logout',login.logout)

route.get('/forget_password', login.forgetpassword)

route.post('/editpassword',login.editpassword)

route.get('/changepassword',login.changepassword)

route.get('/otp',login.otpload)

route.post('/verify-otp', login.verifyotp)

route.post('/delete-otp',login.deleteOtp)

route.post('/resend-otp',login.editpassword)

route.post('/updatepassword',login.updatepassword)

// staffs routes 

route.get('/stafflists',authmiddleware, usercontroller.stafflists)

route.get('/AddStaff',authmiddleware, usercontroller.AddStaff)

route.post('/add_staff',authmiddleware, usercontroller.insertStaff)

route.get('/edit_staff',authmiddleware, usercontroller.editstaff)

route.post('/update_staff',authmiddleware,usercontroller.updateStaff)

route.get('/delete_staff',authmiddleware,usercontroller.deletestaff)

route.put('/blockUserStatus',usercontroller.blockUserStatus)

route.put('/unblockUserStatus',usercontroller.unblockUserStatus)

route.get('/editprofile',authmiddleware, usercontroller.editprofile)

route.put('/update_user',authmiddleware, usercontroller.updateuser)

// account routes

route.get('/accountlist',authmiddleware,accountcontroller.accountlist)

route.get('/Add_Account',authmiddleware,accountcontroller.AddAccount)

route.post('/aad_account',authmiddleware,accountcontroller.insertAccount)

route.get('/edit_acc',authmiddleware, accountcontroller.editacc)

route.put('/update_account',authmiddleware, accountcontroller.updateAccount)

route.get('/delete_acc',authmiddleware,accountcontroller.deleteAccount)

// payment routes

route.get('/paymentlist',authmiddleware, paymentcontroller.paymentlist)

route.get('/Add_Payment',authmiddleware, paymentcontroller.AddPayment)

route.post('/insert_payment',authmiddleware, paymentcontroller.insertpayment)

route.get('/toggle_status',authmiddleware, paymentcontroller.updateStatus)

route.get('/edit_payment',authmiddleware ,paymentcontroller.editpayment)

route.put('/update_payment/:id',authmiddleware , paymentcontroller.updatepayment)

route.get('/delete_payment',authmiddleware, paymentcontroller.deletepayment)

// Customer routes

route.get('/customerslist',authmiddleware, customercontroller.customerslist)

route.get('/Add_Customer',authmiddleware, customercontroller.AddCustomer)

route.post('/add_customer',authmiddleware, customercontroller.insertcustomer)

route.get('/edit_customer',authmiddleware, customercontroller.editCustomer)

route.put('/update_customer', authmiddleware, customercontroller.updateCustomer);

route.get('/delete_customer',authmiddleware, customercontroller.deletecustomer)

// category routes

route.get('/categorylist',authmiddleware, categorycontroller.categorylist)

route.get('/Add_Category',authmiddleware, categorycontroller.AddCategory)

route.post('/add_category',authmiddleware, categorycontroller.insertcategory)

route.get('/edit_category',authmiddleware, categorycontroller.editcategory)

route.put('/update_category',authmiddleware, categorycontroller.updatecategory)

route.get('/subcategorylist',authmiddleware, categorycontroller.subcategorylist)

route.get('/delete_category', authmiddleware, categorycontroller.deleteCategory);

route.get('/Add_Subcategory',authmiddleware, categorycontroller.AddSubcategory)

route.post('/add_subcategory',authmiddleware, categorycontroller.insertsubcategory)

route.get('/edit_subcategory',authmiddleware, categorycontroller.editsubcategory)

route.put('/edit_subcategory',authmiddleware, categorycontroller.updatesubcategory)

route.get('/delete_subcategory',authmiddleware, categorycontroller.deletesubcategory)

// Transaction route

route.get('/transactionlist',authmiddleware, transactioncontroller.transactionlist)

route.get('/Add_Transaction',authmiddleware, transactioncontroller.AddTransaction)

route.post('/fetch-subcategories',authmiddleware, transactioncontroller.getsubcategories)

route.post('/insert-transaction',authmiddleware, transactioncontroller.insertTransaction)

route.get('/edit-transaction',authmiddleware, transactioncontroller.edittransaction)

route.put('/update_transaction',authmiddleware,transactioncontroller.updatetransaction)

route.get('/delete-transaction',authmiddleware,transactioncontroller.deletetransaction)

route.get('/download_transaction',authmiddleware, transactioncontroller.downloadtransaction)



// subexpence rotes

route.get('/subexpencelist',authmiddleware, subexpencecontrller.subexpencelist)

route.get('/Add_SubExpence',authmiddleware, subexpencecontrller.AddSubExpence)

route.post('/add_subexpense',authmiddleware, subexpencecontrller.insertsubexpense)

route.get('/edit-subexpense',authmiddleware, subexpencecontrller.editsubexpense)

route.put('/update_subexpense',authmiddleware, subexpencecontrller.updatesubexpense)

route.get('/delete-subexpence',authmiddleware, subexpencecontrller.deletesubexpence)

module.exports = route;
