const socket = io();

// DOM Elements
const clientsTotal = document.getElementById('client-total');
const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('message-form');
const messageInput = document.getElementById('message-input');
const feedback = document.getElementById('feedback');

// Get username from localStorage
const username = localStorage.getItem('username') || "Anonymous"; // Fallback to 'Anonymous'

// Submit Message Form
messageForm.addEventListener('submit', (e) => {
  e.preventDefault();
  sendMessage();
});

// Update Clients Total
socket.on('clients-total', (data) => {
  clientsTotal.innerText = `Total Clients: ${data}`;
});

// Send Message
function sendMessage() {
  if (messageInput.value === '') return;

  const data = {
    name: username, // Use the stored username
    message: messageInput.value,
    dateTime: new Date(),
  };

  socket.emit('message', data);
  addMessageToUI(true, data);
  messageInput.value = ''; // Clear the input field
}

// Listen for Incoming Messages
socket.on('chat-message', (data) => {
  addMessageToUI(false, data);
});

// Add Message to UI
function addMessageToUI(isOwnMessage, data) {
  clearFeedback(); // Clear typing feedback
   
  // Create a function to format time dynamically
  const formatTime = (dateTime) => {
    const now = new Date();
    const messageTime = new Date(dateTime);
    
    // Check if the message was sent today
    if (messageTime.toDateString() === now.toDateString()) {
      // If sent today, show time in HH:MM format
      return messageTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // If sent on a different day, show date and time
      return messageTime.toLocaleString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  const element = `
    <li class="${isOwnMessage ? 'message-right' : 'message-left'}">
      <p class="message">
        ${data.message}
        <span>${data.name} ● ${formatTime(data.dateTime)}</span>
      </p>
    </li>
  `;
  messageContainer.innerHTML += element;
  scrollToBottom();
}

// Scroll to Bottom
function scrollToBottom() {
  messageContainer.scrollTo(0, messageContainer.scrollHeight);
}

// Typing Indicator Events
messageInput.addEventListener('focus', () => {
  socket.emit('feedback', { feedback: `✍️ ${username} is typing...` });
});

messageInput.addEventListener('keypress', () => {
  socket.emit('feedback', { feedback: `✍️ ${username} is typing...` });
});

messageInput.addEventListener('blur', () => {
  socket.emit('feedback', { feedback: '' });
});

// Display Typing Feedback
socket.on('feedback', (data) => {
  clearFeedback();
  if (data.feedback) {
    const element = `
      <li class="message-feedback">
        <p class="feedback">${data.feedback}</p>
      </li>
    `;
    messageContainer.innerHTML += element;
  }
});

// Clear Typing Feedback
function clearFeedback() {
  document.querySelectorAll('li.message-feedback').forEach((element) => {
    element.parentNode.removeChild(element);
  });
}

// Show/Hide Modals (for groups)
const createGroupModal = document.getElementById('createGroupModal');
const joinGroupModal = document.getElementById('joinGroupModal');
const closeButtons = document.querySelectorAll('.close');

document.getElementById('create-group').addEventListener('click', () => {
  createGroupModal.style.display = 'block';
});

document.getElementById('join-group').addEventListener('click', () => {
  joinGroupModal.style.display = 'block';
});

closeButtons.forEach((btn) =>
  btn.addEventListener('click', () => {
    createGroupModal.style.display = 'none';
    joinGroupModal.style.display = 'none';
  })
);

// Handle Create Group
document.getElementById('create-group-btn').addEventListener('click', () => {
  const groupName = document.getElementById('group-name').value;
  if (groupName) {
    socket.emit('createGroup', { groupName });
    createGroupModal.style.display = 'none';
  }
});

// Handle Join Group
document.getElementById('join-group-btn').addEventListener('click', () => {
  const groupCode = document.getElementById('group-code').value;
  if (groupCode) {
    socket.emit('joinGroup', { groupCode });
    joinGroupModal.style.display = 'none';
  }
});

// Typing Effect for Username Display
window.onload = () => {
  const usernameElement = document.getElementById('username');

  const typeUsername = (text, element) => {
    let i = 0;
    const typingInterval = setInterval(() => {
      element.textContent += text[i];
      i++;
      if (i === text.length) {
        clearInterval(typingInterval);
      }
    }, 100); // Adjust typing speed
  };

  if (username) {
    typeUsername(username, usernameElement);
  }
};

// Logout Redirect
document.getElementById('logout').addEventListener('click', () => {
  window.location.href = '/login.html'; // Redirect to login page
});
