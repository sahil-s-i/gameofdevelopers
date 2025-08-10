import mongoose from "mongoose";

const Quizzeschema = new mongoose.Schema({
    quize_name: {
        type: String,
        required: true,
        trim: true
    },
    quize_questions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quize_Questions"
        }
    ],
    total_score: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

// Pre-save hook to calculate total_score
Quizzeschema.pre('save', async function (next) {
    if (this.quize_questions && this.quize_questions.length > 0) {
        // Populate the related questions to access their scores
        const questions = await mongoose.model("Quize_Questions")
            .find({ _id: { $in: this.quize_questions } })
            .select("score");

        this.total_score = questions.reduce((sum, q) => sum + (q.score || 0), 0);
    }
    next();
});

// model 
const Quizzes = new mongoose.model("Quizzes", Quizzeschema);

export default Quizzes;