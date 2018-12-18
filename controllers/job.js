const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');
var multer = require('multer')
const uuidv1 = require('uuid/v1');
uuidv1(); // ⇨ '45745c60-7b1a-11e8-9c9c-2d42b21b1a3e'
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/cvs')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + uuidv1() + '-' + Date.now() + '.pdf')
    }
});
var uploadCv = multer({dest: 'public/uploads/cvs', storage: storage});


// Load Job Model
require('../models/job');
require('../models/exam');
require('../models/examtemplate');
const Job = mongoose.model('job');
const Exam = mongoose.model('exam');
const ExamTemplate = mongoose.model('examtemplate');

// Job Index Page
router.get('/', ensureAuthenticated, (req, res) => {
    Job.find({'employer._id': req.user.id})
        .sort({createdAt: 'desc'})
        .then(jobs => {
            res.render('job/index', {
                jobs: jobs
            });
        });
});

// Add Job Form
router.get('/add', ensureAuthenticated, (req, res) => {
    res.render('job/add');
});

// Edit Job Form
router.get('/edit/:id', ensureAuthenticated, (req, res) => {
    Job.findOne({
        _id: req.params.id
    })
        .then(job => {
            if (job.employer._id != req.user.id) {
                req.flash('error_msg', 'Not Authorized');
                res.redirect('/job');
            } else {
                res.render('job/edit', {
                    job: job
                });
            }

        });
});

// Reject Applicant
router.post('/applicants/:id/reject', ensureAuthenticated, (req, res) => {
    Job.findOne({
        _id: req.params.id
    })
        .populate('applicants.user')
        .then(job => {
            if (job.employer._id != req.user.id) {
                req.flash('error_msg', 'Not Authorized');
                res.redirect('/job');
            } else {
                Job.update(
                    {_id: req.params.id},
                    {$pull: {applicants: {_id: req.body.applicant_id}}},
                    {multi: true}
                ).then(() => {
                    req.flash('success_msg', 'Removed');
                    res.redirect('/job/applicants/' + req.params.id + '/view');
                });
            }
        }).catch(err => {
        console.log(err);
        req.flash('error_msg', 'An Error Occurred');
        res.redirect('/');
    });
});

// View Applicants Form
router.get('/applicants/:id/view', ensureAuthenticated, (req, res) => {
    Job.findOne({
        _id: req.params.id
    }).populate('applicants.user')
        .then(job => {
            if (job.employer._id != req.user.id) {
                req.flash('error_msg', 'Not Authorized');
                res.redirect('/job');
            } else {
                res.render('job/applicants', {
                    job: job
                });
            }
        });
});

router.get('/apply/:id', ensureAuthenticated, (req, res) => {
    Job.findOne({
        _id: req.params.id
    })
        .then(job => {
            if (job.employer._id == req.user.id) {
                req.flash('error_msg', 'Cannot Apply to your own Job.');
                res.redirect('/job/view/' + req.params.id);
            } else {
                res.render('job/apply', {
                    job: job
                });
            }
        })
        .catch(err => {
            req.flash('error_msg', 'Job Not Found');
            res.redirect('/');
        });
});

router.get('/view/:id', (req, res) => {
    Job.findOne({
        _id: req.params.id
    })
        .then(job => {
            res.render('job/view', {
                job: job
            });
        });
});

// Process Form
router.post('/', ensureAuthenticated, (req, res) => {
    let errors = [];

    if (!req.body.title) {
        errors.push({text: 'Please add a title'});
    }
    if (!req.body.details) {
        errors.push({text: 'Please add some details'});
    }

    if (errors.length > 0) {
        res.render('/add', {
            errors: errors,
            title: req.body.title,
            details: req.body.details
        });
    } else {
        const newJob = {
            title: req.body.title,
            details: req.body.details,
            employer: {
                _id: req.user.id,
                name: req.user.name,
                email: req.user.email,
            }
        };
        new Job(newJob)
            .save()
            .then(job => {
                req.flash('success_msg', 'Job Posted.');
                res.redirect('/job');
            })
    }
});

