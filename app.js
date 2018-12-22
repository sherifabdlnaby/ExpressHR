const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const mongoose = require('mongoose');
const app = express();

// -- Controllers Dependencies
const home = require('./controllers/home');
const job = require('./controllers/job');
const users = require('./controllers/users');
const examtemplates = require('./controllers/examtemplate');
const exam = require('./controllers/exam');

// ----------------- DATABASE CONNECTION ------------------ //

mongoose.Promise = global.Promise;
var configDB = require('./config/database.js');
mongoose.connect(configDB.url, {
    useMongoClient: true
})
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.log(err));

// ------------------------------------------------------- //


// -------------------- RENDER ENGINE -------------------- //

app.engine('handlebars', exphbs({
    defaultLayout: 'main',
    helpers: {
        equals: function (val1, val2) {
            return val1 == val2
        },
        gt: function (val1, val2) {
            return val1 > val2
        },

        lt: function (val1, val2) {
            return val1 < val2
        },
        pass: function (correct, total) {
            return correct >= (total/2)
        },
        inc: function (value, options) {
            return parseInt(value) + 1;
        },
        answerClasses: function (userAnswer, answer) {
            if(userAnswer.text == answer){
                if(userAnswer.correct)
                    return "btn-success";
                else
                    return "btn-danger"
            }
            else return "btn-outline-dark"
        },
        isAnswered: function (userAnswer) {
            return userAnswer.correct != null;
        },
        dateFormat: require('handlebars-dateformat')
    },
}));


app.set('view engine', 'handlebars');

// ------------------------------------------------------- //

// ------------------------ MISC ------------------------- //

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(flash());

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Method override middleware
app.use(methodOverride('_method'));

// Express session middleware
app.use(session({
    secret: 'dracarys',
    resave: true,
    saveUninitialized: true
}));

// ------------------------------------------------------- //


// ---------------------- PASSPORT ----------------------- //

require('./config/passport')(passport);
app.use(passport.initialize());
app.use(passport.session());

// ------------------------------------------------------- //

// Global variables
app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');          // TODO Make consistent with Passport Flash
    res.locals.user = req.user || null;
    next();
});

// --------------------- CONTROLLERS --------------------- //

app.use('/', home);
app.use('/job', job);
app.use('/users', users);
app.use('/examtemplate', examtemplates);
app.use('/exam', exam);

// --------------------- ************ --------------------- //


const port = 5000;

app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});