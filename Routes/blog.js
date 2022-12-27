const fetchuser = require('../middleware/fetchuser');

const express = require('express');

const Blog = require('../models/Blogs');

const router = express.Router();

const User = require('../models/User');

const Feedback = require('../models/Feedback');

const upload = require('../middleware/multer_upload')

const aws_uploadS3 = require('../middleware/aws-s3-multer_upload')

const s3 = require('../middleware/S3')

router.post('/Addblog', fetchuser, aws_uploadS3.single('blogimage'), async (req, res) => {

    try {
        const author = await User.findById(req.user.id);

        const blogdata = { ...req.body }

        if (Object.keys(blogdata).length === 0) { return res.status(400).json({ status: false, msg: "All fields are required" }) }

        if (!req.file) {
            return res.status(400).json({ status: false, msg: "Atleast one image should be selected.." })
        }

        const newblog = await new Blog

            ({
                ...req.body,
                author_name: author.name1,
                user: req.user.id,
                blogimg: req.file.location
                // blogimg: req.file.filename
            }
            ).save();

        if (newblog) {

            res.json({ status: true, 'msg': "blog added successfully!" })
        }


    } catch (error) {
        res.status(500).json({ error: "Some error occured", reason: error.message })
    }

})

router.put('/Update_blog/:id', async (req, res) => {

    try {

        await Blog.findByIdAndUpdate(req.params.id, { $set: { ...req.body, desc: req.body.value } })

        res.json({ status: true, msg: "Blog Updated sucessfully.." });

    } catch (error) {

        res.status(500).json({ error: "Some error occured", reason: error.message })

    }


})

router.delete('/Delete_blog/:id/:bucket_file_name', async (req, res) => {
    try {


        if (req.params.bucket_file_name) {

            var params = {
                Bucket: 'blogapp1-bucket',
                Key: `${req.params.bucket_file_name}`
            };

            s3.deleteObject(params, function (err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                // else console.log(data);           // successful response
            });
        }

        await Blog.findByIdAndDelete(req.params.id)

        res.json({ status: "success", "msg": "Your blog has been removed successfully.." })

    } catch (error) {
        res.status(400).json({ error: error.message })
    }
})

router.get('/searchblogs', async (req, res) => {

    let blogs = await Blog.find();
    let regx = / /g;

    blogs = blogs.filter(blog => {
        if (blog.author_name.replace(regx, "").toLowerCase() == req.query.search.replace(regx, "").toLowerCase()) {
            return blog
        }
    })

    res.json(blogs)

})

router.put('/Addcomments/:id', fetchuser, async (req, res) => {
    const user = await User.findById(req.user.id);

    const { comment } = req.body;

    if (!comment) { return res.status(400).json({ status: false, "msg": "plz write something before posting!" }) }

    const comm_id = Math.random() * 10;

    await Blog.findByIdAndUpdate(req.params.id, { $push: { Comments: { name: user.name1, comment, comm_id, Clikearr: [], Cdislikearr: [], Replyarr: [] } } })

    const blog = await Blog.findById(req.params.id);

    res.status(200).json({ status: true, msg: "Comment added to this blog sucsessfully!", blog })
})

router.put('/updateComment/:id', async (req, res) => {
    const { comm_id, new_comment } = req.body;
    let success = false;
    try {

        const updated_comment = await Blog.updateOne({ "_id": req.params.id, "Comments.comm_id": comm_id }, { $set: { "Comments.$.comment": new_comment } })

        if (updated_comment) res.status(200).json({ success: true, message: "Comment updddated successfully" })

    } catch (error) {

        res.status(500).json({ error: "Some error occured", reason: error.message, success })

    }

})

router.put('/like_Comment/:id', fetchuser, async (req, res) => {

    try {

        const blog_by_id = await Blog.findById(req.params.id);

        await Blog.updateOne({ "_id": req.params.id, "Comments.comm_id": req.body.comm_id }, { $pull: { "Comments.$.Cdislikearr": req.user.id } });

        let bloglike;

        if (blog_by_id.Comments[req.body.comm_index]["Clikearr"].includes(req.user.id)) {
            bloglike = await Blog.updateOne({ "_id": req.params.id, "Comments.comm_id": req.body.comm_id }, { $pull: { "Comments.$.Clikearr": req.user.id } });
        }
        else {
            bloglike = await Blog.updateOne({ "_id": req.params.id, "Comments.comm_id": req.body.comm_id }, { $push: { "Comments.$.Clikearr": req.user.id } });

        }

        res.json({ bloglike })


    } catch (error) {
        res.status(500).json({ error: "Some error occured", reason: error.message })

    }
})