router.post('/apply', ensureAuthenticated, uploadCv.single('cv'), (req, res, done) => {
    Job.findOne({$and: [{_id: req.body.id}]})
        .populate('applicants.user')
        .then(job => {
            if (job) {
                result = job.applicants.find(applicant => applicant.user._id == req.user.id);
                if (result) {
                    req.flash('error_msg', 'You Already Applied for This Job.');
                    res.redirect('/job/view/' + req.body.id);
                    done()
                } else {
                    job.applicants.push({
                        user: req.user._id,
                        status: "new",
                        cv: {
                            path: req.file.path.slice(7),
                            size: req.file.size,
                        },
                    });
                    job.save().then(job => {
                        req.flash('success_msg', 'Applied Successfully');
                        res.redirect('/job/view/' + req.body.id);
                    })
                }
            }
        }).catch(err => {
            console.log(err)
        req.flash('error_msg', 'Something Wrong Happened');
        res.redirect('/job/view/' + req.body.id);
    })
});

// Edit Form process
router.put('/:id', ensureAuthenticated, (req, res) => {
    Job.findOne({
        _id: req.params.id
    })
        .then(job => {
            // new values
            job.title = req.body.title;
            job.details = req.body.details;

            job.save()
                .then(job => {
                    req.flash('success_msg', 'Job updated');
                    res.redirect('/job');
                })
        });
});

// Delete Job
router.delete('/:id', ensureAuthenticated, (req, res) => {
    Job.remove({_id: req.params.id})
        .then(() => {
            req.flash('success_msg', 'Video job removed');
            res.redirect('/job');
        });
});

router.get('/applicants/:id/sendexam/:applicant_id', ensureAuthenticated, (req, res) => {
    Job.findOne({
        _id: req.params.id
    })
        .populate('applicants.user')
        .then(job => {
            if (job.employer._id != req.user.id) {
                req.flash('error_msg', 'Not Authorized');
                res.redirect('/job');
            } else {
                ExamTemplate.find({'user': req.user.id})
                    .populate('questions')
                    .then(examtemplates => {
                        res.render('job/createexam', {
                            job: job,
                            examtemplates: examtemplates,
                            applicant: job.applicants.find(applicant => applicant.user._id == req.params.applicant_id).user
                        });
                    });
            }
        }).catch(err => {
        req.flash('error_msg', 'An Error Occurred');
        res.redirect('/');
    });
});

router.post('/applicants/:id/sendexam/', ensureAuthenticated, async (req, res, done) => {

    job = await Job.findOne({_id: req.params.id}).populate('applicants.user');

    let selectedTemplates;

    if (job.employer._id != req.user.id) {
        req.flash('error_msg', 'Not Authorized');
        res.redirect('/job');
        done()
    }

    let newExam = {
        user: req.body.applicant_id,
        job: req.params.id,
        deadline: req.body.deadline,
        duration: req.body.duration,
        selectedExams: []
    };


    if(! (req.body.examtemplates instanceof Array) ){
        req.body.examtemplates = [req.body.examtemplates]
    }

    selectedTemplates = await ExamTemplate.find( {'_id': { $in: req.body.examtemplates.map(mongoose.Types.ObjectId) }}).populate('questions');

    selectedTemplates.forEach(function (template) {
        let N = template.questions.length;
        let numberOfQuestions = Math.floor(Math.random() * (N - 1)) + 1;
        let questions = shuffle(template.questions).slice(0, numberOfQuestions);
        newExam.selectedExams.push({
                examTemplate: template._id,
                selectedQuestions: questions.map(function (question) {
                    selectedAnswers = shuffle( question.incorrect ).slice(0,Math.min(question.incorrect.length, 3));
                    selectedAnswers.push(shuffle(question.correct)[0]);
                    return {
                        question : question,
                        answers:  shuffle(selectedAnswers),
                        answer: ""
                    }
                })
            }
        )
    });

    let exam = await (new Exam(newExam)).save();

    applicantIndex = job.applicants.findIndex(applicant => applicant.user._id == req.body.applicant_id);

    job.applicants[applicantIndex].status = "exam_sent";

    job = await job.save();

    req.flash('success_msg', 'Exam Sent to User. ##TODO SEND MAIL, VIEW APPLICANT STATUS');
    res.redirect('/');
});



// Shuffle array (This should be in this file and better be sent to somewhere else but yea nvm...)
function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

module.exports = router;