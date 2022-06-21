require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
var FormData = require('form-data');
var form_data = new FormData();
const ejs = require("ejs");
const mongoose = require("mongoose");
mongoose.set('useFindAndModify', false);
const md5 = require("md5");
const session = require('express-session')
const cookieParser = require('cookie-parser')
app.use(cookieParser())
const passport = require("passport")
const passportLocalMongoose = require('passport-local-mongoose')
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');
const cors = require("cors");
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken')
const auth = require('./auth')
const auth2=require("./auth2")

mongoose.connect(`mongodb+srv://admin-mishra:test-123@cluster0.jjmbi.mongodb.net/companydb?retryWrites=true&w=majority`,{useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true});
const fileUpload = require('express-fileupload'); // file upload
app.use(fileUpload({
    useTempFiles: true
}));
var cloudinary = require("cloudinary").v2
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
})
var flag = 0;
var useridvar;
const Company_Profile_Schema = new mongoose.Schema({
    Company_name: String,
    logo_url: String,
    cin_number: String,
    email: String,
    password: String,
    description: String,
    contact_no: String,
    ceo_name: String,
    headquarter_location: String,
    city: String,
    state: String,
    country: String,
    postal: Number,
    Total_Job: Number,
    token: String
})

Company_Profile_Schema.methods.generateAuthToken = async function() {
    try {
        const token = jwt.sign({ _id: this._id.toString() }, process.env.SECRETKEY)
        console.log(token)
        return token
    } catch (error) {
        res.send("error found " + error);
        console.log("gives error " + error)
    }
}

const companyJobSchema = {
    Company_logo: String,
    company_name: String,
    Job_ID: String,
    Job_Category: String,
    Job_Locations: String,
    Posting_Date: Date,
    Apply_Before: Date,
    Job_Schedule: String,
    Job_Description: String,
    Responsibilities: String,
    Base_Qualifications: String,
    Preferred_Skills: String,
    About_Us: String,
    Experience: String,
    cin_num: String,
    count: Number
};
const userSchema = new mongoose.Schema({
    fname: String,
    lname: String,
    address: String,
    state: String,
    city: String,
    pin: String,
    gender: String,
    dob: Date,
    education: String,
    password: String,
    email: {
        type: String,
        trim: true,
        lowercase: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: "Please enter a valid email"
        },
        required: [true, "Email required"]
    },
    Applied: [mongoose.Schema.Types.ObjectId],
    tokens:[{
        token:{
            type:String,
            required:true
        }
    }]
});
userSchema.pre("save",async function(next){
    if(this.isModified("password")){
        this.password=await bcrypt.hash(this.password,10);
    }
    next();
})
userSchema.methods.generateAuthToken=async function(){
    try{
        const token=jwt.sign({_id:this._id.toString()},process.env.KEY_SECRET);
        console.log("Inside Schema",token);
        this.tokens=this.tokens.concat({token:token});
        await this.save();
        return  token;
    }
    catch(err) {
     //res.send("Error",err);
     console.log("Error ye",err);
    }
}
const trackSchema = {
    user_id: String,
    company_id: String,
    name: String,
    dob: Date,
    IntermediateSname: String,
    IntermediatePerc: String,
    HighSname: String,
    HighPerc: String,
    highyop: String,
    interyop: String,
    interboard: String,
    highboard: String,
    workExp: String,
    skills: String,
    resume: Buffer
}


const CompanyProfile = mongoose.model("CompanyProfile", Company_Profile_Schema);


const CompanyJob = mongoose.model("CompanyJob", companyJobSchema);
const User = mongoose.model("User", userSchema);
const Track = mongoose.model("Track", trackSchema);


app.get("/", function(req, res) {
    if (flag === 0)
        res.render("Start", { quote: null, message: null });
    else {
        res.render("Start", { quote: null, message: "Jobs Posted successfully!" });
        flag = 0;
    }
});


app.get('/start', (err, res) => {
    res.render('Start')
})
app.get("/hiring", function(req, res) { res.render("hiring-page", { msg: null }); });

app.get("/company_login", function(req, res) { res.render("Company_login", { msg: 0, check: 0 }); });

