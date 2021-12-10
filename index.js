const express = require('express');
const cors = require('cors');
const transactionComission = require('./routes/transactionComission');
require('dotenv').config();

const main = async () => {
	const PORT = process.env.PORT || 3001;
	const app = express();

	app.use('/transaction', transactionComission);

	app.use(cors());
	app.use(express.json());

	app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

main().catch((err) => {
	console.log('An error occured: ', err);
});
