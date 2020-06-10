module.exports = {
	firebase: {
		apiKey: process.env.FIREBASE_API_KEY,
		databaseURL: process.env.FIREBASE_DATABASE_URL,
		projectId: process.env.FIREBASE_PROJECT_ID,
		messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
		appId: process.env.FIREBASE_APP_ID,
		measurementId: process.env.FIREBASE_MEASUREMENT_ID,
	},
	user: {
		email: process.env.FIREBASE_USER_EMAIL,
		password: process.env.FIREBASE_USER_PASSWORD,
	},
};