app.post("/login_details_check", function(req, res) {
    CompanyProfile.findOne({ cin_number: req.body.cin_num, email: req.body.email, password: req.body.pass }, async(err, result) => {
        if (err) {
            res.send(err)
        } else {
            if (result === null) {
                res.render("Company_login", { msg: 1, check: 0 })
            } else {
                const token = await result.generateAuthToken()
                console.log(token)
                res.cookie('jobPortalCookie', token, {
                    expires: new Date(Date.now() + 86400000),
                    httpOnly: true
                })
                res.redirect('/Profile'); 
            }
        }
    })
})

app.get("/company_registration", function(req, res) { res.render("Company_Registration", { msg: null }); });


var findres;
app.get('/Profile',
    //verify user
    async(req, res, next) => {
        try {
            const token = await req.cookies.jobPortalCookie;
            const verifyUser = await jwt.verify(token, process.env.SECRETKEY)
            findres = verifyUser._id;
            next()
        } catch (error) {
            res.redirect('/company_login')
        }
    },
    function(req, res) {
        CompanyProfile.findOne({ _id: findres }, (req, store) => {
            let date = new Date()
            let d = date.getDate()
            let m = date.getMonth() + 1
            let y = date.getFullYear()
            console.log
            CompanyJob.find({ company_name: store.Company_name, cin_num: store.cin_number }, function(err, data) {
                if (err)
                    res.send(err);
                else {
                    if (data !== null) {
                        res.render("Company_Profile", {
                            Company_name: store.Company_name,
                            logo_url: store.logo_url,
                            cin_number: store.cin_number,
                            email: store.email,
                            description: store.description,
                            contact_no: store.contact_no,
                            ceo_name: store.ceo_name,
                            headquarter_location: store.headquarter_location,
                            today: `${y}-${m}-${d}`,
                            Total_Job: store.__v,
                            x: data
                        });
                    } else {
                        res.render("Company_Profile", {
                            Company_name: store.Company_name,
                            logo_url: store.Company_logo,
                            cin_number: store.cin_number,
                            email: store.email,
                            description: store.description,
                            contact_no: store.contact_no,
                            ceo_name: store.ceo_name,
                            headquarter_location: store.headquarter_location,
                            today: `${y}-${m}-${d}`,
                            Total_Job: store.__v,
                            x: 0
                        });
                    }
                }
            })
        })
    })

app.post("/company_registartion_datails", (req, res) => {
    CompanyProfile.findOne({ cin_number: req.body.cin_num, email: req.body.email }, async(err, result) => {
        if (err) {
            res.redirect('/company_registration');
        } else {
            if (result !== null) {
                res.render("Company_Registration", { msg: "This CIN Number or Email has already taken" });
            } else {
                if (req.files === null) {
                    const value = new CompanyProfile({
                        Company_name: req.body.c_name,
                        logo_url: "",
                        cin_number: req.body.cin_num,
                        email: req.body.email,
                        password: req.body.pass,
                        description: req.body.desc,
                        contact_no: `${req.body.c_code}${req.body.phone}`,
                        ceo_name: req.body.ceo_name,
                        headquarter_location: req.body.loc,
                        city: req.body.city,
                        state: req.body.state,
                        country: req.body.country,
                        postal: req.body.postal
                    })
                    const token = await value.generateAuthToken()
                    console.log(token)
                    res.cookie('jobPortalCookie', token, {
                        expires: new Date(Date.now() + 86400000),
                        httpOnly: true
                    })
                    value.save(function(err, store) {
                        if (err)
                            return console.log(err);

                        else {
                            res.redirect('/Profile');
                        }
                    });
                } else {
                    cloudinary.uploader.upload(req.files.logo.tempFilePath, async(err, result) => {
                        if (err) {
                            res.render("Company_Registration", { msg: "Some Error Occured, Please Try Again" });
                        } else {
                            const value = new CompanyProfile({
                                Company_name: req.body.c_name,
                                logo_url: result.url,
                                cin_number: req.body.cin_num,
                                email: req.body.email,
                                password: req.body.pass,
                                description: req.body.desc,
                                contact_no: `${req.body.c_code}${req.body.phone}`,
                                ceo_name: req.body.ceo_name,
                                headquarter_location: req.body.loc,
                                city: req.body.city,
                                state: req.body.state,
                                country: req.body.country,
                                postal: req.body.postal
                            })
                            const token = await value.generateAuthToken()
                            console.log(token)
                            res.cookie('jobPortalCookie', token, {
                                expires: new Date(Date.now() + 86400000),
                                httpOnly: true
                            })
                            value.save(function(err, store) {
                                if (err)
                                    return console.log(err);
                                else {
                                    res.redirect('/Profile');
                                }
                            });
                        }
                    })
                }
            }
        }
    })
})
app.post('/password_check', (req, res) => {
    CompanyProfile.findOne({ email: req.body.email, cin_number: req.body.cin_num, password: req.body.password }, function(err, data) {
        if (err)
            res.send(false)
        else {
            if (data === null)
                res.send(false)
            else {
                res.send(data._id)
            }
        }
    })
})

