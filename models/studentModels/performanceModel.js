import mongoose from "mongoose";

const performanceSchema = new mongoose.Schema({
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student_Info",
        required: true
    },
    course_completed: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course"
        }
    ],
    course_inprogress: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course"
        }
    ],
    quezes_completed: {
        type: Number,
        default: 0,
    },
    // This is not mentioned in the Diagram I have added it beacuse to know the Quizzes completed by the student
    Quizzes_info: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quizzes"
        }
    ],
    coding_que_solved: {
        type: Number,
        default: 0
    },
    // This is not mentioned in the Diagram I have added it beacuse to know the coding questions solved by the student
    coding_que_info: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Coding_Questions"
        }
    ],
    totalScore: {
        type: Number,
        default: 0
    },
    battlePoints: {
        type: Number,
        default: 0
    },
    codingScore: {
        type: Number,
        default: 0
    },
    Quizzescore: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

// Optional: Auto-calculate scores before save
performanceSchema.pre('save', async function (next) {
    // Calculate quiz score total
    if (this.Quizzes_info?.length) {
        const quizzes = await mongoose.model("Quizzes")
            .find({ _id: { $in: this.Quizzes_info } })
            .select("total_score");
        this.Quizzescore = quizzes.reduce((sum, q) => sum + (q.total_score || 0), 0);
    }

    // Calculate coding score total
    if (this.coding_que_info?.length) {
        const codingQuestions = await mongoose.model("Coding_Questions")
            .find({ _id: { $in: this.coding_que_info } })
            .populate("difficulty", "score"); // get score from DifficultyLevel
        this.codingScore = codingQuestions.reduce((sum, cq) => sum + (cq.difficulty?.score || 0), 0);
    }

    // Total score is sum of quiz + coding scores
    this.totalScore = (this.Quizzescore || 0) + (this.codingScore || 0);

    next();
});

// model 
const Performance = mongoose.model("Performance", performanceSchema);

export default Performance;