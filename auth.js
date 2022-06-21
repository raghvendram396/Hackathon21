const jwt = require('jsonwebtoken')

const auth = async(req, res, next) => {
    try {
        const token = req.cookies.jobPortalCookie;
        const verifyUser = jwt.verify(token, process.env.SECRETKEY)
        console.log(verifyUser)
        console.log("wow")
        next()
    } catch (error) {
        res.status(401).send(error)
    }
}

module.exports = auth;