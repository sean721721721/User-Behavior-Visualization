/* eslint-disable */
// db connect setting
const os = require('os');
if (os.platform() === "linux") {
	module.exports = {
		development: {
			db: ["140.119.164.233:27017/haka?authSource=admin", "140.119.164.233:27017/ptt?authSource=admin"],
			dbUser: 'sean721721721',
			dbPwd: '629629629'
		},
		production: {
			db: ["localhost:27017/haka?authSource=admin", "localhost:27017/ptt?authSource=admin"],
			dbUser: 'sean721721721',
			dbPwd: '629629629'
		}
	};
} else {
	module.exports = {
		development: {
			db: ["140.119.164.233:27017/Pages?authSource=admin","140.119.164.233:27017/ptt?authSource=admin"],
			dbUser: 'sean721721721',
			dbPwd: '629629629'
		},
		production: {
			db: ["localhost:27017/Pages?authSource=admin","localhost:27017/ptt?authSource=admin"],
			dbUser: 'sean721721721',
			dbPwd: '629629629'
		}
	};
}