const express = require("express");
const CreateExpense = require("../models/createExpense"); //import the Schema of Create Expense\
const SaveData=require('../models/saveData');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Make sure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

module.exports = upload;


const UserModel=require('../models/userModel');

const authMiddleware=require('../middleware/expenseMiddleWare');

router.delete("/DELETE_EXPENSE/:userId/:id", authMiddleware, (req, res, next) => {
  UserModel.findOneAndUpdate(
    { _id: req.params.userId },
    { $pull: { expenses: { _id: req.params.id } } },
    { new: true }
    ).then((result) => {
    res.status(200).json({
      message: "Deleted Successfully",
      status: true,
    });
  });
});

router.get("/GET_SINGLE_EXPENSE/:userId/:id",authMiddleware, (req, res, next) => {
  UserModel.findOne({ _id: req.params.userId, 'expenses._id': req.params.id }, { 'expenses.$': 1 }).then((user)=>{
    res.status(200).json({
      message:'Fetch one',
      data:user.expenses[0],
      status:true,
    })
  })
  .catch((err)=>{
    res.status(501).json({
      message:err,
      status:false,
    })
  })
});

router.patch("/UPDATE_EXPENSE/:userId/:id",authMiddleware, (req, res, next) => {
  UserModel.findOneAndUpdate({ _id: req.params.userId, 'expenses._id': req.params.id },
   {$set:{
    'expenses.$':req.body
  }},
   {new:true}
   ).then(
    (result) => {
      // console.log(result);
      res.status(200).json({
        message: "SuccessFully Updated",
        status: true,
      });
    }
  );
});

router.get("/GET_ALL_EXPENSE/:id", authMiddleware, async (req, res) => {
  try {
    const user = await UserModel.findOne({ _id: req.params.id });
    const baseURL = "http://localhost:3000/";

    const formattedExpenses = user.expenses.map((expense) => {
      return {
        ...expense.toObject(),
        expense_date: new Date(expense.expense_date).toDateString(),
        image: expense.image ? baseURL + expense.image : null, // ✅ full URL
      };
    });

    res.status(200).json({
      message: "SuccessFully Fetched",
      data: formattedExpenses,
      status: true,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
      status: false,
    });
  }
});


router.post("/CREATE_EXPENSE", authMiddleware, (req, res, next) => {
  // req body how to use so we install body-parser
  const newExpense = new CreateExpense({
    name: req.body.name,
    amount: req.body.amount,
    expense_date: req.body.expense_date,
    expense_category: req.body.expense_category,
    payment: req.body.payment,
    comment: req.body.comment,
    creater: req.body.creater,
  });

  UserModel.updateOne({_id:req.body.creater},{
    $push: { expenses: newExpense }
  }).then((result)=>{
    res.status(200).json({
      message:'Expense Added',
      status:true,
    })
  }).catch((err)=>{
    res.status(501).json({
      message:err,
      status:false,
    });
  });
});

// Upload an expense with image
// Change 'image' to 'receipt' here
router.post('/CREATE_EXPENSE_WITH_IMAGE/:id', authMiddleware, upload.single('receipt'), async (req, res) => {
  try {
    const {
      name,
      amount,
      expense_category,
      payment,
      comment,
      expense_date,
      projectId,
      projectName
    } = req.body;

    const newExpense = {
      name,
      amount,
      expense_category,
      payment,
      comment,
      expense_date: new Date(expense_date).toDateString(),
      creater: req.params.id,
      projectId,
      projectName,
      image: req.file ? `uploads/${req.file.filename}` : null
    };

    await UserModel.updateOne(
      { _id: req.params.id },
      { $push: { expenses: newExpense } }
    );

    res.status(200).json({
      message: 'Expense with image saved successfully',
      status: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: 'Internal Server Error',
      status: false,
    });
  }
});


router.get("/allEmpExpenses", async (req, res) => {
  try {
    const result = await UserModel.aggregate([
      { $unwind: "$expenses" },
      {
        $group: {
          _id: "$gmail",
          expenseCount: { $sum: 1 },
          expenses: { $push: "$expenses" }
        }
      },
      {
        $project: {
          _id: 0,
          gmail: "$_id",
          expenseCount: 1,
          expenses: 1
        }
      }
    ]);

    res.status(200).json({
      message: "Expenses grouped by email",
      data: result,
      status: true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      status: false
    });
  }
});

