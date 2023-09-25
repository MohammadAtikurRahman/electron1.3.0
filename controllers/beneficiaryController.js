const {request} = require("express");
const jwt_decode = require("jwt-decode");
const {randomNumberNotInBeneficiaryCollection} = require("../helpers/number");
const {findById, findOneAndUpdate, findByIdAndUpdate} = require("../model/user");
const User = require("../model/user");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const os = require('os');






async function addBeneficiary(req, res) {
  let user = jwt_decode(req.body.token);

  // Check if the user already has a beneficiary
  if (user.beneficiary) {
      return res.status(400).json({ errorMessage: "Beneficiary not inserted. Only one beneficiary is allowed per user." });
  }

  const beneficiaryId = await randomNumberNotInBeneficiaryCollection(user.beneficiary);

  if (!req.body.beneficiary.beneficiaryId) {
      req.body.beneficiary["beneficiaryId"] = beneficiaryId;
  }

  // Insert the Windows user name into m_nm field
  req.body.beneficiary["m_nm"] = os.userInfo().username;

  user = await User.findByIdAndUpdate(
      user.id,
      { beneficiary: req.body.beneficiary },
      { new: true },
  );

  return res.status(200).json({ user: user });
}





async function updateBeneficiary(req, res) {
    const {
        name,
        accre,
        age,
        bank,
        ben_id,
        ben_nid,
        ben_sts,
        beneficiaryId,
        branch,
        dis,
        dob,
        duration,
        f_allow,
        f_nm,
        gen,
        job,
        m_nm,
        mob,
        mob_1,
        mob_own,
        nid_sts,
        pass,
        pgm,
        r_out,
        relgn,
        score1,
        sl,
        sub_dis,
        test,
        u_nm,
        uni,
        vill,
        a_sts,
    } = req.body.beneficiary;
    const updatedBeneficiary = await User.findOneAndUpdate(
        {"beneficiary._id": req.params.id},
        {
            $set: {
                "beneficiary.$.name": name,
                "beneficiary.$.accre": accre,
                "beneficiary.$.age": age,
                "beneficiary.$.bank": bank,
                "beneficiary.$.ben_id": ben_id,
                "beneficiary.$.ben_nid": ben_nid,
                "beneficiary.$.ben_sts": ben_sts,
                "beneficiary.$.beneficiaryId": beneficiaryId,
                "beneficiary.$.branch": branch,
                "beneficiary.$.dis": dis,
                "beneficiary.$.dob": dob,
                "beneficiary.$.duration": duration,
                "beneficiary.$.f_allow": f_allow,
                "beneficiary.$.f_nm": f_nm,
                "beneficiary.$.gen": gen,
                "beneficiary.$.job": job,
                "beneficiary.$.m_nm": m_nm,
                "beneficiary.$.mob": mob,
                "beneficiary.$.mob_1": mob_1,
                "beneficiary.$.mob_own": mob_own,
                "beneficiary.$.name": name,
                "beneficiary.$.nid_sts": nid_sts,
                "beneficiary.$.pass": pass,
                "beneficiary.$.pgm": pgm,
                "beneficiary.$.r_out": r_out,
                "beneficiary.$.relgn": relgn,
                "beneficiary.$.score1": score1,
                "beneficiary.$.sl": sl,
                "beneficiary.$.sub_dis": sub_dis,
                "beneficiary.$.test": test,
                "beneficiary.$.u_nm": u_nm,
                "beneficiary.$.uni": uni,
                "beneficiary.$.vill": vill,
                "beneficiary.$.a_sts": a_sts,

            },
        },
        {new: true},
    );

    if (!updatedBeneficiary) {
        return res.status(404).json({error: "Beneficiary not found"});
    }

    return res.status(200).json({updatedBeneficiary});
}

