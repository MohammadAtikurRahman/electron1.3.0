const User = require("../model/user");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const path = require('path');

var userid

async function getEnumerator(req, res) {
    const {id} = req.params;
    const enumerator = await User.findById(id);
    return res.status(200).json(enumerator);
}

async function getToken(data) {
    let token = await jwt.sign(
        {user: data.username, id: data._id, userId: data.userId},
        "shhhhh11111",
        {expiresIn: "1d"},
    );

    // console.log("token",token)
    let decoded = jwt.decode(token);
    userid = decoded.userId
    console.log("userid",userid)
    return token;
}

async function userLogin(req, res) {
  console.log(req.body);
  let user = await User.findOne({ username: req.body.username });
  if (!req.body || !req.body.username || !req.body.password) {
    return res.status(400).json({ error: "Username or Password missing" });
  }
  if (!user) {
    return res.status(401).json({ error: "User Not Found" });
  }
  if (user.password === req.body.password) {
    let token = await getToken(user);

    // Check if PC data already exists
    if (!user.pc || user.pc.length === 0) {
      // Insert an empty PC data object
      await User.updateOne({ _id: user._id }, { $push: { pc: {} } });
    }

    return res.status(200).json({
      message: "Login Successfully.",
      token: token,
      status: true,
    });
  }
  return res.status(500).json({ message: "Something went wrong." });
}


async function findUserid(req,res){
    console.log("userid",userid);
   res.send({userid});
 
 }



async function deletecsv(req, res) {
  // Path to the directory containing the CSV files
  const csvDirectoryPath = path.join(__dirname, '..', '..', 'public');

  // Read the directory
  fs.readdir(csvDirectoryPath, function(err, files) {
      if (err) {
          console.error("Error reading the directory:", err);
          return res.status(500).send('Error reading the directory');
      }

      // Filter out only the .csv files
      const csvFiles = files.filter(file => path.extname(file) === '.csv');

      if (csvFiles.length === 0) {
          console.log("No CSV files found to delete.");
          return res.status(404).send('No CSV files found');
      }

      // Loop through the .csv files and delete each
      for (const file of csvFiles) {
          const filePath = path.join(csvDirectoryPath, file);
          fs.unlink(filePath, function(error) {
              if (error) {
                  console.error(`Error deleting ${file}:`, error);
                  return res.status(500).send(`Error deleting ${file}`);
              } else {
                  console.log(`${file} deleted successfully!`);
              }
          });
      }

      // Send a response once all files are processed
      res.status(200).send('All CSV files deleted successfully');
  });
}










module.exports = {getEnumerator,
    findUserid,
    
    deletecsv,
    userLogin};
