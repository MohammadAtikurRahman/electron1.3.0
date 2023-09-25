const User = require("../model/onlineuser");
const mongoose = require('mongoose');
const dns = require('dns');
const fs = require('fs');
const jwt = require("jsonwebtoken");

async function saveCsvpc(req, res) {
    let schoolData = [];
    let videoData = [];
  
    try {
      const stream = fs.createReadStream(req.file.path);
      for await (const row of stream.pipe(csv())) {
        if(row.hasOwnProperty('Location')) {
          videoData.push(row);
        } else {
          schoolData.push(row);
        }
      }
  
      dns.resolve('www.google.com', async (error) => {
        if (error) {
          console.error('No connection');
        } else {
          console.log('Connected to the internet');
  
          try {
            await mongoose.connect("mongodb+srv://atik:1234@cluster0.qxnid.mongodb.net/electron-online", {
              useNewUrlParser: true,
              useUnifiedTopology: true
            });
            console.log('Connected to MongoDB');
          } catch (err) {
            console.error('Failed to connect to MongoDB', err);
            return;
          }
  
          const userId = userid;
          const users = await User.find({ userId: userId });
  
          if (users.length > 0) {
            const user = users[0];
  
            if(schoolData.length > 0) {
              const newSchoolData = {
                pc_name: schoolData[0]['User Name'],
                eiin: schoolData[0]['EIIN'],
                school_name: schoolData[0]['School Name'],
                pc_id: schoolData[0]['PC ID'],
                lab_id: schoolData[0]['Lab ID'],
                track: schoolData.slice(2).map((row) => ({
                  start_time: row['User Name'],
                  end_time: row['EIIN'],
                  total_time: row['School Name'],
                })),
              };
              user.school.push(newSchoolData);
            }
  
            if(videoData.length > 0) {
              const newVideoData = videoData.map((row) => ({
                video_name: row['Video Name'],
                location: row['Location'],
                pl_start: row['Player Time'],
                start_date_time: row['PC Time Start'],
                pl_end: row['Player End Time'],
                end_date_time: row['PC End Time'],
                duration: row['Total Time'],
                pc_name:row['User Name'],
                eiin: row['EIIN'],
                school_name: row['School Name'],
                pc_id: row['PC ID'],
                lab_id: row['Lab ID'],
              }));
              user.video.push(...newVideoData);
            }
  
            try {
              await user.save();
              console.log('User updated successfully');
              res.status(200).send({ message: 'User updated successfully.' });
            } catch (err) {
              console.error(err);
              res.status(500).send({ message: 'There was an error updating the user.' });
            }
          } else {
            res.status(404).send({ message: 'User not found.' });
          }
        }
      });
    } catch (err) {
      console.error('Error processing CSV file', err);
      res.status(500).send({ message: 'There was an error processing the CSV file.' });
    }
  }



module.exports = {
    saveCsvpc
    
    
  };
