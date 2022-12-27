const mongoose = require('mongoose');

const { Schema } = mongoose;

const BlogSchema = new Schema({
    user:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        required:true
    },
    blogimg:{
        type:String
    },
    title:{
        type:String,
        required:true
    },
    desc:{
        type:String,
        required:true
    },
    author_name:{
        type:String,
        required:true
    },
    category:{
        type:String,
        required:true
    },
    Comments:[Object],
    Blikearr:[mongoose.Schema.Types.ObjectId],
    Bdislikearr:[mongoose.Schema.Types.ObjectId],
},{
    timestamps: true
});

const Blog = mongoose.model('Blogs',BlogSchema )

module.exports = Blog
