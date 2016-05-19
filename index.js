const PORT = process.env["PORT"]
const NODE_SECRET = process.env["NODE_SECRET"]

// console.log(process.env)

const Server = require("./server.js")
const server = new Server(PORT, NODE_SECRET)


server.start().catch( error => {
  throw error;
} )