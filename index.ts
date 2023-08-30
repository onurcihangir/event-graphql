import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
// import {
//   users,
//   events,
//   locations,
//   participants,
// } from "./data.json" assert { type: "json" };
import { User, Event, Participant, Location, QueryIdArgs } from "./types";
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
const require = createRequire(import.meta.url); // construct the require method
const data = require("./data.json");

const { users, events, locations, participants } = data;

const typeDefs = `#graphql
  type Event {
    id: ID!
    title: String!
    desc: String!
    date: String!
    from: String!
    to: String!
    location_id: ID!
    user_id: ID!
    user: User!
    participants: [Participant!]
    location: Location!

  }
  type User {
    id: ID!
    username: String!
    email: String!
  }
  type Participant {
    id: ID!
    user_id: ID!
    event_id: ID!
  }
  type Location {
    id: ID!
    name: String!
    desc: String!
    lat: Float!
    lng: Float!
  }
  type Query {
    users: [User!]!
    user(id: ID!): User!

    events: [Event!]!
    event(id: ID!): Event!

    locations: [Location!]!
    location(id: ID!): Location!

    participants: [Participant!]!
    participant(id: ID!): Participant!
  }
`;

const resolvers = {
  Query: {
    users: () => users,
    user: (parent: User, args: QueryIdArgs) => {
      return users.find((user: User) => user.id == args.id);
    },

    events: () => events,
    event: (parent: Event, args: QueryIdArgs) => {
      return events.find((event: Event) => event.id == args.id);
    },

    locations: () => locations,
    location: (parent: Location, args: QueryIdArgs) => {
      return locations.find((location: Location) => location.id == args.id);
    },

    participants: () => participants,
    participant: (parent: Participant, args: QueryIdArgs) => {
      return participants.find(
        (participant: Participant) => participant.id == args.id
      );
    },
  },
  Event: {
    user: (parent: Event) =>
      users.find((user: User) => user.id === parent.user_id),
    participants: (parent: Event) =>
      participants.filter(
        (participant: Participant) => participant.event_id == parent.id
      ),
    location: (parent: Event) =>
      locations.find((location: Location) => location.id == parent.location_id),
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀  Server ready at: ${url}`);
