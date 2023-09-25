var mongoose = require("mongoose");
var Schema = mongoose.Schema;

const pcSchema = new Schema(
{

    win_start: String,
    win_end: String,
    total_time: Number,
    pc_name: String,
    video_name: String,
    location: String,
    pl_start: String,
    start_date_time: String,
    pl_end: String,
    end_date_time: String,
    duration: String




}



)

const beneficiarySchema = new Schema(
    {
          beneficiaryId: Number,
          mob: String,
          name: String,
          u_nm: String,
          f_nm: String,
          m_nm: String
    

    }
);
const userSchema = new Schema(
    {
        userId: Number,
        mobileNumber: String,
        username: String,
        password: String,
        beneficiary: [beneficiarySchema],
        pc: [pcSchema]
    },
    {timestamps: true},
);
const user = mongoose.model("user", userSchema);
module.exports = user;
