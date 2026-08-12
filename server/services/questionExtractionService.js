const Event = require("../Modals/Event");
const Challenge = require("../Modals/Challenge");
const Result = require("../Modals/Result");

const htmlEntities = {
  amp: "&",
  quot: '"',
  apos: "'",
  "#039": "'",
  lt: "<",
  gt: ">",
  nbsp: " ",
};

const difficultyOrder = {
  easy: 1,
  medium: 2,
  hard: 3,
};

const decodeHtmlEntities = (value = "") =>
  String(value).replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity) => {
    if (entity[0] === "#") {
      const isHex = entity[1]?.toLowerCase() === "x";
      const codePoint = Number.parseInt(
        isHex ? entity.slice(2) : entity.slice(1),
        isHex ? 16 : 10
      );

      if (Number.isFinite(codePoint)) {
        return String.fromCodePoint(codePoint);
      }

      return match;
    }

    return htmlEntities[entity] || match;
  });

const cleanText = (value = "") =>
  decodeHtmlEntities(value).replace(/\s+/g, " ").trim();

const getDuplicateKey = (question = "") => cleanText(question).toLowerCase();

const uniqueCleanValues = (values = []) => {
  const seen = new Set();
  return values.reduce((acc, value) => {
    const cleaned = cleanText(value);
    const key = cleaned.toLowerCase();

    if (!cleaned || seen.has(key)) {
      return acc;
    }

    seen.add(key);
    acc.push(cleaned);
    return acc;
  }, []);
};

const normalizeEventQuestion = (question, event) => {
  const correctAnswer = cleanText(
    question.correctAnswer || question.correct_answer || ""
  );
  const answerOptions = Array.isArray(question.answers)
    ? question.answers.map((item) => item.answer || item)
    : [];
  const fallbackOptions = [
    correctAnswer,
    ...(question.incorrectAnswers || question.incorrect_answers || []),
  ];

  return {
    question: cleanText(question.question),
    category: cleanText(question.category || event.categoryName),
    difficulty: cleanText(question.difficulty || event.difficulty),
    type: cleanText(question.type || event.questionType),
    options: uniqueCleanValues(answerOptions.length ? answerOptions : fallbackOptions),
    correctAnswer,
    foundIn: ["EVENT"],
  };
};

const normalizeChallengeQuestion = (question, challenge) => ({
  question: cleanText(question.question),
  category: cleanText(question.category || challenge.config?.categoryName),
  difficulty: cleanText(question.difficulty || challenge.config?.difficulty),
  type: cleanText(question.type || challenge.config?.questionType),
  options: uniqueCleanValues(
    question.options ||
      question.answers ||
      [question.correctAnswer, ...(question.incorrectAnswers || [])]
  ),
  correctAnswer: cleanText(question.correctAnswer || question.correct_answer || ""),
  foundIn: ["CHALLENGE"],
});

const normalizeResultQuestion = (answer, result) => ({
  question: cleanText(answer.question),
  category: cleanText(answer.category || result.category),
  difficulty: cleanText(answer.difficulty || result.difficulty),
  type: cleanText(answer.type || ""),
  options: uniqueCleanValues(
    answer.options || [answer.correctAnswer, answer.selectedAnswer]
  ),
  correctAnswer: cleanText(answer.correctAnswer || ""),
  foundIn: ["NORMAL_QUIZ"],
});

const mergeQuestion = (questionMap, item) => {
  const key = getDuplicateKey(item.question);

  if (!key) {
    return;
  }

  const existing = questionMap.get(key);

  if (!existing) {
    questionMap.set(key, item);
    return;
  }

  existing.foundIn = Array.from(new Set([...existing.foundIn, ...item.foundIn]));
  existing.options = uniqueCleanValues([...existing.options, ...item.options]);

  if (!existing.correctAnswer && item.correctAnswer) {
    existing.correctAnswer = item.correctAnswer;
  }

  if (!existing.category && item.category) {
    existing.category = item.category;
  }

  if (!existing.difficulty && item.difficulty) {
    existing.difficulty = item.difficulty;
  }

  if (!existing.type && item.type) {
    existing.type = item.type;
  }
};

const compareQuestions = (a, b) => {
  const categoryCompare = String(a.category || "").localeCompare(
    String(b.category || "")
  );

  if (categoryCompare !== 0) {
    return categoryCompare;
  }

  const difficultyCompare =
    (difficultyOrder[String(a.difficulty || "").toLowerCase()] || 99) -
    (difficultyOrder[String(b.difficulty || "").toLowerCase()] || 99);

  if (difficultyCompare !== 0) {
    return difficultyCompare;
  }

  return String(a.question || "").localeCompare(String(b.question || ""));
};

const buildSummary = (questions) => {
  const summaryMap = questions.reduce((acc, item) => {
    const category = item.category || "Uncategorized";
    const difficulty = String(item.difficulty || "").toLowerCase();

    if (!acc[category]) {
      acc[category] = {
        category,
        total: 0,
        easy: 0,
        medium: 0,
        hard: 0,
      };
    }

    acc[category].total += 1;

    if (["easy", "medium", "hard"].includes(difficulty)) {
      acc[category][difficulty] += 1;
    }

    return acc;
  }, {});

  return Object.values(summaryMap).sort((a, b) =>
    a.category.localeCompare(b.category)
  );
};

const getUniqueExistingQuestions = async () => {
  const [events, challenges, results] = await Promise.all([
    Event.find({}).select("categoryName difficulty questionType questions").lean(),
    Challenge.find({})
      .select("config.categoryName config.difficulty config.questionType questions")
      .lean(),
    Result.find({}).select("category difficulty answers").lean(),
  ]);

  const questionMap = new Map();
  let totalQuestionsFound = 0;

  events.forEach((event) => {
    (event.questions || []).forEach((question) => {
      totalQuestionsFound += 1;
      mergeQuestion(questionMap, normalizeEventQuestion(question, event));
    });
  });

  challenges.forEach((challenge) => {
    (challenge.questions || []).forEach((question) => {
      totalQuestionsFound += 1;
      mergeQuestion(questionMap, normalizeChallengeQuestion(question, challenge));
    });
  });

  results.forEach((result) => {
    (result.answers || []).forEach((answer) => {
      totalQuestionsFound += 1;
      mergeQuestion(questionMap, normalizeResultQuestion(answer, result));
    });
  });

  const questions = Array.from(questionMap.values()).sort(compareQuestions);

  return {
    totalQuestionsFound,
    uniqueQuestions: questions.length,
    duplicateQuestions: Math.max(0, totalQuestionsFound - questions.length),
    questions,
    summary: buildSummary(questions),
  };
};

module.exports = {
  cleanText,
  decodeHtmlEntities,
  getDuplicateKey,
  getUniqueExistingQuestions,
};