async function deleteBeneficiary(req, res) {
    User.findOneAndUpdate({}, {$pull: {beneficiary: {_id: req.params.id}}}, (err, data) => {
        if (err) return res.status(400).send(err);
        if (!data) return res.status(404).send("Beneficiary not found");
        res.send("Beneficiary deleted successfully");
    });
}
async function addBeneficiaryInBulk(req, res) {
    let user = jwt_decode(req.body.token);
    for (let i = 0; i < req.body.beneficiary.length; i++) {
        user = await User.findByIdAndUpdate(
            user.id,
            {$push: {beneficiary: req.body.beneficiary[i]}},
            {new: true},
        );
    }

    return res.status(200).json({user: user});
}

async function saveTest(req, res) {
    let user = jwt_decode(req.body.token);

    user = (await User.findById(user.id)).toJSON();

    const beneficiaryId = await randomNumberNotInBeneficiaryCollection(user.beneficiary);

    req.body.beneficiary["beneficiaryId"] = beneficiaryId;

    let beneficiary = [...user.beneficiary, req.body.beneficiary];
    console.log(beneficiary);

    user = await User.findByIdAndUpdate(user._id, {beneficiary}, {new: true})
        .select("-_id")
        .select("-id")
        .select("-username")
        .select("-password")
        .select("-created_at")
        .select("-beneficiary.test");

  

    return res.status(200).json({user: user});
}

async function getBeneficiaries(req, res) {
    const user = jwt_decode(req.headers?.token);
    let beneficiaries = (await User.findById(user.id))?.toJSON()?.beneficiary;
    return res.status(200).json({beneficiaries});
}

async function getToken({beneficiaryId, userId}) {
    let token = await jwt.sign({beneficiaryId, userId}, "shhhhh11111", {expiresIn: "1d"});
    return token;
}

function existsInArray(arr = [], x) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i]?.beneficiaryId === x) {
            return true;
        }
    }
    return false;
}

function getBeneficiaryIndex(arr, beneficiaryId) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i]?.beneficiaryId === beneficiaryId) {
            return i;
        }
    }
    return null;
}

async function beneficiaryLogin(req, res) {

  const beneficiaryId = req.body.beneficiaryId;
  const mob = req.body.mob;

  // Find a user document with a matching beneficiaryId and mob
  User.findOne({ 'beneficiary.beneficiaryId': beneficiaryId, 'beneficiary.mob': mob }, (err, user) => {
    if (err) {
      // Handle error
      res.status(500).send({ error: err });
    } else {
      if (user) {
        // Login successful
        res.status(200).send({ message: 'Login successful' });
      } else {
        // Login failed
        res.status(401).send({ message: 'Invalid beneficiaryId or mob' });
      }
    }
  });

}

async function addBeneficiaryScore(req, res) {
    const {userId, beneficiaryId} = req.body;
    console.log(req.body);
    let result = await User.findOneAndUpdate(
        {userId: userId, "beneficiary.beneficiaryId": beneficiaryId},
        {
            $set: {
                "beneficiary.$.score1": req.body?.score1,
                "beneficiary.$.score2": req.body?.score2,
                "beneficiary.$.duration": req.body?.duration,
            },
        },
        {new: true},
    );
    return res.status(200).json(result);
}

async function saveMultiScore(req, res) {
    const beneficiaries = req.body;
    for (let i = 0; i < beneficiaries.length; i++) {
        let beneficiary = beneficiaries[i];
        let {userId, beneficiaryId, score1, score2, duration} = beneficiary;
        let result = await User.findOneAndUpdate(
            {userId: userId, "beneficiary.beneficiaryId": beneficiaryId},
            {
                $set: {
                    "beneficiary.$.score1": score1,
                    "beneficiary.$.score2": score2,
                    "beneficiary.$.duration": duration,
                },
            },
            {new: true},
        );
    }
    return res.status(200).json({message: "Multiple beneficiaries updated"});
}

