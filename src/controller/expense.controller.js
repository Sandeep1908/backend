import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { Expense } from "../models/expense.modals.js";
import moment from "moment";
import mongoose from "mongoose";

const addExpense = asyncHandler(async (req, res) => {
  const { spendOn, amount, category, subcategory } = req.body;
  console.log(req.body);

  if (!spendOn || !amount || !category || !subcategory) {
    throw new ApiError(400, "All fields are required");
  }

  const expense = await Expense.create({
    userId: req.user.id,
    amount,
    category,
    subcategory,

    spendOn,
  });

  res
    .status(201)
    .json(new ApiResponse(201, expense, "expense added successfully"));
});

const getAllExpenses = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { category, subcategory } = req.query;

  let filter = { userId };

  if (category) {
    filter.category = category;
  }

  if (subcategory) {
    filter.subcategory = subcategory;
  }

  const expenses = await Expense.find(filter).sort({ date: -1 });

  if (!expenses || expenses.length === 0) {
    throw new ApiError(404, "No expenses found for this user");
  }

  const today = moment().startOf("day");
  const yesterday = moment().subtract(1, "days").startOf("day");

  const groupedExpenses = {
    Today: [],
    Yesterday: [],
    Earlier: [],
  };

  expenses.forEach((expense) => {
    const expenseDate = moment(expense.createdAt).startOf("day");

    if (expenseDate.isSame(today)) {
      groupedExpenses.Today.push(expense);
    } else if (expenseDate.isSame(yesterday)) {
      groupedExpenses.Yesterday.push(expense);
    } else {
      groupedExpenses.Earlier.push(expense);
    }
  });

  res
    .status(200)
    .json(
      new ApiResponse(200, groupedExpenses, "Expenses retrieved successfully")
    );
});

const getMonthlyExpenditureByCategory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const startOfMonth = moment().startOf("month");
  const currentDate = moment().endOf("day");

  const monthlyExpenses = await Expense.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: {
          $gte: new Date(startOfMonth),
          $lte: new Date(currentDate),
        },
      },
    },
    {
      $group: {
        _id: "$category",
        totalAmount: { $sum: "$amount" },
      },
    },
    {
      $sort: { totalAmount: -1 },
    },
  ]);

  const categories = [
    "Essential Expenses",
    "Non-Essential Expenses",
    "Miscellaneous",
  ];
  const formattedMonthlyExpenses = categories.map((category) => {
    const expense = monthlyExpenses.find((exp) => exp._id === category);
    return {
      category,
      totalAmount: expense ? expense.totalAmount : 0,
    };
  });

  const totalSpent = formattedMonthlyExpenses.reduce(
    (sum, exp) => sum + exp.totalAmount,
    0
  );
  const expensesWithPercentages = formattedMonthlyExpenses.map((exp) => ({
    ...exp,
    percentage:
      totalSpent > 0 ? ((exp.totalAmount / totalSpent) * 100).toFixed(2) : 0,
  }));

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        expensesWithPercentages,
        "Monthly expenditure by category retrieved successfully"
      )
    );
});

const getWeeklyExpenditureByCategory = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const currentDate = moment().startOf("day");
  const pastWeekDate = moment().subtract(6, "days").startOf("day");

  console.log("current date",currentDate.toDate());
  const weeklyExpenses = await Expense.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        createdAt: {
          $gte: pastWeekDate.toDate(),   
          $lte: currentDate.toDate(),
        },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, // Format date for grouping
          category: "$category",
        },
        totalAmount: { $sum: "$amount" },
      },
    },
    {
      $sort: { "_id.date": 1 },
    },
  ]);

  console.log("Aggregated weekly expenses:", weeklyExpenses);

  const formattedWeeklyExpenses = [];

  for (let i = 0; i < 7; i++) {
    const date = moment()
      .subtract(i, "days")
      .startOf("day")
      .format("YYYY-MM-DD");
    const dayStats = { date, Essential: 0, NonEssential: 0, Miscellaneous: 0 };

    weeklyExpenses.forEach((exp) => {
      if (exp._id.date === date) {
        if (exp._id.category === "Essential Expenses") {
          console.log("exp.totalAmount", exp.totalAmount);
          dayStats.Essential = exp.totalAmount;
        } else if (exp._id.category === "Non-Essential Expenses") {
          dayStats.NonEssential = exp.totalAmount;
        } else if (exp._id.category === "Miscellaneous") {
          dayStats.Miscellaneous = exp.totalAmount;
        }
      }
    });

    formattedWeeklyExpenses.push(dayStats);
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        formattedWeeklyExpenses.reverse(),
        "Weekly expenditure by category retrieved successfully"
      )
    );
});

export {
  addExpense,
  getAllExpenses,
  getMonthlyExpenditureByCategory,
  getWeeklyExpenditureByCategory,
};
