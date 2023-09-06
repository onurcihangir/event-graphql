import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import pkg from "@reduxjs/toolkit";
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
const { nanoid } = pkg;

const { users, events, locations, participants } = data;

const typeDefs = `#graphql
  ## EVENT
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
  input CreateEvent {
    title: String!
    desc: String!
    date: String!
    from: String!
    to: String!
    location_id: ID!
    user_id: ID!
  }
  input UpdateEvent {
    title: String
    desc: String
    date: String
    from: String
    to: String
    location_id: ID
    user_id: ID
  }

  ## USER
  type User {
    id: ID!
    username: String!
    email: String!
  }
  input CreateUser {
    username: String!
    email: String!
  }
  input UpdateUser {
    username: String
    email: String
  }

  ## PARTICIPANT
  type Participant {
    id: ID!
    user_id: ID!
    event_id: ID!
  }
  input CreateParticipant {
    user_id: ID!
    event_id: ID!
  }
  input UpdateParticipant {
    user_id: ID
    event_id: ID
  }

  ## LOCATION
  type Location {
    id: ID!
    name: String!
    desc: String!
    lat: Float!
    lng: Float!
  }
  input CreateLocation {
    name: String!
    desc: String!
    lat: Float!
    lng: Float!
  }
  input UpdateLocation {
    name: String
    desc: String
    lat: Float
    lng: Float
  }

  type DeleteAllOutput {
    count: Int
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

  type Mutation {
    createUser(data: CreateUser!): User!
    updateUser(id: ID!, data: UpdateUser!): User!
    deleteUser(id: ID!): User!
    deleteAllUsers: DeleteAllOutput!

    createEvent(data: CreateEvent!): Event!
    updateEvent(id: ID!, data: UpdateEvent!): Event!
    deleteEvent(id: ID!): Event!
    deleteAllEvents: DeleteAllOutput!

    createParticipant(data: CreateParticipant!): Participant!
    updateParticipant(id: ID!, data: UpdateParticipant!): Participant!
    deleteParticipant(id: ID!): Participant!
    deleteAllParticipants: DeleteAllOutput!

    createLocation(data: CreateLocation!): Location!
    updateLocation(id: ID!, data: UpdateLocation!): Location!
    deleteLocation(id: ID!): Location!
    deleteAllLocations: DeleteAllOutput!
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
  Mutation: {
    // USER
    createUser: (parent: User, { data }) => {
      const user = {
        id: nanoid(),
        ...data,
      };
      users.push(user);
      return user;
    },
    updateUser: (parent: User, { id, data }) => {
      const userIndex = users.findIndex((user: User) => user.id === id);
      if (userIndex === -1) {
        throw new Error("User is not found");
      } else {
        users[userIndex] = { ...users[userIndex], ...data };
        return users[userIndex];
      }
    },
    deleteUser: (parent: User, { id }) => {
      const userIndex = users.findIndex((user: User) => user.id === id);
      if (userIndex === -1) {
        throw new Error("User is not found");
      } else {
        const user = users[userIndex];
        users.splice(userIndex, 1);
        return user;
      }
    },
    deleteAllUsers: () => {
      const count = users.length;
      users.splice(0, count);

      return {
        count,
      };
    },

    // PARTICIPANT
    createParticipant: (parent: Participant, { data }) => {
      const participant = {
        id: nanoid(),
        ...data,
      };
      participants.push(participant);
      return participant;
    },
    updateParticipant: (parent: Participant, { id, data }) => {
      const participantIndex = participants.findIndex(
        (participant: Participant) => participant.id === id
      );
      if (participantIndex === -1) {
        throw new Error("Participant is not found");
      } else {
        participants[participantIndex] = {
          ...participants[participantIndex],
          ...data,
        };
        return participants[participantIndex];
      }
    },
    deleteParticipant: (parent: Participant, { id }) => {
      const participantIndex = participants.findIndex(
        (participant: Participant) => participant.id === id
      );
      if (participantIndex === -1) {
        throw new Error("Participant is not found");
      } else {
        const participant = participants[participantIndex];
        participants.splice(participantIndex, 1);
        return participant;
      }
    },
    deleteAllParticipants: () => {
      const count = participants.length;
      participants.splice(0, count);

      return {
        count,
      };
    },

    // LOCATION
    createLocation: (parent: Location, { data }) => {
      const location = {
        id: nanoid(),
        ...data,
      };
      locations.push(location);
      return locations;
    },
    updateLocation: (parent: Location, { id, data }) => {
      const locationIndex = locations.findIndex(
        (location: Location) => location.id === id
      );
      if (locationIndex === -1) {
        throw new Error("Location is not found");
      } else {
        locations[locationIndex] = {
          ...locations[locationIndex],
          ...data,
        };
        return locations[locationIndex];
      }
    },
    deleteLocation: (parent: Location, { id }) => {
      const locationIndex = locations.findIndex(
        (location: Location) => location.id === id
      );
      if (locationIndex === -1) {
        throw new Error("Location is not found");
      } else {
        const location = locations[locationIndex];
        locations.splice(locationIndex, 1);
        return location;
      }
    },
    deleteAllLocations: () => {
      const count = locations.length;
      locations.splice(0, count);

      return {
        count,
      };
    },

    // EVENT
    createEvent: (parent: Event, { data }) => {
      const event = {
        id: nanoid(),
        ...data,
      };
      events.push(event);
      return events;
    },
    updateEvent: (parent: Event, { id, data }) => {
      const eventIndex = events.findIndex((event: Event) => event.id === id);
      if (eventIndex === -1) {
        throw new Error("Event is not found");
      } else {
        events[eventIndex] = {
          ...events[eventIndex],
          ...data,
        };
        return events[eventIndex];
      }
    },
    deleteEvent: (parent: Event, { id }) => {
      const eventIndex = events.findIndex((event: Event) => event.id === id);
      if (eventIndex === -1) {
        throw new Error("Event is not found");
      } else {
        const event = events[eventIndex];
        events.splice(eventIndex, 1);
        return event;
      }
    },
    deleteAllEvents: () => {
      const count = events.length;
      events.splice(0, count);

      return {
        count,
      };
    },
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
