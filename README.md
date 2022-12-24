# chat-room
Simple real-time chat application made with React and Node.js. This is a project I have done to learn both front- and back-end development as well as a pinch of DevOps.

Wide screen, usual chat appearance with visible side panel:
<p>
  <img src="https://i.imgur.com/OvXJPWH.png" width="750" height="auto">
</p>
Chat with overlaid settings dialogue:
<p>
  <img src="https://i.imgur.com/SdByVIP.png" width="750" height="auto">
</p>

## Installation and Usage
As a user, the chat room is available at <https://chat.helena.re>.
If you want to host your own server, you will have to:
- Clone the repository.
- Install the dependencies via `npm install` in both the root and `frontend/` directories.
- Run `npm start` in both directories to start the back- and front-end, respectively.
- Assuming you are in development mode, the front-end site will be at [http://localhost:3000](http://localhost:3000).

### Required infrastructure
- [IPinfo.io](https://ipinfo.io/) API Token
- [reCaptcha v2](https://developers.google.com/recaptcha/intro) site key pair
- MySQL database

## Features

- User accounts
- Session tokens
- Text messages
  - Reply
  - Go to reply
  - Edit
  - Delete
  - Markdown
- Load previous messages on login
- Notification or sound when a message is received
- Information messages when someone (dis)connects
- Images up to 30 MiB
  - Can attached from storage or pasted
  - Full size view
- Autoscroll when sending message
- Scroll to bottom button
- Side panel with user info
  - Name
  - Status
    - Connected
    - Online
    - Typing
    - Last activity
  - Location
- Settings dialogue
  - Change username
  - Change background chat color
  - Change password
  - Delete account
  - View active sessions
- Support for multiple concurrent sessions from the same user
- Responsive UI