app.post('/post_by_company',
    async(req, res, next) => {
        try {
            const token = await req.cookies.jobPortalCookie;
            const verifyUser = await jwt.verify(token, process.env.SECRETKEY)
            next()
        } catch (error) {
            res.send(false)
        }
    },
    function(req, res) {
        CompanyJob.findOne({ company_name: req.body.company_name, cin_num: req.body.cin_num, Job_ID: req.body.Job_ID }, (err, result) => {
            CompanyProfile.updateOne({ _id: req.body._id }, { __v: req.body.Total_Job }, function(err, data) {
                if (err)
                    res.send('Cannot Post, Something error occured')
                else {
                    if (err)
                        return console.log(err);
                    else {
                        if (result === null) {
                            const value = new CompanyJob({
                                Company_logo: req.body.Company_logo,
                                company_name: req.body.company_name,
                                Job_ID: req.body.Job_ID,
                                Job_Category: req.body.Job_Category,
                                Job_Locations: req.body.Job_Locations,
                                Posting_Date: req.body.Posting_Date,
                                Apply_Before: req.body.Apply_Before,
                                Job_Schedule: req.body.Job_Schedule,
                                Job_Description: req.body.Job_Description,
                                Responsibilities: req.body.Responsibilities,
                                Base_Qualifications: req.body.Base_Qualifications,
                                Preferred_Skills: req.body.Preferred_Skills,
                                About_Us: req.body.About_Us,
                                Experience: req.body.Experience,
                                cin_num: req.body.cin_num,
                                count: req.body.count
                            })
                            value.save(function(err) {
                                if (err)
                                    res.send(err);
                                else {
                                    res.send("Job Posted Successfully")
                                }
                            })
                        } else {
                            res.send("Cannot Post, This Job Id is already exist for this Company.")
                        }
                    }
                }
            })
        })
    })

app.post('/fetch_post_data',
    async(req, res, next) => {
        try {
            const token = await req.cookies.jobPortalCookie;
            const verifyUser = await jwt.verify(token, process.env.SECRETKEY)
            next()
        } catch (error) {
            res.redirect('/company_login')
        }
    },
    function(req, res) {
        CompanyJob.find({ company_name: req.body.comp, cin_num: req.body.cin_num }, function(err, data) {
            if (err)
                res.send(err);
            else {
                res.send(data);
            }
        })
    })

app.post('/delete_post_data',
    async(req, res, next) => {
        try {
            const token = await req.cookies.jobPortalCookie;
            const verifyUser = await jwt.verify(token, process.env.SECRETKEY)
            next()
        } catch (error) {
            res.send(false)
        }
    }, (req, res) => {
        CompanyJob.deleteOne({ _id: req.body.id }, (err, data) => {
            if (err)
                res.send("This Post Can't Delete Due To Technical Issue.");
            else {
                CompanyProfile.updateOne({ _id: req.body._id }, { __v: req.body.Total_Job }, function(error, result) {
                    if (err)
                        res.send("This Post Can't Delete Due To Technical Issue.");
                    else {
                        console.log(data.deletedCount)
                        res.send('This Post is Deleted Successfully');
                    }
                })
            }
        })
    })

app.get('/logout',
    //verify user
    async(req, res, next) => {
        try {
            const token = await req.cookies.jobPortalCookie;
            const verifyUser = await jwt.verify(token, process.env.SECRETKEY)
            next()
        } catch (error) {
            res.redirect('/company_login')
        }
    },
    function(req, res) {
        res.clearCookie('jobPortalCookie');
        res.redirect('/company_login')
    }
)

