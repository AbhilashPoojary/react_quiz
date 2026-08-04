const https = require("https");
const Result = require("../Modals/Result");

const getQuestions = async (req, res) => {
  const {
    amount = 10,
    category = "",
    difficulty = "",
    type = "multiple",
  } = req.query;

  const query = new URLSearchParams({
    amount,
    category,
    difficulty,
    type,
  }).toString();

  try {
    const apiUrl = `https://opentdb.com/api.php?${query}`;
    https
      .get(apiUrl, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          const parsed = JSON.parse(data);
          res.status(200).json(parsed.results || []);
        });
      })
      .on("error", (error) => {
        res.status(500).json({ error: error.message });
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const result = async (req, res) => {
  const { userId, ...others } = req.body;
  console.log(req.body);
  try {
    const result = await new Result({
      ...others,
      userId: req.user.userId,
    }).save();
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const leaderboard = async (req, res) => {
  try {
    const results = await Result.aggregate([
      {
        $sort: {
          score: -1,
          totaltime: 1,
        },
      },
      {
        $limit: 4,
      },
    ]);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const allresult = async (req, res) => {
  try {
    const results = await Result.aggregate([
      {
        $sort: {
          score: -1,
          totaltime: 1,
        },
      },
    ]);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const searchResult = async (req, res) => {
  const { category, difficulty } = req.body;
  console.log(category, difficulty);
  try {
    const matchStage = {};
    if (category !== undefined && category !== null && category !== "") {
      matchStage.category = category;
    }
    if (difficulty !== undefined && difficulty !== null && difficulty !== "") {
      matchStage.difficulty = difficulty;
    }
    const aggregationPipeline = [];
    if (Object.keys(matchStage).length > 0) {
      aggregationPipeline.push({ $match: matchStage });
    }
    let results;
    if (Object.keys(matchStage).length > 0) {
      results = await Result.aggregate(aggregationPipeline);
    } else {
      results = await Result.find();
    }
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getQuestions,
  result,
  leaderboard,
  allresult,
  searchResult,
};
