const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose=require("mongoose");
const md5=require("md5");
const app=express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.set('view engine', 'ejs');
mongoose.connect("mongodb://localhost:27017/companydb",{useNewUrlParser: true});
var flag=0;
const companySchema={
  company: String,
  jobtitle: String,
  WorkExp: String,
  location: String,
  post: String,
  salary: String,
  description: String
};
const userSchema={
  email: String,
  password: String
};
const CompanyJob=mongoose.model("CompanyJob",companySchema);
const User=mongoose.model("User",userSchema);
app.get("/",function(req,res)
{if(flag===0)
res.render("home",{quote:null,message:null});
else
{res.render("home",{quote:null,message: "Jobs Posted successfully!"});
flag=0;
}
});

app.post("/",function(req,res)
{res.render("company");});
app.post("/company",function(req,res)
{const jobpost=new CompanyJob(
  {  company:req.body.company,
    jobtitle:req.body.jobtitle,
    workExp:req.body.wexperience,
    location:req.body.location,
    post:req.body.post,
    salary:req.body.salary,
   description:req.body.description}
);
jobpost.save(function()
{flag=1;
res.redirect("/");
});
});
app.post("/apply",function(req,res)
{
const id=req.body.id;
console.log(id);
});
app.get("/register",function(req,res)
{res.render("register");});
app.post("/register",function(req,res)
{ const user=new User({
  email: req.body.email,
  password: md5(req.body.password)
});
user.save(function(err)
{if(err)
console.log(err);
else {
  CompanyJob.find({},function(err,list)
  {if(err)
  console.log(err);
  else
  {
    if(list)
    res.render("companylist",{jobs: list});
    else res.send("<h1>No Jobs Available</h1>");
  }
  });
}}
);
});
app.post("/login",function(req,res)
{const email=req.body.email;
const password=md5(req.body.password);
User.findOne({email: email},function(err,founduser)
{if(err)
console.log(err);
else{
  if(founduser)
  {if(founduser.password===password)
  {CompanyJob.find({},function(err,list)
  {if(err)
  console.log(err);
  else
  {
    if(list)
    res.render("companylist",{jobs: list});
  }
  });}
  else {
    res.render("home",{quote: "Wrong Password",message:null});
  }

  }
  else res.render("home",{quote: "Invlaid email and password",message:null});
}
})});
app.listen(3000,function()
{console.log("Server successfully ran!");});
