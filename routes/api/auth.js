const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');


//@route  GET api/auth
//@desc   test
//@access public
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);

    } catch (error) {
        console.log(error.message);
        res.status(500).send('Server error');
    }
});

//@route  POST api/auth
//@desc   auth user(login)
//@access public
router.post('/', [
    check('email', 'Please include a valid email')
        .isEmail(),

    check('password', 'Password is required')
        .exists(),



], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    const { email, password } = req.body;

    try {
        //check if user exists

        let user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

        //verify password

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
        }

        //return json webtoken

        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(payload, config.get('jwtToken'), { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );

    } catch (error) {
        console.log(error.message);
        res.status(500).send('server error');
    }


});

module.exports = router;