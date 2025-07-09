const mongoose = require("mongoose");

const createExpense = mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  expense_date: { type: String, required: true },
  expense_category: { type: String, required: true },
  payment: { type: String, required: true },
  comment: { type: String, required: false },
  creater:{type:mongoose.Schema.Types.ObjectId,ref:"UserSchema",required:true},
  image: {
  type: String
},
 projectId: {type:String},
    projectName: {type:String},

});

module.exports = mongoose.model("CreateExpense", createExpense); //here first arg is must start with Capital
