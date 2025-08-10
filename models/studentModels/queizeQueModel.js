import mongoose from "mongoose";

const quizeQuestionSchema = new mongoose.Schema({
    quiz_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quizzes",
    },
    question:
    {
        type: String,
        required: true,
        trim: true
    },
    options: {
        type: [String], 
        required: true,
        validate: {
            validator: function (v) {
                return v.length >= 1; 
            },
            message: "A question must have at least one options."
        }
    },
    correct_option: {
        type: String,
        required: true,
        trim: true
    },
    score: {
        type: Number,
        required: true,
        default: 1 // default score per question
    }
}, {
    timestamps: true
})

// model 
const Quize_Questions = new mongoose.model("Quize_Questions", quizeQuestionSchema);

export default Quize_Questions;
