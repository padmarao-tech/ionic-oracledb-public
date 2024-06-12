require('dotenv').config()
const jwt = require('jsonwebtoken')

const verifyToken = (req,res,next) =>{
    if (!req.headers.authorization) {
        return res.status(401).send('Unauthorized request')
    }
    // console.log(req.headers)
    let token = req.headers.authorization.split(' ')[1]
    // console.log(token)
    if (token === 'null') {
        return res.status(401).send('Unauthorized request')
    }
    let payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    if (!payload) {
        return res.status(401).send('Unauthorized request')
    }
    req.userId = payload.userId
    next()
};

module.exports = verifyToken;