app.post("/registration", function(req, res) { res.render("company", { msg: null }); });

app.post("/registrationform", function(req, res) {
    const company_name = req.body.company;
    // CompanyJob.find({cin_number: req.body.cin},function(err,temp){
    const value = new CompanyJob({
        company: req.body.company,
        cin_number: req.body.cin,
        password: req.body.pass,
        jobtitle: req.body.jobtitle,
        WorkExp: req.body.wexperience,
        location: req.body.location,
        post: req.body.post,
        salary: req.body.salary,
        description: req.body.description
    });
    value.save(function(err) {
        if (err)
            return console.log(err);
        else {
            res.render("home", { message: null, quote: "Posted Successfully!!" });
        }
    });
    // });

});



app.post("/company", function(req, res) {
    const jobpost = new CompanyJob({
        company: req.body.company,
        jobtitle: req.body.jobtitle,
        workExp: req.body.wexperience,
        location: req.body.location,
        post: req.body.post,
        salary: req.body.salary,
        description: req.body.description
    });
    jobpost.save(function() {
        flag = 1;
        res.redirect("/");
    });
});

app.post("/apply", function(req, res) {

    var userid = req.body.userid;
    var jobid = req.body.jobid;
    var jobid_arr = req.body.jobarr;

    res.render("job", { user_id: userid, job_id: jobid, jobidarr: jobid_arr});
});
app.post("/applyjob", function(req, res) {
    useridvar = req.body.userid;
    const jobid = req.body.jobid;
    const user_id = req.body.userid;
    const joblist = req.body.joblist;
    var jobid_arr = req.body.jobarr;


    const trac = new Track({
        user_id: user_id,
        company_id: jobid,
        name: req.body.fname + req.body.lname,
        dob: req.body.dob,
        IntermediateSname: req.body.Interschool,
        IntermediatePerc: req.body.InterPercentage,
        HighSname: req.body.highschool,
        HighPerc: req.body.highPercentage,
        interyop: req.body.interyop,
        highyop: req.body.highyop,
        interboard: req.body.Interboard,
        highboard: req.body.highboard,
        workExp: req.body.we,
        skills: req.body.skills,
        resume: req.body.resume
    });
    User.findOneAndUpdate({ _id: user_id }, { $push: { Applied: jobid } }, { new: true }, function(err, user) {
        if (err) console.log(err);
        else {
            jobid_arr = (user?.Applied);
        }

    });
    trac.save(function(err) {
        if (err)
            console.log(err);
        else {
            CompanyJob.find({}, function(err, list) {
                if (err)
                    console.log(err);
                else {
                    if (list)
                        res.render("companylist", { jobs: list, userid: user_id, jobidarr: jobid_arr });
                    else {
                        res.render([], { jobs: list, userid: user_id, jobidarr: jobid_arr });
                    }
                }
            });
            
        }
    });
});
app.get("/register", function(req, res) {
    res.render("register", { errmsg: "" });
});

var resul;
app.get("/signin", async(req, res,next) =>{
    try{
    const token=await req.cookies.jwt;
    const verifyuser=await jwt.verify(token,process.env.KEY_SECRET);
    resul=await User.findOne({_id: verifyuser?._id});    
    next();
    }
    catch(err){
      console.log("Not signed In")
      res.render("signin",{errmsg:""});
    }
},function(req,res){
    CompanyJob.find({},function(err,joblist){
        if(err)
        {
            res.render("signin",{errmsg:""});
            console.log(err);
        }
        else res.render("companylist", { jobs: joblist, userid: resul?._id, jobidarr: resul?.Applied });
    })
})
var lgres
app.get("/LOGGOUT",async(req,res,next)=>{
  try {
    const token = await req.cookies.jwt;
    const verifyuser = await jwt.verify(token, process.env.KEY_SECRET)
    lgres=verifyuser;
    next()
} 
  catch(err){
    res.render("signin",{errmsg:""});
  } 
},function(req,res){
    console.log("User is:",lgres);
    res.clearCookie('jwt');
    res.redirect('signin');
}
)

