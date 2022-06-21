const jwt=require("jsonwebtoken");

const auth2=async(req,res,next)=>{
try{
const token=req.cookies.jwt;
const verifyUser=jwt.verify(token,process.env.KEY_SECRET);
next();
}
catch(err)
{
    console.log(err);
    res.render("signin",{errmsg:"Error occured, try again!"});
}
}
module.exports=auth2;