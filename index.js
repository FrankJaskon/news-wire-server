const fs = require('fs')
const jsonServer = require('json-server')
const path = require('path')

const server = jsonServer.create()

const router = jsonServer.router(path.resolve(__dirname, 'db.json'))

server.use(jsonServer.defaults({}))
server.use(jsonServer.bodyParser)

server.post('/login', (req, res) => {
	try {
		const { username, password } = req.body
		const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'db.json'), 'UTF-8'))
		const { users = []} = db

		const userFromDb = users.find(
			(user) => user.username === username && user.password === password,
		)

		if (userFromDb) {
			return res.json({
				id: userFromDb.id,
				username: userFromDb.username,
				avatar: userFromDb.avatar,
				roles: userFromDb.roles
			})
		}

		return res.status(403).json({ message: 'User not found' })
	} catch (e) {
		console.log(e)
		return res.status(500).json({ message: e.message })
	}
})

server.post('/users', (req, res) => {
	try {
		const { username, password } = req.body
		const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'db.json'), 'UTF-8'))
		const { users = []} = db
		const { profiles = []} = db

		const userFromDb = users.find(
			(user) => user.username === username && user.password === password,
		)

		if (userFromDb) {
			return res.status(403).json({ message: 'User with this email already exists' })
		}


		const generateUniqueId = () => {
			const timestamp = new Date().getTime().toString().slice(-4);

			const randomNum = Math.floor(Math.random() * 10000);

			const uniqueId = parseInt(`${timestamp}${randomNum}`);

			return uniqueId;
		}

		const uniqId =  generateUniqueId()

		const newUser = {
			id: uniqId,
			username,
			password,
			avatar: '',
			roles: [
				'USER'
			],
		}

		const emailSymbolIndex = username.split('').findIndex((elem) => elem === '@')

		const newProfile = {
			id: uniqId,
			firstname: '',
			lastname: '',
			age: undefined,
			currency: '',
			country: '',
			city: '',
			username: username.slice(0, emailSymbolIndex !== -1 ? ++emailSymbolIndex : undefined),
			avatar: ''
		}

		users.push(newUser)
		profiles.push(newProfile)
		fs.writeFileSync(path.resolve(__dirname, 'db.json'), JSON.stringify(db, null, 2), 'UTF-8')

		const newUserFromDb = users.find(
			(user) => user.id === uniqId,
		)

		return res.status(200).json(res.json({
			id: newUserFromDb.id,
			username: newUserFromDb.username,
			avatar: newUserFromDb.avatar,
			roles: newUserFromDb.roles
		}))
	} catch (e) {
		console.log(e)
		return res.status(500).json({ message: e.message })
	}
})

server.get('/profiles/:id', (req, res) => {
	try {
	  const { id } = req.params;
	  const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'db.json'), 'UTF-8'));
	  const { profiles = [] } = db;

	  const profile = profiles.find((profile) => profile.id === parseInt(id));

	  if (profile) {
		return res.json(profile);
	  }

	  return res.status(404).json({ message: 'Profile not found' });
	} catch (e) {
	  console.log(e);
	  return res.status(500).json({ message: e.message });
	}
});

server.put('/profiles/:id', (req, res) => {
	try {
	  const { id } = req.params;
	  const updatedProfile = req.body;
	  const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'db.json'), 'UTF-8'));
	  const { profiles = [], users = [] } = db;

	  const profileIndex = profiles.findIndex((profile) => profile.id === parseInt(id));
	  const userIndex = users.findIndex((user) => user.id === parseInt(id));

	  if (profileIndex !== -1) {
		  profiles[profileIndex] = { ...profiles[profileIndex], ...updatedProfile };

		if (updatedProfile.avatar) {
			users[userIndex] = { ...users[userIndex], avatar: updatedProfile.avatar };
		}

		fs.writeFileSync(path.resolve(__dirname, 'db.json'), JSON.stringify(db, null, 2), 'UTF-8');

		return res.json({
			profile: profiles[profileIndex],
			user: users[userIndex]
		});
	  }

	  return res.status(404).json({ message: 'Profile not found' });
	} catch (e) {
	  console.log(e);
	  return res.status(500).json({ message: e.message });
	}
});

server.use((req, res, next) => {
	if (!req.headers.authorization) {
		return res.status(403).json({ message: 'AUTH ERROR' })
	}

	next()
})

server.use(router)

server.listen(8000, () => {
	console.log('server is running on 8000 port')
})
