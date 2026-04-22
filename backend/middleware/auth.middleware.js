const { verifyToken } = require("../utils/jwt.utils");

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({error: 'Unauthorized'});
    }

    try {
        const token = authHeader.split(' ')[1];
        req.user = verifyToken(token);
        next();
    }
    catch (err) {
        return res.status(401).json({error: 'Invalid token'});
    }
};

module.exports = authenticate;