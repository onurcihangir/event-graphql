export type User = {
  id: Number;
  username: String;
  email: String;
};

export type Event = {
  id: Number;
  title: String;
  desc: String;
  date: String;
  from: String;
  to: String;
  location_id: Number;
  user_id: Number;
};

export type Participant = {
  id: Number;
  user_id: Number;
  event_id: Number;
};

export type Location = {
  id: Number;
  name: String;
  desc: String;
  lat: Number;
  lng: Number;
};

export interface QueryIdArgs {
  id: Number;
}