app.post("/register", async(req, res) => {
    try
    {   var flag=false;
        await User.findOne({email: req.body.email }, function(err, user) {
            if (err) {
                flag=true;
                console.log(err);
                res.render("register",{errmsg:"Some error occured, Please try again!"});
            } 
             else {
            if(user)
             {  flag=true;
                res.render("register", { errmsg: "Email already registered with another account"});
              }
            }
        });
             var gg = req.body.gender;
              var newuser = new User({
                        fname: req.body.fname,
                        lname: req.body.lname,
                        email: req.body.email,
                        password: req.body.password,
                        address: req.body.address,
                        state: req.body.state,
                        city: req.body.city,
                        pin: req.body.pin,
                        gender: gg,
                        dob: req.body.dob,
                        education: req.body.education,
                        Applied: []
                    });
                    if(flag===false) 
                    {
                    const token=await newuser.generateAuthToken();
                    res.cookie("jwt",token,{
                        expires:new Date(Date.now()+1800000),
                        httpOnly:true
                    });  
                res.redirect("/signin");
          
              }
    }
    catch(err)
    {
        res.render("register",{errmsg: "Some error occured, Please try again!"});
        console.log("Error:",err);
    }
   
});




app.post("/create", function(req, res) {
    res.render("register", { errmsg: "" });
})

// app.post("/signin", function(req, res) {
//     User.findOne({ email: req.body.email }, function(err, user) {
//         if (!user) {
//             res.render("signin", { errmsg: "Email not registered, Please try again with valid email" });
//         } else {
//             var pass = md5(req.body.password);
//             if (pass === user.password) {
//                 CompanyJob.find({}, function(err, joblist) {

//                     if (err) {
//                         console.log(err);
//                     } else {
//                         res.render("companylist", { jobs: joblist, userid: user._id, jobidarr: user.Applied });
//                     }
//                 });
//             } else {
//                 res.render("signin", { errmsg: "Wrong Password" });
//             }
//         }
//     });
// });



// app.post("/signin", async(req, res)=>{
//     try{
//     const email=req.body.email;
//     const password=req.body.password;
//     const useremail=await User.findOne({email: email});
//     var flag=false;
//     if(!useremail)
//     {flag=true;
//     email="";
//     res.render("signin",{errmsg:"Email not registered"});
//    }
//    if(flag===false){
//     const isMatch=await bcrypt.compare(password,useremail?.password);
//     const token=await useremail.generateAuthToken();
//     res.cookie("jwt",token,{
//         expires:new Date(Date.now()+1800000),
//         httpOnly:true
//     });
//     if(isMatch===true) 
//     {
//        await CompanyJob.find({}, function(err, joblist) {
//         if (err) {
//             console.log(err);
//         } else {
//            // email="";
//             res.render("companylist", { jobs: joblist, userid: useremail._id, jobidarr: useremail.Applied });
//         }
//     }); 
//     }
//     else res.render("signin",{errmsg:"Invalid Password"});
//     }
//     else res.render("signin",{errmsg:"Email not registered"});
// }
//     catch(err)
//     {
//     console.log(err);
//     res.render("signin",{errmsg:"Invalid Login details"});
//     }
 
// });


app.post("/signin", async(req, res)=>{
    try{
    const email=req.body.email;
    const password=req.body.password;
    const useremail=await User.findOne({email: email});
    var flag=false;
    if(!useremail)
    {flag=true;
    res.render("signin",{errmsg:"Email not registered"});
    }
   if(flag===false){
    const isMatch=await bcrypt.compare(password,useremail?.password);
    const token=await useremail.generateAuthToken();
    res.cookie("jwt",token,{
        expires:new Date(Date.now()+1800000),
        httpOnly:true
    });
    if(isMatch===true) 
    {
    //    await CompanyJob.find({}, function(err, joblist) {
    //     if (err) {
    //         console.log(err);
    //     } else {
    //        // email="";
    //         res.render("companylist", { jobs: joblist, userid: useremail._id, jobidarr: useremail.Applied });
    //     }
    // }); 
    res.redirect("/signin");
    }
    else res.render("signin",{errmsg:"Invalid Password"});
    }
    else res.render("signin",{errmsg:"Email not registered"});
}
    catch(err)
    {
    console.log(err);
    res.render("signin",{errmsg:"Invalid Login details"});
    }
 
});
app.listen(process.env.PORT || 3000, function() { console.log("Server successfully ran!"); 
});