router.put('/dislike_Comment/:id', fetchuser, async (req, res) => {

    try {

        const blog1 = await Blog.findById(req.params.id);

        await Blog.updateOne({ "_id": req.params.id, "Comments.comm_id": req.body.comm_id }, { $pull: { "Comments.$.Clikearr": req.user.id } });

        let blogdislike;

        if (blog1.Comments[req.body.comm_index]["Cdislikearr"].includes(req.user.id)) {

            blogdislike = await Blog.updateOne({ "_id": req.params.id, "Comments.comm_id": req.body.comm_id }, { $pull: { "Comments.$.Cdislikearr": req.user.id } });
        }
        else {

            blogdislike = await Blog.updateOne({ "_id": req.params.id, "Comments.comm_id": req.body.comm_id }, { $push: { "Comments.$.Cdislikearr": req.user.id } });

        }

        res.json({ blogdislike })


    } catch (error) {
        res.status(500).json({ error: "Some error occured", reason: error.message })

    }
})

router.put('/Delete_comment/:id', async (req, res) => {

    try {
        const { comm_id } = req.body

        await Blog.findByIdAndUpdate(req.params.id, { $pull: { Comments: { comm_id } } })

        res.json({ status: "success", msg: "Comment deleted successfully" })

    } catch (error) {
        res.status(400).json({ status: false, message: error.message })
    }

})

router.put('/like_Blog/:id', fetchuser, async (req, res) => {

    try {
        const blog = await Blog.findById(req.params.id);

        await Blog.findByIdAndUpdate(req.params.id, { $pull: { Bdislikearr: req.user.id } })

        if (blog.Blikearr.includes(req.user.id)) {
            await Blog.findByIdAndUpdate(req.params.id, { $pull: { Blikearr: req.user.id } })
        }
        else {
            await Blog.findByIdAndUpdate(req.params.id, { $push: { Blikearr: req.user.id } })
        }

        res.json({ status: "success", msg: "Liked the blog..." })

    } catch (error) {
        res.status(400).json({ status: false, message: error.message })
    }
})

router.put('/dislike_Blog/:id', fetchuser, async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        await Blog.findByIdAndUpdate(req.params.id, { $pull: { Blikearr: req.user.id } })

        if (blog.Bdislikearr.includes(req.user.id)) {
            await Blog.findByIdAndUpdate(req.params.id, { $pull: { Bdislikearr: req.user.id } })
        }
        else {
            await Blog.findByIdAndUpdate(req.params.id, { $push: { Bdislikearr: req.user.id } })
        }

        res.send("DisLiked the blog...")

    } catch (error) {
        res.status(400).json({ status: false, message: error.message })

    }
})

router.get('/Allblogs', async (req, res) => {

    // const allblogs = await Blog.find().sort({_id:-1});
    try {
        const allblogs = await Blog.find();

        if (!allblogs) { return rea.status(400).json({ status: false, msg: "no user has posted the blog yet.." }) }

        res.json({ status: true, allblogs })

    } catch (error) {
        res.status(400).json({ status: false, message: error.message })
    }

})

router.get('/blogs_by_category/:category', async (req, res) => {
    try {
        let category = req.params.category;
        const blogs_by_category = await Blog.find({ category })

        if (blogs_by_category.length === 0) { return res.status(404).json({ status: false, msg: "The blogs of this category is not added yet.." }) }

        res.json({ status: true, blogs_by_category })

    } catch (error) {
        res.status(400).json({ status: false, message: error.message })
    }
})

router.post('/limited_blogs', async (req, res) => {
    try {
        let query = req.query
        let cat = req.body.category
        let findQuery = cat === "all" ? {} : { category: cat }
        let blogs = await Blog.find(findQuery).skip(query.from).limit(query.numOfBlogsPerPage)
        res.status(200).json({ status: true, blogs })
    } catch (error) {
        res.status(400).json({ status: false, message: error.message })
    }
})

router.get('/totalnumOfBlogs', async (req, res) => {
    try {
        let cat = req.query.category;
        let findQuery = cat === "all" ? {} :{category:cat}
        let results = await Blog.find(findQuery)
        res.status(200).send({results:results.length})
    } catch (error) {
        res.status(400).json({ status: false, message: error.message })
    }
})

router.get('/blog_by_id/:id', async (req, res) => {

    try {
        const blogid = req.params.id;
        const blog_by_id = await Blog.findById(blogid);

        if (!blog_by_id) {
            return res.status(400).json({ status: false })
        }

        res.json({ status: "success", blog_by_id })

    } catch (error) {
        res.status(400).json({ status: false, error: error.message })
    }
})

router.put('/push_reply/:id', fetchuser, async (req, res) => {

    try {

        const { comm_id, rep } = req.body;

        const user_by_id = await User.findById(req.user.id);

        const user = user_by_id.name1;

        const rep_id = Math.random(23) * 10;

        await Blog.updateOne({ "_id": req.params.id, "Comments.comm_id": comm_id }, { $push: { "Comments.$.Replyarr": { user, "reply": rep, rep_id } } })

        res.json({ success: true, msg: "Replied to Comment Sucessfully!" });

    } catch (error) {
        res.status(400).json({ error: "Some error occured", reason: error.message })
    }
})

