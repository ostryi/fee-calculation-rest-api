module.exports = {
	defaultPricing: function defaultPricing(amount) {
		const minAmount = 5;
		if (amount < minAmount) {
			return '0.05';
		}
		return '0.5';
	},
	clientWithADiscount: function clientWithADiscount() {
		return '0.05';
	},
	turnoverDiscount: async function turnoverDiscount() {
		return '0.03';
	},
};
