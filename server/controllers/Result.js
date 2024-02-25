const Result = require("../Modals/Result");

const result = async (req, res) => {
  const { ...others } = req.body;
  console.log(req.body);
  try {
    const result = await new Result({
      ...others,
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

module.exports = { result, leaderboard, allresult, searchResult };
