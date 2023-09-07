import { createSchema, createYoga, createPubSub } from "graphql-yoga";
import pkg from "@reduxjs/toolkit";
import { User, Event, Participant, Location, QueryIdArgs } from "./types";
import { createRequire } from "module"; // Bring in the ability to create the 'require' method
import { createServer } from "node:http";
const require = createRequire(import.meta.url); // construct the require method
const data = require("./data.json");
const { nanoid } = pkg;

const { users, events, locations, participants } = data;

import { Redis } from "ioredis";
import { createRedisEventTarget } from "@graphql-yoga/redis-event-target";

const options = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  },
};

const publishClient = new Redis(options);
const subscribeClient = new Redis(options);

const eventTarget = createRedisEventTarget({
  publishClient,
  subscribeClient,
});

const pubSub = createPubSub<{
  userCreated: [userCreated: User];
  userUpdated: [userUpdated: User];
  eventCreated: [eventCreated: Event];
  eventUpdated: [eventUpdated: Event];
  locationCreated: [locationCreated: Location];
  locationUpdated: [locationUpdated: Location];
  participantAdded: [participantAdded: Participant];
  participantUpdated: [participantUpdated: Participant];
}>({ eventTarget });

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

  type Subscription {
    userCreated: User!
    userUpdated: User!

    eventCreated: Event!
    eventUpdated: Event!

    participantAdded: Participant!
    participantUpdated: Participant!

    locationCreated: Location!
    locationUpdated: Location!
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
      pubSub.publish("userCreated", user);
      return user;
    },
    updateUser: (parent: User, { id, data }) => {
      const userIndex = users.findIndex((user: User) => user.id === id);
      if (userIndex === -1) {
        throw new Error("User is not found");
      } else {
        users[userIndex] = { ...users[userIndex], ...data };
        pubSub.publish("userUpdated", users[userIndex]);
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
      pubSub.publish("participantAdded", participant);
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
        pubSub.publish("participantUpdated", participants[participantIndex]);
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
      pubSub.publish("locationCreated", location);
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
        pubSub.publish("locationUpdated", locations[locationIndex]);
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
      pubSub.publish("eventCreated", event);
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
        pubSub.publish("eventUpdated", events[eventIndex]);
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
  Subscription: {
    userCreated: {
      subscribe: () => pubSub.subscribe("userCreated"),
      resolve: (payload) => payload,
    },
    userUpdated: {
      subscribe: () => pubSub.subscribe("userUpdated"),
      resolve: (payload) => payload,
    },
    eventCreated: {
      subscribe: () => pubSub.subscribe("eventCreated"),
      resolve: (payload) => payload,
    },
    eventUpdated: {
      subscribe: () => pubSub.subscribe("eventUpdated"),
      resolve: (payload) => payload,
    },
    participantAdded: {
      subscribe: () => pubSub.subscribe("participantAdded"),
      resolve: (payload) => payload,
    },
    participantUpdated: {
      subscribe: () => pubSub.subscribe("participantUpdated"),
      resolve: (payload) => payload,
    },
    locationCreated: {
      subscribe: () => pubSub.subscribe("locationCreated"),
      resolve: (payload) => payload,
    },
    locationUpdated: {
      subscribe: () => pubSub.subscribe("locationUpdated"),
      resolve: (payload) => payload,
    },
  },
};

const schema = createSchema({
  typeDefs,
  resolvers,
});

const yoga = createYoga({ schema });

const server = createServer(yoga);

server.listen(4000, () => {
  console.info("Server is running on http://localhost:4000/graphql");
});