async function benenScore(req, res) {
    const {userId, beneficiaryId} = req.body;
    const beneficiaries = (await User.findOne({userId: userId})).toJSON().beneficiary;

    let index = getBeneficiaryIndex(beneficiaries, beneficiaryId);

    if (index !== null) beneficiaries[index]["score1"] = req.body?.score1;

    if (index !== null) beneficiaries[index]["time"] = req.body?.time;

    if (index !== null) beneficiaries[index]["duration"] = req.body?.duration;

    const user = (
        await User.findOneAndUpdate({userId: userId}, {beneficiary: beneficiaries}, {new: true})
    ).toJSON();

    console.log(user);

    const whoLoggedIn = await User.findOne({userId: userId});

    if (existsInArray(beneficiaries, beneficiaryId)) {
        return res.status(200).json({whoLoggedIn});
    }

    return res.status(400).json({error: "Credentials does not exists"});
}

async function saveTestScore(req, res) {
    const data = jwt_decode(req.body.beneficiaryToken);
    const beneficiaries = (await User.findOne({userId: data.userId})).toJSON().beneficiary;

    console.log(beneficiaries);

    let index = getBeneficiaryIndex(beneficiaries, data.beneficiaryId);
    console.log(index);

    if (index) beneficiaries[index]["score1"] = req.body.score1;

    if (index) beneficiaries[index]["time"] = req.body.time;

    if (index) beneficiaries[index]["duration"] = req.body.duration;

    console.log("at index", beneficiaries[index]);

    const user = (
        await User.findOneAndUpdate(
            {userId: data.userId},
            {beneficiary: beneficiaries},
            {new: true},
        )
    ).toJSON();

    console.log(user);

    return res.json({message: "score saved", beneficiary: user.beneficiary[index]});
}

async function savePcInfo(req, res) {
    try {
      // Get the user ID and beneficiary data from the request
      const userId = req.body.userId;
      const winStart = req.body.win_start;
      const winEnd = req.body.win_end;
      const totalTime = req.body.total_time;
  
      // Find the user document in the database
      const user = await User.findOne({ userId: userId });
  
      if (user) {
        // Create a new beneficiary object with the given data
        const newBeneficiary = {
          win_start: winStart,
          win_end: winEnd,
          total_time: totalTime,
        };
  
        // Add the new beneficiary to the user's beneficiary array
        user.pc.push(newBeneficiary);
  
        // Save the updated user document to the database
        await user.save();
  
        // Send a success response
        res.status(200).json({
          success: true,
          message: 'Beneficiary data saved successfully',
          user: user,
        });
      } else {
        // If the user is not found, send an error response
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
    } catch (error) {
      // If there's an error, send an error response
      res.status(500).json({
        success: false,
        message: 'An error occurred while saving the beneficiary data',
        error: error.message,
      });
    }
  }





























  async function saveVideoInfo(req, res) {
    try {
      const userId = req.body.userId;
      const videos = req.body.videos; 

      const user = await User.findOne({ userId: userId });

      if (user) {
        for (let video of videos) {
            // Check if the video_name field is present
            if (!video.video_name) {
                continue;  // Skip this iteration if video_name is not present
            }
            user.pc.push({
              video_name: video.video_name,
              location: video.location,
              pl_start: video.pl_start,
              start_date_time: video.start_date_time,
              pl_end: video.pl_end,
              end_date_time: video.end_date_time,
              duration: video.duration
            });
        }

        await user.save();
  
        res.status(200).json({
          success: true,
          message: 'video data saved successfully',
          user: user,
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'An error occurred while saving the beneficiary data',
        error: error.message,
      });
    }
}





module.exports = {
    addBeneficiary,
    addBeneficiaryInBulk,
    getBeneficiaries,
    beneficiaryLogin,
    benenScore,
    addBeneficiaryScore,
    saveTestScore,
    saveTest,
    updateBeneficiary,
    deleteBeneficiary,
    saveMultiScore,
    savePcInfo,
    saveVideoInfo
};
