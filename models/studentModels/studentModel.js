import mongoose from "mongoose";
import bcrypt from "bcryptjs";

//schema
const studentSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: true,
        trim: true
    },
    lastname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true,
        validate: {
            validator: function (v) {
                return /^\d{10}$/.test(v); // validates 10-digit mobile number
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    college: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        trim: true,
        ref: "College"
    },
    semester: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
})

//  Hash the user passowrd before saving
studentSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        next();
    }
    this.password = await bcrypt.hash(this.password, 10);
})

// model 
const Student_Info = mongoose.model("Student_Info", studentSchema);

export default Student_Info;