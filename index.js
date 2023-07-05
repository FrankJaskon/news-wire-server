const fs = require('fs')
const jsonServer = require('json-server')
const path = require('path')
const cors = require('cors')

const server = jsonServer.create()

const router = jsonServer.router(path.resolve(__dirname, 'db.json'))

server.use(jsonServer.defaults({}))
server.use(jsonServer.bodyParser)

server.post('/login', (req, res) => {
	try {
		const { username, password } = req.body
		const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'db.json'), 'UTF-8'))
		const { users = [] } = db

		const userFromDb = users.find(
			(user) => user.username === username && user.password === password,
		)

		if (userFromDb) {
			return res.json({
				id: userFromDb.id,
				username: userFromDb.username,
				avatar: userFromDb.avatar,
				roles: userFromDb.roles,
				jsonSettings: userFromDb.jsonSettings
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
		const { users = [] } = db
		const { profiles = [] } = db

		const userFromDb = users.find(
			(user) => user.username === username && user.password === password,
		)

		if (userFromDb) {
			return res.status(403).json({ message: 'User with this email already exists' })
		}


		const generateUniqueId = () => {
			const timestamp = new Date().getTime().toString().slice(-4)

			const randomNum = Math.floor(Math.random() * 10000)

			const uniqueId = parseInt(`${timestamp}${randomNum}`)

			return uniqueId
		}

		const uniqId = generateUniqueId()

		const newUser = {
			id: uniqId,
			username,
			password,
			avatar: '',
			roles: [
				'USER'
			],
		}

		const profileUsername = username.split('@')?.[0]

		const newProfile = {
			id: uniqId,
			firstname: '',
			lastname: '',
			age: undefined,
			currency: '',
			country: '',
			city: '',
			username: profileUsername,
			avatar: ''
		}

		users.push(newUser)
		profiles.push(newProfile)
		fs.writeFileSync(path.resolve(__dirname, 'db.json'), JSON.stringify(db, null, 2), 'UTF-8')

		const newUserFromDb = users.find(
			(user) => user.id === uniqId,
		)

		return res.status(200).json({
			id: newUserFromDb.id,
			username: newUserFromDb.username,
			avatar: newUserFromDb.avatar,
			roles: newUserFromDb.roles
		})
	} catch (e) {
		console.log(e)
		return res.status(500).json({ message: e.message })
	}
})

server.get('/users/:id', (req, res) => {
	try {
		const { id } = req.params
		const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'db.json'), 'UTF-8'))
		const { users = [] } = db
		const userFromDb = users.find(
			(user) => user.id === parseInt(id),
		)

		if (!userFromDb) {
			return res.status(404).json({ message: 'User has not been found' })
		}
		return res.json(userFromDb)
	} catch (e) {
		console.log(e)
		return res.status(500).json({ message: e.message })
	}
})

server.get('/profiles/:id', (req, res) => {
	try {
		const { id } = req.params
		const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'db.json'), 'UTF-8'))
		const { profiles = [] } = db

		const profile = profiles.find((profile) => profile.id === parseInt(id))

		if (profile) {
			return res.json(profile)
		}

		return res.status(404).json({ message: 'Profile has not been found' })
	} catch (e) {
		console.log(e)
		return res.status(500).json({ message: e.message })
	}
})

server.put('/profiles/:id', (req, res) => {
	try {
		const { id } = req.params
		const updatedProfile = req.body
		const db = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'db.json'), 'UTF-8'))
		const { profiles = [], users = [] } = db

		const profileIndex = profiles.findIndex((profile) => profile.id === parseInt(id))
		const userIndex = users.findIndex((user) => user.id === parseInt(id))

		if (profileIndex !== -1) {
			profiles[profileIndex] = { ...profiles[profileIndex], ...updatedProfile }

			users[userIndex] = { ...users[userIndex], avatar: updatedProfile.avatar }

			fs.writeFileSync(path.resolve(__dirname, 'db.json'), JSON.stringify(db, null, 2), 'UTF-8')

			return res.json({
				profile: profiles[profileIndex],
				user: users[userIndex]
			})
		}

		return res.status(404).json({ message: 'Profile not found' })
	} catch (e) {
		console.log(e)
		return res.status(500).json({ message: e.message })
	}
})

const checkAuthorization = (req, res, next) => {
	if (!req.headers.authorization) {
		return res.status(403).json({ message: 'AUTH ERROR' })
	}
	next()
}

server.use((req, res, next) => {
	if (req.method === 'PUT' || req.method === 'POST' || req.method === 'PATCH' || req.method === 'DELETE') {
		checkAuthorization(req, res, next)
	} else {
		next()
	}
})

server.use(router)

server.use((req, res, next) => {
	res.header('Cache-Control', 'no-store')
	next()
})

server.use(cors({
	origin: 'https://news-wire.netlify.app',
	methods: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
	allowedHeaders: 'Content-Type'
}))

server.listen(8000, () => {
	console.log('server is running on 8000 port')
})
