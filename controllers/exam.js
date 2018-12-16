const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');
var multer = require('multer')
const uuidv1 = require('uuid/v1');
uuidv1(); // ⇨ '45745c60-7b1a-11e8-9c9c-2d42b21b1a3e'


// Load Job Model
require('../models/question');
require('../models/exam');
const Question = mongoose.model('question');
const Exam = mongoose.model('exam');



// Add Exam Form
router.get('/add', ensureAuthenticated, (req, res) => {
    res.render('exam/add');
});

// Add Exam
router.post('/', ensureAuthenticated, (req, res) => {
    let errors = [];

    if (!req.body.title) {
        errors.push({text: 'Please add a title'});
    }
    if (!req.body.details) {
        errors.push({text: 'Please add some details'});
    }
    if (!req.body.type) {
        errors.push({text: 'Please add some details'});
    }

    if (errors.length > 0) {
        res.render('/add', {
            errors: errors,
            title: req.body.title,
            details: req.body.details,
            type: req.body.type
        });
    } else {
        const newExam = {
            title: req.body.title,
            details: req.body.details,
            type: req.body.type,
            user: req.user.id,
            questions : []
        };
        new Exam(newExam)
            .save()
            .then(exam => {
                req.flash('success_msg', 'Exam Added, Go add questions.');
                res.redirect('/exam');
            })
    }
});


// View Exam
// Job Index Page
router.get('/', ensureAuthenticated, (req, res) => {
    Exam.find({'user': req.user.id})
        .then(exams => {
            res.render('exam/index', {
                exams: exams
            });
        });
});

module.exports = router;