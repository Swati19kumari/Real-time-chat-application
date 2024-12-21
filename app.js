const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

mongoose.set('strictQuery', false);

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/wechat', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB', err);
});

// Import models
const User = require('./models/User');
const Message = require('./models/Message');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes (same as before)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// API Endpoints (same as before)
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ error: 'Email is already registered' });
        }

        const user = new User({ username, email, password }); // Hash password in production
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Error saving user:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email });
        if (!user || user.password !== password) { // Hash comparison in production
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const token = Buffer.from(`${user.email}:${Date.now()}`).toString('base64'); // Use JWT in production
        res.status(200).json({ message: 'Login successful', token, username: user.username });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Socket.IO Configuration
let clients = 0;

io.on('connection', (socket) => {
    // Track total connected clients
    clients++;
    io.emit('clients-total', clients);

    // Handle incoming messages
    socket.on('message', (data) => {
        // Broadcast message to all connected clients except the sender
        socket.broadcast.emit('chat-message', data);

        // Optionally, save message to database
        const newMessage = new Message({
            username: data.name,
            message: data.message,
            timestamp: data.dateTime
        });

        newMessage.save().catch(err => {
            console.error('Error saving message:', err);
        });
    });

    // Typing feedback
    socket.on('feedback', (data) => {
        socket.broadcast.emit('feedback', data);
    });

    // Group management
    socket.on('createGroup', (data) => {
        const groupCode = Math.random().toString(36).substring(7);
        socket.join(groupCode);
        socket.emit('groupCreated', { groupCode });
    });

    socket.on('joinGroup', (data) => {
        socket.join(data.groupCode);
        socket.emit('groupJoined', { groupCode: data.groupCode });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        clients--;
        io.emit('clients-total', clients);
    });
});

// Start Server
server.listen(PORT, () => console.log(`💬 Server running on http://localhost:${PORT}`));