module.exports = router;



router.post('/SAVE_DATA',(req,res,next)=>{
  const allData=new SaveData({
    username:req.body.username,
    name:req.body.name,
    firstLoginDate:req.body.firstLoginDate,
    lastLoginDate:req.body.lastLoginDate,
    userId:req.body.userId,
    expenseLogged:req.body.expenseLogged,
  });
  UserModel.updateOne({_id:req.body.userId},{
    $push: { userData: allData }
  }).then((result)=>{
    res.status(200).json({
      message:'Save',
      status:true,
    })
  }).catch((err)=>{
    res.status(501).json({
      message:err,
      status:false,
    });
  });
});

router.get('/GET_SAVE_DATA/:id', (req, res) => {
  const { id } = req.params;

  // Validate id before querying the DB
  if (!id || id === 'undefined') {
    return res.status(400).json({
      message: 'Invalid or missing user ID',
      status: false
    });
  }

  UserModel.findById(id)
    .then(user => {
      if (!user) {
        return res.status(404).json({
          message: 'User not found',
          status: false
        });
      }

      res.status(200).json({
        message: 'Fetched user successfully',
        data: user,
        status: true
      });
    })
    .catch(err => {
      res.status(500).json({
        message: 'Server Error',
        error: err,
        status: false
      });
    });
});

router.get('/GET_CATEGORY/:id',(req,res,next)=>{
  UserModel.findOne({ _id: req.params.id },).then((user)=>{
    res.status(200).json({
      message:'Fetch All Category',
      data:user.category,
      status:true,
    })
  })
  .catch((err)=>{
    res.status(501).json({
      message:err,
      status:false,
    })
  })
});




router.post('/SAVE_CATEGORY/:id',(req,res,next)=>{
  UserModel.updateOne({_id:req.params.id},{
    $push: { category: { $each: req.body } }
  }).then((result)=>{
    // console.log(result);
    res.status(200).json({
      message:'Expense Added',
      status:true,
    })
  }).catch((err)=>{
    res.status(501).json({
      message:err,
      status:false,
    });
  });
})

router.post('/EDIT_CATEGORY/:id',(req,res,next)=>{
  UserModel.updateOne(
    { _id: req.params.id },
    { $set: { category: req.body } }
  ).then((result) => {
    // console.log(result);
    res.status(200).json({
      message: 'Category Updated',
      status: true,
    });
  }).catch((err) => {
    res.status(501).json({
      message: err,
      status: false,
    });
  });  
});


router.post('/UPDATE_SAVE_DATA/:id',(req,res,next)=>{
  UserModel.findOneAndUpdate({ _id: req.params.id,'userData.userId': req.params.id },
   {$set:{
    'userData.$.lastLoginDate':req.body.lastLoginDate,
    'userData.$.expenseLogged':req.body.expenseLogged,
  }},
   {new:true}
   ).then(
    (result) => {
      res.status(200).json({
        message: "SuccessFully Updated LoginDate",
        status: true,
      });
    }
  );
})

// router.post('/UPDATE_PROFILE/:id',(req,res,next)=>{
//   UserModel.findOneAndUpdate({ _id: req.params.id,'userData.userId': req.params.id },
//    {$set:{
//     'userData.$.username':req.body.username,
//     'userData.$.name':req.body.name,
//   }},
//    {new:true}
//    ).then(
//     (result) => {
//       res.status(200).json({
//         message: "SuccessFully Updated Profile Info",
//         status: true,
//       });
//     }
//   );
// })

router.post('/UPDATE_PROFILE/:id', upload.single('profilePic'), async (req, res) => {
  try {
    console.log('Received Body:', req.body);
    console.log('Received File:', req.file);

    const { name, username, gmail } = req.body;
    const profilePicName = req.file ? req.file.filename : undefined;

    const updateData = {
      name,
      username,
      gmail,
    };

    if (profilePicName) {
      updateData.profilePicName = profilePicName;
    }

    const result = await UserModel.findByIdAndUpdate(req.params.id, updateData, { new: true });

    res.status(200).json({
      message: 'Profile updated successfully',
      data: result,
      status: true
    });

  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({
      message: 'Error updating profile',
      error,
      status: false
    });
  }
});



module.exports = router;
