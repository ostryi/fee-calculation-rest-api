const express = require('express');
const router = express.Router();
const fetchP = import('node-fetch').then((mod) => mod.default);
const fetch = (...args) => fetchP.then((fn) => fn(...args));
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const mysql = require('mysql2/promise');
const {
	defaultPricing,
	turnoverDiscount,
	clientWithADiscount,
} = require('../utils/feeRules.js');
require('dotenv').config();

router.post('/', jsonParser, async (req, res) => {
	const exchange = await fetch('https://api.exchangerate.host/2021-01-01')
		.then((response) => response.json())
		.catch((err) => console.log('Error: ', err));

	const connection = await mysql.createConnection({
		host: 'localhost',
		user: 'root',
		database: 'test',
		password: process.env.PASSWORD,
	});

	try {
		let amountInEuros = 0;
		if (req.body.currency !== 'EUR') {
			if (req.body.currency in exchange.rates) {
				amountInEuros = req.body.amount / exchange.rates[req.body.currency];
			}
		}

		let sqlSelectDate = `SELECT date, amountInEuros FROM transactions where client_id = ${req.body.client_id}`;
		const [rowsSelectDate, fieldsSelectDate] = await connection.execute(
			sqlSelectDate,
		);

		let sum = 0;
		rowsSelectDate.map((row) => {
			const date = row['date'].toJSON();
			if (new Date(date).getMonth() !== new Date().getMonth()) {
				return false;
			} else {
				sum += Number(row['amountInEuros']);
			}
		});

		if (sum >= 1000) {
			const amount = await turnoverDiscount();
			res.status(200).json({
				amount: amount,
				currency: 'EUR',
			});
		} else if (req.body.client_id !== 42 && sum < 1000) {
			const amount = await defaultPricing(amountInEuros);
			res.status(200).json({
				amount: amount,
				currency: 'EUR',
			});
		} else if (req.body.client_id === 42 && sum < 1000) {
			const amount = await clientWithADiscount();
			res.status(200).json({
				amount: amount,
				currency: 'EUR',
			});
		}

		let sqlInsert = `INSERT INTO transactions(date, amount, currency, client_id, amountInEuros) VALUES(${mysql.escape(
			req.body.date,
		)}, ${mysql.escape(req.body.amount)}, ${mysql.escape(
			req.body.currency,
		)}, ${mysql.escape(req.body.client_id)}, ${
			amountInEuros !== 0 ? amountInEuros : mysql.escape(req.body.amount)
		})`;
		const [rows, fields] = await connection.execute(sqlInsert);
	} catch {
		console.log('An error occured');
	}
});

module.exports = router;
