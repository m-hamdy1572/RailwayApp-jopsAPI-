const User = require('../models/Users');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, UnauthenticatedError } = require('../errors');
const jwt = require('jsonwebtoken');
const register = async (req, res) => {
    const user = await User.create({ ...req.body });
    // const token = jwt.sign({ userId: user._id, name: user.name }, process.env.JWT_SECTER, {
    //     expiresIn: '7d'
    // })
    const token = user.createJWT();
    res
        .status(StatusCodes.CREATED)
        .json({ user: { name: user.name }, token });
};

const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        throw new BadRequestError('Please provide email, password');
    const user = await User.findOne({ email });
    if (!user)
        throw new UnauthenticatedError('Invalid Credentials')
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect)
        throw new UnauthenticatedError('Invalid Credentials')
    const token = user.createJWT();
    res.status(StatusCodes.OK).json({ user: { name: user.name }, token });
};

module.exports = {
    register,
    login,
}