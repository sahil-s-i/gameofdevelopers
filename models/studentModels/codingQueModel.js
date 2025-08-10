import mongoose from "mongoose";

const codingQuestionsSchema = new mongoose.Schema({
    question_name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    sample_testcase: [
        {
            input: { type: String, required: true },
            output: { type: String, required: true }
        }
    ],
    all_testcase: [
        {
            input: { type: String, required: true },
            output: { type: String, required: true }
        }
    ],
    difficulty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DifficultyLevel",
        required: true
    }
}, {
    timestamps: true
})

// model 
const Coding_Questions = new mongoose.model("Coding_Questions", codingQuestionsSchema);

export default Coding_Questions;