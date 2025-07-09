const bcrypt = require("bcryptjs/dist/bcrypt");

router.patch('/updateStud/:id', async(req, res)=>{
    try{
         const studId= req.params.id;
        const student = await stud.findOneAndUpdate({studId:studId},{phone: req.body.phone, address: req.body.address},{new:true});

        res.status(200).json({
            message:"SuccessFully Updated",
            data: student,
        })

    }
    catch(err){
        return res.status(500).json({
            message:"Not found",
            err: err.message
        })

    }
})



router.post('/login', async(req,res)=>{
    try{

        const userId = await user.findOne({gmail: req.body.gmail});
        const hashPass = await bcrypt.compare(req.body.pass, userId.pass);

        const token = await jwt.sign({gmail:userId.gmail}, process.env.JWT_KEY, {expiresIn:"1h"});

        res.status(200).json({
            message:"Login Success",
            gmail:userId.gmail,
            token

        })



    }

    catch(err){
        return res.status(500).json({
            message:"Invalid Cred",
            err:err.message
        })
    }
})




router.delete('/delete/:id', async(req, res)=>{
    try{

        const stud = await Student.findByIdAndDelete(req.params.id);

        if(!stud){
            return res.status(404).json({
                message:"Not Found"
            })
        }

        res.status(200).json({
            message:"User Deleted Success",
            status:true,
        })

    }
    catch(err){

        
        res.status(500).json({
            message:"Internal", 
            err:err.message,
        })


    }
})


router.get('/studs', async(req,res)=>{
    try{

        const page= parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) *limit;
        const total = await Stud.countDocuments();

        const studs= await Stud.find().skip(skip).limit(limit);

        res.status(200).json({
            total,
            page,
            limit,
            skip,
            data: studs,
            
        })
    }
    catch(err){

        return res.status(500).json({
            message:"Error",
            err:err.message,
        })

    }
})


const middlewaressw = async (req,res,next)=>{

    try{
         const token = req.headers.authorization?.split("")[1];

    const tokenVerify = await jwt.verify(token, process.env.JWT_KEY);

    req.user= {gmail: tokenVerify.gmail};
    next();

    }
    catch(err)
{
    return res.status(500).json({
        message:"Internal",
        err:err.message
    })
}
   



    
}


module.exports = middlewaressw



// multiple formdata

router.post("/studData", async(req,res)=>{
    try{
        const formData = req.body;
        if(!Array.isArray(formData)){
            return res.status(400).json({
                message:"Invalid Input"
            })
        }

        const stdDetails = await User.InsertMany(formData);

        res.status(200).json({
            message:"Success",
            data: stdDetails,
        })

    }
    catch(err){
        return res.status(500).json({
        message:"Internal",
        err:err.message
    })

    }
})




router.patch("/updateCourse", async(req, res)=>{
    try{

        const {sem, newCourse} = req.body;

        const updatedCourse = await Exam.updateMany(
            {sem: sem},
            {$set:{course:newCourse}}

        );

        res.status(200).json({
            message:"Suucess",

        })


    }
    catch(err){
        return res.status(500).json({
        message:"Internal",
        err:err.message
    })
    }
})



const storage = multer.diskStorage({
    destination: (req, file, cb)=>{
       cb(null, 'uploads/')
    },

    filename: (req,file,cb)=>{
        cb(null, Date.now() +'-'+ file.filename)

    }
})


const filter = multer({
    storage:storage,
    filterTypes:function(req,file,cb){
        const allowed = "png|jpeg|jpg";
        if(allowed.includes(file.filename)){
             cb(null, true);
        }
        else{
            cb(new Error("Only .jpg, .jpeg, .png allowed"));
        }

    } 

})


// in api

router.post("/uploads", upload.single('receipt'),async(req,res)=>{
    try{
        const {name, claswss} = req.body;

        const stud =new Student({
            name,
            claswss,
            file:req.file.filename
        });

        const result = await stud.save();

        res.status(201).json({
            message:"submit"
        })


    }

    catch(err){

    }

})