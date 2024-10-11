import express from 'express'
import { verifyJwt } from '../middlewares/auth.middleware.js'
import { addExpense, getAllExpenses, getMonthlyExpenditureByCategory, getWeeklyExpenditureByCategory } from '../controller/expense.controller.js'

const router = express.Router()


router.route('/add-expense').post(verifyJwt,addExpense)
router.route('/get-expenses').get(verifyJwt,getAllExpenses)
router.route('/monthly-stas').get(verifyJwt,getMonthlyExpenditureByCategory)
router.route('/weekly-stats').get(verifyJwt,getWeeklyExpenditureByCategory)



export default router;