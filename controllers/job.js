const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const {ensureAuthenticated} = require('../config/auth');
var multer  = require('multer')
const uuidv1 = require('uuid/v1');
uuidv1(); // ⇨ '45745c60-7b1a-11e8-9c9c-2d42b21b1a3e'
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/cvs')
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + uuidv1() + '-'+ Date.now() + '.pdf')
    }
});
var uploadCv = multer({ dest: 'public/uploads/cvs', storage: storage });


// Load Job Model
require('../models/job');
const Job = mongoose.model('job');

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

// View Applicants Form
router.get('/applicants/:id', ensureAuthenticated, (req, res) => {
    Job.findOne({
        _id: req.params.id
    })
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
                res.redirect('/job/view/'+req.params.id);
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
    Job.findOne( { $and : [ {_id: req.body.id} ]})
        .then( job => {
            if(job) {
                result = job.applicants.find(applicant => applicant._id == req.user.id);
                if (result) {
                    req.flash('error_msg', 'You Already Applied for This Job.');
                    res.redirect('/job/view/' + req.body.id);
                    done()
                } else {
                    job.applicants.push({
                        _id: req.user._id,
                        name: req.user.name,
                        email: req.user.email,
                        username: req.user.username,
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
                    req.flash('success_msg', 'Video job updated');
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

module.exports = router;