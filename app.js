require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
var FormData = require('form-data');
var form_data = new FormData();
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set('view engine', 'ejs');
const cors=require("cors");
const Bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const user = process.env.MONGOUSER
const pass = process.env.MONGOPASS
mongoose.connect(`mongodb+srv://${user}:${pass}@cluster0.zksak.mongodb.net/Job_Portal?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true });
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
const Company_Profile_Schema = {
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
    postal: Number
}
const companySchema = {
    cin_number: String,
    password: String,
    company: String,
    jobtitle: String,
    WorkExp: String,
    location: String,
    post: String,
    salary: String,
    description: String
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
		education:String,
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
	 }
  });
const trackSchema = {
    user_id: String,
    company_id: String,
    name: String,
    contact: Number,
    dob: Date,
    IntermediateSname: String,
    IntermediatePerc: String,
    HighSname: String,
    HighPerc: String,
    workExp: String,
    awards: String
}
const CompanyProfile = mongoose.model("CompanyProfile", Company_Profile_Schema);
const CompanyJob = mongoose.model("CompanyJob", companySchema);
const User = mongoose.model("User", userSchema);
const Track = mongoose.model("Track", trackSchema);


app.get("/", function(req, res) {
    if (flag === 0)
        res.render("home", { quote: null, message: null });
    else {
        res.render("home", { quote: null, message: "Jobs Posted successfully!" });
        flag = 0;
    }
});



app.post("/hiring", function(req, res) { res.render("hiring-page", { msg: null }); });

app.get("/company_login", function(req, res) { res.render("Company_login", { msg: 0 }); });

app.post("/login_details_check", function(req, res) {
    CompanyProfile.findOne({ cin_number: req.body.cin_num, email: req.body.email, password: req.body.pass }, (err, result) => {
        if (err) {
            res.send(err)
        } else {
            if (result === null) {
                res.render("Company_login", { msg: 1 })
            } else {
                res.render("Company_Profile", {
                    Company_name: result.company_name,
                    logo_url: result.logo_url,
                    cin_number: result.cin_number,
                    email: result.email,
                    description: result.description,
                    contact_no: result.contact_no,
                    ceo_name: result.ceo_name,
                    headquarter_location: result.headquarter_location,
                    city: result.city,
                    state: result.state,
                    country: result.country,
                    postal: result.postal
                })
            }
        }
    })
})

app.get("/company_registration", function(req, res) { res.render("Company_Registration", { msg: null }); });

app.post("/company_registartion_datails", (req, res) => {
    CompanyProfile.findOne({ cin_number: req.body.cin_num, email: req.body.email }, (err, result) => {
        if (err) {
            res.send(err);
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
                        contact_no: `${req.body.c_code}+${req.body.phone}`,
                        ceo_name: req.body.ceo_name,
                        headquarter_location: req.body.loc,
                        city: req.body.city,
                        state: req.body.state,
                        country: req.body.country,
                        postal: req.body.postal
                    })
                    value.save(function(err) {
                        if (err)
                            return console.log(err);
                        else {
                            console.log("no files")
                            res.render("Company_Profile", {
                                Company_name: req.body.c_name,
                                logo_url: "",
                                cin_number: req.body.cin_num,
                                email: req.body.email,
                                description: req.body.desc,
                                contact_no: `${req.body.c_code}+${req.body.phone}`,
                                ceo_name: req.body.ceo_name,
                                headquarter_location: req.body.loc,
                                city: req.body.city,
                                state: req.body.state,
                                country: req.body.country,
                                postal: req.body.postal
                            });
                        }
                    });
                } else {
                    cloudinary.uploader.upload(req.files.file.tempFilePath, (err, result) => {
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
                                contact_no: `${req.body.c_code}+${req.body.phone}`,
                                ceo_name: req.body.ceo_name,
                                headquarter_location: req.body.loc,
                                postal: req.body.postal
                            })
                            value.save(function(err) {
                                if (err)
                                    return console.log(err);
                                else {
                                    console.log("with files")
                                    res.render("Company_Profile", {
                                        Company_name: req.body.c_name,
                                        logo_url: result.url,
                                        cin_number: req.body.cin_num,
                                        email: req.body.email,
                                        description: req.body.desc,
                                        contact_no: `${req.body.c_code}+${req.body.phone}`,
                                        ceo_name: req.body.ceo_name,
                                        headquarter_location: req.body.loc,
                                        postal: req.body.postal
                                    });
                                }
                            });
                        }
                    })
                }
            }
        }
    })
})

app.post("/Check_Profile", (req, res) => {
    res.render("Company_Profile", { data: req.body })
})

app.post("/registration",function(req,res)
{res.render("company",{msg:null});});

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



app.post("/company",function(req,res)
{const jobpost=new CompanyJob(
  { company:req.body.company,
    jobtitle:req.body.jobtitle,
    workExp:req.body.wexperience,
    location:req.body.location,
    post:req.body.post,
    salary:req.body.salary,
   description:req.body.description
 }
);
jobpost.save(function()
{flag=1;
res.redirect("/");
});
});

app.get("/login",function(req,res)
{
CompanyJob.find({},function(err,list)
{if(err)
console.log(err);
else
{
if(list)
res.render("companylist",{jobs: list,userid: useridvar});
}
});});
app.post("/apply",function(req,res)
{
Track.findOne({user_id: req.body.userid, company_id: req.body.id},function(err,found)
{if(err)
console.log(err);
else {
  if(found!=null)
  {res.render("Already");}
  else res.render("job",{id: req.body.id,userid: req.body.userid});
}});
});
app.post("/postajob",function(req,res)
{ useridvar=req.body.userid;
const jobid=req.body.job;
const userid=req.body.userid;
const trac=new Track({
  user_id: userid,
  company_id: jobid,
  name: req.body.name,
  dob: req.body.dob,
  contact: req.body.contact,
  IntermediateSname: req.body.school,
  IntermediatePerc: req.body.perc,
  HighSname: req.body.hschool,
  HighPerc: req.body.hperc,
  workExp: req.body.we,
  awards: req.body.ah
});
trac.save(function(err)
{if(err)
console.log(err);
else
res.redirect("/login");
});
});
app.get("/register",function(req,res)
{
	res.render("register",{errmsg:""});
});

app.get("/signin",function(req,res) {
	res.render("signin",{errmsg: ""});
})
app.post("/register",function(req,res)
{
User.findOne({email: req.body.email},function(err,user) {
	if(err) {
		console.log(err);
	}
	else {
		if(!user){
			var gg=req.body.gender;
			var newuser=new User({
				fname: req.body.fname,
				lname: req.body.lname,
				email: req.body.email,
				password: md5(req.body.password),
        address: req.body.address,
				state: req.body.state,
				city: req.body.city,
				pin: req.body.pin,
				gender: gg,
				dob: req.body.dob,
				education: req.body.education
			});
			newuser.save(function(err) {
				if(err) {res.render("register",{errmsg: err.message});}
				else {
					res.render("signin",{errmsg: "Registration Successfull. Please Sigin"});
				}
			});
		}
		else {
			res.render("register",{errmsg: "Email already registered with another account"});
		}
	}

});
});

app.post("/signin",function(req,res) {

User.findOne({email: req.body.email},function(err,user) {
	if(!user) {
		res.redirect("signin",{errmsg: "Email not registered, Please try again with valid email"});
	}
	else {
		var pass=md5(req.body.password);
		if(pass===user.password)
		{
			CompanyJob.find({},function(err,joblist){
				if(err) {
					console.log(err);
				}
				else {
					res.render("companylist",{jobs: joblist,userid: user._id});
				}
			})
		}
		else {
			res.redirect("/signin",{errmsg: "Wrong Password"});
		}
	}
});
});
app.listen(process.env.PORT || 3000, function() { console.log("Server successfully ran!"); });