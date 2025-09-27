
let events: any[] = [];

export const setEvents = (newEvents: any[]) => {
  events = newEvents;
};

export const getEvents = () => {
  return events;
};