router.put('/update_reply/:id', async (req, res) => {
    try {
        let { comm_id, rep_ind, new_reply } = req.body;

        // let updated_result = await Blog.updateOne({ "_id": req.params.id, "Comments.comm_id": comm_id, "Replyarr.rep_id": rep_id }, { $set: { "Comments.$.Replyarr": [] } })

        let reply_to_update = `Comments.$.Replyarr.${rep_ind}.reply`

        let updated_result = await Blog.updateOne({ "_id": req.params.id, "Comments.comm_id": comm_id }, { $set: { [reply_to_update]: new_reply } })

        updated_result ? res.json({ success: true, msg: "Replied to Updated Sucessfully!" }) : res.json({ success: false, msg: "Some error occured try again!" });

    } catch (error) {
        res.status(400).json({ error: "Some error occured", reason: error.message })
    }
})

router.put('/delete_reply/:id', async (req, res) => {

    try {

        const { comm_id, rep_id } = req.body;

        const deleted_reply = await Blog.updateOne({ "_id": req.params.id, "Comments.comm_id": comm_id }, { $pull: { "Comments.$.Replyarr": { rep_id } } })

        res.json(deleted_reply)

    } catch (error) {
        res.status(400).json({ error: "Some error occured", reason: error.message })
    }
})

router.post('/feedback/:stars', fetchuser, async (req, res) => {

    try {
        const user = await User.findById(req.user.id)
        const feedback = await new Feedback({
            userid: req.user.id,
            name: user.name1,
            stars: req.params.stars,
        }).save()

        const allfeedbacks = await Feedback.find({});

        allstars = []

        allfeedbacks.forEach(feedB => {
            allstars.push(feedB.stars)
        })

        if (feedback) res.status(200).json({ success: true, message: "Rated sucessfully", feedback, allstars });

    } catch (error) {
        res.status(400).json({ success: false, error: "Some error occured", reason: error.message })
    }
})

router.put('/updatefeedback/:id/:stars', fetchuser, async (req, res) => {

    try {

        await Feedback.findByIdAndUpdate(req.params.id, { $set: { stars: req.params.stars } });

        const allfeedbacks = await Feedback.find({});

        allstars = []

        allfeedbacks.forEach(feedB => {
            allstars.push(feedB.stars)
        })

        res.status(200).json({ success: true, message: "Review Updated Successfully", allstars });

    } catch (error) {
        res.status(400).json({ success: false, error: "Some error occured", reason: error.message })
    }
})

router.post('/getFeedbackbyuser', fetchuser, async (req, res) => {

    try {

        const feedback_by_user = await Feedback.findOne({ userid: req.user.id });

        const allfeedbacks = await Feedback.find({});

        allstars = []

        allfeedbacks.forEach(feedB => {
            allstars.push(feedB.stars)
        })

        if (!feedback_by_user) return res.status(400).json({ status: false, message: "Not Given any feedback yet", allstars })

        res.status(200).json({ success: true, feedback_by_user, allstars });

    } catch (error) {
        res.status(400).json({ success: false, error: "Some error occured", reason: error.message })
    }
})

router.get('/getallfeedbacks', async (req, res) => {
    try {
        const allfeedbacks = await Feedback.find({});
        res.status(200).json({ success: true, allfeedbacks })
    } catch (error) {
        res.status(400).json({ success: false, error: "Some error occured", reason: error.message })

    }
})

router.put('/addreview/updatefeedback', fetchuser, async (req, res) => {

    try {

        await Feedback.updateOne({ userid: req.user.id }, { $set: { review: req.body.review } });

        const feedback = await Feedback.findOne({ userid: req.user.id })

        if (feedback) res.status(200).json({ success: true, message: "review added to your feedback", feedback })

    } catch (error) {
        res.status(400).json({ success: false, error: "Some error occured", reason: error.message })

    }

})

router.delete('/deletefeedback/:id', async (req, res) => {
    try {
        const deleted_feedBack = await Feedback.findByIdAndDelete(req.params.id);

        const allfeedbacks = await Feedback.find({});

        allstars = []

        allfeedbacks.forEach(feedB => {
            allstars.push(feedB.stars)
        })

        res.status(200).json({ success: true, message: "Feedback removed successflly", allstars })

    } catch (error) {
        res.status(400).json({ success: false, error: "Some error occured", reason: error.message })

    }
})

router.put('/updateReview', fetchuser, async (req, res) => {
    try {
        const { review } = req.body;

        const updated_feedback = await Feedback.updateOne({ userid: req.user.id }, { $set: { review } })

        const feedback_by_user = await Feedback.findOne({ userid: req.user.id })

        if (updated_feedback && feedback_by_user) res.status(200).json({ success: true, message: "review updated successfully !", feedback_by_user })

    } catch (error) {

        res.status(400).json({ success: false, error: "Some error occured", reason: error.message })
    }
})

module.exports = router