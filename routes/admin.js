//Routes for actions on /admin

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
var passport = require('passport');
var cors = require('cors');
/*
var allowedOrigins = ['https://geopark-beta.herokuapp.com/'];
router.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin 
        // (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not ' +
                'allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));*/

var { isAuth } = require('../middleware/isAuth');
require('../middleware/passport')(passport);

const User = require('../models/User');
const PinPoints = require('../models/PinPoints');
const Events = require('../models/Events');
const Routes = require('../models/Routes');

router.use(express.static('www'));


//Reutrns Login for Admin
router.get('/', (req, res) => {
    try {
        if (req.user == null) {
            res.status(200).render('admin', { layout: 'admin' });
        } else {
            res.redirect('/admin/dashboard');
        }

    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error')
    }
})

//Accepts data for new user
router.post('/createUser', async (req, res) => {
    const { username, password } = req.body;
    try {

        user = new User({
            username,
            password
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        res.status(200).redirect('/admin');
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error')
    }
})

//Accepts login credentials and processes for auth
router.post('/signin', (req, res, next) => {
    try {
        passport.authenticate('local', {
            successRedirect: '/admin/dashboard',
            failureRedirect: '/?incorrectLogin'
        })(req, res, next)
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error')
    }
})

//Deserializes current session
router.get('/signout', isAuth, (req, res) => {
    //Logs the logged in user out and redirects to the sign in page
    req.logout();
    res.redirect('/');
})

//Returns Admin dashboard - private route, requires Auth
router.get('/dashboard', isAuth, async (req, res) => {
    try {
        var pinDocuments, eventDocuments, routeDocuments;
        await PinPoints.find({}, null, {sort:{ category: -1, name:1 }}, function(err, pinDocs) {
            if (err) throw err;
            pinDocuments = pinDocs;
        })
        await Events.find({}, null, { sort: { name: 1} }, function(err, eventDocs) {
            if (err) throw err;
            eventDocuments = eventDocs
        })
        await Routes.find({}, null, { sort: { name: 1 } }, function(err, routeDocs) {
            if (err) throw err;
            routeDocuments = routeDocs
        })

        res.status(200).render('adminDashboard', { layout: 'admin', data: { "pinDocs": pinDocuments, "eventDocs": eventDocuments, "routeDocs": routeDocuments }, pinsExist: true, eventsExist: true, routesExist: true })


    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error')
    }
})


router.get('/dashboard', isAuth, (req, res) => {
    //console.log("getEventsAdmin");
    try {
        Events.find({}).lean()
            .exec((err, pind) => {
                if (pind.length) {
                    res.status(200).render('adminDashboard', { layout: 'admin', pind: pind, pindExist: true });
                } else {
                    res.status(200).render('adminDashboard', { layout: 'admin', pindExist: true });
                }
            });
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server Error')
    }
})

module.exports = router;
