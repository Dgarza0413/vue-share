const { ApolloServer, AuthenticationError } = require("apollo-server");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

//Import typeDegs and resolvers
const filePath = path.join(__dirname, "typeDefs.gql");
const typeDefs = fs.readFileSync(filePath, "utf-8");
const resolvers = require("./resolvers");

// import environment variables and mongoose models connect
require("now-env");
// require("dotenv").config({ path: "variables.env" });
const User = require("./models/User");
const Post = require("./models/Post");

//connect to mongodb atlas database
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true })
  // .connect(
  //   "mongodb://mongodb+srv://dgarza:Webdev2019@dbcluster-29s92.mongodb.net/test?retryWrites=true"
  // )
  .then(() => console.log("DB connected"))
  .catch(err => console.error(err));

//verify JWT Token passwed from client
const getUser = async token => {
  if (token) {
    try {
      return await jwt.verify(token, process.env.SECRET);
    } catch (err) {
      throw new AuthenticationError(
        "Your session has ended. Please sign in again"
      );
    }
  }
};

mongoose.set("useCreateIndex", true);

//create apollo/graphql server using typedegs, resolvers, and context objects
const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: error => ({
    name: error.name,
    message: error.message.replace("Context creation failed:", "")
  }),
  context: async ({ req }) => {
    const token = req.headers["authorization"];
    return { User, Post, currentUser: await getUser(token) };
  }
});

server.listen({ port: process.env.PORT || 4000 }).then(({ url }) => {
  console.log(`server listening on ${url}`);
});
