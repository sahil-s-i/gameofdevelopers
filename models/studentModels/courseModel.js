import mongoose from "mongoose";

// schema 
const courseSchema = new mongoose.Schema({
    coursename: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    thumbnail: {
        type: String,
        required: true,
        trim: true
        // Optional one - if the image is url 
        // validate: {
        //     validator: v => /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/.test(v),
        //     message: props => `${props.value} is not a valid image URL!`
        // }
    },
    last_updated: {
        type: Date,
        default: Date.now
    },
    course_content: {
        type: Object, // or Array depending on structure
        required: true
    }
}, {
    timestamps: true
})

// model 
const Course = mongoose.model("Course", courseSchema);

export default Course;

