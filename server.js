// Set the environment variables at the top of the file.
const path = require('path');
const binaryPath = path.join(__dirname, './mongodb-binaries');
process.env.MONGOMS_SYSTEM_BINARY = path.join(binaryPath, 'mongod.exe');

require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose").set("debug", true);
const { MongoMemoryServer } = require('mongodb-memory-server');
const { router } = require("./routes.js");
const user = require("./model/user.js");
const moment = require('moment');
const os = require('os');

const dbPath = path.join(__dirname, './mongodb-data');

const mongod = new MongoMemoryServer({
    instance: {
        dbName: 'test-db-22',
        dbPath: dbPath,
        storageEngine: 'wiredTiger',
        port: 27017 
    },
    binary: {
        version: '4.0.28',
        downloadDir: binaryPath,
        mongodBinaryPath: path.join(binaryPath, 'mongod.exe'),
        skipMD5: true,
        debug: false,
        autoDownload: false
    },
    autoStart: false
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static("uploads"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(router);


app.use("/", (req, res, next) => {
    try {
        if (
            req.path == "/login" ||
            req.path == "/register" ||
            req.path == "/" ||
            req.path == "/add" ||
            req.path == "/getCSV" ||

            req.path == "/api" ||
            req.path == "/users" ||
            req.path == "/delete-csv" ||

            req.path == "/get-testscore" ||
            req.path == "/get-beneficiary" ||
            req.path == "/user-details" ||
            req.path == "/enumerator" ||
            req.path == "/get-enumerator" ||
            req.path == "/get-all" ||
            req.path == "/get-login" ||
            req.path == "/get-pc" ||
            req.path === "/get-vd" ||
            req.path == "/get-download" ||
            req.path == "/get-school" ||
            req.path == "/list-beneficiary" ||
            req.path == "/beneficiary"
        ) {
            next();
        } else {
            /* decode jwt token if authorized*/
            jwt.verify(req.headers.token, "shhhhh11111", function (err, decoded) {
                if (decoded && decoded.user) {
                    req.user = decoded;
                    next();
                } else {
                    return res.status(401).json({
                        errorMessage: "User unauthorized!",
                        status: false,
                    });
                }
            });
        }
    } catch (e) {
        res.status(400).json({
            errorMessage: "Something went wrong!",
            status: false,
        });
    }
});

app.get("/", (req, res) => {
    res.send({});
});

app.get("/user-details", (req, res) => {
    res.send({});
});

function generateRandomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
app.post("/register", async (req, res) => {
    try {
        const userId = generateRandomNumber(10000, 99999).toString();
        console.log("userid",userId);
        if (req.body && req.body.username && req.body.password) {
            user.find({username: req.body.username}, (err, data) => {
                if (data.length == 0) {
                    let User = new user({
                        username: req.body.username,
                        password: req.body.password,
                        userId: userId,
                    });
                    User.save((err, data) => {
                        if (err) {
                            res.status(400).json({
                                errorMessage: err,
                                status: false,
                            });
                        } else {
                            res.status(200).json({
                                status: true,
                                title: "Registered Successfully.",
                            });
                        }
                    });
                } else {
                    res.status(400).json({
                        errorMessage: `Username ${req.body.username} already exist!`,
                        status: false,
                    });
                }
            });
        } else {
            res.status(400).json({
                errorMessage: "Add proper parameter first!",
                status: false,
            });
        }
    } catch (e) {
        res.status(400).json({
            errorMessage: "Something went wrong!",
            status: false,
        });
    }
});


app.get("/api", (req, res) => {
    user.find((err, val) => {
        if (err) {
            console.log(err);
        } else {
            res.json(val);
        }
    });
});
app.get("/get-all", (req, res) => {
    user.find((err, val) => {
        if (err) {
            console.log(err);
        } else {
            res.json(val);
        }
    });
});

app.get("/get-enumerator", async (req, res) => {
    let users = await user.find({}).select("-beneficiary");
    return res.status(200).json(users);
});

app.get("/get-testscore", async (req, res) => {
    let users = await user.find({})
      .select("-username -password -createdAt -updatedAt -__v -id -_id -userId")
      .select("-pc._id")
      .select("-beneficiary._id")
      .exec();
  
    const formattedData = users[0].pc;
    const beneficiaries = users[0].beneficiary;
  
    let result = formattedData
      .filter(data => data.video_name !== undefined && data.video_name !== "")
      .map(data => ({
        video_name: data.video_name,
        location: data.location,
        pl_start: data.pl_start,
        start_date_time: data.start_date_time,
        pl_end: data.pl_end,
        end_date_time: data.end_date_time,
        duration: data.duration,
      }));
  
    // Remove duplicates
    const uniqueResult = result.reduce((acc, curr) => {
      const exists = acc.find(item => JSON.stringify(item) === JSON.stringify(curr));
      if (!exists) {
        acc.push(curr);
      }
      return acc;
    }, []);
  
    return res.status(200).json({ beneficiary: beneficiaries, pc: uniqueResult });
  });
  
  app.get("/get-pc", async (req, res) => {
    try {
        let users = await user.find({});

        if (!users || users.length === 0) {
            return res.status(404).send('Data not found');
        }

        const pcData = users[0].pc;

        const formattedData = pcData.map(entry => {
            const winStart = moment(entry.win_start, "M/D/YYYY, h:mm:ss A");
            const winEnd = moment(entry.win_end, "M/D/YYYY, h:mm:ss A");
            const minutes = winEnd.diff(winStart, 'minutes');

            return {
                ...entry._doc,
                total_time: minutes.toString()
            };
        });

        const uniqueDataMap = {};

        for (const entry of formattedData) {
            if (!uniqueDataMap[entry.win_start] || moment(uniqueDataMap[entry.win_start].win_end, "M/D/YYYY, h:mm:ss A").isBefore(moment(entry.win_end, "M/D/YYYY, h:mm:ss A"))) {
                uniqueDataMap[entry.win_start] = entry;
            }
        }

        const uniqueEntries = Object.values(uniqueDataMap);

        let datewiseDurations = {};
        let datewiseStart = {};
        let datewiseEnd = {};

        for (const entry of uniqueEntries) {
            const date = moment(entry.win_start, "M/D/YYYY, h:mm:ss A").format("M/D/YYYY");
            const time = moment(entry.win_start, "M/D/YYYY, h:mm:ss A").format("h:mm:ss A");
            const endTime = moment(entry.win_end, "M/D/YYYY, h:mm:ss A").format("h:mm:ss A");

            if (!datewiseDurations[date]) {
                datewiseDurations[date] = 0;
                datewiseStart[date] = time;  // Set the initial start time
                datewiseEnd[date] = endTime;  // Set the initial end time
            }

            if(moment(datewiseStart[date], "h:mm:ss A").isAfter(moment(time, "h:mm:ss A"))) {
                datewiseStart[date] = time;  // Update with earlier time if found
            }

            if(moment(datewiseEnd[date], "h:mm:ss A").isBefore(moment(endTime, "h:mm:ss A"))) {
                datewiseEnd[date] = endTime;  // Update with later time if found
            }

            datewiseDurations[date] += Number(entry.total_time);
        }

        const datewiseEntries = Object.entries(datewiseDurations).map(([date, duration]) => ({
            win_start: `${date}, ${datewiseStart[date]}`,
            win_end: `${date}, ${datewiseEnd[date]}`,
            total_time: duration.toString()
        }));

        return res.status(200).json([...uniqueEntries, ...datewiseEntries]);

    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal server error');
    }
});




// app.delete('/delete-csv', (req, res) => {
//   // path to the csv file in the public directory
//   const csvFilePath = path.join(__dirname, '..', 'public', 'video_information.csv');

//   fs.unlink(csvFilePath, function(error) {
//     if (error) {
//       console.error("Error deleting CSV file:", error);
//       res.status(500).send('Error deleting file');
//     } else {
//       console.log("File deleted successfully!");
//       res.status(200).send('File deleted successfully');
//     }
//   });
// });


app.get("/get-download", async (req, res) => {
  let users = await user.find({})
    .select("-username")
    .select("-password")
    .select("-createdAt")
    .select("-updatedAt")
    .select("-__v")
    .select("-id")
    .select("-_id")
    .select("-userId")
    .select("-beneficiary");

  const formattedData = users[0].pc;

  // Group data by date
  let dataByDate = {};
  for (let data of formattedData) {
    let dateObject = moment(data.win_end, "M/D/YYYY, h:mm:ss A");

    // Check if the date is valid
    if (!dateObject.isValid()) {
      // If the date is not valid, skip this entry
      continue;
    }

    let date = dateObject.format('YYYY-MM-DD');
    if (!dataByDate[date]) {
      dataByDate[date] = [];
    }
    dataByDate[date].push(data);
  }

  // For each date, sort by time and select the earliest start and latest end
  let result = [];
  for (let date in dataByDate) {
    dataByDate[date].sort((a, b) => moment(a.win_start, "M/D/YYYY, h:mm:ss A").toDate() - moment(b.win_start, "M/D/YYYY, h:mm:ss A").toDate());
    let earliestStart = dataByDate[date][0].win_start;

    dataByDate[date].sort((a, b) => moment(b.win_end, "M/D/YYYY, h:mm:ss A").toDate() - moment(a.win_end, "M/D/YYYY, h:mm:ss A").toDate());
    let latestEnd = dataByDate[date][0].win_end;

    let total_time = dataByDate[date][0].total_time;
    let formattedTotalTime = '';

    if (total_time < 60) {
      formattedTotalTime = `${total_time} minute${total_time !== 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(total_time / 60);
      const minutes = total_time % 60;
      formattedTotalTime = `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    result.push({
      earliestStart,
      latestEnd,
      total_time: formattedTotalTime
    });
  }

  return res.status(200).json(result);
});



app.get("/get-school", async (req, res) => {
    try {
        let users = await user.find({})
            .select("-username")
            .select("-password")
            .select("-createdAt")
            .select("-updatedAt")
            .select("-__v")
            .select("-id")
            .select("-_id")
            .select("-userId");

        if (!users || users.length === 0) {
            return res.status(404).send('Data not found');
        }

        const beneficiaries = users[0].beneficiary;
        const pcData = users[0].pc;

        const formattedData = pcData.map(entry => {
            const winStart = moment(entry.win_start, "M/D/YYYY, h:mm:ss A");
            const winEnd = moment(entry.win_end, "M/D/YYYY, h:mm:ss A");
            const minutes = winEnd.diff(winStart, 'minutes');

            return {
                earliestStart: entry.win_start,
                latestEnd: entry.win_end,
                total_time: minutes.toString()
            };
        });

        const uniqueDataMap = {};

        for (const entry of formattedData) {
            if (!uniqueDataMap[entry.earliestStart] || moment(uniqueDataMap[entry.earliestStart].latestEnd, "M/D/YYYY, h:mm:ss A").isBefore(moment(entry.latestEnd, "M/D/YYYY, h:mm:ss A"))) {
                uniqueDataMap[entry.earliestStart] = entry;
            }
        }

        const uniqueEntries = Object.values(uniqueDataMap);

        let datewiseDurations = {};
        let datewiseStart = {};
        let datewiseEnd = {};

        for (const entry of uniqueEntries) {
            const date = moment(entry.earliestStart, "M/D/YYYY, h:mm:ss A").format("M/D/YYYY");
            const time = moment(entry.earliestStart, "M/D/YYYY, h:mm:ss A").format("h:mm:ss A");
            const endTime = moment(entry.latestEnd, "M/D/YYYY, h:mm:ss A").format("h:mm:ss A");

            if (!datewiseDurations[date]) {
                datewiseDurations[date] = 0;
                datewiseStart[date] = time;
                datewiseEnd[date] = endTime;
            }

            if(moment(datewiseStart[date], "h:mm:ss A").isAfter(moment(time, "h:mm:ss A"))) {
                datewiseStart[date] = time;
            }

            if(moment(datewiseEnd[date], "h:mm:ss A").isBefore(moment(endTime, "h:mm:ss A"))) {
                datewiseEnd[date] = endTime;
            }

            datewiseDurations[date] += Number(entry.total_time);
        }

        function formatTime(minutes) {
            const hours = Math.floor(minutes / 60);
            const remainingMinutes = minutes % 60;
            return `${hours > 0 ? hours + ' hours' : ''} ${remainingMinutes + ' minutes'}`;
        }

        const datewiseEntries = Object.entries(datewiseDurations)
            .map(([date, duration]) => ({
                earliestStart: `${date}, ${datewiseStart[date]}`,
                latestEnd: `${date}, ${datewiseEnd[date]}`,
                total_time: formatTime(duration)
            }))
            .filter(entry => 
                !entry.earliestStart.includes("Invalid date") && 
                !entry.latestEnd.includes("Invalid date") &&
                !isNaN(parseInt(entry.total_time))
            );

        return res.status(200).json({ beneficiary: beneficiaries, pc: datewiseEntries });

    } catch (error) {
        console.error(error);
        return res.status(500).send('Internal server error');
    }
});











  app.get("/get-vd", async (req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    let users = await user
      .find({})
      .select("-username")
      .select("-password")
      .select("-createdAt")
      .select("-updatedAt")
      .select("-__v")
      .select("-id")
      .select("-_id")
      .select("-pc._id")
      .select("-pc.win_start")
      .select("-pc.win_end")
      .select("-pc.total_time");
  
    const formattedData = users[0].pc;
    const filteredData = formattedData.filter((obj, index, self) => {
      return (
        JSON.stringify(obj) !== JSON.stringify({}) &&
        index === self.findIndex((o) => {
          return JSON.stringify(o) === JSON.stringify(obj);
        })
      );
    });
  
    const response = {
      userId: users[0].userId, // Adding userId
      beneficiary: users[0].beneficiary, // Adding beneficiary
      videoData: filteredData // video data
    };
  
    return res.status(200).json(response);
  });
  

app.get("/get-beneficiary", async (req, res) => {
    let users = await user
        .find({})
        .select("-_id")
        .select("-id")
        .select("-username")
        .select("-password")
        .select("-createdAt")

        .select("-beneficiary.test");

    const data = users;
    const data1 = users;
    const formatted_data = data[0];

    //   const formatted_data1= data1[1]

    // extact_data1 = formatted_data1['beneficiary']

    extact_data = formatted_data["beneficiary"];

    // let obj3 = Object.assign(extact_data, extact_data1);

    //  console.log(obj3)

    return res.status(200).json(extact_data);
});

app.get("/get-login", async (req, res) => {
    // let users = await user.find({}).select("-password").select("-username").select("-beneficiary.name").select("-beneficiary.f_nm")
    // .select("-beneficiary.ben_nid").select("-beneficiary.ben_id").select("-beneficiary.sl").select("-beneficiary.m_nm").select("-beneficiary.age").select("-beneficiary.dis")
    // .select("-beneficiary.sub_dis").select("-beneficiary.uni").select("-beneficiary.vill").select("-beneficiary.relgn").select("-beneficiary.job").select("-beneficiary.gen")

    // .select("-beneficiary.mob").select("-beneficiary.pgm").select("-beneficiary.pass").select("-beneficiary.bank").select("-beneficiary.branch").select("-beneficiary.r_out")

    // .select("-beneficiary.mob_1").select("-beneficiary.ben_sts").select("-beneficiary.nid_sts").select("-beneficiary.a_sts").select("-beneficiary.u_nm")

    // .select("-beneficiary.dob").select("-beneficiary.accre").select("-beneficiary.f_allow").select("-beneficiary.mob_own").select("-beneficiary.test")

    let users = await user.find({}).select("-beneficiary");
    return res.status(200).json(users);
});

app.get("/enumerator", (req, res) => {
    product.find((err, val) => {
        if (err) {
            console.log(err);
        } else {
            res.json(val);
        }
    });
});

app.post("/api", async (req, res) => {
    try {
        // const anotherData = JSON.parse(req.body)
        const saveData = req.body;
        const newData = new user({
            username: saveData.username,
            password: saveData.password,
        });
        await newData.save();
        res.status(201).json({success: true, data: newData});
    } catch (error) {
        res.status(400).json({success: false});
    }
});
app.get('/getCSV', (req, res) => {
    const userDirectory = os.homedir();
    const filePath = path.join(userDirectory, 'Desktop/d-Lab-csv/video_information.csv');
    res.sendFile(filePath);
});


app.post("/add", async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                status: false,
                errorMessage: "Both username and password are required!"
            });
        }

        const newUser = new user({
            username: username,
            password: password,
            userId: Math.floor(Math.random() * 10000)  // This is just a random number for userId, adjust as necessary
        });

        await newUser.save();

        res.status(201).json({
            status: true,
            message: "User added successfully!",
            data: newUser
        });
    } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).json({
            status: false,
            errorMessage: "Internal Server Error"
        });
    }
});

async function startServer() {
    try {
        // Start MongoMemoryServer and get the connection URI
        await mongod.start();
        const mongoUri = await mongod.getUri();

        console.log('MongoDB In-Memory URI:', mongoUri);

        // Connect mongoose to the in-memory instance
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useFindAndModify: false,
        });

        app.listen(2000, () => {
            console.log("Server is running on port 2000");
        });
    } catch (err) {
        console.error('Error starting server or MongoMemoryServer:', err);
    }
}

startServer();