/* eslint-disable */
// db connect setting
const os = require('os');
if (os.platform() === "linux") {
	module.exports = {
		development: {
			db: ["140.119.164.22:27017/haka?authSource=admin", "140.119.164.22:27017/ptt?authSource=admin"],
			dbUser: 'villager',
			dbPwd: '4given4get'
		},
		production: {
			db: ["localhost:27017/haka?authSource=admin", "localhost:27017/ptt?authSource=admin"],
			dbUser: 'villager',
			dbPwd: '4given4get'
		}
	};
} else {
	module.exports = {
		development: {
			db: ["140.119.164.22:27017/Pages?authSource=admin","140.119.164.22:27017/ptt?authSource=admin"],
			dbUser: 'villager',
			dbPwd: '4given4get'
		},
		production: {
			db: ["localhost:27017/Pages?authSource=admin","localhost:27017/ptt?authSource=admin"],
			dbUser: 'villager',
			dbPwd: '4given4get'
		}
	};
}