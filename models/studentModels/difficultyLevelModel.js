import mongoose from "mongoose";

const difficultyLevelSchema = new mongoose.Schema({
    difficulty: {
        type: String,
        required: true,
        trim: true,
        enum: ['easy', 'medium', 'hard'] // restrict to only these 3
    },
    score: {
        type: Number,
        min: 1
    }
}, {
    timestamps: true
})

// Pre-save hook to set score based on difficulty
difficultyLevelSchema.pre('save', function (next) {
    const scoreMapping = {
        easy: 5,
        medium: 10,
        hard: 20
    };
    if (this.difficulty && scoreMapping[this.difficulty]) {
        this.score = scoreMapping[this.difficulty];
    }
    next();
});

// model 
const DifficultyLevel = mongoose.model("DifficultyLevel", difficultyLevelSchema);

export default DifficultyLevel;